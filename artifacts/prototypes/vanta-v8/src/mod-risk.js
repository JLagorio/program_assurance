// Risk, findings, POA&M, authorization, package room, suppliers, people, review queue, schedule and continuous monitoring.
// Data read from the local database on 17 Nov 2026 (WS-X90, program 5b834025…, tenant 80ad4373…). Anything else is marked Example.
(() => {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const { esc, fmt, pct, day, gl, pill, tag, who, bar, header, completion, page, pair, tools, sevPill, dueOf, dueCell } = h;
  const TODAY = data.TODAY;
  const ME = "Ingrid Solberg";
  const EX = '<span class="ex">Example</span>';
  const note = (t) => `<p class="note-p">${t}</p>`;

  // ——— Dates ———
  const D = (iso) => new Date(iso + "T12:00:00");
  const diffDays = (d) => Math.round((d - TODAY) / 86400000);
  const dfull = (iso) => D(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dd = (iso) => (iso ? (iso.slice(0, 4) === "2026" ? day(iso) : dfull(iso)) : "");
  const fromDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() !== 2026 ? { year: "numeric" } : {}) });
  const addDays = (iso, n) => { const d = D(iso); d.setDate(d.getDate() + n); return d; };
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const ring = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const dueC = (d) => (d.getFullYear() !== 2026 ? `<span class="num">${fromDate(d)}</span>` : dueCell(d));
  const span2 = (a, b) => { const ya = a.slice(0, 4), yb = b.slice(0, 4); return ya === yb ? `${day(a)} – ${day(b)}${ya !== "2026" ? `, ${ya}` : ""}` : `${dd(a)} – ${dd(b)}`; };
  const tr = (s, w = 440) => `<span class="risk-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;

  // ——— Shared parts ———
  const ST = {};
  const cur = (k, d = "all") => ST[k] || d;
  function qvs(key, list) {
    const on = cur(key, list[0][0]);
    return `<div class="views risk-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv risk-qvb${on === v ? " on" : ""}" aria-pressed="${on === v}" data-rq="${key}" data-rv="${v}">${esc(l)}${n != null ? ` <span class="num">${fmt(n)}</span>` : ""}</button>`).join("")}</div>`;
  }
  function tabs(list, current) {
    return `<div class="tabsx risk-tabs" role="tablist">${list.map(([r, l, n]) => `<span role="tab" tabindex="0" aria-selected="${r === current}"${r === current ? ' class="on"' : ` data-go="${r}"`}>${esc(l)}${n != null ? ` <span class="ct">${fmt(n)}</span>` : ""}</span>`).join("")}</div>`;
  }
  function attn(rows, title = "Needs attention", over = null) {
    const total = over != null ? over : rows.filter((r) => typeof r[2] === "number" && !r[3]).reduce((a, r) => a + r[2], 0);
    return `<div class="card"><div class="t">${esc(title)} <span class="num">${fmt(total)}</span></div><div class="rows">${rows
      .map(([g, l, n, muted, go]) => `<div class="row${go ? " risk-go" : ""}"${go ? ` role="button" tabindex="0" data-rq="${go[0]}" data-rv="${go[1]}"` : ""}>${gl(g)}<span${muted ? ' class="muted"' : ""}>${l}</span><b class="num${muted ? " muted" : ""}">${typeof n === "number" ? fmt(n) : esc(n)}</b></div>`)
      .join("")}</div></div>`;
  }
  function tbl(cols, rows, total, panelKey, empty = "Nothing matches this view.") {
    const body = rows.length
      ? rows.map((r) => `<tr tabindex="0" data-panel="${esc(r.panel || panelKey || "")}" data-id="${esc(r.id || "")}">${r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`).join("")
      : `<tr class="risk-empty"><td colspan="${cols.length}">${ring(empty)}</td></tr>`;
    return `<div class="frame"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div><div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>25 per page · ‹ ›</span></div></div>`;
  }
  const phead = (title, actions = "") => `<div class="risk-ph"><h4>${esc(title)}</h4>${actions ? `<div class="risk-pa">${actions}</div>` : ""}</div>`;
  const sect = (title, count, body, action = "") => `<div class="sect"><div class="sh"><b class="risk-shb">${esc(title)}${count != null ? `<span class="num">${fmt(count)}</span>` : ""}</b>${action}</div><div class="sb">${body}</div></div>`;
  const line = (glyph, html, end = "") => `<div class="risk-line">${gl(glyph)}<span>${html}</span>${end ? `<span class="risk-le">${end}</span>` : ""}</div>`;
  const plink = (kind, id, text) => `<button type="button" class="risk-lk" data-panel="${kind}" data-id="${esc(id)}">${esc(text)}</button>`;
  const btn = (label, attrs = "", ink = false, sm = false) => `<button type="button" class="btn${ink ? " ink" : ""}${sm ? " sm" : ""}" ${attrs}>${esc(label)}</button>`;
  const modalBtn = (label, key, id = "", ink = false, sm = false) => btn(label, `data-modal="${key}" data-id="${esc(id)}"`, ink, sm);
  const footer = (primary, toast) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal data-risk-toast="${esc(toast)}">${esc(primary)}</button>`;
  const field = (label, control, hint = "") => `<label class="risk-fl"><span class="risk-flab">${esc(label)}</span>${control}${hint ? `<span class="risk-hint">${hint}</span>` : ""}</label>`;
  const input = (value = "", type = "text", extra = "") => `<input class="risk-in" type="${type}" value="${esc(value)}" ${extra}>`;
  const select = (opts, sel) => `<select class="risk-in">${opts.map((o) => `<option${o === sel ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  const area = (value = "", rows = 3, ph = "") => `<textarea class="risk-in risk-ta" rows="${rows}" placeholder="${esc(ph)}">${esc(value)}</textarea>`;
  const check = (label, on = false, extra = "") => `<label class="risk-chk"><input type="checkbox"${on ? " checked" : ""} ${extra}><span>${label}</span></label>`;
  const radio = (name, label, on = false, hint = "") => `<label class="risk-chk"><input type="radio" name="${name}"${on ? " checked" : ""}><span>${label}${hint ? `<small>${hint}</small>` : ""}</span></label>`;
  const fieldset = (legend, body) => `<fieldset class="risk-fs"><legend class="risk-flab">${esc(legend)}</legend>${body}</fieldset>`;
  const PEOPLE = ["Amara Bell", "D. Okafor", "Dan Whitfield", "Elena Vasquez", "Hana Lindqvist", "Ingrid Solberg", "Joel Barrantes", "Marcus Ryde", "Nadia Fournier", "Priya Raghavan", "R. Calloway", "Ray Colston", "Sarah Chen", "Tom Okafor", "Victor Amsel", "Wes Duarte"];

  // ——— Data: WS-X90 open operational issues (44), with the published determinations they rest on ———
  const ISS = [["1f680dd7","critical","2026-10-21","","Publish the retired key history and reissue the audit direction","Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)","AU-10:other_than_satisfied"],["a4823e25","critical","2026-11-13","","Remove the password-only path and make the switch exchange mutual","Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))","IA-2(2):other_than_satisfied"],["85973641","high","2026-08-07","","Remediate REQ-100","Unmet requirement REQ-100","CM-4:other_than_satisfied"],["e9c669c2","high","2026-08-10","","Remediate REQ-008","Unmet requirement REQ-008","AC-11:other_than_satisfied,AU-4:other_than_satisfied"],["28b99485","high","2026-08-13","","Remediate REQ-068","Unmet requirement REQ-068",""],["a76a9dc1","high","2026-09-24","","Restore state-level visibility and operator attribution at the boundary gateway","Session-table occupancy missing from the gateway counter export, leaving low-rate state exhaustion undetectable (SC-5(3))","SC-5(3):other_than_satisfied"],["4d5a5dfc","high","2026-10-02","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Mission data sessions over the tactical radio never presented to platform monitoring (SI-4(10))","SI-4(10):other_than_satisfied"],["e4560090","high","2026-10-04","","Restore state-level visibility and operator attribution at the boundary gateway","Egress denial records attribute maintenance-origin traffic to a device instead of an operator (SC-7(9))","SC-7(9):other_than_satisfied"],["77d97586","high","2026-10-08","","Evidence the interlock trust basis and fit provisioned hardware identity","Payload Safety Interlock carries an asserted trustworthiness basis with no supplier assurance case (SA-8(9))","SA-8(9):other_than_satisfied"],["6578da17","high","2026-10-09","","Seal the maintenance service connector and confirm the interface inventory","Maintenance Access Gateway service connector locked but unsealed, so an unauthorized connection leaves no trace (SC-7(14))","SC-7(14):other_than_satisfied"],["c0fdce4e","high","2026-10-10","Ingrid Solberg","Remediate CVE-2024-6387 on the Mission Computer","CVE-2024-6387 in the OpenSSH server (regreSSHion)",""],["cc34d8ab","high","2026-10-19","","Derive bay access from the facility roster and export the reader log","Protected bay access list transcribed by hand, so a facility removal leaves bay access standing (PE-3(1))","PE-3(1):other_than_satisfied"],["f40812b7","high","2026-10-31","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Navigation, timing and payload firmware violations raise an alert without driving the restricted state (SI-7(5))","SI-7(5):other_than_satisfied"],["963823be","high","2026-11-05","","Route in-partition failures into the platform secure state","In-partition failures never reach the Secure Boot Controller, so the platform does not enter its defined secure state (SC-24)","SC-24:other_than_satisfied"],["fee2cf4d","moderate","2026-08-07","","Remediate REQ-119","Unmet requirement REQ-119",""],["4264643b","moderate","2026-08-07","","Remediate REQ-024","Unmet requirement REQ-024","CM-2:partially_satisfied"],["c772d10a","moderate","2026-08-07","","Remediate REQ-062","Unmet requirement REQ-062","SC-28:partially_satisfied"],["9f9fbd16","moderate","2026-08-09","","Remediate REQ-083","Unmet requirement REQ-083","AC-12:partially_satisfied"],["42eedb4e","moderate","2026-08-15","","Remediate REQ-032","Unmet requirement REQ-032","CM-11:partially_satisfied"],["42b96885","moderate","2026-08-17","","Remediate REQ-053","Unmet requirement REQ-053","RA-3:partially_satisfied"],["1f77e9bd","moderate","2026-08-18","","Remediate REQ-092","Unmet requirement REQ-092","AU-11:partially_satisfied,CA-8:partially_satisfied"],["c9ad506f","moderate","2026-09-16","","Evidence the interlock trust basis and fit provisioned hardware identity","Expired acquisition procedures can still be cited in a live procurement package (SA-1)","SA-1:partially_satisfied"],["f0ff0fae","moderate","2026-10-01","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Monitoring and boot-integrity enhancement procedures still marked draft in the signed SI set (SI-1)","SI-1:partially_satisfied"],["b0f430d2","moderate","2026-10-07","","Add insider-threat and spillage handling to the incident procedures","Incident response procedures name no insider-threat branch or spillage roles after the scope expansion (IR-1)","IR-1:partially_satisfied"],["0d7e1855","moderate","2026-10-24","","Terminate failed-inspection sessions and reissue the unsigned access procedures","Seven access control procedures in field packages carry no current owner signature (AC-1)","AC-1:partially_satisfied"],["ac339ae5","moderate","2026-10-25","","Terminate failed-inspection sessions and reissue the unsigned access procedures","UDP-bearing approved tunnel outlives a failed inspection past the five-second termination bound (AC-4(4))","AC-4(4):partially_satisfied"],["9bdc5d1b","moderate","2026-10-26","","Make the privileged access review reduce privilege by itself","Unreconfirmed privileged assignments flagged on the Platform Management Controller but never reduced (AC-6(7))","AC-6(7):partially_satisfied"],["942ef213","moderate","2026-10-30","","Exercise a whole-article recovery against the four-hour objective","Recovery exercise restored one partition, leaving the four-hour objective unproven for the article (CP-4)","CP-4:partially_satisfied"],["ec5d8c5f","moderate","2026-11-03","","Automate the second reporting route for weakness reports","Two of four weakness reports reached the second recipient past the five-working-day bound (IR-6(2))","IR-6(2):partially_satisfied"],["b3646a99","moderate","2026-11-04","","Abort a baseline scan on a stale signature set","Baseline scan ran to completion on a thirty-hour-old signature set without aborting (RA-5(2))","RA-5(2):partially_satisfied"],["fe939b44","moderate","2026-11-07","","Trigger the post-campaign reconciliation and sign the outstanding procedures","Four of eleven configuration management procedures unsigned and flagged review-overdue (CM-1)","CM-1:partially_satisfied"],["315fbe31","moderate","2026-11-08","","Gate payload telemetry maintenance instead of recording it afterwards","Payload Telemetry Unit maintained on retrospective paperwork outside the work-order gate (MA-2(2))","MA-2(2):partially_satisfied"],["d054753e","moderate","2026-11-08","","Trigger the post-campaign reconciliation and sign the outstanding procedures","Post-campaign change review has no trigger and runs only when somebody remembers (CM-3(7))","CM-3(7):partially_satisfied"],["ab332f61","moderate","2026-11-09","","Evidence the interlock trust basis and fit provisioned hardware identity","Six LRUs fall back to a maintenance-record serial number for hardware identity at power-on (SA-10(3))","SA-10(3):partially_satisfied"],["cf162cda","moderate","2026-11-13","","Remove the password-only path and make the switch exchange mutual","Timing Receiver port admitted to the mission VLAN on a one-sided certificate exchange (IA-3(1))","IA-3(1):partially_satisfied"],["ecb1e2a1","moderate","2026-11-13","","Sign the ground-support telemetry agreement before the exchange continues","Ground-support telemetry exchange carrying traffic on an interim approval with no signed agreement (CA-3)","CA-3:partially_satisfied"],["b61b983c","moderate","2026-11-14","","Put compromised-credential screening on a scheduled refresh","Compromised-password screening list refreshed ad hoc, so an accepted credential may already be public (IA-5(1))",""],["82ba14e2","low","2026-08-09","","Remediate REQ-045","Unmet requirement REQ-045","MA-3:partially_satisfied"],["ac70a0fd","low","2026-08-16","","Remediate REQ-109","Unmet requirement REQ-109","CP-10:partially_satisfied"],["8c7f42de","low","2026-08-17","","Remediate REQ-015","Unmet requirement REQ-015","AU-6:partially_satisfied,CA-2:partially_satisfied"],["81ab0471","low","2026-09-23","","Restore state-level visibility and operator attribution at the boundary gateway","SC policy baseline carries an issue date but no recorded review decision in the Configuration Repository (SC-1)","SC-1:partially_satisfied"],["f24ba0a0","low","2026-10-11","","Reissue the personnel security procedure to match enforced gating","Personnel security procedure describes weaker gating than the Provisioning Workstation enforces (PS-1)","PS-1:partially_satisfied"],["29919692","low","2026-10-13","","Publish the retired key history and reissue the audit direction","Audit procedures still written to the original 74-control scope in the Configuration Repository (AU-1)","AU-1:partially_satisfied"],["55517d12","low","2026-10-31","","Re-home the alternate bearer off the shared port group","Primary and alternate bearers converge on one Internal Ethernet Switch port group (CP-8(2))","CP-8(2):partially_satisfied"]].map(([id, sev, opened, owner, poam, title, from]) => {
    const due = dueOf(opened, sev);
    const left = diffDays(due);
    return { id, sev, opened, owner, poam, title, due, left, late: left < 0, soon: left >= 0 && left <= 14, from: from ? from.split(",").map((x) => x.split(":")) : [] };
  });
  const SEVR = { critical: 0, high: 1, moderate: 2, low: 3 };
  const issueById = (id) => ISS.find((i) => i.id === id) || ISS.find((i) => id && i.title.startsWith(id)) || ISS[0];
  const DESC = {
    "1f680dd7": "Every arm and release command in the mission run captured in EVD-253 carried a signature from LRU-003 binding the command, the operator identity and the LRU-011 interlock state. Verification breaks on key history: commands signed under a rotated key verify as unknown-key.",
    "a4823e25": "LRU-019 enforces a hardware credential and PIN on every session while it is attached to the ground support network. Taken off that network the laptop falls back to a local password-only logon.",
    "c0fdce4e": "The Mission Computer's maintenance image runs OpenSSH server 9.6p1, which CVE-2024-6387 (regreSSHion) affects: a signal handler race in sshd that lets an unauthenticated remote attacker run code as root. The server listens on the maintenance interface only. OpenSSH 9.8p1 fixes it.",
  };
  const DET = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["info", "Not assessed"] };
  const detPill = (d) => pill(DET[d][0], DET[d][1]);
  const ISSUE_OF = {};
  ISS.forEach((i) => i.from.forEach(([c]) => { ISSUE_OF[c] = i; }));

  // ——— Data: POA&M (41 items, their milestones and the issues they answer) ———
  const POAM = [["0344afc0","Remediate REQ-024","in_progress","","2026-09-08",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["4264643b"],"Close implementation and evidence gap for REQ-024 across LRU-017, LRU-020, LRU-001."],["ccb452ad","Remediate REQ-045","in_progress","","2026-09-11",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["82ba14e2"],"Close implementation and evidence gap for REQ-045 across LRU-013, LRU-014, LRU-017."],["96e50cb7","Remediate REQ-068","in_progress","","2026-09-14",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["28b99485"],"Close implementation and evidence gap for REQ-068 across LRU-013, LRU-016."],["d1f095da","Remediate REQ-092","in_progress","","2026-09-17",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["1f77e9bd"],"Close implementation and evidence gap for REQ-092 across LRU-018, LRU-001."],["a99b735e","Remediate REQ-114","completed","","2026-09-20",null,["4a718961"],"Close implementation and evidence gap for REQ-114 across LRU-014, LRU-017, LRU-001."],["04339e87","Remediate REQ-008","in_progress","","2026-10-06",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["e9c669c2"],"Close implementation and evidence gap for REQ-008 across LRU-013, LRU-014."],["217100a1","Remediate REQ-032","in_progress","","2026-10-09",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["42eedb4e"],"Close implementation and evidence gap for REQ-032 across LRU-013, LRU-016."],["7f342a9e","Remediate REQ-053","in_progress","","2026-10-12",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["42b96885"],"Close implementation and evidence gap for REQ-053 across LRU-001, LRU-013."],["c674a57a","Remediate REQ-074","completed","","2026-10-15",null,["7813f01e"],"Close implementation and evidence gap for REQ-074 across LRU-003, LRU-017."],["4be4ddde","Remediate REQ-100","in_progress","","2026-10-18",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["85973641"],"Close implementation and evidence gap for REQ-100 across LRU-020."],["cb6336b6","Remediate REQ-119","in_progress","","2026-10-21",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["fee2cf4d"],"Close implementation and evidence gap for REQ-119 across LRU-017, LRU-019."],["bd54cb23","Remediate REQ-015","in_progress","","2026-11-07",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["8c7f42de"],"Close implementation and evidence gap for REQ-015 across LRU-015, LRU-018, LRU-001."],["1c554589","Remediate REQ-039","completed","","2026-11-10",null,["fdb85e36"],"Close implementation and evidence gap for REQ-039 across LRU-014, LRU-017, LRU-001."],["75421dca","Remediate REQ-062","in_progress","","2026-11-13",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["c772d10a"],"Close implementation and evidence gap for REQ-062 across LRU-003, LRU-007."],["ca8301dc","Remediate REQ-083","in_progress","","2026-11-16",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["9f9fbd16"],"Close implementation and evidence gap for REQ-083 across LRU-013, LRU-014."],["96bd4063","Remediate REQ-109","in_progress","","2026-11-19",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["ac70a0fd"],"Close implementation and evidence gap for REQ-109 across LRU-015."],["dccc2343","Order the compiled audit trail on source time","completed","","2026-12-05",[[1,"Stamp source time on records relayed by LRU-009 before they leave the switch","completed","2026-10-03","2026-10-03",""],[2,"Rebuild the compiled trail on origin time and re-run the seeded ordering sequence","completed","2026-10-24","2026-10-24",""],[3,"Confirm the order tolerance against the LRU-005 reference under a congested segment","completed","2026-11-14","2026-11-14",""]],["d370ad92"],"The relay path now stamps a source time before a record leaves the switch, and the compiled trail is rebuilt on that stamp so ordering holds across every source rather than across most of them. The work completed inside the assessment windo"],["9a43f6a8","Block out-of-window privileged commands at the maintenance gateway","completed","","2026-12-07",[[1,"Promote the scheduled-window test at LRU-014 from advisory to a blocking admission check","completed","2026-10-05","2026-10-05",""],[2,"Refuse an out-of-window privileged command with its reason code in the session log","completed","2026-10-26","2026-10-26",""],[3,"Retest the three admission checks from LRU-019 including the window leg","completed","2026-11-16","2026-11-16",""]],["0299f647"],"The scheduled-window leg of the admission decision was wired as advisory and is now a blocking check, so a command issued outside a window is refused rather than narrated. The retest exercised all three admission checks from the laptop and "],["def9d690","Remediate CVE-2024-6387 on the Mission Computer","open","Ingrid Solberg","2026-12-08",[[1,"Set LoginGraceTime 0 on the maintenance interface","planned","2026-11-17",null,"Ingrid Solberg"],[2,"Take Mission Computer version 2","planned","2026-12-01",null,"Ingrid Solberg"],[3,"Rescan LRU-001","planned","2026-12-08",null,"Ingrid Solberg"]],["c0fdce4e"],"Close the race on the maintenance interface now, take version 2 of the Mission Computer, which carries OpenSSH server 9.8p1, and rescan LRU-001 to confirm the fix."],["20b24018","Refuse unlisted hardware on every switch port","completed","","2026-12-09",[[1,"Reflash the four lagging LRU-009 ports to the enforcement build","completed","2026-10-07","2026-10-07",""],[2,"Confirm an unlisted device is refused a data path on all twelve switch ports","completed","2026-10-28","2026-10-28",""],[3,"Check the refusal reaches the platform log inside the thirty-second bound","completed","2026-11-18","2026-11-18",""]],["884b66de"],"The four ports running firmware that predated the enforcement build were reflashed, so an unlisted device is now refused a path on all twelve rather than reported on four of them. The objective retested clean inside the assessment window wi"],["1e855acc","Alert on privileged tool use outside an open work order","completed","","2026-12-11",[[1,"Build the out-of-work-order alert rule on the collector","completed","2026-10-09","2026-10-09",""],[2,"Seed an out-of-order privileged invocation through LRU-014 and confirm the alert fires","completed","2026-10-30","2026-10-30",""],[3,"Route the alert to the maintenance review queue with the technician identity attached","completed","2026-11-20","2026-11-20",""]],["fe5baef3"],"The rule had been specified for the collector and never built, so this item builds it and routes what it raises to the maintenance review queue with the technician identity attached. A seeded out-of-order invocation raised the alert on rete"],["7d023346","Automate the second reporting route for weakness reports","in_progress","","2026-12-27",[[1,"Automate dispatch to the second recipient off the same trigger as the first","completed","2026-10-06","2026-10-06",""],[2,"Re-report the two late cases and record the corrected timeline against each","in_progress","2026-11-06",null,""],[3,"Measure elapsed time from containment on the next four weakness reports","planned","2026-12-06",null,""]],["ec5d8c5f"],"Dispatch to the second recipient is automated off the same trigger as the first, which is the only arrangement under which one bound covers both. The two cases that ran late are re-reported and the next four are measured from their recorded"],["03c0317f","Publish the retired key history and reissue the audit direction","in_progress","","2026-12-29",[[1,"Publish the retired signing key identifiers from LRU-003 to the collector","completed","2026-10-08","2026-10-08",""],[2,"Re-verify the stranded arm and release records against the republished key history","in_progress","2026-11-08",null,""],[3,"Reissue the audit procedures to the current control scope and describe the correlation behaviour now running","planned","2026-12-08",null,""]],["29919692","d63206a4","1f680dd7"],"Publishing the retired signing key identifiers to the collector is what makes a signature resolvable after a rotation, so it leads and the stranded arm and release records are re-verified behind it. The AU-1 procedure reissue is carried in "],["2647a7d2","Put compromised-credential screening on a scheduled refresh","in_progress","","2027-01-04",[[1,"Put the compromised-password list refresh on a scheduled quarterly job feeding LRU-003","completed","2026-10-14","2026-10-14",""],[2,"Re-screen the credentials already held in the LRU-015 region against the refreshed list","in_progress","2026-11-14",null,""],[3,"Retest IA-5(1) with a candidate published after the previous refresh","planned","2026-12-14",null,""]],["b61b983c"],"Screening quality is a scheduling problem rather than a mechanism problem, so the list moves onto a quarterly job and what is already stored is re-screened against it. The objective is retested with a candidate published since the previous "],["6c99b283","Exercise a whole-article recovery against the four-hour objective","in_progress","","2027-01-10",[[1,"Release the flight-configuration article for a full recovery exercise","completed","2026-10-20","2026-10-20",""],[2,"Restore the platform management and payload interface partitions from the sealed LRU-015 set","in_progress","2026-11-20",null,""],[3,"Measure the whole-article restore against the four-hour objective and lodge the record","planned","2026-12-20",null,""]],["942ef213"],"Nothing changes on the platform under this item; what is missing is a whole-article exercise, so the flight-configuration article is released and the untested partitions are restored from a sealed backup set. The elapsed time then becomes a"],["08b61d0b","Restore state-level visibility and operator attribution at the boundary gateway","in_progress","","2027-01-26",[[1,"Publish session-table and buffer occupancy counters in the LRU-007 telemetry export","completed","2026-10-05","2026-10-05",""],[2,"Set collector thresholds on the new counters so a low-rate excursion alerts at LRU-018","completed","2026-11-05","2026-11-05",""],[3,"Carry maintenance session identity into the denial record so a denied flow names an operator","in_progress","2026-12-05",null,""],[4,"Lodge the SC policy annual review as a Configuration Repository workflow step and retest all three objectives","planned","2027-01-05",null,""]],["81ab0471","a76a9dc1","e4560090"],"Extending the gateway telemetry export is the load-bearing change here, because the same export feeds both the SC-5(3) occupancy question and the thresholds the collector evaluates. Carrying maintenance session identity into the SC-7(9) den"],["875a2892","Seal the maintenance service connector and confirm the interface inventory","in_progress","","2027-01-27",[[1,"Fit tamper-evident seals to the LRU-014 service connector and record each against its key holder","in_progress","2026-11-06",null,""],[2,"Add the seal state to the boundary interface inspection sheet used at the flightline","planned","2026-12-06",null,""],[3,"Re-verify the physical interface inventory with the independent assessor","planned","2027-01-06",null,""]],["6578da17","7bb62aeb"],"Seals are specified and on order, so this item fits them to the LRU-014 service connector, records each against its key holder and adds the seal state to the sheet an inspector actually works from. SC-7(14) is retested against the physical "],["24b7225c","Make the privileged access review reduce privilege by itself","in_progress","","2027-02-01",[[1,"Make a non-reconfirmed assignment on LRU-013 expire instead of raising a flag","completed","2026-10-11","2026-10-11",""],[2,"Reduce the two privileged assignments left standing by the last review","completed","2026-11-11","2026-11-11",""],[3,"Report each reduction to the collector so a downgrade is auditable after the fact","planned","2026-12-11",null,""],[4,"Retest AC-6(7) across a full review cycle with a seeded non-reconfirmation","planned","2027-01-11",null,""]],["9bdc5d1b"],"Expiry replaces the flag, so an assignment a review leaves unreconfirmed loses its privilege without waiting for somebody to remember. The two assignments still standing from the last cycle are reduced first and the objective is then retest"],["4d7b5e23","Gate payload telemetry maintenance instead of recording it afterwards","in_progress","","2027-02-08",[[1,"Bring payload telemetry maintenance inside the LRU-016 work-order gate","in_progress","2026-11-18",null,""],[2,"Withdraw the retrospective paper route so no action starts without an open order","planned","2026-12-18",null,""],[3,"Extend the LRU-013 stale-record flag over the newly gated equipment","planned","2027-01-18",null,""]],["315fbe31"],"The equipment moves inside the work-order gate and the retrospective paper route is withdrawn, so no action proceeds without an open order behind it. The stale-record flag is extended over the newly gated equipment so coverage becomes visib"],["e2f0b4d9","Sign the ground-support telemetry agreement before the exchange continues","in_progress","","2027-02-13",[[1,"Draft the control responsibility split for the ground-support telemetry exchange","completed","2026-10-23","2026-10-23",""],[2,"Obtain the other party's signature and record the impact level on the agreement","planned","2026-11-23",null,""],[3,"Bind the signed agreement identifier to the exchange entry in the LRU-007 policy set","planned","2026-12-23",null,""],[4,"Disable any exchange whose agreement is not current at the next policy set review","planned","2027-01-23",null,""]],["ecb1e2a1"],"The exchange keeps carrying traffic only until its agreement is signed, so the control responsibility split is drafted, signed and bound to the entry in the gateway policy set. Enforcement then happens at the policy review, where any exchan"],["f4938b99","Abort a baseline scan on a stale signature set","in_progress","","2027-02-14",[[1,"Compare the mirrored signature set timestamp against the freshness window before a scan starts","planned","2026-11-24",null,""],[2,"Abort a scan running on a stale set and surface the reason to the operator","planned","2026-12-24",null,""],[3,"Print the signature set identifier in the scan report header","planned","2027-01-24",null,""]],["b3646a99"],"A freshness comparison and an abort are what the requirement asks for and what the workstation does not implement, so both are built. Lifting the signature set identifier into the report header is what afterwards lets a reviewer tell a clea"],["aedcd7ce","Derive bay access from the facility roster and export the reader log","in_progress","","2027-02-28",[[1,"Derive the bay reader list from the facility roster instead of transcribing it","completed","2026-11-07","2026-11-07",""],[2,"Remove bay access automatically when a holder leaves the facility roster","planned","2026-12-07",null,""],[3,"Export the bay reader log for correlation against current platform access","planned","2027-01-07",null,""],[4,"Retest PE-3(1) with a credential withdrawn at the facility level","planned","2027-02-07",null,""]],["cc34d8ab"],"The bay reader list stops being transcribed and starts being derived, so a removal at the facility level takes bay access with it rather than waiting for somebody to remember. Exporting the reader log for correlation is what allows a bay en"],["e35d68ed","Reissue the personnel security procedure to match enforced gating","in_progress","","2027-03-01",[[1,"Reissue the personnel security procedure to match the eligibility gating LRU-017 enforces","planned","2026-12-08",null,""],[2,"Record the national eligibility change against the approved revision in LRU-020","planned","2027-01-08",null,""],[3,"Re-disseminate to every provisioning role and capture the acknowledgements","planned","2027-02-08",null,""]],["f24ba0a0"],"The published procedure is reissued to describe the eligibility gating the workstation actually enforces, and the national eligibility change is recorded against the approved revision. Re-dissemination with acknowledgements closes the objec"],["c1f073e7","Terminate failed-inspection sessions and reissue the unsigned access procedures","in_progress","","2027-03-03",[[1,"Tear down a UDP-bearing tunnel on inspection failure rather than discarding its packets","in_progress","2026-12-10",null,""],[2,"Reissue the seven unsigned access control procedures with a current owner signature","planned","2027-01-10",null,""],[3,"Make the LRU-017 package check test the signature state of every procedure it assembles","planned","2027-02-10",null,""]],["0d7e1855","ac339ae5"],"Two independent corrections sit under this item: a tunnel that fails inspection is torn down inside the bound instead of being drained packet by packet, and the seven procedures published without a current owner signature are reissued. The "],["65d17707","Remove the password-only path and make the switch exchange mutual","in_progress","","2027-03-06",[[1,"Ship the offline credential verifier in the LRU-019 baseline so a disconnected session still needs a hardware credential","completed","2026-11-13","2026-11-13",""],[2,"Withdraw the password-only local logon from the Maintenance Laptop image","in_progress","2026-12-13",null,""],[3,"Require the Timing Receiver to present its own certificate before LRU-009 admits the port","planned","2027-01-13",null,""],[4,"Retest both authentication objectives with the laptop off the ground support network","planned","2027-02-13",null,""]],["a4823e25","cf162cda"],"The offline credential verifier for the laptop baseline is the only thing that forecloses the password-only path, so it leads and the local logon is withdrawn behind it. The IA-3(1) half changes the Timing Receiver end of the link to presen"],["de5e5c65","Close the mission-link monitoring blind spot and widen the restricted-state trigger","in_progress","","2027-03-08",[[1,"Decide whether to terminate the LRU-008 mission link for inspection or record a formal metadata-only acceptance","completed","2026-11-15","2026-11-15",""],[2,"Extend the restricted-state response to navigation, timing and payload firmware violations","planned","2026-12-15",null,""],[3,"Sign the draft monitoring and boot-integrity procedures into the issued SI set","planned","2027-01-15",null,""],[4,"Retest the monitoring coverage and restricted-state objectives on the integration rig","planned","2027-02-15",null,""]],["f0ff0fae","4d5a5dfc","f40812b7"],"The open decision on the mission link is taken first, because everything else depends on whether the link is terminated for inspection or metadata-only visibility is formally accepted. The restricted-state response is then widened across th"],["8b91a4ee","Trigger the post-campaign reconciliation and sign the outstanding procedures","in_progress","","2027-03-09",[[1,"Open a reconciliation against the LRU-018 event stream whenever LRU-020 records a campaign closing","planned","2026-12-16",null,""],[2,"Sign the four outstanding configuration management procedures and clear the review-overdue flag","planned","2027-01-16",null,""],[3,"Run the post-campaign review against the next planned campaign and record both exception classes","planned","2027-02-16",null,""]],["fe939b44","d054753e"],"A campaign closing in the repository becomes the event that opens a reconciliation, which is what the requirement asks for and what nothing currently provides. The four unsigned procedures are signed in the same pass because they cover the "],["866eeaad","Re-home the alternate bearer off the shared port group","in_progress","","2027-03-14",[[1,"Re-home the LRU-008 radio path off the shared LRU-009 port group","in_progress","2026-11-21",null,""],[2,"Rebuild the primary and alternate traces from live interface and routing state","planned","2026-12-21",null,""],[3,"Withdraw the accepted single point of failure entry once the traces are disjoint","planned","2027-01-21",null,""],[4,"Retest CP-8(2) with the shared port group failed","planned","2027-02-21",null,""]],["55517d12"],"Moving the radio path off the shared port group is the only change that makes the two traces disjoint on the platform side of the demarcation. The accepted single point of failure entry is withdrawn once the traces are rebuilt from live sta"],["1e65bd58","Evidence the interlock trust basis and fit provisioned hardware identity","in_progress","","2027-03-15",[[1,"Obtain the supplier assurance case for LRU-011 and review the basis behind the dependency entry","in_progress","2026-12-22",null,""],[2,"Fit a provisioned identity part to the six units still identified from a maintenance record","planned","2027-01-22",null,""],[3,"Reissue the acquisition procedures to the current scope and stop an expired revision being citable","planned","2027-02-22",null,""]],["c9ad506f","77d97586","ab332f61"],"The supplier assurance case behind the interlock is the missing side of the comparison, so obtaining and reviewing it is this item's first obligation. Fitting a provisioned identity part to the six units still identified from a maintenance "],["0ad5eb72","Add insider-threat and spillage handling to the incident procedures","in_progress","","2027-03-26",[[1,"Name the insider-threat branch and its decision authority in the incident response procedures","in_progress","2026-12-05",null,""],[2,"Assign the spillage roles the expanded control set introduces","planned","2027-01-05",null,""],[3,"Stage the reissued procedure set on LRU-017 and confirm the digest matches the repository","planned","2027-02-05",null,""],[4,"Exercise both new branches and record the corrective actions they produce","planned","2027-03-05",null,""]],["b0f430d2"],"The procedure set is reviewed against the expanded escalation chain, naming the insider-threat branch and assigning the spillage roles the added enhancements introduce. The reissued set is staged for ground support and both branches are exe"],["f07580fc","Route in-partition failures into the platform secure state","in_progress","","2027-03-28",[[1,"Route partition-level integrity and watchdog failures to LRU-002 rather than the partition handler","planned","2026-12-07",null,""],[2,"Define the whole-platform secure state transition for an in-flight partition failure","planned","2027-01-07",null,""],[3,"Demonstrate the transition on the rig with a mission partition failed in the air-mode profile","planned","2027-02-07",null,""],[4,"Retest SC-24 against an induced in-partition failure and record the elapsed transition time","planned","2027-03-07",null,""]],["963823be"],"Failures raised inside a mission partition are handed to that partition's own handler today, and this item routes them to LRU-002 and defines the whole-platform transition the requirement describes. The demonstration is run in the air-mode "]].map(([id, title, status, owner, planned, ms, issues, plan]) => {
    const its = (issues || []).map((x) => ISS.find((i) => i.id === x)).filter(Boolean);
    const deadline = its.length ? new Date(Math.min(...its.map((i) => i.due))) : null;
    const mss = (ms || []).map(([seq, t, s, pd, cd, o]) => ({ seq, title: t, status: s, planned: pd, done: cd, owner: o, item: id }));
    const fromF = its.some((i) => i.from.length);
    return { id, title, status, owner, planned, ms: mss, issues: its, issueIds: issues || [], plan, deadline, fromF, reached: mss.filter((m) => m.status === "completed").length,
      lateVsDeadline: deadline && planned && status !== "completed" ? diffDays(D(planned)) - diffDays(deadline) : 0 };
  });
  const MILESTONES = POAM.flatMap((p) => p.ms);
  const poamById = (id) => POAM.find((p) => p.id === id) || POAM.find((p) => id && p.title.startsWith(id)) || POAM[0];
  const poamByTitle = (t) => POAM.find((p) => p.title === t);
  const PSTAT = { in_progress: ["warn", "In progress"], completed: ["ok", "Completed"], open: ["none", "Not started"], planned: ["none", "Planned"] };
  const pstat = (s) => pill(PSTAT[s][0], PSTAT[s][1]);

  // ——— Data: risks (40), their ATT&CK techniques and response due dates ———
  const RISKS = [["0a21dc94","A password on its own reaches WS-X90 at the flightline","critical","moderate","high","","Anyone holding the Maintenance Laptop on a dispersed flightline who guesses or replays its local password and opens a privileged maintenance session.","2026-12-13",[["T1078","Valid Accounts"],["T1110","Brute Force"]],[]],["d3902bc5","Payload arm and release records become unverifiable as signing keys rotate","critical","moderate","high","","Someone who alters or disowns an arm or release command once its signing key has rotated, knowing the record can no longer be checked.","2026-11-02",[["T1553","Subvert Trust Controls"],["T1565","Data Manipulation"]],[]],["7ddbc65b","A hand-kept bay list leaves standing physical access to key and recovery material","high","moderate","high","","A person removed from the program who still badges into the protected bay and attaches hardware to, or lifts credentials from, the Mission Computer, the Cryptographic Services Module or the Secure Storage Module.","2026-12-18",[["T1200","Hardware Additions"],["T1552","Unsecured Credentials"]],[]],["5828fe17","A partition that has failed its own integrity check keeps flying the mission","high","moderate","high","","A modified image in a mission partition, or tampering below its operating system, that fails the partition's own integrity check in flight and keeps producing mission output.","2027-01-04",[["T1542","Pre-OS Boot"],["T1601","Modify System Image"]],[]],["79e3025e","An unsealed service connector leaves a physical route into the maintenance path","high","moderate","high","","A visitor on the flightline who seats a cable or a device at the Maintenance Access Gateway's service connector between inspections to reach the mission computing chain.","2026-12-08",[["T1091","Replication Through Removable Media"],["T1200","Hardware Additions"]],[]],["ccc13a34","Low-rate exhaustion and unattributable egress at the WS-X90 external boundary","high","moderate","high","","A patient adversary who drains the Protected Network Gateway's session state below the profiled rate and pushes data out through a maintenance session.","2026-11-22",[["T1048","Exfiltration Over Alternative Protocol"],["T1499","Endpoint Denial of Service"]],[]],["4cb2d6a3","Risk arising from REQ-008","high","moderate","high","","Activity under AC-11 and AU-4 on the Maintenance Access Gateway and Platform Management Controller that goes unwatched until its consequences show.","2026-10-09",[],[]],["d7e16faf","Risk arising from REQ-039","high","moderate","high","","An unauthorized change to the Maintenance Access Gateway, Mission Computer and Provisioning Workstation, by a technician or an attacker with access, that nothing rejects.","2026-10-02",[],[]],["ec94501b","Risk arising from REQ-068","high","moderate","high","","Activity under SI-7 on the Platform Management Controller and Update & Recovery Controller that goes unwatched until its consequences show.","2026-10-12",[],[]],["146be363","Risk arising from REQ-100","high","moderate","high","","Activity under CM-4 on the Configuration Repository that goes unwatched until its consequences show.","2026-10-06",[],[]],["602c1b5d","The mission link is unmonitored and three firmware domains cannot force the restricted state","high","moderate","high","","A compromised navigation, timing or payload component that keeps producing mission output over the Tactical Data Radio, whose traffic nobody inspects.","2026-11-30",[["T1040","Network Sniffing"],["T1495","Firmware Corruption"]],[]],["d726f6b1","The payload interlock's trust basis is asserted and six units identify themselves from paperwork","high","moderate","high","","A substituted or counterfeit part in the Payload Safety Interlock, or in one of six units that identify themselves from paperwork.","2026-11-15",[["T1036","Masquerading"],["T1195","Supply Chain Compromise"]],[]],["c9f087a6","A disallowed session survives at the boundary while field procedures go unsigned","moderate","moderate","moderate","","An outside party who holds a tunnel open through the Protected Network Gateway after inspection has refused it, to come back in or ride a remote session.","2027-02-21",[["T1133","External Remote Services"],["T1563","Remote Service Session Hijacking"]],[]],["1a0778b3","A publicly known password is still a valid WS-X90 credential","moderate","moderate","moderate","","An attacker replaying passwords from public breach collections against the provisioning path.","2027-03-14",[["T1078","Valid Accounts"],["T1110","Brute Force"]],[]],["579ecff1","A scan on a stale signature set reports clean and the program acts on it","moderate","moderate","moderate","","Exploitation of a newly published vulnerability in the WS-X90 build during the window in which the program's own scanning cannot see it.","2027-03-04",[["T1562","Impair Defenses"]],[]],["d0c7d0ad","Insider threat and spillage have an escalation path and no named owner","moderate","moderate","moderate","","An insider who copies data from a WS-X90 system and carries it off on removable media, or a classified spillage that spreads while the response is organized.","2027-02-04",[["T1005","Data from Local System"],["T1052","Exfiltration Over Physical Medium"]],[]],["065fc910","Payload telemetry maintenance happens outside the work-order gate","moderate","moderate","moderate","","Someone with access to the payload telemetry equipment who does unsanctioned work on it remotely and files the paperwork afterwards.","2027-03-08",[["T1021","Remote Services"]],[]],["85db8319","Platform telemetry crosses to a party nobody has signed a responsibility split with","moderate","moderate","moderate","","A ground-support partner whose own compromise or mishandling turns the telemetry exchange into a channel out of WS-X90.","2027-03-13",[["T1020","Automated Exfiltration"],["T1199","Trusted Relationship"]],[]],["4fad3c91","Privilege that survived its own review still reaches platform management","moderate","moderate","moderate","","An attacker who compromises one of the two holders whose privilege the review revoked on paper, or who adjusts the account to keep it.","2027-02-23",[["T1078","Valid Accounts"],["T1098","Account Manipulation"]],[]],["a4e6d677","Risk arising from REQ-024","moderate","high","high","","Activity under CM-2 on the Configuration Repository, Mission Computer and Provisioning Workstation that goes unwatched until its consequences show.","2026-12-05",[],[]],["54a7538a","Risk arising from REQ-032","moderate","low","moderate","","Activity under CM-11 on the Platform Management Controller and Update & Recovery Controller that goes unwatched until its consequences show.","2026-12-13",[],[]],["a69bb505","Risk arising from REQ-053","moderate","high","high","","Use of the Mission Computer and Platform Management Controller that the policy under RA-3 forbids, going ahead unchecked.","2026-12-15",[],[]],["8393c795","Risk arising from REQ-062","moderate","low","moderate","","A weakness in SC-28 on the Cryptographic Services Module and Protected Network Gateway that stays hidden because nobody can verify the implementation.","2026-12-05",[],[]],["54e57a74","Risk arising from REQ-083","moderate","high","high","","An unauthorized change to the Maintenance Access Gateway and Platform Management Controller, by a technician or an attacker with access, that nothing rejects.","2026-12-07",[],[]],["03162c69","Risk arising from REQ-092","moderate","low","moderate","","Activity under AU-11 and CA-8 on the Mission Computer and Security Log Collector that goes unwatched until its consequences show.","2026-12-16",[],[]],["25938cff","Risk arising from REQ-114","moderate","high","high","","A weakness in IA-8 on the Maintenance Access Gateway, Mission Computer and Provisioning Workstation that stays hidden because nobody can verify the implementation.","2026-12-19",[],[]],["41330f8c","Risk arising from REQ-119","moderate","low","moderate","","An unauthorized change to the Maintenance Laptop and Provisioning Workstation, by a technician or an attacker with access, that nothing rejects.","2026-12-05",[],[]],["c6f53950","The four-hour recovery objective has never been measured on a whole article","moderate","moderate","moderate","","An attack or failure that destroys data or disables recovery and forces a real restore of partitions nobody has exercised.","2027-02-27",[["T1485","Data Destruction"],["T1490","Inhibit System Recovery"]],[]],["576c965f","The widest configuration divergence WS-X90 produces has no review behind it","moderate","moderate","moderate","","An unapproved change, or a modified image, slipped in during a change campaign while the configuration is furthest from the approved one.","2027-03-07",[["T1601","Modify System Image"]],[]],["ba874b40","Weakness reports reach their second recipient after the reporting bound","moderate","moderate","moderate","","Another program on the same baseline, exploited through a weakness WS-X90 reported to it late.","2027-03-03",[],[]],["a5f7ee46","Out-of-window privileged maintenance was recorded rather than refused","low","low","low","","A privileged account used for maintenance outside its window through a remote service on the Maintenance Access Gateway.","2027-05-10",[["T1021","Remote Services"],["T1078","Valid Accounts"]],[]],["f659e4b2","Out-of-work-order privileged tool use was recorded and never surfaced","low","low","low","","An insider who uses privileged maintenance tools with no work order behind them and clears what traces they can.","2027-05-10",[["T1070","Indicator Removal on Host"],["T1072","Software Deployment Tools"]],[]],["23c37f1c","Primary and alternate bearers converge on one switch port group","low","low","low","","A fault in, or a denial of service against, the one Internal Ethernet Switch port group both bearers cross.","2027-04-29",[["T1498","Network Denial of Service"]],[]],["c23dcfa0","Relayed audit records carried a second ordering inside the platform trail","low","low","low","","Someone who reorders or blurs the platform trail during congestion to hide cause and effect.","2027-04-25",[["T1070","Indicator Removal on Host"],["T1565","Data Manipulation"]],[]],["39802516","Risk arising from REQ-015","low","moderate","moderate","","An unauthorized change to the Mission Computer, Secure Storage Module and Security Log Collector, by a technician or an attacker with access, that nothing rejects.","2027-02-13",[],[]],["8974368f","Risk arising from REQ-045","low","moderate","moderate","","Use of the Maintenance Access Gateway, Platform Management Controller and Provisioning Workstation that the policy under MA-3 forbids, going ahead unchecked.","2027-02-05",[],[]],["f644b3d4","Risk arising from REQ-074","low","moderate","moderate","","A weakness in SR-11 on the Cryptographic Services Module and Provisioning Workstation that stays hidden because nobody can verify the implementation.","2027-02-15",[],[]],["4cefa004","Risk arising from REQ-109","low","moderate","moderate","","Use of the Secure Storage Module that the policy under CP-10 forbids, going ahead unchecked.","2027-02-12",[],[]],["a7e6c40b","The personnel procedure and the provisioning gate no longer agree","low","low","low","","An account created to the looser written procedure once the gate is relaxed to match it.","2027-04-09",[["T1078","Valid Accounts"],["T1136","Create Account"]],[]],["0ec14b7b","Unlisted hardware was announced onto the internal segment and then carried","low","low","low","","An unlisted device attached to the internal segment to listen to or relay its traffic.","2027-05-04",[["T1200","Hardware Additions"],["T1557","Man-in-the-Middle"]],[]]].map(([id, title, sev, lik, imp, owner, threat, due, tech, poam]) => ({ id, title, sev, lik, imp, owner, threat, due, tech, poam }));
  const riskById = (id) => RISKS.find((r) => r.id === id) || RISKS.find((r) => id && r.title.startsWith(id)) || RISKS[0];

  // ——— Data: a sample of WS-X90's 313 determinations (every finding short of satisfied, and the first of the others) ———
  const AF = [["AC-11","Device Lock","other_than_satisfied","init","2026-08-10",false],["AU-4","Audit Log Storage Capacity","other_than_satisfied","init","2026-08-10",false],["AU-10","Non-repudiation","other_than_satisfied","inc1","2026-10-21",false],["CM-4","Impact Analyses","other_than_satisfied","init","2026-08-07",false],["IA-2(2)","Multi-factor Authentication to Non-privileged Accounts","other_than_satisfied","inc2","2026-11-13",false],["IA-5","Authenticator Management","other_than_satisfied","init","2026-08-03",false],["PE-3(1)","System Access","other_than_satisfied","inc1","2026-10-19",false],["SA-8(9)","Trusted Components","other_than_satisfied","inc1","2026-10-08",false],["SC-5(3)","Detection and Monitoring","other_than_satisfied","inc1","2026-09-24",false],["SC-7(9)","Restrict Threatening Outgoing Communications Traffic","other_than_satisfied","inc1","2026-10-04",false],["SC-7(14)","Protect Against Unauthorized Physical Connections","other_than_satisfied","inc1","2026-10-09",false],["SC-24","Fail in Known State","other_than_satisfied","inc1","2026-11-05",false],["SI-4(10)","Visibility of Encrypted Communications","other_than_satisfied","inc1","2026-10-02",false],["SI-7(5)","Automated Response to Integrity Violations","other_than_satisfied","inc1","2026-10-31",false],["AC-1","Policy and Procedures","partially_satisfied","inc1","2026-10-24",false],["AC-4(4)","Flow Control of Encrypted Information","partially_satisfied","inc1","2026-10-25",false],["AC-6(7)","Review of User Privileges","partially_satisfied","inc1","2026-10-26",false],["AC-12","Session Termination","partially_satisfied","init","2026-08-09",false],["AC-17(4)","Privileged Commands and Access","partially_satisfied","inc2","2026-11-11",false],["AU-1","Policy and Procedures","partially_satisfied","inc1","2026-10-13",false],["AU-6","Audit Record Review, Analysis, and Reporting","partially_satisfied","init","2026-08-17",false],["AU-6(3)","Correlate Audit Record Repositories","partially_satisfied","inc1","2026-10-03",false],["AU-11","Audit Record Retention","partially_satisfied","init","2026-08-18",false],["AU-12(1)","System-wide and Time-correlated Audit Trail","partially_satisfied","inc1","2026-10-27",false],["CA-2","Control Assessments","partially_satisfied","init","2026-08-17",false],["CA-3","Information Exchange","partially_satisfied","inc2","2026-11-13",false],["CA-8","Penetration Testing","partially_satisfied","init","2026-08-18",false],["CM-1","Policy and Procedures","partially_satisfied","inc1","2026-11-07",false],["CM-2","Baseline Configuration","partially_satisfied","init","2026-08-07",false],["CM-3(7)","Review System Changes","partially_satisfied","inc1","2026-11-08",false],["CM-7(9)","Prohibiting The Use of Unauthorized Hardware","partially_satisfied","inc1","2026-11-05",false],["CM-11","User-installed Software","partially_satisfied","init","2026-08-15",false],["CP-4","Contingency Plan Testing","partially_satisfied","inc1","2026-10-30",false],["CP-8(2)","Single Points of Failure","partially_satisfied","inc1","2026-10-31",false],["CP-10","System Recovery and Reconstitution","partially_satisfied","init","2026-08-16",false],["IA-3(1)","Cryptographic Bidirectional Authentication","partially_satisfied","inc2","2026-11-13",false],["IA-8","Identification and Authentication (Non-organizational Users)","partially_satisfied","init","2026-08-21",false],["IR-1","Policy and Procedures","partially_satisfied","inc1","2026-10-07",false],["IR-6(2)","Vulnerabilities Related to Incidents","partially_satisfied","inc1","2026-11-03",false],["MA-2(2)","Automated Maintenance Activities","partially_satisfied","inc1","2026-11-08",false],["MA-3","Maintenance Tools","partially_satisfied","init","2026-08-09",false],["MA-3(5)","Execution with Privilege","partially_satisfied","inc2","2026-11-11",false],["PS-1","Policy and Procedures","partially_satisfied","inc1","2026-10-11",false],["RA-3","Risk Assessment","partially_satisfied","init","2026-08-17",false],["RA-5(2)","Update Vulnerabilities to Be Scanned","partially_satisfied","inc1","2026-11-04",false],["SA-1","Policy and Procedures","partially_satisfied","inc1","2026-09-16",false],["SA-10(3)","Hardware Integrity Verification","partially_satisfied","inc1","2026-11-09",false],["SC-1","Policy and Procedures","partially_satisfied","inc1","2026-09-23",false],["SC-18","Mobile Code","partially_satisfied","inc1","2026-10-26",false],["SC-28","Protection of Information at Rest","partially_satisfied","init","2026-08-07",false],["SI-1","Policy and Procedures","partially_satisfied","inc1","2026-10-01",false],["SR-11","Component Authenticity","partially_satisfied","init","2026-08-19",false],["AC-2(12)","Account Monitoring for Atypical Usage","not_assessed","inc1","2026-10-25",false],["AC-16","Security and Privacy Attributes","not_assessed","inc1","2026-10-28",false],["AC-16(7)","Consistent Attribute Interpretation","not_assessed","inc1","2026-10-28",false],["AC-23","Data Mining Protection","not_assessed","inc1","2026-10-30",false],["AT-2","Literacy Training and Awareness","not_assessed","inc1","2026-11-05",false],["AT-2(4)","Suspicious Communications and Anomalous System Behavior","not_assessed","inc1","2026-11-05",false],["AT-2(6)","Cyber Threat Environment","not_assessed","inc1","2026-11-05",false],["AT-6","Training Feedback","not_assessed","inc1","2026-11-06",false],["AC-2","Account Management","satisfied","init","2026-08-20",false],["AC-2(1)","Automated System Account Management","satisfied","inc1","2026-10-24",false],["AC-2(2)","Automated Temporary and Emergency Account Management","satisfied","inc1","2026-10-24",false],["AC-2(3)","Disable Accounts","satisfied","inc1","2026-10-25",false],["AC-2(4)","Automated Audit Actions","satisfied","inc1","2026-10-25",false],["AC-3","Access Enforcement","satisfied","init","2026-08-21",false],["AC-4","Information Flow Enforcement","satisfied","init","2026-08-05",false],["AC-5","Separation of Duties","satisfied","init","2026-08-06",false]].map(([code, title, det, res, date, risk]) => ({ id: `${code}|${res}`, code, title, det, res, date, risk }));
  const RES = { init: ["SAR · initial authorization", "Published Aug 28"], inc1: ["SAR · expanded set, increment 1", "Published Nov 12"], inc2: ["Interim results, increment 2", "Draft"] };
  const AF_COUNTS = { all: 313, other_than_satisfied: 14, partially_satisfied: 38, not_assessed: 74, satisfied: 187 };

  // ——— Data: role holders (program_role_assignments) ———
  const ROLES = [
    ["authorizing_official", "R. Calloway", "Authorizing official", "AO", "Signs the authorization decision; the last step of a risk acceptance"],
    ["lead_assessor", "D. Okafor", "Lead assessor", "SCA", "Publishes assessment results"],
    ["assessor", "Nadia Fournier", "Assessor", "SCA", "Records determinations; reviews evidence"],
    ["assessor", "Local developer", "Assessor", "SCA", "Records determinations"],
    ["security_manager", "Joel Barrantes", "Information system security manager", "ISSM", "Second step of a risk acceptance; owns continuous monitoring"],
    ["security_officer", "Priya Raghavan", "Information system security officer", "ISSO", "First step of a risk acceptance; owns the package"],
    ["system_owner", "Ray Colston", "System owner", "SO", "Owns the POA&M and the remediation budget"],
  ];
  const roleOf = (n) => ROLES.find((r) => r[1] === n);

  // ——— Assets in the SYS-WSX90 boundary; AST-109NNN is LRU-NNN ———
  const ASSETS = ["Mission Computer", "Secure Boot Controller", "Cryptographic Services Module", "Navigation Processor", "Timing Receiver", "Navigation Sensor Interface", "Protected Network Gateway", "Tactical Data Radio", "Internal Ethernet Switch", "Payload Interface Controller", "Payload Safety Interlock", "Payload Telemetry Unit", "Platform Management Controller", "Maintenance Access Gateway", "Secure Storage Module", "Update & Recovery Controller", "Provisioning Workstation", "Security Log Collector", "Maintenance Laptop", "Configuration Repository"]
    .map((name, i) => {
      const n = String(i + 1).padStart(3, "0");
      const its = ISS.filter((x) => x.title.toLowerCase().includes(name.toLowerCase()) || (name === "Mission Computer" && x.id === "c0fdce4e"));
      const worst = its.length ? its.slice().sort((a, b) => SEVR[a.sev] - SEVR[b.sev])[0].sev : null;
      const next = its.length ? new Date(Math.min(...its.map((x) => x.due))) : null;
      return { id: `AST-109${n}`, lru: `LRU-${n}`, name, issues: its, worst, next, cves: name === "Mission Computer" ? 1 : 0, sbom: name === "Mission Computer" };
    });

  // ——— Vulnerabilities: CVE-2024-6387 is real; the rest are Example ———
  const VULNS = [
    { id: "CVE-2024-6387", ex: false, title: "Signal handler race in OpenSSH's sshd (regreSSHion)", sev: "high", cvss: "8.1", asset: "Mission Computer · LRU-001", iava: null, opened: "2026-10-10", status: ["warn", "Fix in version 2"], issue: "c0fdce4e" },
    { id: "CVE-2023-48795", ex: true, title: "SSH prefix truncation (Terrapin)", sev: "moderate", cvss: "5.9", asset: "Maintenance Access Gateway · LRU-014", iava: "IAVB 2024-B-0011", opened: "2026-09-02", status: ["warn", "Patch staged"] },
    { id: "CVE-2023-4911", ex: true, title: "glibc dynamic loader buffer overflow (Looney Tunables)", sev: "high", cvss: "7.8", asset: "Provisioning Workstation · LRU-017", iava: "IAVA 2023-A-0532", opened: "2026-10-28", status: ["none", "Not started"] },
    { id: "CVE-2024-3596", ex: true, title: "RADIUS response forgery (Blast-RADIUS)", sev: "critical", cvss: "9.0", asset: "Protected Network Gateway · LRU-007", iava: "IAVA 2024-A-0402", opened: "2026-11-06", status: ["info", "Mitigated, awaiting rescan"] },
  ].map((v) => ({ ...v, due: dueOf(v.opened, v.sev) }));

  // ——— Deactivated findings: none in WS-X90 today, so every row is Example ———
  const DEACT = [
    { id: "d1", finding: "STIG V-230264, package signature check (CAT II)", scope: "Provisioning Workstation", reason: "Not applicable", why: "Air-gapped: packages arrive only on the signed media path (CM-14)", evidence: "Media signing procedure, revision 4", by: "Joel Barrantes", ends: "2027-02-15" },
    { id: "d2", finding: "ACAS plugin 187201, weak SSH MAC offered", scope: "Maintenance Laptop", reason: "Compensating control", why: "The interface is disabled in the flight configuration; only the ground image offers it", evidence: "Flight configuration export, build 4.2.1", by: "Priya Raghavan", ends: "2026-11-24" },
    { id: "d3", finding: "Screen lock after 15 minutes (AC-11)", scope: "Navigation Processor", reason: "Not applicable", why: "Headless LRU with no interactive session", evidence: null, by: "Priya Raghavan", ends: "2027-03-01" },
    { id: "d4", finding: "STIG V-257777, FIPS mode for TLS (CAT I)", scope: "Timing Receiver", reason: "False positive", why: "The receiver uses its validated module; the scan reads the vendor's bootloader string", evidence: "CMVP certificate and vendor letter", by: "Joel Barrantes", ends: "2027-05-30" },
  ];

  // ——— Quick-view clicks re-draw the screen in place ———
  function redraw(k, v) {
    const r = (location.hash || "#home").slice(1);
    if (!S[r]) return;
    const main = document.getElementById("main");
    const top = main.scrollTop;
    main.innerHTML = S[r]();
    main.scrollTop = top;
    const again = main.querySelector(`button[data-rq="${k}"][data-rv="${v}"]`);
    if (again) again.focus();
  }
  function toast(text) {
    let t = document.getElementById("risk-toast");
    if (!t) { t = document.createElement("div"); t.id = "risk-toast"; t.className = "risk-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-rq]");
    if (q) { ST[q.dataset.rq] = q.dataset.rv; redraw(q.dataset.rq, q.dataset.rv); return; }
    const t = e.target.closest("[data-risk-toast]");
    if (t && t.dataset.riskToast) toast(t.dataset.riskToast);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".risk-go[data-rq], div.risk-go[data-panel]")) { e.preventDefault(); e.target.click(); }
  });

  // ═════════════ Findings ═════════════
  const findHead = () => header("Findings", `<span>WS-X90 · SYS-WSX90</span><span>Open issues <b>44</b></span><span>Open CVEs <b>1</b></span><span>Determinations <b>313</b></span>`,
    `<button type="button" class="btn">Import scan</button>${modalBtn("Create operational issue", "risk-issue-new", "", true)}`);
  const findTabs = (c) => tabs([["findings", "By issue", 44], ["findings-vulns", "Vulnerabilities", 1], ["findings-assets", "By asset", 20], ["findings-assessment", "Assessment findings", 313], ["findings-deactivated", "Deactivated"]], c);
  ["findings-vulns", "findings-assets", "findings-assessment", "findings-deactivated"].forEach((r) => { ROUTE_NAV[r] = "findings"; });

  S.findings = () => {
    const v = cur("iss");
    const lateN = ISS.filter((i) => i.late).length, soonN = ISS.filter((i) => i.soon).length, fromN = ISS.filter((i) => i.from.length).length;
    const ownN = ISS.filter((i) => i.owner).length, poamN = ISS.filter((i) => i.poam).length;
    const f = { all: () => true, late: (i) => i.late, soon: (i) => i.soon, critical: (i) => i.sev === "critical", high: (i) => i.sev === "high", fromf: (i) => i.from.length, noowner: (i) => !i.owner }[v] || (() => true);
    const list = ISS.filter(f).sort((a, b) => a.due - b.due);
    return page(
      findHead(),
      pair(
        completion({ title: "Operational issues closed", total: 53, done: 9, unit: "closed", note: "44 open", minis: [["From assessment findings", fromN, 44], ["With a POA&M item", poamN, 44], ["With an owner", ownN, 44]] }),
        attn([["diamond", "Past their remediate-by date", lateN, false, ["iss", "late"]], ["clock", "Due within two weeks", soonN, false, ["iss", "soon"]], ["diamond", "Critical", 2, false, ["iss", "critical"]], ["diamond", "High", 12, false, ["iss", "high"]], ["ring", "No owner", 44 - ownN, false, ["iss", "noowner"]]]),
      ),
      findTabs("findings"),
      qvs("iss", [["all", "All", 44], ["late", "Past due", lateN], ["soon", "Due soon", soonN], ["critical", "Critical", 2], ["high", "High", 12], ["fromf", "From assessment findings", fromN], ["noowner", "No owner", 44 - ownN]]),
      tools("Search findings", ["Severity", "Owner", "Remediate by", "Control"]),
      tbl(["Operational issue", "Severity", "From finding", "Opened", "Remediate by", "POA&M item", "Owner"], list.slice(0, 12).map((i) => ({
        id: i.id, cells: [tr(i.title, 340), sevPill(i.sev), i.from.length ? `${tag(i.from[0][0])}${i.from.length > 1 ? ` <span class="risk-mu num">+${i.from.length - 1}</span>` : ""}` : ring("None"), `<span class="num">${dd(i.opened)}</span>`, dueC(i.due), i.poam ? tr(i.poam, 200) : ring("None"), who(i.owner || null)],
      })), list.length, "issue"),
      note("Remediate by counts from the day an issue opens: critical 15 days, high 30, moderate 90, low 180 (Settings › Deadlines). From finding is the published determination the issue rests on."),
    );
  };

  P.issue = (id) => {
    const i = issueById(id);
    const p = poamByTitle(i.poam);
    const gap = p && p.planned ? diffDays(D(p.planned)) - i.left : 0;
    return { label: "Operational issue preview", body: `
      ${phead(i.title, modalBtn("Create POA&M item", "risk-poam-new", i.id, true, true))}
      <dl class="kv"><dt>Severity</dt><dd>${sevPill(i.sev)}</dd><dt>Status</dt><dd>${pill("none", "Open")}</dd><dt>Opened</dt><dd>${dfull(i.opened)}</dd><dt>Remediate by</dt><dd>${dueC(i.due)}</dd><dt>Owner</dt><dd>${who(i.owner || null)}</dd></dl>
      ${i.late ? `<div class="next">${gl("diamond")}<span>${-i.left} days past its ${i.sev} deadline of ${SLA_TXT[i.sev]}</span></div>` : ""}
      ${DESC[i.id] ? sect("Why it fails", null, `<p class="risk-p">${esc(DESC[i.id])}</p>`) : ""}
      ${sect("Assessment findings", i.from.length, i.from.length ? i.from.map(([c, d]) => { const af = AF.find((x) => x.code === c && x.det === d); return line(DET[d][0] === "ok" ? "check" : DET[d][0] === "bad" ? "diamond" : "part", `${tag(c)} ${esc(DET[d][1])}`, af && af.res === "inc2" ? "Draft results" : af ? RES[af.res][1] : "Published"); }).join("") : `<span>Raised from an SBOM import, not an assessment.</span>`)}
      ${sect("POA&M item", p ? 1 : 0, p ? `${plink("risk-poam", p.id, p.title)}<div class="risk-mini">${bar(p.ms.length ? pct(p.reached, p.ms.length) : 0)}<span class="num">${p.reached} of ${p.ms.length} milestones · planned ${p.planned ? dd(p.planned) : "—"}</span></div>${gap > 0 ? line("clock", `Planned completion is ${gap} days after remediate-by`) : ""}` : ring("No POA&M item yet"))}
      ${sect("Not applicable?", null, `<span>Deactivate with a reason, evidence and an end date that switches it back on.</span><div>${modalBtn("Deactivate…", "risk-deactivate", i.id, false, true)}</div>`)}` };
  };
  const SLA_TXT = { critical: "15 days", high: "30 days", moderate: "90 days", low: "180 days" };

  S["findings-vulns"] = () => {
    const v = cur("vul");
    const list = VULNS.filter((x) => v === "all" || (v === "late" ? x.due < TODAY : v === "iava" ? x.iava && x.iava.startsWith("IAVA") : v === "iavb" ? x.iava && x.iava.startsWith("IAVB") : true));
    return page(
      findHead(),
      pair(
        completion({ title: "Open CVEs answered by a POA&M item", total: 1, done: 1, unit: "answered", note: "CVE-2024-6387 on LRU-001", minis: [["Assets affected", 1, 20], ["With an IAVA linked", 0, 1], ["Fix published", 1, 1]] }),
        attn([["diamond", "Past remediate-by", 1, false, ["vul", "late"]], ["clock", "Fix published, version not taken", 1], ["ring", "No IAVA or IAVB linked", 1], ["ring", "Known exploited (CISA KEV)", 0, true]]),
      ),
      findTabs("findings-vulns"),
      qvs("vul", [["all", "All"], ["late", "Past due"], ["iava", "IAVA"], ["iavb", "IAVB"]]),
      tools("Search CVEs", ["Severity", "Asset", "IAVM", "Remediate by"]),
      tbl(["CVE", "Title", "Severity", "Asset", "IAVA / IAVB", "Remediate by", "Status"], list.map((x) => ({
        id: x.id, cells: [`${esc(x.id)}${x.ex ? ` ${EX}` : ""}`, tr(x.title, 300), `${sevPill(x.sev)} <span class="num risk-mu">${x.cvss}</span>`, esc(x.asset), x.iava ? tag(x.iava) : ring("Not linked"), dueC(x.due), pill(x.status[0], x.status[1])],
      })), list.length, "risk-vuln"),
      note("CVE-2024-6387 is WS-X90's, read from the Mission Computer SBOM (CycloneDX 1.5, Oct 8). The other rows are Example, to show IAVA and IAVB deadlines beside the CVE's own."),
    );
  };
  P["risk-vuln"] = (id) => {
    const x = VULNS.find((v) => v.id === id) || VULNS[0];
    if (x.ex) return { label: "Vulnerability preview", body: `
      ${phead(`${x.id} · ${x.title}`, modalBtn("Create POA&M item", "risk-poam-new", x.id, true, true))}
      <p>${EX}</p>
      <dl class="kv"><dt>Severity</dt><dd>${sevPill(x.sev)} <span class="num risk-mu">CVSS ${x.cvss}</span></dd><dt>IAVM</dt><dd>${tag(x.iava)}</dd><dt>Asset</dt><dd>${esc(x.asset)}</dd><dt>Remediate by</dt><dd>${dueC(x.due)}</dd><dt>Status</dt><dd>${pill(x.status[0], x.status[1])}</dd></dl>
      ${sect("Deadlines", null, `${line("clock", "IAVM compliance date, from the notice", fromDate(x.due))}${line("ring", "Report compliance in the program's IAVM status")}`)}` };
    return { label: "Vulnerability preview", body: `
      ${phead("CVE-2024-6387 · regreSSHion", btn("Link IAVA", "data-risk-toast=\"An IAVA picker would open here\"", false, true) + plink("risk-poam", "def9d690", "Open POA&M item"))}
      <dl class="kv"><dt>Severity</dt><dd>${sevPill("high")} <span class="num risk-mu">CVSS 8.1</span></dd><dt>Vector</dt><dd class="risk-mono">AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H</dd><dt>Published</dt><dd>Jul 1, 2024</dd><dt>Fixed in</dt><dd>OpenSSH 9.8p1</dd><dt>Known exploited</dt><dd>No</dd><dt>Remediate by</dt><dd>${dueC(x.due)}</dd><dt>IAVA / IAVB</dt><dd>${ring("Not linked")}</dd></dl>
      <div class="next">${gl("clock")}<span>Mission Computer version 2 carries OpenSSH 9.8p1. WS-X90 runs version 1.</span></div>
      ${sect("Where it is", 1, `${line("diamond", "openssh-server 9.6p1 · Affected", "VEX")}<span class="risk-mu">Mission Computer maintenance image SBOM · Oct 8 · 13 components · on LRU-001</span>`)}
      ${sect("Controls", 2, `${line("ring", `${tag("RA-5")} Vulnerability Monitoring and Scanning`)}${line("ring", `${tag("SI-2")} Flaw Remediation`)}`)}
      ${sect("Operational issue", 1, plink("issue", "c0fdce4e", "CVE-2024-6387 in the OpenSSH server (regreSSHion)"))}
      ${sect("Offered to the component's owner", 1, line("info", "Offered by Ingrid Solberg on Nov 14", "Waits on Priya Raghavan"))}` };
  };

  S["findings-assets"] = () => {
    const v = cur("ast");
    const withN = ASSETS.filter((a) => a.issues.length).length;
    const list = ASSETS.filter((a) => v === "all" || (v === "with" ? a.issues.length : v === "late" ? a.next && a.next < TODAY : v === "cve" ? a.cves : true))
      .sort((a, b) => (b.issues.length ? 1 : 0) - (a.issues.length ? 1 : 0) || (a.worst ? SEVR[a.worst] : 9) - (b.worst ? SEVR[b.worst] : 9) || a.id.localeCompare(b.id));
    const lateA = ASSETS.filter((a) => a.next && a.next < TODAY).length;
    return page(
      findHead(),
      pair(
        completion({ title: "Assets with no open issue", total: 20, done: 20 - withN, unit: "assets clear", note: `${withN} assets carry an open issue`, minis: [["With an SBOM", 1, 20], ["With an open CVE", 1, 20], ["Critical issue", 1, 20]] }),
        attn([["diamond", "An issue past remediate-by", lateA, false, ["ast", "late"]], ["diamond", "A critical issue", 1, false, ["ast", "with"]], ["clock", "An open CVE", 1, false, ["ast", "cve"]], ["ring", "No SBOM", 19]]),
      ),
      findTabs("findings-assets"),
      qvs("ast", [["all", "All", 20], ["with", "With open issues", withN], ["late", "Past due", lateA], ["cve", "Open CVE", 1]]),
      tools("Search assets", ["Element", "Severity", "SBOM"]),
      tbl(["Asset", "LRU", "Open issues", "Worst", "Open CVEs", "Next remediate-by", "SBOM"], list.slice(0, 20).map((a) => ({
        id: a.id, cells: [`${esc(a.name)} <span class="risk-mu num">${a.id}</span>`, tag(a.lru), `<span class="num">${a.issues.length}</span>`, a.worst ? sevPill(a.worst) : ring("None"), `<span class="num">${a.cves || "—"}</span>`, a.next ? dueC(a.next) : `<span class="risk-mu">—</span>`, a.sbom ? pill("ok", "CycloneDX 1.5") : ring("None")],
      })), list.length, "risk-asset"),
      note("An issue counts on an asset when it names the asset, or, for CVE-2024-6387, through the Mission Computer SBOM; the schema links no issue to an asset yet."),
    );
  };
  P["risk-asset"] = (id) => {
    const a = ASSETS.find((x) => x.id === id) || ASSETS[0];
    return { label: "Asset preview", body: `
      ${phead(a.name, btn("Import scan", "", false, true))}
      <dl class="kv"><dt>Asset</dt><dd class="num">${a.id}</dd><dt>LRU</dt><dd>${tag(a.lru)}</dd><dt>Boundary</dt><dd>${tag("SYS-WSX90")}</dd><dt>Worst open</dt><dd>${a.worst ? sevPill(a.worst) : ring("None")}</dd><dt>SBOM</dt><dd>${a.sbom ? "Mission Computer maintenance image · Oct 8" : ring("None")}</dd></dl>
      ${sect("Open issues", a.issues.length, a.issues.length ? a.issues.map((i) => `<div class="risk-line">${gl(i.sev === "critical" || i.sev === "high" ? "diamond" : "clock")}${plink("issue", i.id, i.title)}<span class="risk-le">${dueC(i.due)}</span></div>`).join("") : "No open issue names this asset.")}
      ${a.cves ? sect("Vulnerabilities", 1, `<div class="risk-line">${gl("diamond")}${plink("risk-vuln", "CVE-2024-6387", "CVE-2024-6387 · openssh-server 9.6p1")}</div>`) : ""}
      ${sect("STIG checklists", null, `${ring("No checklist imported")}<span class="risk-mu">CAT I / II / III counts appear once a .ckl or .cklb is imported.</span>`)}` };
  };

  S["findings-assessment"] = () => {
    const v = cur("af");
    const shown = v === "all" ? AF : AF.filter((x) => x.det === v);
    return page(
      findHead(),
      pair(
        completion({ title: "Determinations satisfied", total: 313, done: 187, unit: "satisfied", note: "2 results published · 1 draft", minis: [["Partially satisfied", 38, 313], ["Other than satisfied", 14, 313], ["Not assessed", 74, 313]] }),
        attn([["diamond", "Other than satisfied", 14, false, ["af", "other_than_satisfied"]], ["part", "Partially satisfied", 38, false, ["af", "partially_satisfied"]], ["clock", "Not assessed", 74, false, ["af", "not_assessed"]], ["info", "In draft results, increment 2", 20, true], ["ring", "Linked to a risk", 0, true]]),
      ),
      findTabs("findings-assessment"),
      qvs("af", [["all", "All", 313], ["other_than_satisfied", "Other than satisfied", 14], ["partially_satisfied", "Partially satisfied", 38], ["not_assessed", "Not assessed", 74], ["satisfied", "Satisfied", 187]]),
      tools("Search assessment findings", ["Determination", "Results", "Control family", "Assessor"]),
      tbl(["Control", "Assessment finding", "Determination", "Results", "Determined", "Operational issue"], shown.slice(0, 14).map((x) => {
        const i = ISSUE_OF[x.code];
        return { id: x.id, cells: [tag(x.code), tr(x.title, 340), detPill(x.det), `${esc(RES[x.res][0])}${x.res === "inc2" ? ` ${pill("none", "Draft")}` : ""}`, `<span class="num">${dd(x.date)}</span>`, i ? `<span class="who">${gl("check")}<span style="color:var(--ink)">Opened</span></span>` : x.det === "satisfied" || x.det === "not_assessed" ? `<span class="risk-mu">—</span>` : ring("None")] };
      }), AF_COUNTS[v] || 313, "risk-finding"),
      note("From assessment_finding_rows: 313 determinations by Nadia Fournier across the initial authorization SAR (68), the expanded set's increment 1 (225) and its draft increment 2 (20). Ordered worst first, then by the catalog's reading order."),
    );
  };
  P["risk-finding"] = (id) => {
    const x = AF.find((f) => f.id === id) || AF[0];
    const i = ISSUE_OF[x.code];
    const p = i && poamByTitle(i.poam);
    const short = x.det !== "satisfied" && x.det !== "not_assessed";
    return { label: "Assessment finding preview", body: `
      ${phead(`${x.code} ${x.title}`, short && !i ? modalBtn("Create operational issue", "risk-issue-new", x.code, true, true) : short ? modalBtn("Create POA&M item", "risk-poam-new", i.id, true, true) : "")}
      <dl class="kv"><dt>Determination</dt><dd>${detPill(x.det)}</dd><dt>Results</dt><dd>${esc(RES[x.res][0])}</dd><dt>State</dt><dd>${x.res === "inc2" ? pill("none", "Draft") : pill("ok", RES[x.res][1])}</dd><dt>Determined</dt><dd>${dfull(x.date)}</dd><dt>Assessor</dt><dd>${who("Nadia Fournier")}</dd></dl>
      ${x.res === "inc2" ? `<div class="next">${gl("info")}<span>Draft results decide nothing until D. Okafor publishes them.</span></div>` : ""}
      ${sect("Operational issue", i ? 1 : 0, i ? `${plink("issue", i.id, i.title)}<span class="risk-mu">${esc(cap(i.sev))} · remediate by ${fromDate(i.due)}</span>` : short ? ring("None yet: an issue makes it a POA&M line") : "Nothing to remediate.")}
      ${p ? sect("POA&M item", 1, `${plink("risk-poam", p.id, p.title)}<div class="risk-mini">${bar(p.ms.length ? pct(p.reached, p.ms.length) : 0)}<span class="num">${p.reached} of ${p.ms.length} milestones</span></div>`) : ""}` };
  };

  S["findings-deactivated"] = () => page(
    findHead(),
    pair(
      `<div class="card"><div class="t">Deactivated <span>${EX}</span></div><div class="big num">4</div><div class="foot"><span>findings switched off with a reason</span><span>each switches back on by itself</span></div></div>`,
      attn([["clock", `Switches back on within 14 days ${EX}`, 1], ["ring", `No evidence attached ${EX}`, 1], ["info", "Deactivated in WS-X90 today", 0, true]]),
    ),
    findTabs("findings-deactivated"),
    tools("Search deactivated findings", ["Reason", "Asset", "Ends"]),
    tbl(["Finding", "Asset", "Reason", "Evidence", "Deactivated by", "Switches back on"], DEACT.map((x) => ({
      id: x.id, cells: [`${tr(x.finding, 300)} ${EX}`, esc(x.scope), tag(x.reason), x.evidence ? tr(x.evidence, 220) : ring("None"), who(x.by), dueC(D(x.ends))],
    })), 4, "risk-deact"),
    note("No finding is deactivated in WS-X90 today; the rows are Example. A deactivation keeps its reason, its evidence and who decided, and the finding returns to the register on its end date."),
  );
  P["risk-deact"] = (id) => {
    const x = DEACT.find((d) => d.id === id) || DEACT[0];
    return { label: "Deactivated finding preview", body: `
      ${phead(x.finding, btn("Switch back on", `data-risk-toast="${esc(x.finding)} is back in the register"`, true, true))}
      <p>${EX}</p>
      <dl class="kv"><dt>Asset</dt><dd>${esc(x.scope)}</dd><dt>Reason</dt><dd>${tag(x.reason)}</dd><dt>Deactivated by</dt><dd>${who(x.by)}</dd><dt>Switches on</dt><dd>${dueC(D(x.ends))}</dd></dl>
      ${sect("Justification", null, `<p class="risk-p">${esc(x.why)}</p>`)}
      ${sect("Evidence", x.evidence ? 1 : 0, x.evidence ? line("check", esc(x.evidence)) : ring("None attached"))}
      ${sect("History", 2, `${line("info", `Deactivated by ${esc(x.by)}`, "Oct 30")}${line("ring", "Switches back on", fromDate(D(x.ends)))}`)}` };
  };

  M["risk-deactivate"] = (id) => {
    const i = ISS.find((x) => x.id === id);
    const end = addDays("2026-11-17", 90);
    return { title: "Deactivate finding", body: `
      ${field("Finding", `<div class="risk-ro">${esc(i ? i.title : id || "STIG V-230264, package signature check (CAT II)")}</div>`)}
      ${field("Reason", select(["Not applicable to this system", "Compensating control", "False positive", "Risk accepted (opens Request acceptance)"], "Not applicable to this system"))}
      ${field("Justification", area("", 3, "Why this finding does not apply, in one or two sentences"), "Required. The assessor and the AO see it beside the finding.")}
      ${field("Evidence", select(["Attach a file or choose evidence…", "Media signing procedure, revision 4", "Flight configuration export, build 4.2.1"], "Attach a file or choose evidence…"), "Optional, and asked for at the next assessment.")}
      ${field("Switches back on", input(end.toISOString().slice(0, 10), "date"), "Required, at most 12 months away. The finding returns to the register that day.")}
      ${note("Deactivating never closes the issue's POA&M item; it pauses its deadline.")}`,
      footer: footer("Deactivate", "Deactivated until " + fromDate(end)) };
  };
  M["risk-issue-new"] = (code) => ({ title: "Create operational issue", body: `
      ${field("Title", input("", "text", 'placeholder="What fails, where, and the control in brackets"'))}
      <div class="risk-row2">${field("Severity", select(["Critical", "High", "Moderate", "Low"], "High"))}${field("Owner", select(["No owner", ...PEOPLE], "No owner"))}</div>
      ${field("Rests on", select(["No assessment finding", ...AF.filter((x) => x.det === "other_than_satisfied" || x.det === "partially_satisfied").map((x) => `${x.code} · ${DET[x.det][1]}`)], code ? `${code} · ${DET[(AF.find((x) => x.code === code) || AF[0]).det][1]}` : "No assessment finding"))}
      ${field("Asset", select(["None", ...ASSETS.map((a) => `${a.name} · ${a.lru}`)], "None"))}
      ${note("Remediate by is set from the severity: critical 15 days, high 30, moderate 90, low 180.")}`,
    footer: footer("Create operational issue", "Operational issue created") });

  M["risk-poam-new"] = (id) => {
    const i = ISS.find((x) => x.id === id);
    const v = VULNS.find((x) => x.id === id);
    const existing = i && poamByTitle(i.poam);
    const due = i ? i.due : v ? v.due : addDays("2026-11-17", 90);
    const subject = i ? i.title : v ? `${v.id} · ${v.title}` : null;
    return { title: "Create POA&M item", body: `
      ${subject ? field("Answers", `<div class="risk-ro">${esc(subject)}</div>`) : field("Answers", select(["Choose operational issues, risks or findings…", ...ISS.slice(0, 8).map((x) => x.title)], "Choose operational issues, risks or findings…"))}
      ${existing ? fieldset("This issue is already answered", `${radio("risk-pn", "Create a new item", true, "Both items then answer it")}${radio("risk-pn", `Add a milestone to ${esc(existing.title)}`, false, `${existing.reached} of ${existing.ms.length} milestones reached`)}`) : ""}
      ${field("Title", input(i ? `Remediate: ${i.title.replace(/\s*\(.*\)$/, "")}` : v ? `Remediate ${v.id} on the ${v.asset.split(" · ")[0]}` : ""))}
      <div class="risk-row2">${field("Owner", select(["No owner", ...PEOPLE], i && i.owner ? i.owner : "No owner"))}${field("Planned completion", input(due.toISOString().slice(0, 10), "date"), `Remediate by ${fromDate(due)}${i ? `, the ${i.sev} deadline` : ""}`)}</div>
      ${fieldset("Milestones", ["Correct the implementation or configuration", "Collect replacement evidence", "Reassess the affected control"].map((t, n) => `<div class="risk-ms"><span class="num">${n + 1}</span>${input(t)}${input(addDays("2026-11-17", 20 * (n + 1)).toISOString().slice(0, 10), "date", 'aria-label="Planned date"')}</div>`).join("") + `<button type="button" class="btn sm">Add milestone</button>`)}
      ${field("Resources", input("", "text", 'placeholder="Funding, people or parts the plan needs"'))}
      ${note("The item joins the WS-X90 POA&M and exports to eMASS and OSCAL with its milestones.")}`,
      footer: footer("Create POA&M item", "POA&M item created") };
  };

  // ═════════════ POA&M ═════════════
  ROUTE_NAV["poam-milestones"] = "poam";
  const poamHead = () => header("POA&M", `<span>WS-X90 Sentinel Mission System — POA&amp;M</span><span>Items <b>41</b></span><span>Milestones <b>${MILESTONES.length}</b></span>`,
    `${modalBtn("Export ▾", "risk-export", "poam")}${modalBtn("Create POA&M item", "risk-poam-new", "", true)}`);
  const poamCards = () => {
    const lateMs = MILESTONES.filter((m) => m.status !== "completed" && m.planned && D(m.planned) < TODAY).length;
    const pastPlan = POAM.filter((p) => p.status !== "completed" && p.planned && D(p.planned) < TODAY).length;
    const lateVs = POAM.filter((p) => p.lateVsDeadline > 0).length;
    const fromF = POAM.filter((p) => p.fromF).length;
    return pair(
      completion({ title: "POA&M items completed", total: 41, done: 7, unit: "completed", note: "33 in progress · 1 not started", minis: [["Milestones reached", MILESTONES.filter((m) => m.status === "completed").length, MILESTONES.length], ["From assessment findings", fromF, 41], ["Plan inside remediate-by", POAM.filter((p) => p.status !== "completed" && p.deadline && p.lateVsDeadline <= 0).length, POAM.filter((p) => p.status !== "completed" && p.deadline).length]] }),
      attn([["diamond", "Planned completion passed", pastPlan, false, ["poam", "pastplan"]], ["clock", "Plan later than remediate-by", lateVs, false, ["poam", "latevs"]], ["diamond", "Milestones overdue", lateMs], ["ring", "No owner", POAM.filter((p) => !p.owner).length, false, ["poam", "noowner"]]]),
    );
  };
  S.poam = () => {
    const v = cur("poam");
    const f = { all: () => true, in_progress: (p) => p.status === "in_progress", open: (p) => p.status === "open", completed: (p) => p.status === "completed", pastplan: (p) => p.status !== "completed" && p.planned && D(p.planned) < TODAY, latevs: (p) => p.lateVsDeadline > 0, fromf: (p) => p.fromF, noowner: (p) => !p.owner }[v] || (() => true);
    const list = POAM.filter(f).sort((a, b) => (a.status === "completed") - (b.status === "completed") || (a.deadline || Infinity) - (b.deadline || Infinity));
    return page(
      poamHead(), poamCards(),
      tabs([["poam", "Items", 41], ["poam-milestones", "Milestones", MILESTONES.length]], "poam"),
      qvs("poam", [["all", "All", 41], ["in_progress", "In progress", 33], ["open", "Not started", 1], ["completed", "Completed", 7], ["pastplan", "Planned date passed", POAM.filter((p) => p.status !== "completed" && p.planned && D(p.planned) < TODAY).length], ["latevs", "Later than remediate-by", POAM.filter((p) => p.lateVsDeadline > 0).length], ["fromf", "From findings", POAM.filter((p) => p.fromF).length]]),
      tools("Search POA&M items", ["Status", "Owner", "Planned completion", "Source"]),
      tbl(["POA&M item", "Status", "Progress", "Planned", "Remediate by", "From", "Owner"], list.slice(0, 14).map((p) => ({
        id: p.id, cells: [tr(p.title, 280), pstat(p.status), p.ms.length ? `<span class="risk-prog">${bar(pct(p.reached, p.ms.length))}<span class="num">${p.reached} of ${p.ms.length}</span></span>` : `<span class="risk-mu">—</span>`,
          p.planned ? (p.status === "completed" ? `<span class="num">${dd(p.planned)}</span>` : dueC(D(p.planned))) : ring("Not set"),
          p.deadline ? `${dueC(p.deadline)}${p.lateVsDeadline > 0 ? ` <span class="risk-plus" title="The plan ends ${p.lateVsDeadline} days after remediate-by">plan +${p.lateVsDeadline}d</span>` : ""}` : `<span class="risk-mu">—</span>`,
          p.issues.length ? `${p.fromF ? tag(p.issues.find((i) => i.from.length)?.from[0][0] || "") : `<span class="risk-mu">REQ</span>`}${p.issues.length > 1 ? ` <span class="num risk-mu">+${p.issues.length - 1}</span>` : ""}` : `<span class="risk-mu">Closed</span>`, who(p.owner || null)],
      })), list.length, "risk-poam"),
      note("Remediate by is the earliest deadline among the open issues an item answers. A tag is the control of the assessment finding the item came from."),
    );
  };
  S["poam-milestones"] = () => {
    const v = cur("ms");
    const open = MILESTONES.filter((m) => m.status !== "completed");
    const f = { all: (m) => m.status !== "completed", late: (m) => m.status !== "completed" && m.planned && D(m.planned) < TODAY, soon: (m) => m.status !== "completed" && m.planned && diffDays(D(m.planned)) >= 0 && diffDays(D(m.planned)) <= 14, nodate: (m) => m.status !== "completed" && !m.planned, done: (m) => m.status === "completed" }[v];
    const list = MILESTONES.filter(f).sort((a, b) => (a.planned ? D(a.planned) : Infinity) - (b.planned ? D(b.planned) : Infinity));
    return page(
      poamHead(), poamCards(),
      tabs([["poam", "Items", 41], ["poam-milestones", "Milestones", MILESTONES.length]], "poam-milestones"),
      qvs("ms", [["all", "Open", open.length], ["late", "Overdue", MILESTONES.filter((m) => m.status !== "completed" && m.planned && D(m.planned) < TODAY).length], ["soon", "Due within two weeks", MILESTONES.filter((m) => m.status !== "completed" && m.planned && diffDays(D(m.planned)) >= 0 && diffDays(D(m.planned)) <= 14).length], ["nodate", "No planned date", MILESTONES.filter((m) => m.status !== "completed" && !m.planned).length], ["done", "Reached", MILESTONES.filter((m) => m.status === "completed").length]]),
      tools("Search milestones", ["Status", "Owner", "Planned date"]),
      tbl(["Milestone", "POA&M item", "Status", "Planned", "Owner"], list.slice(0, 14).map((m) => ({
        id: `${m.item}:${m.seq}`, cells: [tr(m.title, 380), tr(poamById(m.item).title, 260), pstat(m.status), m.planned ? (m.status === "completed" ? `<span class="num">${dd(m.planned)}</span>` : dueC(D(m.planned))) : ring("Not set"), who(m.owner || null)],
      })), list.length, "risk-milestone"),
      note("The milestones of the requirement-gap items (Remediate REQ-…) carry no planned date yet; eMASS will refuse them until they do."),
    );
  };
  P["risk-poam"] = (id) => {
    const p = poamById(id);
    return { label: "POA&M item preview", body: `
      ${phead(p.title, modalBtn("Add milestone", "risk-ms-new", p.id, true, true))}
      <dl class="kv"><dt>Status</dt><dd>${pstat(p.status)}</dd><dt>Planned</dt><dd>${p.planned ? (p.status === "completed" ? dfull(p.planned) : dueC(D(p.planned))) : ring("Not set")}</dd><dt>Remediate by</dt><dd>${p.deadline ? dueC(p.deadline) : `<span class="risk-mu">No open issue</span>`}</dd><dt>Progress</dt><dd><span class="risk-prog">${bar(p.ms.length ? pct(p.reached, p.ms.length) : 0)}<span class="num">${p.reached} of ${p.ms.length}</span></span></dd><dt>Owner</dt><dd>${who(p.owner || null)}</dd></dl>
      ${p.lateVsDeadline > 0 ? `<div class="next">${gl("clock")}<span>The plan ends ${p.lateVsDeadline} days after the remediate-by date. Move a milestone or record why.</span></div>` : ""}
      ${sect("Milestones", p.ms.length, p.ms.length ? p.ms.map((m) => `<div class="risk-line">${gl(m.status === "completed" ? "check" : m.status === "in_progress" ? "clock" : "ring")}${plink("risk-milestone", `${p.id}:${m.seq}`, m.title)}<span class="risk-le">${m.planned ? (m.status === "completed" ? `<span class="num">${dd(m.planned)}</span>` : dueC(D(m.planned))) : "No date"}</span></div>`).join("") : ring("None recorded"))}
      ${sect("Answers", p.issues.length, p.issues.length ? p.issues.map((i) => `<div class="risk-line">${gl(i.sev === "critical" || i.sev === "high" ? "diamond" : "clock")}${plink("issue", i.id, i.title)}</div>`).join("") : "Its issues are closed.")}
      ${p.plan ? sect("Remediation plan", null, `<p class="risk-p">${esc(p.plan)}</p>`) : ""}` };
  };
  P["risk-milestone"] = (id) => {
    const [item, seq] = String(id).split(":");
    const p = poamById(item);
    const m = p.ms.find((x) => String(x.seq) === seq) || p.ms[0] || { seq: 1, title: "No milestone", status: "planned" };
    return { label: "Milestone preview", body: `
      ${phead(m.title, m.status === "completed" ? "" : btn("Mark reached", `data-risk-toast="Milestone ${m.seq} reached"`, true, true))}
      <dl class="kv"><dt>Milestone</dt><dd class="num">${m.seq} of ${p.ms.length}</dd><dt>Status</dt><dd>${pstat(m.status)}</dd><dt>Planned</dt><dd>${m.planned ? (m.status === "completed" ? dfull(m.planned) : dueC(D(m.planned))) : ring("Not set")}</dd><dt>Reached</dt><dd>${m.done ? dfull(m.done) : `<span class="risk-mu">—</span>`}</dd><dt>Owner</dt><dd>${who(m.owner || null)}</dd></dl>
      ${sect("POA&M item", 1, `${plink("risk-poam", p.id, p.title)}<span class="risk-mu">Remediate by ${p.deadline ? fromDate(p.deadline) : "—"}</span>`)}
      ${sect("Change the planned date", null, `<span>A slipped date keeps the original and the reason, as eMASS asks.</span><div>${modalBtn("Change planned date", "risk-ms-move", id, false, true)}</div>`)}` };
  };
  M["risk-ms-new"] = (id) => ({ title: "Add milestone", body: `${field("POA&M item", `<div class="risk-ro">${esc(poamById(id).title)}</div>`)}${field("Milestone", input("", "text", 'placeholder="What is done, in one line"'))}<div class="risk-row2">${field("Planned date", input("2026-12-15", "date"))}${field("Owner", select(["No owner", ...PEOPLE], "No owner"))}</div>`, footer: footer("Add milestone", "Milestone added") });
  M["risk-ms-move"] = (id) => {
    const [item, seq] = String(id).split(":"); const p = poamById(item); const m = p.ms.find((x) => String(x.seq) === seq) || p.ms[0];
    return { title: "Change planned date", body: `${field("Milestone", `<div class="risk-ro">${esc(m ? m.title : "")}</div>`)}<div class="risk-row2">${field("Was", `<div class="risk-ro num">${m && m.planned ? dfull(m.planned) : "Not set"}</div>`)}${field("New planned date", input("2027-01-15", "date"))}</div>${field("Reason for the change", area("", 3, "Why the date moves; it stays in the item's history and the eMASS export"))}`, footer: footer("Change planned date", "Planned date changed; the original is kept") };
  };

  // ═════════════ Risks ═════════════
  ROUTE_NAV["risks-snapshots"] = "risks";
  const riskHead = () => header("Risks", `<span>WS-X90 risk register</span><span>Open <b>40</b></span><span>Last decision snapshot <b>Sep 18</b></span>`, `<button type="button" class="btn">Export ▾</button>${modalBtn("Create risk", "risk-risk-new", "", true)}`);
  const sevStack = (c, h2 = "Open risks", mins = null) => `<div class="card"><div class="t">${esc(h2)} <span class="num">${c.critical + c.high + c.moderate + c.low} total</span></div><div class="big num">${c.critical + c.high + c.moderate + c.low}</div><div class="stack"><i style="flex:${c.critical};background:var(--bad)"></i><i style="flex:${c.high};background:var(--bad);opacity:.6"></i><i style="flex:${c.moderate};background:var(--warn)"></i><i style="flex:${c.low};background:var(--ink-4)"></i></div><div class="legend"><span style="--c:var(--bad)">Critical ${c.critical}</span><span style="--c:color-mix(in srgb, var(--bad) 60%, var(--canvas))">High ${c.high}</span><span style="--c:var(--warn)">Moderate ${c.moderate}</span><span style="--c:var(--ink-4)">Low ${c.low}</span></div>${mins ? `<div class="minis">${mins.map(([l, n, of]) => `<div class="mini">${esc(l)}<b class="num">${fmt(n)}</b>${bar(pct(n, of))}</div>`).join("")}</div>` : ""}</div>`;
  const SEVC = { critical: 2, high: 10, moderate: 18, low: 10 };
  S.risks = () => {
    const v = cur("risk");
    const pastResp = RISKS.filter((r) => r.due && D(r.due) < TODAY).length;
    const f = { all: () => true, critical: (r) => r.sev === "critical", high: (r) => r.sev === "high", moderate: (r) => r.sev === "moderate", low: (r) => r.sev === "low", pastresp: (r) => r.due && D(r.due) < TODAY, noowner: (r) => !r.owner }[v];
    const list = RISKS.filter(f);
    return page(
      riskHead(),
      pair(sevStack(SEVC, "Open risks", [["Response: mitigate", 40, 40], ["With ATT&CK techniques", 24, 40], ["Accepted", 0, 40]]), attn([["ring", "No owner", 40, false, ["risk", "noowner"]], ["diamond", "Critical or high", 12, false, ["risk", "high"]], ["clock", "Response date passed", pastResp, false, ["risk", "pastresp"]], ["info", "Awaiting acceptance", 0, true], ["ring", "Accepted", 0, true]])),
      tabs([["risks", "Register", 40], ["risks-snapshots", "Snapshots", 1]], "risks"),
      qvs("risk", [["all", "All", 40], ["critical", "Critical", 2], ["high", "High", 10], ["moderate", "Moderate", 18], ["low", "Low", 10], ["pastresp", "Response date passed", pastResp]]),
      tools("Search risks", ["Severity", "Likelihood", "Impact", "ATT&CK technique", "Owner"]),
      tbl(["Risk", "Severity", "Likelihood × impact", "ATT&CK techniques", "Response due", "Owner"], list.slice(0, 14).map((r) => ({
        id: r.id, cells: [tr(r.title, 330), sevPill(r.sev), `${esc(cap(r.lik))} × ${esc(cap(r.imp))}`, r.tech.length ? r.tech.map((t) => tag(t[0])).join(" ") : ring("None"), r.due ? dueC(D(r.due)) : ring("Not set"), who(r.owner || null)],
      })), list.length, "risk"),
      note("Every risk's response is Mitigate today. ATT&CK techniques are those NIST SP 800-160 Vol. 2 Appendix F prints, linked to 24 of the 40 risks."),
    );
  };
  P.risk = (id) => {
    const r = riskById(id);
    const chain = [["ISSO", "Priya Raghavan"], ["ISSM", "Joel Barrantes"], ["Authorizing official", "R. Calloway"]];
    return { label: "Risk preview", body: `
      ${phead(r.title, modalBtn("Request acceptance", "risk-accept", r.id, true, true))}
      <dl class="kv"><dt>Severity</dt><dd>${sevPill(r.sev)}</dd><dt>Likelihood</dt><dd>${esc(cap(r.lik))}</dd><dt>Impact</dt><dd>${esc(cap(r.imp))}</dd><dt>Response</dt><dd>Mitigate · due ${r.due ? fromDate(D(r.due)) : "—"}</dd><dt>Owner</dt><dd>${who(r.owner || null)}</dd></dl>
      ${sect("Threat", null, `<p class="risk-p">${esc(r.threat)}</p>`)}
      ${sect("ATT&CK techniques", r.tech.length, r.tech.length ? r.tech.map(([c, t]) => line("info", `${tag(c)} ${esc(t)}`, "Enterprise")).join("") : `${ring("None linked")}<div>${btn("Link ATT&CK technique", 'data-risk-toast="The technique picker would open here"', false, true)}</div>`)}
      ${sect("Acceptance, in order", 3, `<div class="chain">${chain.map(([role, n], k) => `<div class="step">${gl("ring")}<span>${esc(role)} · ${esc(n)}</span><span class="risk-mu">${k === 2 ? "Signs last" : "Not started"}</span></div>`).join("")}</div><span class="risk-mu">From the program's role holders. An acceptance expires after 12 months, or with the ATO on Sep 17, 2029, whichever comes first.</span>`)}
      ${sect("Snapshot at the last decision", null, line("check", `ATO with conditions · Sep 18, 2026 · ${esc(cap(r.sev))}, ${esc(r.lik)} × ${esc(r.imp)}`, "Unchanged"))}` };
  };
  M["risk-accept"] = (id) => {
    const r = riskById(id);
    return { title: "Request acceptance", body: `
      ${field("Risk", `<div class="risk-ro">${esc(r.title)} · ${esc(cap(r.sev))}</div>`)}
      ${fieldset("Approvers, in order", `<ol class="risk-ol"><li>${who("Priya Raghavan")}<span class="risk-mu">ISSO</span></li><li>${who("Joel Barrantes")}<span class="risk-mu">ISSM</span></li><li>${who("R. Calloway")}<span class="risk-mu">Authorizing official · signs</span></li></ol><span class="risk-hint">From WS-X90's role holders. Each step sees the steps before it.</span>`)}
      ${field("Residual risk statement", area("", 3, "What remains after the planned mitigation, and why it is acceptable for operational use"))}
      ${field("Compensating measures", area("", 2, "Controls or procedures that hold the risk down until remediation"))}
      <div class="risk-row2">${field("Acceptance expires", input("2027-11-17", "date"), "At most 12 months, and never after the ATO's ATD, Sep 17, 2029.")}${field("Review cadence", select(["Monthly", "Quarterly", "At each ConMon report"], "Quarterly"))}</div>
      ${check("Lock a snapshot of the risk with the request", true, "disabled")}`,
      footer: footer("Send to Priya Raghavan", "Acceptance requested: Priya Raghavan is first") };
  };
  M["risk-risk-new"] = () => ({ title: "Create risk", body: `${field("Title", input("", "text", 'placeholder="What could happen, to what, in one sentence"'))}${field("Threat", area("", 2, "Who or what, and how"))}<div class="risk-row2">${field("Likelihood", select(["Low", "Moderate", "High"], "Moderate"))}${field("Impact", select(["Low", "Moderate", "High"], "High"))}</div><div class="risk-row2">${field("Response", select(["Mitigate", "Accept", "Avoid", "Transfer"], "Mitigate"))}${field("Owner", select(["No owner", ...PEOPLE], "No owner"))}</div>${field("ATT&CK techniques", select(["Choose techniques…", "T1078 Valid Accounts", "T1195 Supply Chain Compromise", "T1200 Hardware Additions"], "Choose techniques…"))}`, footer: footer("Create risk", "Risk created") });

  S["risks-snapshots"] = () => page(
    riskHead(),
    pair(sevStack(SEVC, "What the AO saw on Sep 18", [["Response: mitigate", 40, 40], ["Assessed Sep 12", 40, 40], ["Accepted", 0, 40]]),
      attn([["diamond", "Operational issues opened since", 36], ["diamond", "Critical issues opened since", 2], ["info", "Assessment results published since", 1], ["ring", "Risks reassessed since", 0, true], ["ring", "Risks added since", 0, true]], "Since the snapshot")),
    tabs([["risks", "Register", 40], ["risks-snapshots", "Snapshots", 1]], "risks-snapshots"),
    tbl(["Snapshot", "Decision", "Taken", "Risks", "Critical or high", "Locked by", "State"], [
      { id: "v1", cells: ["Package version 1", tag("ATO with conditions"), `<span class="num">Sep 18, 2026</span>`, `<span class="num">40</span>`, `<span class="num">12</span>`, who("R. Calloway"), pill("ok", "Locked")] },
      { id: "v2", cells: ["Package version 2", ring("Pending decision"), `<span class="risk-mu">At signing</span>`, `<span class="num risk-mu">40 now</span>`, `<span class="num risk-mu">12 now</span>`, who(null), pill("none", "Not taken")] },
      { id: "ex", cells: [`Risk acceptance · bearer port group ${EX}`, tag("Risk accepted"), `<span class="num">—</span>`, `<span class="num">1</span>`, `<span class="num">0</span>`, who("R. Calloway"), pill("ok", "Locked")] },
    ], 3, "risk-snap"),
    note("A snapshot locks what the decision maker saw: each risk's severity, likelihood, impact, threat and response. WS-X90's 40 risk revisions were assessed Sep 12 and none has changed, so version 1's snapshot reads as the register does today. The third row is Example."),
  );
  P["risk-snap"] = (id) => {
    if (id === "ex") return { label: "Snapshot preview", body: `${phead("Risk acceptance · bearer port group")}<p>${EX}</p><dl class="kv"><dt>Risk</dt><dd>Primary and alternate bearers converge on one switch port group</dd><dt>Decision</dt><dd>${tag("Risk accepted")}</dd><dt>Expires</dt><dd>12 months after signing</dd></dl>${sect("Signed in order", 3, ["Priya Raghavan", "Joel Barrantes", "R. Calloway"].map((n) => line("check", esc(n))).join(""))}` };
    const v2 = id === "v2";
    return { label: "Snapshot preview", body: `
      ${phead(v2 ? "Package version 2 · pending" : "Package version 1 · ATO with conditions", v2 ? "" : btn("Compare with today", 'data-risk-toast="No risk changed since Sep 18"', false, true))}
      <dl class="kv"><dt>Decision</dt><dd>${v2 ? ring("Pending") : tag("ATO with conditions")}</dd><dt>Taken</dt><dd>${v2 ? "Locks when the AO signs" : "Sep 18, 2026"}</dd><dt>Decided by</dt><dd>${who(v2 ? null : "R. Calloway")}</dd><dt>Risks</dt><dd class="num">40 · 2 critical, 10 high, 18 moderate, 10 low</dd></dl>
      ${sect("Critical and high", 12, RISKS.filter((r) => r.sev === "critical" || r.sev === "high").map((r) => `<div class="risk-line">${gl("diamond")}${plink("risk", r.id, r.title)}</div>`).join(""))}
      ${v2 ? "" : sect("Conditions of the decision", 3, CONDITIONS.map((c) => line("clock", esc(c[0]))).join(""))}` };
  };

  // ═════════════ Authorization ═════════════
  const CONDITIONS = [
    ["Close the high-severity remediation items within 90 days", "2026-12-17", "12 high issues open"],
    ["Complete the expanded control set assessment", "2026-11-20", "Campaign ends Nov 20"],
    ["Report the SA-24 design review at the annual authorization review", "2027-09-18", "Annual review"],
  ];
  const DECIDE = { ato: "ATO", atoc: "ATO with conditions", iatt: "IATT", atu: "ATU", dato: "DATO" };
  const heldReason = `<div class="risk-held-why" id="risk-held-why">${gl("ring")}<span>Signing is held to <b>R. Calloway</b>, the authorizing official. You are signed in as ${ME}.</span><button type="button" class="risk-lk" data-modal="risk-sign" data-id="preview">Preview as R. Calloway</button></div>`;
  function timeline(lanes, from, to) {
    const a = D(from), b = D(to), span = b - a;
    const x = (iso) => Math.max(0, Math.min(100, ((D(iso) - a) / span) * 100));
    const ticks = [];
    for (let d = new Date(a); d <= b; d.setMonth(d.getMonth() + 3)) ticks.push([((d - a) / span) * 100, d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })]);
    const T = ((TODAY - a) / span) * 100;
    return `<div class="risk-tl"><div class="risk-tlax"><span></span><div class="risk-tlt">${ticks.map(([p, l]) => `<span style="inset-inline-start:${p}%">${l.replace(" ", " ’")}</span>`).join("")}</div></div>${lanes.map(([title, items]) => `<div class="risk-tll"><b>${esc(title)}</b><div class="risk-tlk"><span class="risk-today" style="inset-inline-start:${T}%"></span>${items.map((it) => it.at
      ? `<span class="risk-mk" style="inset-inline-start:${x(it.at)}%;--c:${it.c}" title="${esc(it.l)} · ${dd(it.at)}"></span>`
      : `<i style="inset-inline-start:${x(it.s)}%;width:${Math.max(1.2, x(it.e) - x(it.s))}%;background:${it.c}" title="${esc(it.l)}"></i>${it.more ? `<span class="risk-more">→</span>` : ""}`).join("")}</div></div><div class="risk-tlkey">${items.map((it) => `<span style="--c:${it.c}" class="${it.at ? "mk" : ""}">${esc(it.l)} · <span class="num">${it.at ? dd(it.at) : it.r || span2(it.s, it.e)}</span></span>`).join("")}</div>`).join("")}</div>`;
  }
  S.authorization = () => {
    const highOpen = ISS.filter((i) => i.sev === "high").length;
    const elapsed = pct(TODAY - D("2026-09-18"), D("2029-09-17") - D("2026-09-18"));
    return page(
      header("Authorization", `<span>WS-X90 Sentinel Mission System authorization package</span><span>Decision <b>ATO with conditions</b></span><span>ATD <b>Sep 17, 2029</b></span><span>AO <b>R. Calloway</b></span>`,
        `<button type="button" class="btn" data-go="package-room">Open package room</button><button type="button" class="btn ink risk-held" aria-disabled="true" aria-describedby="risk-held-why">Sign as the AO</button>`),
      heldReason,
      pair(
        `<div class="card"><div class="t">Current authorization <span>version 1</span></div><div class="big">ATO with conditions</div>${bar(elapsed, "var(--ink-3)")}<div class="foot"><span class="num">Signed Sep 18, 2026 · ${elapsed}% of its term</span><span class="num">ATD Sep 17, 2029</span></div>
          <div class="rows">${CONDITIONS.map(([t, due, s], k) => `<div class="row risk-cond">${gl(k === 0 ? "clock" : k === 1 ? "clock" : "ring")}<span>${esc(t)}</span><b class="num">${k === 0 ? dueC(D(due)) : dd(due)}</b></div>`).join("")}</div></div>`,
        attn([["clock", "Conditions open", 3], ["diamond", "High issues to close by Dec 17", highOpen], ["diamond", "Critical issues opened since the decision", 2], ["info", "Package version 2 in draft", 1, true]]),
      ),
      `<div class="card"><div class="t">Decisions <span>RMF's words</span></div><div class="risk-legend2">${[["ATO", 0], ["ATO with conditions", 1], ["IATT", 0], ["ATU", 0], ["DATO", 0]].map(([l, n]) => `<span class="${n ? "on" : ""}">${esc(l)} <b class="num">${n}</b></span>`).join("")}<span class="risk-mu">ATD is the authorization termination date</span></div>
        ${tbl(["Decision", "Package", "Decided", "Effective", "ATD", "Decided by"], [
          { id: "v2", cells: [ring("Pending"), "Version 2 · draft", `<span class="risk-mu">—</span>`, `<span class="risk-mu">—</span>`, `<span class="risk-mu">—</span>`, ring("Not signed")] },
          { id: "v1", cells: [pill("ok", "ATO with conditions"), "Version 1 · published Sep 2", `<span class="num">Sep 18, 2026</span>`, `<span class="num">Sep 18, 2026</span>`, `<span class="num">Sep 17, 2029</span>`, who("R. Calloway")] },
          { id: "ex", cells: [`${pill("info", "IATT")} ${EX}`, "Developmental test article", `<span class="num">Jun 2, 2026</span>`, `<span class="num">Jun 2, 2026</span>`, `<span class="num">Aug 31, 2026</span>`, who("R. Calloway")] },
        ], 3, "risk-decision")}</div>`,
      `<div class="card"><div class="t">Schedule <span>Jul 2026 – Dec 2027</span></div>${timeline([
        ["Authorization", [{ s: "2026-09-18", e: "2027-12-31", c: "var(--ok)", l: "ATO with conditions", r: "Sep 18, 2026 – Sep 17, 2029", more: true }, { at: "2026-11-13", c: "var(--info)", l: "Package version 2 in draft" }, { at: "2026-12-17", c: "var(--warn)", l: "Condition 1 due" }, { at: "2027-09-18", c: "var(--ink-3)", l: "Annual authorization review" }]],
        ["Assessment", [{ s: "2026-08-03", e: "2026-08-21", c: "var(--ok)", l: "Initial authorization assessment" }, { s: "2026-09-14", e: "2026-11-20", c: "var(--info)", l: "Expanded control set" }, { s: "2026-10-01", e: "2027-09-30", c: "var(--ink-4)", l: "Continuous monitoring FY2027" }, { s: "2027-01-11", e: "2027-02-05", c: "var(--warn)", l: "Cooperative vulnerability identification" }]],
      ], "2026-07-01", "2027-12-31")}</div>`,
      `<div class="grid2">${residualCard()}${`<div class="card"><div class="t">Residual risk, by response <span class="num">40</span></div><div class="rows"><div class="row">${gl("clock")}<span>Mitigate</span><b class="num">40</b></div><div class="row">${gl("ring")}<span class="risk-mu">Accepted</span><b class="num risk-mu">0</b></div><div class="row">${gl("ring")}<span class="risk-mu">Transferred or avoided</span><b class="num risk-mu">0</b></div><div class="row">${gl("diamond")}<span>Response date passed</span><b class="num">${RISKS.filter((r) => r.due && D(r.due) < TODAY).length}</b></div></div>${note("The AO signs over the residual risk as the snapshot locks it at signing.")}</div>`}</div>`,
    );
  };
  function residualCard() {
    const LI = { high: { high: 4 }, moderate: { high: 12, moderate: 14 }, low: { moderate: 4, low: 6 } };
    const lv = ["low", "moderate", "high"];
    const tone = (l, i) => { const s = lv.indexOf(l) + lv.indexOf(i); return s >= 3 ? "risk-z3" : s === 2 ? "risk-z2" : "risk-z1"; };
    return `<div class="card"><div class="t">Residual risk <span>likelihood × impact</span></div><div class="risk-mx" role="table" aria-label="Open risks by likelihood and impact">
      ${["high", "moderate", "low"].map((imp) => `<span class="risk-mxl">${cap(imp)}</span>${lv.map((lik) => { const n = (LI[lik] || {})[imp] || 0; return `<span class="risk-mxc ${tone(lik, imp)}${n ? "" : " zero"}" title="${cap(lik)} likelihood, ${imp} impact: ${n}">${n || ""}</span>`; }).join("")}`).join("")}
      <span></span>${lv.map((l) => `<span class="risk-mxl b">${cap(l)}</span>`).join("")}</div><div class="foot"><span>Impact ↑ · likelihood →</span><span class="num">40 open risks</span></div></div>`;
  }
  P["risk-decision"] = (id) => {
    if (id === "ex") return { label: "Decision preview", body: `${phead("IATT · developmental test article")}<p>${EX}</p><dl class="kv"><dt>Decision</dt><dd>${pill("info", "IATT")}</dd><dt>For</dt><dd>Interim authorization to test on the range</dd><dt>ATD</dt><dd>Aug 31, 2026</dd></dl>` };
    if (id === "v2") return { label: "Decision preview", body: `${phead("Package version 2 · pending decision", btn("Open package room", 'data-go="package-room"', false, true))}<dl class="kv"><dt>State</dt><dd>${pill("none", "Draft")}</dd><dt>Holds</dt><dd>SSP 3 with the Block 1.1 configuration, and the expanded control set results once published</dd></dl>${heldReason}` };
    return { label: "Decision preview", body: `
      ${phead("ATO with conditions · version 1", btn("Export decision letter", 'data-risk-toast="Decision letter exported (PDF, CUI marked)"', false, true))}
      <dl class="kv"><dt>Decision</dt><dd>${pill("ok", "ATO with conditions")}</dd><dt>Decided by</dt><dd>${who("R. Calloway")}</dd><dt>Decided</dt><dd>Sep 18, 2026</dd><dt>Effective</dt><dd>Sep 18, 2026</dd><dt>ATD</dt><dd>Sep 17, 2029</dd><dt>Package</dt><dd>Version 1 · SSP 2, SAP, SAR and 3 evidence documents</dd></dl>
      ${sect("Rationale", null, `<p class="risk-p">Residual risk is acceptable for operational use given the tailored cyber resiliency commitments and the conditions below.</p>`)}
      ${sect("Conditions", 3, CONDITIONS.map(([t, due]) => line("clock", esc(t), dd(due))).join(""))}
      ${sect("Risk snapshot", 1, plink("risk-snap", "v1", "40 risks locked at signing · 2 critical, 10 high"))}` };
  };
  M["risk-sign"] = () => ({ title: "Sign the authorization decision", body: `
      <div class="risk-doc">
        <div class="risk-cui">CUI</div>
        <div class="risk-docb">
          <p class="risk-eyebrow">Authorization decision · WS-X90 Sentinel Mission System</p>
          <h5>Package version 2 · FY2027 annual update</h5>
          ${fieldset("Decision", `<div class="risk-seg">${["ATO", "ATO with conditions", "IATT", "DATO"].map((l, k) => `<label><input type="radio" name="risk-dec"${k === 1 ? " checked" : ""}><span>${l}</span></label>`).join("")}</div>`)}
          <div class="risk-row2">${field("Effective", input("2026-11-20", "date"))}${field("ATD", input("2029-09-17", "date"), "Never past three years")}</div>
          ${field("Conditions", area("Close the high-severity remediation items within 90 days.\nReport the SA-24 design review at the annual authorization review.", 3))}
          <dl class="kv"><dt>Residual risk</dt><dd class="num">40 open · 2 critical, 10 high, 18 moderate, 10 low</dd><dt>SAR</dt><dd class="num">313 determinations · 187 satisfied</dd><dt>POA&amp;M</dt><dd class="num">41 items · 7 completed</dd></dl>
          ${check("I have reviewed the SAR, the POA&M and the risk snapshot that locks when I sign.")}
          <div class="risk-sig"><span class="risk-sign">R. Calloway</span><div class="risk-sigl"><span>R. Calloway · Authorizing official</span><span class="num">Nov 17, 2026</span></div></div>
        </div>
        <div class="risk-cui">CUI</div>
      </div>
      <div class="risk-held-why">${gl("clock")}<span>Version 2 is still a draft. It can be signed once Priya Raghavan submits it.</span></div>`,
    footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink risk-held" aria-disabled="true">Sign with CAC</button>` });

  // ═════════════ Package room ═════════════
  const RECIPIENTS = [
    { id: "ao", n: "R. Calloway", role: "Authorizing official", acc: "Full package · sign", exp: "2027-09-17", ex: false },
    { id: "la", n: "D. Okafor", role: "Lead assessor", acc: "Full package", exp: "2027-03-31", ex: false },
    { id: "issm", n: "Joel Barrantes", role: "ISSM", acc: "Full package · share", exp: "2027-09-17", ex: false },
    { id: "isso", n: "Priya Raghavan", role: "ISSO", acc: "Full package · share", exp: "2027-09-17", ex: false },
    { id: "so", n: "Ray Colston", role: "System owner", acc: "Read only", exp: "2027-09-17", ex: false },
    { id: "navy", n: "Receiving AO's representative", role: "Reciprocity reviewer", acc: "SSP, SAR, POA&M · no download", exp: "2026-12-15", ex: true },
    { id: "cssp", n: "CSSP analyst", role: "Cybersecurity service provider", acc: "SSP and POA&M", exp: "2027-01-31", ex: true },
  ];
  const ACCESS = [
    ["Nov 16, 14:02", "Receiving AO's representative", "Opened the SAR (version 1)", "Watermarked view"],
    ["Nov 15, 09:41", "CSSP analyst", "Downloaded the POA&M (OSCAL JSON)", "Watermarked file"],
    ["Nov 14, 16:20", "Joel Barrantes", "Shared with the receiving AO's representative", "Expires Dec 15"],
    ["Nov 12, 11:05", "R. Calloway", "Opened the SSP (version 1)", "Watermarked view"],
  ];
  const DOCS_V1 = [["System security plan", "SSP 2 · published Jul 25"], ["Security assessment plan", "Initial authorization"], ["Security assessment report", "68 determinations · Aug 28"], ["Annual incident response capability test report", "Evidence"], ["Independent penetration test report, external boundary and technician session path", "Evidence"], ["Contingency planning policy and recovery procedure set, revision 3.1", "Evidence"]];
  S["package-room"] = () => page(
    header("Package room", `<span>WS-X90 Sentinel Mission System authorization package</span><span>Version 1 <b>published</b></span><span>Version 2 <b>draft</b></span>`, `${modalBtn("Export ▾", "risk-export", "all")}${modalBtn("Share the package", "risk-share", "", true)}`),
    `<div class="risk-banner"><b>CUI</b><span>Controlled by: Program Office · Category: CTI · Distribution D</span>${EX}</div>`,
    pair(
      `<div class="card"><div class="t">Version 1 holds <span class="num">6 documents</span></div><div class="rows">${DOCS_V1.map(([t, s]) => `<div class="row risk-ra">${gl("check")}<span>${esc(t)}</span><b class="risk-mu risk-sm">${esc(s)}</b></div>`).join("")}</div></div>`,
      `<div class="card"><div class="t">Room settings</div><div class="rows">
        <div class="row">${gl("check")}<span>Watermark: viewer, time and CUI banner</span><b class="risk-sm">On</b></div>
        <div class="row">${gl("check")}<span>Every open and download logged</span><b class="risk-sm">On</b></div>
        <div class="row">${gl("clock")}<span>Access expires by default after</span><b class="num risk-sm">90 days</b></div>
        <div class="row">${gl("ring")}<span>Downloads for reciprocity reviewers</span><b class="risk-sm">Off</b></div></div></div>`,
    ),
    `<h4 class="subhead">Recipients <span class="risk-mu num">${RECIPIENTS.length}</span></h4>`,
    tbl(["Recipient", "Role", "Can open", "Expires", "Last opened"], RECIPIENTS.map((r) => ({
      id: r.id, cells: [r.ex ? `<span class="risk-nm">${esc(r.n)}</span> ${EX}` : who(r.n), esc(r.role), esc(r.acc), dueC(D(r.exp)), r.ex ? `<span class="num">${r.id === "navy" ? "Nov 16" : "Nov 15"}</span>` : ring("Not logged yet")],
    })), RECIPIENTS.length, "risk-recipient"),
    `<h4 class="subhead">Versions <span class="risk-mu num">2</span></h4>`,
    tbl(["Version", "State", "Published", "Submitted", "Decision", "Holds"], [
      { id: "2", cells: ["Version 2", pill("none", "Draft"), `<span class="risk-mu">—</span>`, `<span class="risk-mu">—</span>`, ring("Pending"), tr("FY2027 annual update: SSP 3 with the Block 1.1 configuration and the expanded control set results once published", 360)] },
      { id: "1", cells: ["Version 1", pill("ok", "Published"), `<span class="num">Sep 2 · Priya Raghavan</span>`, `<span class="num">Aug 29</span>`, pill("ok", "ATO with conditions"), tr("Initial authorization: SSP 2, the initial assessment plan and report, and key test evidence", 360)] },
    ], 2, "risk-pkgver"),
    `<h4 class="subhead">Access log</h4>`,
    tbl(["When", "Who", "What", "Protection"], ACCESS.map((a, k) => ({ id: String(k), cells: [`<span class="num">${a[0]}</span>`, `${esc(a[1])}`, `${esc(a[2])} ${EX}`, tag(a[3])] })), ACCESS.length, "risk-access"),
    `<div class="card"><div class="t">Export</div><div class="risk-exports">${[["OSCAL SSP", "SSP 3 draft or SSP 2 · JSON or XML", "ssp"], ["OSCAL SAR", "Assessment results · 313 determinations", "sar"], ["OSCAL POA&M", "41 items · 123 milestones", "poam"], ["eMASS", "Controls, test results and POA&M in eMASS import format", "emass"]].map(([t, s, k]) => `<button type="button" class="risk-exp" data-modal="risk-export" data-id="${k}"><b>${esc(t)}</b><span>${esc(s)}</span></button>`).join("")}</div></div>`,
    note("The package, its versions and its documents are WS-X90's. Recipients are the program's role holders; the two others, the access log and the CUI banner's wording are Example."),
  );
  P["risk-recipient"] = (id) => {
    const r = RECIPIENTS.find((x) => x.id === id) || RECIPIENTS[0];
    return { label: "Recipient preview", body: `
      ${phead(r.n, btn("Revoke access", `data-risk-toast="Access revoked for ${esc(r.n)}"`, false, true) + modalBtn("Change access", "risk-share", r.id, true, true))}
      ${r.ex ? `<p>${EX}</p>` : ""}
      <dl class="kv"><dt>Role</dt><dd>${esc(r.role)}</dd><dt>Can open</dt><dd>${esc(r.acc)}</dd><dt>Expires</dt><dd>${dueC(D(r.exp))}</dd><dt>Watermark</dt><dd>Name, time and CUI banner</dd><dt>Version</dt><dd>1, and 2 once published</dd></dl>
      ${sect("Access log", r.ex ? 1 : 0, r.ex ? line("info", esc(ACCESS[r.id === "navy" ? 0 : 1][2]), ACCESS[r.id === "navy" ? 0 : 1][0]) : ring("No open logged yet"))}` };
  };
  P["risk-pkgver"] = (id) => id === "2"
    ? { label: "Package version preview", body: `${phead("Version 2 · draft", modalBtn("Submit to the AO", "risk-submit", "2", true, true))}<dl class="kv"><dt>State</dt><dd>${pill("none", "Draft")}</dd><dt>Holds</dt><dd>SSP 3 (draft) with the Block 1.1 configuration</dd><dt>Waits on</dt><dd>Publishing the expanded set's increment 2 results</dd></dl>${sect("To submit", 3, `${line("clock", "SSP 3 published")}${line("clock", "Increment 2 results published (20 findings in draft)")}${line("check", "POA&M current: 41 items")}`)}` }
    : { label: "Package version preview", body: `${phead("Version 1 · published", btn("Open in room", 'data-risk-toast="Opening version 1 (watermarked)"', false, true))}<dl class="kv"><dt>Published</dt><dd>Sep 2, 2026 · Priya Raghavan</dd><dt>Submitted</dt><dd>Aug 29, 2026</dd><dt>Decision</dt><dd>${pill("ok", "ATO with conditions")} Sep 18</dd></dl>${sect("Documents", 6, DOCS_V1.map(([t]) => line("check", esc(t))).join(""))}` };
  P["risk-access"] = (k) => { const a = ACCESS[+k] || ACCESS[0]; return { label: "Access log entry", body: `${phead(a[2])}<p>${EX}</p><dl class="kv"><dt>When</dt><dd>${esc(a[0])}</dd><dt>Who</dt><dd>${esc(a[1])}</dd><dt>Protection</dt><dd>${tag(a[3])}</dd></dl>` }; };
  M["risk-submit"] = () => ({ title: "Submit to the AO", body: `${note("Version 2 cannot be submitted yet: SSP 3 is a draft and the increment 2 results are unpublished.")}${line("clock", "SSP 3 published")}${line("clock", "Increment 2 results published")}`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` });
  M["risk-share"] = (id) => {
    const r = RECIPIENTS.find((x) => x.id === id);
    return { title: r ? "Change access" : "Share the package", body: `
      ${field("Recipient", r ? `<div class="risk-ro">${esc(r.n)}</div>` : input("", "text", 'placeholder="Name or .mil address"'))}
      <div class="risk-row2">${field("Role", select(["Reciprocity reviewer", "Authorizing official's representative", "Assessor", "CSSP", "Read only"], r ? r.role : "Reciprocity reviewer"))}${field("Version", select(["Version 1 · published", "Version 2 once published"], "Version 1 · published"))}</div>
      ${fieldset("Documents", ["System security plan", "Security assessment report", "POA&M", "Evidence (3 documents)"].map((d, k) => check(esc(d), k < 3)).join(""))}
      <div class="risk-row2">${field("Access expires", input(r ? r.exp : "2027-02-15", "date"), "Every share expires.")}${field("Downloads", select(["Watermarked view only", "Watermarked download"], "Watermarked view only"))}</div>
      <div class="risk-banner"><b>CUI</b><span>Each page carries the banner and the viewer's name.</span></div>`,
      footer: footer(r ? "Save access" : "Share", r ? "Access saved" : "Shared: the recipient gets a link that expires") };
  };
  M["risk-export"] = (k) => {
    const T = { ssp: "Export OSCAL SSP", sar: "Export OSCAL SAR", poam: "Export OSCAL POA&M", emass: "Export for eMASS", all: "Export the package" }[k] || "Export the package";
    return { title: T, body: `
      ${k === "emass" ? `${field("System", `<div class="risk-ro">WS-X90 Sentinel Mission System · SYS-WSX90</div>`)}${fieldset("Include", check("Control implementations (SSP 3 draft)", true) + check("Test results: 313 determinations", true) + check("POA&M: 41 items, 123 milestones", true) + check("Artifacts: 3 evidence documents", false))}${note("eMASS refuses a milestone with no planned date: 24 of the requirement-gap milestones have none.")}`
        : `${fieldset("What", ["SSP", "SAR", "POA&M"].map((x) => check(x === "SAR" ? "SAR · assessment results" : x, k === "all" || k === x.toLowerCase())).join(""))}<div class="risk-row2">${field("Version", select(k === "poam" ? ["Current POA&M"] : ["Package version 1 · SSP 2", "Draft · SSP 3"], k === "poam" ? "Current POA&M" : "Package version 1 · SSP 2"))}${field("Format", select(["OSCAL 1.1.2 JSON", "OSCAL 1.1.2 XML"], "OSCAL 1.1.2 JSON"))}</div>${check("Validate against the OSCAL schema before export", true)}`}
      ${note("Every export carries the CUI banner and lands in the access log.")}`,
      footer: footer("Export", `${T}: file ready`) };
  };

  // ═════════════ Suppliers (SR family) ═════════════
  const TIERS = { 1: ["Tier 1", "Quarterly", ["Attestation", "SBOM", "HBOM", "CMMC Level 2", "Counterfeit plan"]], 2: ["Tier 2", "Twice a year", ["Attestation", "SBOM", "CMMC Level 2"]], 3: ["Tier 3", "Yearly", ["Attestation", "CMMC Level 1"]] };
  const SUPPLIERS = [
    { id: "x800", n: "X800 Missile component set", kind: "Component set", tier: 1, owner: "Priya Raghavan", line: "Air Defense", comps: 18, note: "1 SBOM · 1 open CVE", flags: [["bad", "Open CVE"]], next: "2027-01-15", ev: { SBOM: ["ok", "Mission Computer · v1 Oct 8, v2 Nov 12"], Attestation: ["none", "Not asked yet"], HBOM: ["none", "Not asked yet"], "CMMC Level 2": ["none", "Not asked yet"], "Counterfeit plan": ["none", "Not asked yet"] } },
    { id: "g25", n: "G25 launch control component set", kind: "Component set", tier: 1, owner: "Marcus Ryde", line: "Mission Systems", comps: 8, note: "No SBOM", flags: [], next: "2027-01-15" },
    { id: "g40", n: "G40 ground terminal component set", kind: "Component set", tier: 2, owner: null, line: null, comps: 4, note: "No owner", flags: [], next: "2027-03-01" },
    { id: "r210", n: "R210 launcher electronics component set", kind: "Component set", tier: 2, owner: null, line: null, comps: 3, note: "No owner", flags: [], next: "2027-03-01" },
    { id: "openbsd", n: "OpenBSD project (OpenSSH)", kind: "Open source, from an SBOM", tier: 2, owner: null, line: null, comps: 1, note: "openssh-server 9.6p1 · CVE-2024-6387", flags: [["bad", "Open CVE"]], next: "2026-12-01" },
    { id: "ald", n: "Aldergrove Microelectronics", kind: "Hardware: FPGA", tier: 1, owner: "Priya Raghavan", ex: true, comps: 2, note: "Mission Computer, Cryptographic Module", flags: [["bad", "Counterfeit alert"]], next: "2026-11-30" },
    { id: "kes", n: "Kestrel Power Systems", kind: "Hardware: power", tier: 2, owner: "Marcus Ryde", ex: true, comps: 1, note: "Launcher Power Supply", flags: [["warn", "DMSMS notice"]], next: "2027-02-01" },
    { id: "lark", n: "Larkspur Cloud", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
    { id: "north", n: "Northwind Analytics", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
    { id: "tess", n: "Tessellate Support", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
    { id: "cob", n: "Cobalt Mail", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
    { id: "mer", n: "Meridian Payroll", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
    { id: "pine", n: "Pinehurst Legal", kind: "Organization: service", tier: 3, owner: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01" },
  ];
  S.suppliers = () => {
    const v = cur("sup");
    const list = SUPPLIERS.filter((s) => v === "all" || (v === "t1" ? s.tier === 1 : v === "flag" ? s.flags.length : v === "sets" ? s.kind === "Component set" : true));
    return page(
      header("Suppliers", `<span>Supply chain risk management · SR family</span><span>Component sets <b>4</b></span><span>Organizations <b>6</b></span><span>SBOM upstreams <b>1</b></span>`, `<button type="button" class="btn">Import SBOM</button>${modalBtn("Request from a supplier", "risk-portal", "", true)}`),
      pair(
        completion({ title: "Library components with an SBOM", total: 33, done: 1, unit: "with an SBOM", note: "Mission Computer, versions 1 and 2", minis: [["With an owner", 26, 33], ["Open CVEs", 1, 33], ["Consumers behind", 4, 33]] }),
        attn([["diamond", "An open CVE from an upstream", 1, false, ["sup", "flag"]], ["ring", "Component sets with no owner", 2, false, ["sup", "sets"]], ["diamond", `Counterfeit alerts ${EX}`, 1], ["clock", `DMSMS notices ${EX}`, 1]]),
      ),
      `<div class="risk-tiers">${Object.entries(TIERS).map(([k, [t, cad, ev]]) => `<div class="card risk-tier"><div class="t">${t} <span>${esc(cad)}</span></div><span class="risk-mu">${k === "1" ? "Mission-critical or CPI-bearing parts" : k === "2" ? "Parts in the boundary" : "Services outside the boundary"}</span><div class="risk-tags">${ev.map(tag).join(" ")}</div></div>`).join("")}</div>`,
      qvs("sup", [["all", "All", SUPPLIERS.length], ["t1", "Tier 1", SUPPLIERS.filter((s) => s.tier === 1).length], ["flag", "Flagged", SUPPLIERS.filter((s) => s.flags.length).length], ["sets", "Component sets", 4]]),
      tools("Search suppliers", ["Tier", "Kind", "Flag", "Next review"]),
      tbl(["Supplier", "Kind", "Tier and cadence", "Next review", "Flags", "Owner"], list.map((s) => ({
        id: s.id, cells: [`${tr(s.n, 260)}${s.ex ? ` ${EX}` : ""}`, esc(s.kind.split(":")[0].replace(", from an SBOM", "")), `${tag(TIERS[s.tier][0])} <span class="risk-mu">${esc(TIERS[s.tier][1])}</span>`, dueC(D(s.next)), s.flags.length ? s.flags.map(([k, l]) => pill(k, l)).join(" ") : ring("None"), who(s.owner || null)],
      })), list.length, "risk-supplier"),
      note("Component sets, their owners and business lines, the OpenSSH upstream and the six organizations are the workspace's. Tiers and review dates are proposed settings; Aldergrove and Kestrel, and every counterfeit and DMSMS flag, are Example."),
    );
  };
  P["risk-supplier"] = (id) => {
    const s = SUPPLIERS.find((x) => x.id === id) || SUPPLIERS[0];
    const ev = TIERS[s.tier][2];
    return { label: "Supplier preview", body: `
      ${phead(s.n, modalBtn("Send a request", "risk-portal", s.id, true, true))}
      ${s.ex ? `<p>${EX}</p>` : ""}
      <dl class="kv"><dt>Kind</dt><dd>${esc(s.kind)}</dd><dt>Tier</dt><dd>${tag(TIERS[s.tier][0])} · ${esc(TIERS[s.tier][1])}</dd><dt>Next review</dt><dd>${dueC(D(s.next))}</dd><dt>Owner</dt><dd>${who(s.owner || null)}</dd>${s.line ? `<dt>Business line</dt><dd>${esc(s.line)}</dd>` : ""}<dt>Supplies</dt><dd>${s.comps ? `${s.comps} component${s.comps > 1 ? "s" : ""} · ${esc(s.note)}` : esc(s.note)}</dd></dl>
      ${s.flags.length ? s.flags.map(([k, l]) => `<div class="next">${gl(k === "bad" ? "diamond" : "clock")}<span>${esc(l)}${l === "Open CVE" ? ": CVE-2024-6387 in openssh-server 9.6p1, fixed in 9.8p1" : l === "DMSMS notice" ? ": end of life for the converter module in Q3 2027" : ": a lot of FPGAs failed authentication at receiving (SR-11)"}</span></div>`).join("") : ""}
      ${sect("Evidence asked by its tier", ev.length, ev.map((e) => { const st = (s.ev && s.ev[e]) || ["none", "Not asked yet"]; return `<div class="risk-line">${gl(st[0] === "ok" ? "check" : "ring")}<span>${esc(e)}</span><span class="risk-le risk-mu">${esc(st[1])}</span></div>`; }).join(""))}
      ${s.id === "x800" ? sect("Components in WS-X90's use", 1, line("diamond", "Mission Computer · version 1 in use, version 2 published Nov 12")) : ""}` };
  };
  M["risk-portal"] = (id) => {
    const s = SUPPLIERS.find((x) => x.id === id);
    return { title: "Request from a supplier", body: `
      ${field("Supplier", select(SUPPLIERS.filter((x) => !x.ex).map((x) => x.n), s && !s.ex ? s.n : SUPPLIERS[0].n))}
      ${fieldset("Ask for", [["SBOM (CycloneDX or SPDX)", true], ["HBOM", true], ["Supplier attestation of provenance (SR-4)", true], ["CMMC status and SPRS score", false], ["Counterfeit avoidance plan (SR-11)", false], ["DMSMS and end-of-life notices", false]].map(([l, on]) => check(esc(l), on)).join(""))}
      ${field("Components", select(["Every component the supplier gives WS-X90", "Mission Computer", "Cryptographic Module", "Operational Flight Program"], "Every component the supplier gives WS-X90"))}
      <div class="risk-row2">${field("Due", input("2026-12-17", "date"))}${field("Reminders", select(["Weekly until answered", "Once, 3 days before", "None"], "Weekly until answered"))}</div>
      ${field("Message", area("", 2, "Optional: what the request is for"))}
      ${note("The supplier answers in the portal with a link that expires; nothing of WS-X90 is shared beyond what the request names.")}`,
      footer: footer("Send request", "Request sent to the supplier portal") };
  };

  // ═════════════ People ═════════════
  ROUTE_NAV["people-8140"] = "people"; ROUTE_NAV["people-access"] = "people";
  const peopleHead = () => header("People", `<span>WS-X90 role holders</span><span>Roles <b>6</b></span><span>Holders <b>7</b></span>`, modalBtn("Assign a role", "risk-role", "", true));
  const peopleTabs = (c) => tabs([["people", "Role holders", 7], ["people-8140", "DoD 8140 qualifications"], ["people-access", "Privileged access reviews"]], c);
  const Q8140 = {
    "R. Calloway": ["611", "Authorizing Official/Designating Representative", "Advanced", "CGRC", 14, ["ok", "Qualified"]],
    "D. Okafor": ["612", "Security Control Assessor", "Advanced", "CISSP", 26, ["ok", "Qualified"]],
    "Nadia Fournier": ["612", "Security Control Assessor", "Intermediate", "CASP+", 9, ["warn", "Learning hours due Jan 31"]],
    "Local developer": ["612", "Security Control Assessor", "Basic", "Security+", 0, ["bad", "Not qualified"]],
    "Joel Barrantes": ["722", "Information Systems Security Manager", "Advanced", "CISSP", 31, ["ok", "Qualified"]],
    "Priya Raghavan": ["461", "Systems Security Analyst", "Intermediate", "Security+", 18, ["ok", "Qualified"]],
    "Ray Colston": ["801", "Program Manager", "Intermediate", "DAU PM", 6, ["warn", "Qualifying by Mar 1"]],
  };
  S.people = () => page(
    peopleHead(),
    pair(
      completion({ title: "RMF roles held", total: 6, done: 6, unit: "roles with a holder", note: "7 holders", minis: [["One AO", 1, 1], ["One lead assessor", 1, 1], ["With a start date", 0, 7]] }),
      attn([["ring", "No start date recorded", 7], ["ring", "No end date recorded", 7, true], ["diamond", `Not 8140 qualified ${EX}`, 1]]),
    ),
    peopleTabs("people"),
    tools("Search people", ["Role", "Organization"]),
    tbl(["Person", "Role", "Short", "Acts it holds", "Since"], ROLES.map(([k, n, role, s, acts]) => ({ id: n, cells: [who(n), esc(role), tag(s), tr(acts, 380), ring("Not recorded")] })), 7, "risk-person"),
    note("From program_role_assignments. Where a program records an AO or a lead assessor, only today's holder signs a decision or publishes results."),
  );
  S["people-8140"] = () => page(
    peopleHead(),
    pair(
      completion({ title: `Role holders qualified ${EX}`, total: 7, done: 4, unit: "qualified for their work role", note: "DoD 8140.03 and the DCWF" }),
      attn([["diamond", `Not qualified ${EX}`, 1], ["clock", `Qualifying, with a date ${EX}`, 1], ["clock", `Learning hours due ${EX}`, 1]]),
    ),
    peopleTabs("people-8140"),
    tools("Search qualifications", ["Work role", "Proficiency", "Status"]),
    tbl(["Person", "DCWF work role", "Proficiency", "Foundational", "Learning hours", "Status"], ROLES.map(([, n]) => { const q = Q8140[n]; return { id: n, cells: [`${who(n)} ${EX}`, `${tag(q[0])} ${esc(q[1])}`, esc(q[2]), tag(q[3]), `<span class="num">${q[4]} of 20</span>`, pill(q[5][0], q[5][1])] }; }), 7, "risk-person"),
    note("The role holders are WS-X90's; every qualification on this tab is Example. Continuous learning counts 20 hours a year."),
  );
  const PARS = [
    { id: "q1", t: "Quarterly privileged account review (AC-2, AC-6)", scope: "Platform Management Controller, Maintenance Access Gateway", st: "In review", rev: "Victor Amsel", due: "2026-12-01", acc: [18, 11], real: true },
    { id: "q0", t: "Privileged account review, Q3", scope: "All LRUs with privileged accounts", st: "Completed", rev: "Victor Amsel", due: "2026-09-01", acc: [21, 21], ex: true },
    { id: "ml", t: "Maintenance Laptop local accounts", scope: "Maintenance Laptop · LRU-019", st: "Draft", rev: "Priya Raghavan", due: "2026-12-13", acc: [6, 0], ex: true },
  ];
  const parStep = (st) => `<div class="wiz">${["Draft", "In review", "Completed"].map((s, k) => `<span class="${s === st ? "on" : ""}"><i>${["Draft", "In review", "Completed"].indexOf(st) > k ? "✓" : k + 1}</i>${s}</span>`).join("")}</div>`;
  S["people-access"] = () => page(
    peopleHead(),
    pair(
      completion({ title: `Accounts decided ${EX}`, total: 18, done: 11, unit: "kept or revoked", note: "this quarter's review" }),
      attn([["clock", "Review due Dec 1", 1], ["diamond", `Revoked on paper, still active ${EX}`, 2], ["ring", `Accounts not yet decided ${EX}`, 7]]),
    ),
    peopleTabs("people-access"),
    tbl(["Review", "Scope", "Status", "Accounts decided", "Reviewer", "Due"], PARS.map((r) => ({ id: r.id, cells: [`${tr(r.t, 320)}${r.ex ? ` ${EX}` : ""}`, tr(r.scope, 260), pill(r.st === "Completed" ? "ok" : r.st === "In review" ? "warn" : "none", r.st), `<span class="num">${r.acc[1]} of ${r.acc[0]}</span>${r.real ? ` ${EX}` : ""}`, who(r.rev), r.st === "Completed" ? `<span class="num">${dd(r.due)}</span>` : dueC(D(r.due))] })), 3, "risk-par"),
    note("The quarterly review is WS-X90's scheduled task (in progress, Victor Amsel, due Dec 1); its account counts and the other two reviews are Example. A review moves Draft → In review → Completed, and a revoked account must show removed before it completes."),
  );
  P["risk-par"] = (id) => {
    const r = PARS.find((x) => x.id === id) || PARS[0];
    const accts = [["svc-maint-07", "Platform Management Controller", "Revoke", true], ["j.barrantes-adm", "Maintenance Access Gateway", "Keep", false], ["p.raghavan-adm", "Platform Management Controller", "Keep", false], ["field-tech-03", "Maintenance Access Gateway", "Revoke", true], ["w.duarte-adm", "Platform Management Controller", "Not decided", false]];
    return { label: "Access review preview", body: `
      ${phead(r.t, r.st === "Completed" ? "" : btn(r.st === "Draft" ? "Start review" : "Complete review", `data-risk-toast="${r.st === "Draft" ? "Review started" : "Two revoked accounts are still active: remove them first"}"`, true, true))}
      ${parStep(r.st)}
      <dl class="kv"><dt>Scope</dt><dd>${esc(r.scope)}</dd><dt>Reviewer</dt><dd>${who(r.rev)}</dd><dt>Due</dt><dd>${r.st === "Completed" ? dfull(r.due) : dueC(D(r.due))}</dd><dt>Decided</dt><dd class="num">${r.acc[1]} of ${r.acc[0]} accounts</dd></dl>
      ${sect("Accounts", r.acc[0], `<p>${EX}</p>${accts.map(([a, w, d, flag]) => `<div class="risk-line">${gl(d === "Keep" ? "check" : d === "Revoke" ? "diamond" : "ring")}<span><b class="risk-mono">${esc(a)}</b> · ${esc(w)}</span><span class="risk-le">${flag ? pill("bad", "Still active") : esc(d)}</span></div>`).join("")}`)}` };
  };
  P["risk-person"] = (n) => {
    const r = roleOf(n) || ROLES[0]; const q = Q8140[r[1]];
    return { label: "Person preview", body: `
      ${phead(r[1], modalBtn("Change role", "risk-role", r[1], false, true))}
      <dl class="kv"><dt>Role</dt><dd>${esc(r[2])} ${tag(r[3])}</dd><dt>Acts</dt><dd>${esc(r[4])}</dd><dt>Since</dt><dd>${ring("Not recorded")}</dd></dl>
      ${sect("DoD 8140", null, `<p>${EX}</p>${line(q[5][0] === "ok" ? "check" : q[5][0] === "warn" ? "clock" : "diamond", `${tag(q[0])} ${esc(q[1])} · ${esc(q[2])}`)}${line("info", `Foundational: ${esc(q[3])} · ${q[4]} of 20 learning hours`)}`)}
      ${r[0] === "authorizing_official" ? sect("Decisions signed", 1, plink("risk-decision", "v1", "ATO with conditions · Sep 18, 2026")) : ""}` };
  };
  M["risk-role"] = (n) => ({ title: n ? "Change role" : "Assign a role", body: `${field("Person", n ? `<div class="risk-ro">${esc(n)}</div>` : select(PEOPLE, "Amara Bell"))}${field("Role", select(["Authorizing official", "Lead assessor", "Assessor", "ISSM", "ISSO", "System owner"], n ? (roleOf(n) || ROLES[0])[2].replace("Information system security manager", "ISSM").replace("Information system security officer", "ISSO") : "Assessor"))}<div class="risk-row2">${field("Starts", input("2026-11-17", "date"))}${field("Ends", input("", "date"), "Optional")}</div>${note("WS-X90 has one authorizing official and one lead assessor at a time; assigning a new one ends the current holder's period.")}`, footer: footer(n ? "Save role" : "Assign role", "Role saved") });

  // ═════════════ Review queue ═════════════
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
  S["review-queue"] = () => {
    const v = cur("rq");
    const kinds = RQK.filter(([k]) => v === "all" || k === v);
    const waited = (iso) => -diffDays(D(iso));
    return page(
      header("Review queue", `<span>Across the workspace</span><span>Waiting <b>148</b></span><span>Programs <b>8</b></span><span>Longest wait <b>${waited("2026-09-12")} days</b></span>`, ""),
      pair(
        `<div class="card"><div class="t">Waiting on a reviewer <span class="num">148 total</span></div><div class="big num">148</div><div class="stack">${RQK.map(([k, l, n], i) => `<i style="flex:${n};background:${["var(--info)", "var(--ink-4)", "var(--warn)", "var(--ok)", "var(--ok)", "var(--bad)", "var(--ink-3)"][i]}"></i>`).join("")}</div><div class="legend">${RQK.map(([k, l, n], i) => `<span style="--c:${["var(--info)", "var(--ink-4)", "var(--warn)", "var(--ok)", "var(--ok)", "var(--bad)", "var(--ink-3)"][i]}">${esc(l.split(" to ")[0])} ${n}</span>`).join("")}</div></div>`,
        attn([["diamond", "Waiting more than 30 days", 8, false, ["rq", "gate"]], ["clock", "Waiting more than 7 days", 1, false, ["rq", "package"]], ["info", "Waiting on Nadia Fournier", 88, false, ["rq", "evidence"]], ["ring", "Waiting on nobody named", 50, false, ["rq", "discussion"]]], "Waiting longest", 9),
      ),
      qvs("rq", [["all", "All", 148], ...RQK.map(([k, l, n]) => [k, l, n])]),
      tools("Search the queue", ["Kind", "Program", "Waiting on"]),
      kinds.map(([k, l, n, g]) => `<div class="risk-rqg"><h4 class="risk-rqh">${gl(g)}${esc(l)} <span class="ct num">${n}</span>${n > RQ[k].length ? `<button type="button" class="risk-lk risk-va" data-rq="rq" data-rv="${k}">View all ${n} →</button>` : ""}</h4>${tbl(["Record", "Program", "Waiting on", "Waiting since", k === "gate" ? "Gate due" : k === "evidence" ? "Owner" : "Requested by"], RQ[k].map((r) => ({
        id: `${k}:${r[0]}`, cells: [tr(r[1], 360), tr(r[2], 180), who(r[3]).replace("No owner", "Nobody named"), `<span class="num">${dd(r[4])}</span> <span class="risk-mu num">· ${waited(r[4])}d</span>`, k === "gate" ? dueC(D(r[6])) : r[5] ? who(r[5]) : `<span class="risk-mu">—</span>`],
      })), n, "risk-rq")}</div>`).join(""),
      note("From review_queue_rows: 148 records waiting on a reviewer, 88 of them WS-X90's evidence for Nadia Fournier. Each kind shows its first rows."),
    );
  };
  P["risk-rq"] = (id) => {
    const [k, rid] = String(id).split(":");
    const r = RQ_ALL.find((x) => x.kind === k && x.id === rid) || RQ_ALL[0];
    const kind = RQK.find((x) => x[0] === r.kind);
    const act = { evidence: "Accept evidence", discussion: "Open discussion", gate: "Decide gate", assessment_results: "Publish assessment results", product_assessment: "Publish product assessment", package: "Decide package", component_offer: "Review offer" }[r.kind];
    const heldRes = r.kind === "assessment_results";
    return { label: "Review preview", body: `
      ${phead(r.name, heldRes ? `<button type="button" class="btn sm ink risk-held" aria-disabled="true">${act}</button>` : btn(act, `data-risk-toast="${esc(act)}: done"`, true, true))}
      ${heldRes ? `<div class="risk-held-why">${gl("ring")}<span>Held to D. Okafor, the lead assessor.</span></div>` : ""}
      <dl class="kv"><dt>Kind</dt><dd>${esc(kind[1])}</dd><dt>Program</dt><dd>${esc(r.prog)}</dd><dt>Waiting on</dt><dd>${who(r.on || null).replace("No owner", "Nobody named")}</dd><dt>Waiting since</dt><dd>${dfull(r.since)} · ${-diffDays(D(r.since))} days</dd>${r.due ? `<dt>Gate due</dt><dd>${dueC(D(r.due))}</dd>` : ""}${r.by ? `<dt>${r.kind === "evidence" ? "Owner" : "Requested by"}</dt><dd>${who(r.by)}</dd>` : ""}</dl>
      ${r.kind === "evidence" ? sect("Review", null, `${line("clock", "Version 1 · pending review")}<span class="risk-mu">Accept, or send back with what to revise.</span>`) : ""}
      ${r.kind === "component_offer" ? sect("The offer", 1, line("info", "Found on WS-X90's LRU-001, which runs version 1 of the X800 Missile component set. Every system built from that version carries the same server.")) : ""}
      ${r.kind === "assessment_results" ? sect("Holds", 20, `${line("check", "13 satisfied")}${line("part", "4 partially satisfied")}${line("diamond", "1 other than satisfied · IA-2(2)")}${line("ring", "2 not assessed")}`) : ""}` };
  };

  // ═════════════ Schedule ═════════════
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
  ].map(([id, t, s, a, b, o]) => ({ id, t, s, a, b, o }));
  const TSTAT = { completed: ["ok", "Completed"], cancelled: ["none", "Cancelled"], blocked: ["bad", "Blocked"], in_progress: ["warn", "In progress"], ready: ["info", "Ready"], planned: ["none", "Planned"] };
  const tstat = (s) => pill(TSTAT[s][0], TSTAT[s][1]);
  const openTask = (x) => x.s !== "completed" && x.s !== "cancelled";
  const GATES = [
    { id: "pdr", t: "PDR", long: "Preliminary design review", st: "in_review", due: "2026-10-10", crit: [["outcome.AR.4", "Identified stakeholder protection concerns are addressed by the system architecture.", "System Architecture Definition", "check"], ["outcome.AR.5", "Traceability of the security aspects of system architecture elements to key architecturally relevant stakeholder and system requirements is established.", "System Architecture Definition", "check"], ["outcome.AR.7", "Security aspects of system elements, their interactions, and their interfaces are defined.", "System Architecture Definition", "clock"], ["outcome.SR.6", "Traceability of the security aspects of system requirements and associated security-relevant constraints to stakeholder requirements is established.", "System Requirements Definition", "ring"]] },
    { id: "cdr", t: "CDR", long: "Critical design review", st: "not_started", due: "2026-10-01", crit: [["outcome.DE.2", "System requirements are allocated to address their security aspects.", "Design Definition", "ring"], ["outcome.DE.3", "Security interfaces and security aspects of interfaces between system elements composing the system are defined.", "Design Definition", "ring"], ["outcome.DE.4", "Security design characteristics of each system element are defined.", "Design Definition", "ring"], ["outcome.DE.6", "Traceability of security design characteristics is established.", "Design Definition", "ring"]] },
  ];
  S.schedule = () => {
    const v = cur("tsk");
    const late = TASKS.filter((x) => openTask(x) && D(x.b) < TODAY), soon = TASKS.filter((x) => openTask(x) && diffDays(D(x.b)) >= 0 && diffDays(D(x.b)) <= 14);
    const list = TASKS.filter((x) => v === "all" ? true : v === "open" ? openTask(x) : v === "late" ? late.includes(x) : v === "soon" ? soon.includes(x) : x.s === v);
    return page(
      header("Schedule", `<span>WS-X90 Sentinel Mission System</span><span>Tasks <b>14</b></span><span>Lifecycle gates <b>2</b></span>`, `${modalBtn("Create task", "risk-task-new", "", true)}`),
      pair(
        completion({ title: "Tasks completed", total: 14, done: 3, unit: "completed", note: "1 cancelled · 10 open", minis: [["Monthly checks", 3, 6], ["Quarterly checks", 0, 3], ["Annual exercises", 0, 4]] }),
        attn([["diamond", "Gates past their date", 2], ["diamond", "Blocked", 1, false, ["tsk", "blocked"]], ["clock", "Tasks past due", late.length, false, ["tsk", "late"]], ["clock", "Due within two weeks", soon.length, false, ["tsk", "soon"]]]),
      ),
      `<h4 class="subhead">Lifecycle gates</h4>`,
      `<div class="grid2">${GATES.map((g) => { const met = g.crit.filter((c) => c[3] === "check").length; return `<button type="button" class="card risk-gate" data-panel="risk-gate" data-id="${g.id}"><div class="t">${esc(g.t)} <span>${esc(g.long)}</span></div><div class="risk-gr">${pill(g.st === "in_review" ? "info" : "none", g.st === "in_review" ? "In review" : "Not started")}<span>Due ${dueC(D(g.due))}</span></div>${bar(pct(met, g.crit.length))}<div class="foot"><span class="num">${met} of ${g.crit.length} security outcomes met ${EX}</span><span>NIST SP 800-160 Vol. 1</span></div></button>`; }).join("")}</div>`,
      `<h4 class="subhead">Tasks</h4>`,
      qvs("tsk", [["all", "All", 14], ["open", "Open", TASKS.filter(openTask).length], ["late", "Past due", late.length], ["soon", "Due soon", soon.length], ["blocked", "Blocked", 1], ["completed", "Completed", 3]]),
      tools("Search tasks", ["Status", "Owner", "Due"]),
      tbl(["Task", "Status", "Window", "Due", "Owner"], list.map((x) => ({ id: x.id, cells: [tr(x.t, 380), tstat(x.s), `<span class="num">${span2(x.a, x.b)}</span>`, openTask(x) ? dueC(D(x.b)) : `<span class="num risk-mu">${dd(x.b)}</span>`, who(x.o)] })), list.length, "risk-task"),
      note("Tasks are the WS-X90 continuous monitoring FY2027 plan's scheduled tasks. WS-X90's PDR and CDR record no gate criteria yet, so the security outcomes under each gate are Example, drawn from NIST SP 800-160 Vol. 1's System Architecture, Requirements and Design Definition processes."),
    );
  };
  P["risk-gate"] = (id) => {
    const g = GATES.find((x) => x.id === id) || GATES[0];
    return { label: "Lifecycle gate preview", body: `
      ${phead(`${g.t} · ${g.long}`, btn("Add security outcomes", 'data-risk-toast="The outcome picker would open here"', false, true) + (g.st === "in_review" ? btn("Decide gate", 'data-risk-toast="Gate decision recorded"', true, true) : ""))}
      <dl class="kv"><dt>Status</dt><dd>${pill(g.st === "in_review" ? "info" : "none", g.st === "in_review" ? "In review" : "Not started")}</dd><dt>Due</dt><dd>${dueC(D(g.due))}</dd><dt>Decided</dt><dd>${ring("Not yet")}</dd></dl>
      ${sect("Gate criteria", g.crit.length, `<p>${EX}</p>${g.crit.map(([code, t, proc, st]) => `<div class="risk-crit">${gl(st)}<div><span>${esc(t)}</span><span class="risk-mu">${tag(code.replace("outcome.", ""))} ${esc(proc)}</span></div></div>`).join("")}`)}` };
  };
  P["risk-task"] = (id) => {
    const x = TASKS.find((t) => t.id === id) || TASKS[0];
    return { label: "Task preview", body: `
      ${phead(x.t, openTask(x) ? btn(x.s === "blocked" ? "Record what blocks it" : "Mark complete", `data-risk-toast="${x.s === "blocked" ? "Blocker recorded" : "Task completed"}"`, true, true) : "")}
      <dl class="kv"><dt>Status</dt><dd>${tstat(x.s)}</dd><dt>Window</dt><dd class="num">${dfull(x.a)} – ${dfull(x.b)}</dd><dt>Due</dt><dd>${openTask(x) ? dueC(D(x.b)) : dfull(x.b)}</dd><dt>Owner</dt><dd>${who(x.o)}</dd><dt>Plan</dt><dd>WS-X90 continuous monitoring — FY2027</dd></dl>
      ${x.s === "blocked" ? `<div class="next">${gl("diamond")}<span>Blocked since Nov 11; nobody has said why.</span></div>` : ""}` };
  };
  M["risk-task-new"] = () => ({ title: "Create task", body: `${field("Title", input("", "text", 'placeholder="What is done, in one line"'))}<div class="risk-row2">${field("Owner", select(["No owner", ...PEOPLE], "No owner"))}${field("Due date", input("2026-12-15", "date"))}</div>${field("Repeats", select(["Does not repeat", "Monthly", "Quarterly", "Yearly"], "Does not repeat"))}${field("Controls", input("", "text", 'placeholder="e.g. RA-5, SI-2"'))}`, footer: footer("Create task", "Task created") });

  // ═════════════ Continuous monitoring ═════════════
  const SNAP = [["2026-11-13", 14, 235, 90, 13, 34, 174], ["2026-11-14", 14, 235, 90, 13, 34, 174], ["2026-11-15", 14, 234, 89, 13, 34, 176], ["2026-11-16", 14, 234, 89, 13, 34, 176], ["2026-11-17", 14, 233, 90, 13, 34, 176]];
  const SNAPC = [["Satisfied", "var(--ok)", 6], ["Partially satisfied", "var(--warn)", 5], ["Other than satisfied", "var(--bad)", 4], ["Not assessed", "var(--info)", 3], ["No evidence", "var(--ink-4)", 2], ["No requirement", "var(--line-strong)", 1]];
  const CHECKS = [
    ["vuln", "Vulnerability scan, mission network", "Monthly", "RA-5, SI-2", "Joel Barrantes", ["warn", "2 days late"], "2026-11-15", "Oct 11", ["t1", "t6"]],
    ["stig", "STIG compliance scan", "Monthly", "CM-6", "Joel Barrantes", ["bad", "Blocked"], "2026-11-11", "Oct 13", ["t2", "t5"]],
    ["poamr", "POA&M review", "Monthly", "CA-5", "Priya Raghavan", ["info", "Ready"], "2026-11-21", "Oct 14", ["t3", "t7"]],
    ["par", "Privileged account review", "Quarterly", "AC-2, AC-6", "Victor Amsel", ["warn", "In progress"], "2026-12-01", null, ["t8"]],
    ["au6", "Audit log review sampling", "Quarterly", "AU-6", "Nadia Fournier", ["none", "Planned"], "2026-12-23", null, ["t9"]],
    ["cm", "Configuration baseline audit", "Quarterly", "CM-2, CM-3", "Ingrid Solberg", ["none", "Planned"], "2026-12-28", null, ["t10"]],
    ["subset", "Control subset assessment, AC and IA", "Yearly", "CA-2, CA-7", "Nadia Fournier", ["none", "Planned"], "2027-02-11", null, ["t11"]],
    ["ir", "Incident response tabletop", "Yearly", "IR-3", "Priya Raghavan", ["none", "Planned"], "2027-03-13", null, ["t12"]],
    ["cp", "Contingency plan test on a whole article", "Yearly", "CP-4", "Amara Bell", ["none", "Planned"], "2027-04-12", null, ["t13"]],
    ["sa24", "Cyber resiliency exercise", "Yearly", "SA-24", "Wes Duarte", ["none", "Planned"], "2027-06-01", null, ["t14"]],
  ];
  const TRIGGERS = [
    ["crit", "diamond", "A critical issue past its remediate-by date", "Tripped: AU-10, 12 days late", "bad"],
    ["sig", "clock", "Significant change: a new configuration in the SSP", "SSP 3 drafts the Block 1.1 configuration", "warn"],
    ["c1", "clock", "Condition 1 of the decision not met by its date", "12 high issues open · due Dec 17", "warn"],
    ["comp", "info", "A component version in the boundary superseded", "Mission Computer version 2 published Nov 12", "info"],
    ["kev", "check", "A known exploited vulnerability (CISA KEV) in the boundary", "None", "ok"],
    ["atd", "check", "ATD within 12 months", "Sep 17, 2029", "ok"],
  ];
  S.conmon = () => {
    const last = SNAP[SNAP.length - 1];
    return page(
      header("Continuous monitoring", `<span>WS-X90 continuous monitoring — FY2027</span><span>Plan <b>Oct 1, 2026 – Sep 30, 2027</b></span><span>Authorized <b>to Sep 17, 2029</b></span>`, `${modalBtn("Export ConMon report", "risk-export", "all")}${modalBtn("Plan a check", "risk-task-new", "", true)}`),
      pair(
        completion({ title: "Controls satisfied", total: 560, done: last[6], unit: "controls satisfied today", note: "tracked since Nov 13", minis: [["Short of satisfied", last[4] + last[5], 560], ["Not assessed", last[3], 560], ["No evidence", last[2], 560]] }),
        attn([["diamond", "Reauthorization triggers tripped", 1], ["clock", "Triggers to review", 2], ["diamond", "Checks blocked or late", 2], ["info", "Changes since the decision", 6, true]]),
      ),
      `<div class="card"><div class="t">Control status, by day <span class="num">560 controls</span></div>
        <div class="risk-cols" role="img" aria-label="Control status on each day from Nov 13 to Nov 17: satisfied ${SNAP.map((s) => s[6]).join(", ")}">${SNAP.map((s) => `<div class="risk-col"><b class="num">${pct(s[6], 560)}%</b><div class="risk-colbar">${SNAPC.map(([l, c, i]) => `<i style="flex:${s[i]};background:${c}" title="${l}: ${s[i]}"></i>`).join("")}</div><span class="num">${day(s[0])}</span></div>`).join("")}</div>
        <div class="legend">${SNAPC.map(([l, c, i]) => `<span style="--c:${c}">${l} ${last[i]}</span>`).join("")}</div>
        ${note("From program_posture_snapshots: one snapshot a day since Nov 13. Satisfied went from 174 to 176 on Nov 15; nothing is backfilled before the first day.")}</div>`,
      `<h4 class="subhead">Cadence of checks</h4>`,
      tbl(["Check", "Cadence", "Controls", "Owner", "Now", "Next due", "Last done"], CHECKS.map(([id, t, cad, c, o, st, due, lastDone]) => ({ id, cells: [esc(t), tag(cad), esc(c), who(o), pill(st[0], st[1]), dueC(D(due)), lastDone ? `<span class="num">${lastDone}</span>` : ring("Not yet")] })), CHECKS.length, "risk-check"),
      `<div class="grid2"><div class="card"><div class="t">Since the last authorization <span>Sep 18</span></div><div class="rows">
        <div class="row">${gl("diamond")}<span>Operational issues opened · 2 critical, 9 high</span><b class="num">36</b></div>
        <div class="row">${gl("info")}<span>Determinations published · Nov 12</span><b class="num">225</b></div>
        <div class="row">${gl("clock")}<span>Determinations in draft results</span><b class="num">20</b></div>
        <div class="row">${gl("diamond")}<span>CVE-2024-6387 found on LRU-001 · Oct 10</span><b class="num">1</b></div>
        <div class="row">${gl("clock")}<span>Mission Computer version 2 published · Nov 12</span><b class="num">1</b></div>
        <div class="row">${gl("clock")}<span>SSP 3 in draft · Block 1.1 configuration</span><b class="num">1</b></div>
        <div class="row">${gl("ring")}<span class="risk-mu">Risks reassessed</span><b class="num risk-mu">0</b></div></div></div>
        <div class="card"><div class="t">Reauthorization triggers <span class="num">${TRIGGERS.length}</span></div><div class="rows">${TRIGGERS.map(([id, g, t, s, k]) => `<div class="row risk-go risk-ra" role="button" tabindex="0" data-panel="risk-trigger" data-id="${id}">${gl(g)}<span>${esc(t)}</span><b>${pill(k === "bad" ? "bad" : k === "warn" ? "warn" : k === "info" ? "info" : "ok", k === "bad" ? "Tripped" : k === "warn" ? "Review" : k === "info" ? "Watch" : "Clear")}</b></div>`).join("")}</div>${note("The rules are proposed; each is read against WS-X90's records today.")}</div></div>`,
    );
  };
  P["risk-check"] = (id) => {
    const c = CHECKS.find((x) => x[0] === id) || CHECKS[0];
    const runs = c[8].map((x) => TASKS.find((t) => t.id === x));
    return { label: "Check preview", body: `
      ${phead(c[1], btn("Record a result", `data-risk-toast="Result recorded for ${esc(c[1])}"`, true, true))}
      <dl class="kv"><dt>Cadence</dt><dd>${tag(c[2])}</dd><dt>Controls</dt><dd>${esc(c[3])}</dd><dt>Owner</dt><dd>${who(c[4])}</dd><dt>Now</dt><dd>${pill(c[5][0], c[5][1])}</dd><dt>Next due</dt><dd>${dueC(D(c[6]))}</dd></dl>
      ${sect("Runs", runs.length, runs.length ? runs.map((t) => `<div class="risk-line">${gl(t.s === "completed" ? "check" : t.s === "blocked" ? "diamond" : t.s === "in_progress" ? "clock" : "ring")}${plink("risk-task", t.id, t.t)}<span class="risk-le">${tstat(t.s)}</span></div>`).join("") : ring("None yet"))}` };
  };
  P["risk-trigger"] = (id) => {
    const t = TRIGGERS.find((x) => x[0] === id) || TRIGGERS[0];
    const detail = {
      crit: plink("issue", "1f680dd7", "Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)"),
      sig: line("clock", "Package version 2 drafts SSP 3; the AO decides whether the change is significant"),
      c1: plink("risk-decision", "v1", "ATO with conditions · Sep 18, 2026"),
      comp: line("info", "WS-X90 runs version 1; version 2 fixes CVE-2024-6387"),
      kev: line("check", "CVE-2024-6387 is not in the KEV catalog"),
      atd: line("check", "Sep 17, 2029 · 34 months away"),
    }[t[0]];
    return { label: "Trigger preview", body: `${phead(t[2], t[4] === "bad" ? btn("Notify the AO", 'data-risk-toast="R. Calloway notified"', true, true) : "")}<dl class="kv"><dt>State</dt><dd>${pill(t[4] === "bad" ? "bad" : t[4] === "warn" ? "warn" : t[4] === "info" ? "info" : "ok", t[4] === "bad" ? "Tripped" : t[4] === "warn" ? "Review" : t[4] === "info" ? "Watch" : "Clear")}</dd><dt>Reads</dt><dd>${esc(t[3])}</dd></dl>${sect("Why", null, detail)}${note("A tripped trigger asks the AO whether to reauthorize; it never changes the decision by itself.")}` };
  };
})();
