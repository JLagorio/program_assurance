// mod-v8-boundary (v8b-): version 8's boundary screens, on the kit (PA.AK).
// Routes: itcsc (WS-X90's ITCSC record: Checklist, -summary, -approval, -history, -comments, -activity); itcsc-import and
// itcsc-import-review (read a completed AF ITCSC, review it field by field, apply it to WS-X90 or create a program from it);
// interconnections (CA-3; -expiring, -no-agreement, -expired); ppsm (ports, protocols and services; -dod, -unregistered, -conditional).
// Adds to getting-started: Import or complete the ITCSC. The walkthrough's ITCSC start is in mod-program-new.js (PA.pnITCSC).
// Real: WS-X90's name, description, categorization, type, lifecycle, roles and emails (local database, SELECT only, Nov 18, 2026);
// the elements, control statuses, narratives and requirements (PA.SSP); the baseline layers and their counts (the walkthrough's DB and
// mod-v7-program); SSP 3 section 9's four ports. The form's sections, questions and options are the public AF ITCSC v2.0's.
// The PPSM assurance terms are DoDI 8551.01's Category Assurance List (CAL) colours: Green, Yellow, Red, and Temporary until assessed.
// Everything invented carries the Example badge.
(() => {
  const PA = window.PA;
  const { S, P, M, ROUTE_NAV, h } = PA;
  const AK = PA.AK, D = PA.SSP;
  if (!AK || !D) return;
  const { esc, fmt, pill, gl } = h;
  const ME = "Ingrid Solberg";
  const EX = '<span class="ex">Example</span>';

  // ——— Small pieces (the kit has the rest) ———
  const mu = (t) => `<span class="v8b-mu">${esc(t)}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const md = (iso) => AK.md(iso);
  const mdy = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const plural = (n, w, ws) => `${fmt(n)} ${n === 1 ? w : ws || w + "s"}`;
  const go = (r) => `data-go="${esc(r)}" role="link" tabindex="0"`;
  const vgo = (r) => `data-v8b-go="${esc(r)}" role="link" tabindex="0"`; // a link inside a row that opens a panel
  const btn = (label, attrs = "", ink = false, sm = true) => `<button type="button" class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const lnk = (label, attrs) => `<span class="ak-link" role="link" tabindex="0" ${attrs}>${esc(label)}</span>`;
  const tst = (msg) => `data-v8b-toast="${esc(msg)}"`;
  const toast = (t, l) => { if (D.ui && D.ui.toast) D.ui.toast(t, l); };
  const route = () => (location.hash || "#home").slice(1);
  const code = (t) => `<span class="ak-code">${esc(t)}</span>`;
  const clip = (inner, w, title) => `<span class="v8b-clip" style="max-width:${w}px"${title ? ` title="${esc(title)}"` : ""}>${inner}</span>`;
  const li = (lead, text, end = "", attrs = "") => `<div class="v8b-li"${attrs ? " " + attrs : ""}>${lead}<span class="x">${text}</span>${end ? `<span class="e">${end}</span>` : ""}</div>`;
  const none = (t) => `<span class="who v8b-none">${gl("ring")}${esc(t)}</span>`;
  const pan = (body) => `<div class="v8b-pan v8b-wide">${body}</div>`;
  const quote = (who, text) => `<blockquote class="v8b-q"><span class="k">${esc(who)}</span>${esc(text)}</blockquote>`;
  const wire = (html, label, attrs) => html.replace(`<span class="btn sm">${esc(label)}</span>`, `<button type="button" class="btn sm" ${attrs}>${esc(label)}</button>`);
  const banner = (opt, attrs) => { const b = AK.banner(opt); return opt.action && attrs ? wire(b, opt.action, attrs) : b; };
  const field = (label, control, help = "", req = false) => `<div class="ak-field"><label>${esc(label)}${req ? ' <span class="req">Required</span>' : ""}</label>${control}${help ? `<span class="s">${help}</span>` : ""}</div>`;
  const sel = (text) => `<div class="ak-select">${esc(text)}${AK.i("down")}</div>`;
  const inp = (text, tall = false) => `<div class="ak-input${tall ? " tall" : ""}">${esc(text)}</div>`;
  const foot = (primary, attrs) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal ${attrs}>${esc(primary)}</button>`;
  const cardH = (title, count, action = "") => `<div class="v8b-cardh"><b>${esc(title)}</b>${count != null ? `<span class="ct num">${esc(count)}</span>` : ""}${action ? `<span class="v8b-push">${action}</span>` : ""}</div>`;
  const opts = (list, on) => `<span class="v8b-opts">${list.map((o) => `<span class="v8b-opt${o === on ? " on" : ""}">${AK.check(o === on)}${esc(o)}</span>`).join("")}</span>`;
  const checks = (list) => `<span class="v8b-opts col">${list.map(([o, on]) => `<span class="v8b-opt${on ? " on" : ""}">${AK.check(on)}${esc(o)}</span>`).join("")}</span>`;
  // The framed table every after screen uses: one line a cell, rows open a panel or a route.
  function tbl({ cols, rows, panel = "", pager = true, label = "", total, nm = 0, cls = "" }) {
    const body = rows.length ? rows.map((r) => {
      if (r.group) return `<tr class="v8b-grp"><td colspan="${cols.length}">${r.group}</td></tr>`;
      const pk = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` data-go="${esc(r.go)}" tabindex="0"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id || "")}" tabindex="0"` : "";
      return `<tr${r.cls ? ` class="${r.cls}"` : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="v8b-empty"><td colspan="${cols.length}">${none("Nothing in this view.")}</td></tr>`;
    const t = total ?? rows.filter((r) => !r.group).length;
    return `<div class="frame v8b-frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${t ? `1–${t} of ${fmt(t)}` : "0 of 0"}</span><span>25 per page</span></div>` : ""}</div>`;
  }

  // ——— State: owners, selection, the import's file and choices, version 4 ———
  const OWN = {}, SEL = new Set(), CHOICE = {};
  const ST = { file: "wsx90", qv: "all", pqv: "all", v4: null, applied: false };
  let LASTP = null;
  const ownerOf = (key, dflt = null) => (Object.prototype.hasOwnProperty.call(OWN, key) ? OWN[key] : dflt);
  const ownerEdit = (key, dflt = null) => `<span class="v8b-own" role="button" tabindex="0" data-modal="v8b-owner" data-id="${esc(key)}" title="Change owner">${AK.owner(ownerOf(key, dflt))}${AK.i("pen")}</span>`;
  const PEOPLE = [[ME, "Security engineer"], ["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"], ["Marcus Ryde", "Component owner"], ["D. Okafor", "Lead assessor (SCA)"], ["Nadia Fournier", "Assessor"], ["R. Calloway", "Authorizing official"]];

  // ——— WS-X90's elements and controls (PA.SSP) ———
  const EL = {};
  D.elements.forEach(([c, n, t, p, l]) => (EL[c] = { code: c, name: n, type: t, parent: p, lru: l }));
  const elName = (c) => (EL[c] ? EL[c].name : c);
  const elShort = (c) => (EL[c] ? `${EL[c].lru || c} ${EL[c].name}` : c);
  const ctl = (c) => D.ctl(c);
  const stPill = (c) => { const x = ctl(c); if (!x) return mu("Not in the baseline"); const s = D.STATUS[x.cs] || ["Unknown", "none"]; return pill(s[1], s[0]); };
  const ctlRow = (c, back) => { const x = ctl(c); return li(code(c), esc(x ? x.t : ""), stPill(c), `data-panel="v8b-ctl" data-id="${esc(c + "|" + back)}" role="button" tabindex="0"`); };

  // ——— Interconnections (CA-3). Connected systems, organizations, AOs, agreements and dates are examples, except where WS-X90's SSP says. ———
  const IC = [
    { id: "IC-101", name: "Ground data link", to: "Tactical data link network", org: "Joint Interface Control Cell", ao: "Col. M. Ferris", type: "RF data link", cls: "CUI", dir: "Both ways", flows: "Position reports out, tasking in", enc: "FIPS 140-3", encBy: "The Cryptographic Services Module (LRU-003) wraps every frame",
      agr: { kind: "ISA", st: "Signed", ref: "ISA-WSX90-TDL", signed: "2024-01-16", exp: "2027-01-15" }, appr: ["sent", "2026-11-10"], remind: "Nov 14",
      els: ["CN-109108", "CN-109107"], owner: "Priya Raghavan", review: ["2026-07-20", "Joel Barrantes"], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8", "SC-47"],
      src: [["CA-3", "The Tactical Data Radio (LRU-008) tactical data link agreement is signed and current."], ["SC-47", "Command and control runs over one path - the ground data link terminating on the Protected Network Gateway (LRU-007), carried by the Tactical Data Radio (LRU-008)."]],
      comments: [{ who: "Priya Raghavan", role: "ISSO", when: "Nov 10", text: "Renewal sent to R. Calloway. The cell's AO signs second." }, { who: "Joel Barrantes", role: "ISSM", when: "Nov 14", text: `${AK.mention("Priya Raghavan")} the annex still names the old crypto module part number. Fix it in the renewal.` }] },
    { id: "IC-102", name: "Mission planning network", to: "Mission planning network", org: "Wing mission planning cell", ao: "Lt Col D. Ames", type: "Ethernet", cls: "CUI", dir: "Both ways", flows: "Mission plans in, mission reports out", enc: "FIPS 140-3", encBy: "TLS 1.3 on the Protected Network Gateway",
      agr: { kind: "ISA", st: "Signed", ref: "ISA-WSX90-MPN", signed: "2026-06-30", exp: "2029-06-30" }, appr: ["approved", "2026-06-30"],
      els: ["CN-109107"], owner: "Joel Barrantes", review: ["2026-06-30", "Joel Barrantes"], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8", "SC-7(4)"],
      src: [["SC-7(4)", "Each external telecommunication service terminates on its own managed interface of the Protected Network Gateway (LRU-007) under a named traffic-flow policy."]], comments: [] },
    { id: "IC-103", name: "Depot maintenance enclave", to: "Depot maintenance enclave", org: "Depot maintenance group", ao: "R. Iverson", type: "Maintenance port", cls: "CUI", dir: "Both ways", flows: "Maintenance commands in, logs out", enc: "FIPS 140-3", encBy: "SSH on the Maintenance Access Gateway",
      agr: { kind: "MOA", st: "Signed", ref: "MOA-WSX90-DEPOT", signed: "2026-03-02", exp: "2027-02-12" }, appr: ["waiting"],
      els: ["CN-109114", "CN-109107"], owner: "Ray Colston", review: ["2026-08-20", "Joel Barrantes"], added: "2026-08-20", ctl: ["CA-3", "SC-7", "SC-8", "SC-7(8)", "SC-7(10)"],
      src: [["SC-7(3)", "The Protected Network Gateway (LRU-007) is the only LRU with an interface in the external address space, carrying the ground data link and the maintenance service port."], ["SC-7(8)", "Firmware retrieval over the maintenance service port still uses an unproxied path."], ["SC-7(10)", "One test has been run against the ground data link, there is no recurring cadence, and the maintenance service port has not been tested at all."]], comments: [] },
    { id: "IC-104", name: "Ground support telemetry", to: "Ground support telemetry system", org: "Program test office", ao: "Lt Col K. Brandt", type: "Ethernet", cls: "CUI", dir: "Outbound", flows: "Payload telemetry out", enc: "FIPS 140-3", encBy: "TLS 1.3 on the Protected Network Gateway",
      agr: { kind: "ISA", st: "Draft", ref: "ISA-WSX90-GST", interim: "2026-12-15" }, appr: ["sent", "2026-11-03"],
      els: ["CN-109112", "CN-109107"], owner: "Priya Raghavan", review: ["2026-10-06", "Priya Raghavan"], added: "2026-10-06", since: true, ctl: ["CA-3", "SC-7", "SC-8", "CA-3(6)"],
      src: [["CA-3", "The gap is the ground-support telemetry exchange, which is running under a time-bounded interim approval while its agreement is in draft; the interim approval has an expiry recorded but the exchange is live without a signed agreement."], ["CA-3(6)", "The Payload Telemetry Unit (LRU-012) releases telemetry on link-layer identity alone, with no check against a recorded read authorization."]],
      comments: [{ who: "Priya Raghavan", role: "ISSO", when: "Oct 6", text: "Live under R. Calloway's interim approval until Dec 15 while the ISA is in draft." }, { who: "D. Okafor", role: "Lead assessor (SCA)", when: "Nov 12", text: "CA-3 can't be found satisfied while this runs without a signed agreement." }] },
    { id: "IC-105", name: "SIPRNet reachback", to: "SIPRNet", org: "DISA", ao: "DISN connection approval", type: "VPN over DISN", cls: "SECRET", dir: "Both ways", flows: "Mission reports out, tasking in", enc: "NSA Type 1", encBy: "A HAIPE device at the ground station",
      agr: { kind: "ISA", st: "Draft", ref: "ISA-WSX90-SIPR" }, appr: ["waiting"],
      els: ["CN-109107"], owner: "Joel Barrantes", review: ["2026-10-27", "Joel Barrantes"], added: "2026-10-27", since: true, ctl: ["CA-3", "SC-7", "SC-8", "SC-7(3)"],
      src: [["SC-7(3)", "The number of external connections is held at two by construction rather than by policy."]],
      comments: [{ who: "Joel Barrantes", role: "ISSM", when: "Oct 27", text: "Needs ITCSC version 4 first: SECRET makes 7F and 6E yes and brings in the Classified Information Overlay." }] },
    { id: "IC-106", name: "Mission data loads", to: "Mission planning system loader", org: "Wing mission planning cell", ao: "Lt Col D. Ames", type: "Removable media", cls: "CUI", dir: "Inbound", flows: "Mission data in", enc: "FIPS 140-3", encBy: "Encrypted media on the signed allow-list",
      agr: { kind: "MOU", st: "Expired", ref: "MOU-WSX90-MDL", signed: "2025-10-31", exp: "2026-10-31" }, appr: ["waiting"],
      els: ["CN-109101"], owner: "Ray Colston", review: ["2025-10-31", "Joel Barrantes"], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8", "MP-7"],
      src: [["MP-7", "The Mission Computer (LRU-001) and the Maintenance Access Gateway (LRU-014) refuse mass-storage class enumeration on their maintenance ports unless the device serial is in the signed removable-device allow-list."]],
      comments: [{ who: "Ray Colston", role: "System owner", when: "Nov 3", text: "The MOU lapsed Oct 31. Loads go on under the old terms until the wing's AO signs." }] },
    { id: "IC-107", name: "Depot maintenance laptop", to: "Depot maintenance laptop", org: "Depot maintenance group", ao: "R. Iverson", type: "Removable media", cls: "CUI", dir: "Both ways", flows: "Fault logs out, procedures in", enc: "FIPS 140-3", encBy: "Encrypted media on the signed allow-list",
      agr: { kind: "MOU", st: "Expired", ref: "MOU-WSX90-DML", signed: "2025-09-30", exp: "2026-09-30" }, appr: ["waiting"],
      els: ["CN-109119"], owner: "Ray Colston", review: ["2025-09-30", "Joel Barrantes"], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8", "SC-41"],
      src: [["SC-41", "On the two ground support endpoints the exposure is removable media and wireless, and wireless is handled decisively: the hardware is removed from both the Maintenance Laptop (LRU-019) and the Provisioning Workstation (LRU-017) rather than disabled in software."]], comments: [] },
    { id: "IC-108", name: "GPS", to: "GPS", org: "US Space Force", ao: "Not applicable", type: "RF, receive only", cls: "Unclassified", dir: "Inbound", flows: "Position and time in", enc: "None", encBy: "A broadcast signal, received only",
      agr: { kind: "", st: "Not required", why: "A broadcast WS-X90 only receives: there is no exchange to agree.", by: "Ingrid Solberg", on: "2026-08-20" },
      els: ["CN-109105"], owner: ME, review: ["2026-08-20", ME], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8"], src: [], comments: [] },
    { id: "IC-109", name: "Identity services", to: "Corporate identity provider (PRG-1013)", org: "Corporate IT", ao: "PRG-1013's AO", type: "Inherited service", cls: "CUI", dir: "Inbound", flows: "Identities and group membership", enc: "FIPS 140-3", encBy: "LDAPS from the Platform Management Controller",
      agr: { kind: "", st: "Not required", why: "The common control provider record covers it: WS-X90 inherits the identity service.", by: "Joel Barrantes", on: "2026-09-12" }, real: true,
      els: ["CN-109113"], owner: "Joel Barrantes", review: ["2026-09-12", "Joel Barrantes"], added: "2026-03-16", ctl: ["CA-3", "SC-7", "SC-8"],
      src: [["SSP 3 §5", "Identity services come from the corporate identity provider outside it."]], comments: [] },
  ];
  const ICBY = Object.fromEntries(IC.map((x) => [x.id, x]));
  const AGR = { Signed: "ok", Draft: "warn", Expired: "bad", "Not required": "info" };
  const agrPill = (a) => pill(AGR[a.st], a.kind ? `${a.kind} · ${a.st}` : a.st);
  // An expiry: red once past, amber inside 90 days, the age or the time left beside the day.
  const exp = (iso, pre = "") => {
    const d = AK.days(iso), cls = d < 0 ? " bad" : d <= 90 ? " warn" : "";
    const tail = d < 0 ? ` · ${-d === 1 ? "1 day" : -d + " days"} ago` : d <= 90 ? ` · in ${d === 1 ? "1 day" : d + " days"}` : "";
    return `<span class="ak-due${cls}">${AK.i(d < 0 ? "flag" : "calendar")}${pre}${md(iso)}${tail}</span>`;
  };
  const expShort = (iso) => { const d = AK.days(iso), day = new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); return d < 0 ? `<span class="ak-due bad">${AK.i("flag")}${day} · ${-d === 1 ? "1 day" : -d + " days"} ago</span>` : d <= 90 ? `<span class="ak-due warn">${AK.i("calendar")}${day} · in ${d === 1 ? "1 day" : d + " days"}</span>` : `<span class="ak-due">${AK.i("calendar")}${md(iso)}</span>`; };
  const expTbl = (a) => (a.st === "Not required" ? AK.due(null, { none: "No expiry" }) : a.st === "Draft" ? (a.interim ? `<span title="Interim approval to ${esc(md(a.interim))}">${expShort(a.interim)}</span>` : AK.due(null, { none: "Not signed" })) : expShort(a.exp));
  const face = (n) => `<span class="v8b-face" role="img" aria-label="${esc("Owner: " + (n || "nobody"))}" title="${esc(n || "No owner")}">${AK.avatar(n, 24)}</span>`;
  const expCell = (a) => (a.st === "Not required" ? AK.due(null, { none: "No expiry" }) : a.st === "Draft" ? (a.interim ? exp(a.interim, "Interim to ") : AK.due(null, { none: "Not signed" })) : exp(a.exp));
  const clsTag = (c) => `<span class="v8b-cls${c === "SECRET" ? " s" : ""}">${esc(c)}</span>`;
  const addYear = (iso) => `${+iso.slice(0, 4) + 1}${iso.slice(4)}`;
  const icIn = {
    all: () => true,
    expiring: (x) => x.agr.st === "Signed" && AK.days(x.agr.exp) >= 0 && AK.days(x.agr.exp) <= 90,
    "no-agreement": (x) => x.agr.st === "Draft",
    expired: (x) => x.agr.st === "Expired",
  };

  // ——— Ports, protocols and services. SSP 3 §9's four rows are WS-X90's; the narratives name the rest; numbers marked Example are invented. ———
  const PPS = [
    { id: "PPS-01", port: "443/tcp", proto: "HTTPS (TLS 1.3)", svc: "Mission plan transfer", dir: "Outbound", bnd: "Enclave", ic: "IC-102", el: "CN-109107", cal: "Green", reg: "Registered", regId: "17342", owner: "Joel Barrantes", ssp: 1, ctl: ["CM-7", "SC-7", "SA-4(9)"] },
    { id: "PPS-02", port: "22/tcp", proto: "SSH", svc: "Maintenance sessions", dir: "Inbound", bnd: "Enclave", ic: "IC-103", el: "CN-109114", cal: "Yellow", reg: "Pending", owner: "Ray Colston", ssp: 2, ctl: ["CM-7", "SC-7", "AU-14(1)"],
      conds: [["SSH version 2 only", 1], ["FIPS 140-3 validated algorithms", 1], ["Public key authentication, no passwords", 1], ["Session audit on before the port comes up", 1, "AU-14(1)"]],
      src: [["AU-14(1)", "If the enable step fails, the boot sequence leaves the maintenance port down, so there is no window in which a maintenance session can be opened with session auditing off."]] },
    { id: "PPS-03", port: "6514/tcp", proto: "Syslog over TLS", svc: "Security log forwarding", dir: "Inside", bnd: "Internal only", el: "CN-109118", cal: "Green", reg: "Not required", owner: "Priya Raghavan", ssp: 3, ctl: ["CM-7", "SC-7", "AU-9"] },
    { id: "PPS-04", port: "n/a", proto: "Link protocol", svc: "Position reports and tasking", dir: "Both ways", bnd: "Over the air", ic: "IC-101", el: "CN-109108", cal: "Not applicable", reg: "Not required", owner: "Priya Raghavan", ssp: 4, ctl: ["CM-7", "SC-7", "SC-8(1)"],
      src: [["SC-8(1)", "Confidentiality and integrity in transmission are provided by the Cryptographic Services Module (LRU-003), which wraps every outbound frame before it reaches the Protected Network Gateway (LRU-007) or the Tactical Data Radio (LRU-008)."]] },
    { id: "PPS-05", port: "443/tcp", proto: "HTTPS", svc: "Firmware retrieval", dir: "Inbound", bnd: "Enclave", ic: "IC-103", el: "CN-109107", cal: "Yellow", reg: "Not registered", owner: "Ray Colston", ctl: ["CM-7", "SC-7", "SC-7(8)", "CM-7(3)"],
      conds: [["Through an approved proxy", 0, "SC-7(8)"], ["Signed images only", 1]],
      src: [["SC-7(8)", "Firmware retrieval over the maintenance service port still uses an unproxied path, so the exemption set in practice is wider than the named list."], ["CM-7(3)", "Registration compliance for ports, protocols and services is currently a paper reconciliation performed at release review."]] },
    { id: "PPS-06", port: "2001/tcp", portEx: 1, proto: "Vendor diagnostic", svc: "Sensor interface diagnostics", dir: "Inside", bnd: "Internal only", el: "CN-109106", cal: "Not listed", reg: "Not required", owner: ME, off: 1, ctl: ["CM-7", "CM-7(1)", "SA-4(9)"],
      src: [["CM-7(1)", "LRU-006 still exposes two vendor diagnostic services that are enabled in the shipped configuration with no approved entry, and disabling them is blocked on a vendor firmware release. That is the open item behind REQ-578."]] },
    { id: "PPS-07", port: "2002/udp", portEx: 1, proto: "Vendor diagnostic", svc: "Sensor interface trace", dir: "Inside", bnd: "Internal only", el: "CN-109106", cal: "Not listed", reg: "Not required", owner: ME, off: 1, ctl: ["CM-7", "CM-7(1)", "SA-4(9)"],
      src: [["CM-7(1)", "LRU-006 still exposes two vendor diagnostic services that are enabled in the shipped configuration with no approved entry, and disabling them is blocked on a vendor firmware release. That is the open item behind REQ-578."]] },
    { id: "PPS-08", port: "443/tcp", proto: "HTTPS (TLS 1.3)", svc: "Mission report upload", dir: "Outbound", bnd: "DISN", ic: "IC-105", el: "CN-109107", cal: "Green", reg: "Pending", owner: "Joel Barrantes", ctl: ["CM-7", "SC-7", "SC-7(3)"] },
    { id: "PPS-09", port: "50100/udp", portEx: 1, proto: "UDP stream", svc: "Payload telemetry", dir: "Outbound", bnd: "Enclave", ic: "IC-104", el: "CN-109112", cal: "Temporary", reg: "Not registered", owner: "Priya Raghavan", ctl: ["CM-7", "SC-7", "CA-3(6)"] },
    { id: "PPS-10", port: "636/tcp", proto: "LDAPS", svc: "Directory lookups", dir: "Outbound", bnd: "Enclave", ic: "IC-109", el: "CN-109113", cal: "Green", reg: "Registered", regId: "15208", owner: "Joel Barrantes", ctl: ["CM-7", "SC-7", "IA-2"] },
    { id: "PPS-11", port: "123/udp", proto: "NTP", svc: "Time distribution", dir: "Inside", bnd: "Internal only", el: "CN-109105", cal: "Yellow", reg: "Not required", owner: ME, ctl: ["CM-7", "SC-7", "AU-8"],
      conds: [["Authenticated NTP with symmetric keys", 1], ["Clients take time from the Timing Receiver only", 1]] },
    { id: "PPS-12", port: "161/udp", proto: "SNMPv3", svc: "Device health polling", dir: "Inside", bnd: "Internal only", el: "CN-109113", cal: "Yellow", reg: "Not required", owner: ME, ctl: ["CM-7", "SC-7", "CM-6"],
      conds: [["Authentication and privacy (authPriv) only", 1], ["Polling only, no set requests", 1]] },
  ];
  const PSBY = Object.fromEntries(PPS.map((x) => [x.id, x]));
  const CAL = { Green: "ok", Yellow: "warn", Red: "bad", Temporary: "none", "Not listed": "none", "Not applicable": "info" };
  const REG = { Registered: "ok", Pending: "warn", "Not registered": "bad", "Not required": "info" };
  const dodB = (x) => x.bnd === "Enclave" || x.bnd === "DISN";
  const unmet = (x) => (x.conds || []).filter((c) => !c[1]).length;
  const calCell = (x) => `${pill(CAL[x.cal], x.cal)}${unmet(x) ? ` <span class="v8b-bad num">${unmet(x)} unmet</span>` : ""}`;
  const psIn = { all: () => true, dod: dodB, unregistered: (x) => x.reg === "Pending" || x.reg === "Not registered", conditional: (x) => x.cal === "Yellow" };

  // ——— Selection and the bulk bar (interconnections) ———
  const cb = (id, label) => `<span class="v8b-cb" role="checkbox" tabindex="0" aria-checked="${SEL.has(id)}" aria-label="${esc(label)}" data-v8b-sel="${esc(id)}">${AK.check(SEL.has(id))}</span>`;
  const cbAll = (ids) => { const all = ids.length > 0 && ids.every((i) => SEL.has(i)), some = ids.some((i) => SEL.has(i)); return `<span class="v8b-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : some ? "mixed" : "false"}" aria-label="Select every row" data-v8b-sel="*" data-v8b-all="${esc(ids.join("|"))}">${AK.check(all)}</span>`; };
  function bulk() {
    let html = AK.bulk({ count: SEL.size, actions: ["Request renewal", "Assign owner", "Remind owners"] });
    html = html.replace('<span class="ak-link">Deselect</span>', '<button type="button" class="ak-link v8b-linkbtn" data-v8b-desel="1">Deselect</button>');
    html = html.replace('<span class="btn sm">Request renewal</span>', '<button type="button" class="btn sm" data-modal="v8b-renew" data-id="selected">Request renewal</button>');
    html = html.replace('<span class="btn sm">Assign owner</span>', '<button type="button" class="btn sm" data-modal="v8b-owner" data-id="ic:*">Assign owner</button>');
    return html.replace('<span class="btn sm">Remind owners</span>', `<button type="button" class="btn sm" data-v8b-remind="1">Remind owners</button>`);
  }
  const filters = (search, list) => `<div class="tools v8b-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span></div>`;

  // ——— Redraw in place ———
  function redraw(focus) {
    const r = route(); if (!S[r]) return;
    const main = document.getElementById("main"), top = main.scrollTop;
    main.innerHTML = S[r]();
    main.scrollTop = top;
    if (focus) { const el = main.querySelector(focus); if (el) el.focus(); }
  }
  function refreshPanel() {
    const pb = document.querySelector("#panel:not([hidden]) .pbody");
    if (pb && LASTP && P[LASTP.kind]) { const o = P[LASTP.kind](LASTP.id); if (o) pb.innerHTML = o.body; }
  }
  const closeModal = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  const q = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v);

  // ═════════════ The ITCSC record ═════════════
  // WS-X90's baseline layers (High 370, then each layer at its place in the stack), and how each maps onto the form.
  const LAYERS = [
    ["NIST SP 800-53 Rev 5 High baseline", "370", "§10: the highest of C High, I High, A Moderate"],
    ["CNSSI 1253 National Security System Allocation", "+201 −17 · 554", "§7: an NSS (7C, 7D). The NSS baseline, not a §6 overlay"],
    ["Mission Assurance Overlay", "−5 · 549", "§6F: mission or function specific"],
    ["Deployed Platform Overlay", "+1 · 550", "§6F: mission or function specific"],
    ["Customer A Tailoring", "−4 · 546", "Not on the ITCSC: a customer's tailoring"],
    ["WS-X90 program tailoring", "+14 · 560", "Not on the ITCSC: the program's own last layer"],
  ];
  const SRC = { prog: "Program record", sys: "System record", roles: "Program roles", base: "Baseline layers", tree: "System tree", ssp5: "SSP 3 §5", ssp4: "SSP 3 §4", ic: "Interconnections", nar: "SC-41 narrative", form: "ITCSC only" };
  const srcTag = (k, ex) => `<span class="v8b-src${k === "form" ? " f" : ""}">${esc(SRC[k] || k)}</span>${ex ? EX : ""}`;
  const flag = (t) => `<span class="v8b-flag">${gl("diamond")}${esc(t)}</span>`;
  const qa = (q, a, src, ex, extra = "") => `<div class="v8b-qr"><span class="q">${q}</span><span class="a">${a}${extra}</span><span class="s">${src ? srcTag(src, ex) : ""}</span></div>`;
  const INFO = [["Mission plans", "High", "High", "Moderate"], ["Payload commands", "High", "High", "Moderate"], ["Navigation state and timing", "Moderate", "High", "Moderate"], ["Telemetry", "Moderate", "Moderate", "Low"], ["Security audit records", "Moderate", "High", "Low"], ["Maintenance and fault records", "Low", "Moderate", "Low"]];
  const lv = (l) => `<span class="v8b-lv${l === "High" ? " h" : ""}">${esc(l)}</span>`;
  const TEAM = [
    ["Authorizing official", "R. Calloway", "", "Weapons AO office", "roles", true],
    ["AODR", "Lena Marsh", "", "Weapons AO office", "form", true],
    ["Program manager", "Ray Colston", "r.colston@equinox.mil", "Program office", "roles", true],
    ["SCA", "D. Okafor", "", "Assessment team", "roles", true],
    ["ISSM", "Joel Barrantes", "j.barrantes@equinox.mil", "Program office", "roles", true],
    ["Director of engineering / ISSE", ME, "", "Program office", "people", false],
    ["User representative", "Capt. T. Abara", "", "Operating squadron", "form", false],
    ["Requirements lead", "Sam Ortega", "", "Program office", "form", false],
    ["Primary POC", "Priya Raghavan", "p.raghavan@equinox.mil", "Program office", "roles", true],
  ];
  const ifaceV3 = IC.filter((x) => !x.since);
  const AO_BOUNDS = ["AETC RT&E", "AF Enterprise", "AF Cyberspace Operations (AFCO)", "AFOTEC", "Air Force Weather (AFWWS)", "Aircraft", "Civil Engineering (CE)", "Command & Control (C2)", "Cyber Space Innovation (CSI)", "Defense Cyber Crime Center (DC3)", "DT&E", "Finance (SAF/FM)", "Headquarters Air Force (HAF)", "Industrial Depot Maintenance (IDM)", "Logistics (AF/A4)", "Manpower (AF/A1)", "Nuclear, non-NC3 (AFNWC)", "Operational Test Infrastructure (OTI)", "Rapid Cyber Acquisition (RCA)", "Science & Technology (AFRL)", "Security Forces (SF)", "Space", "USAFA", "Weapons", "Other"];
  const sec = (n, t, rows, opt = {}) => `<section class="ak-card v8b-sec" id="v8b-s${n}"><div class="v8b-sec-h"><span class="v8b-sn num">${esc(n)}</span><b>${esc(t)}</b>${opt.flag ? flag(opt.flag) : ""}<span class="v8b-push v8b-mu">${esc(opt.note || "")}</span></div><div class="v8b-qa">${rows}</div>${opt.after || ""}</section>`;

  function checklist() {
    const x = D.system;
    const s1 = sec("1", "System identification", [
      qa("System name", `<b>${esc(x.name)}</b>`, "prog"),
      qa("System acronym", "WS-X90", "prog"),
      qa("Version", "Block 1", "SSP revision 2"),
      qa("ITIPS", num("31877"), "form", true),
      qa("DITPR#", "Not applicable", "form", true),
      qa("eMASS#", num("4417"), "form", true),
    ].join(""), { note: "Names must match ITIPS" });
    const s2 = sec("2", "Technical description and purpose", [
      qa("Description", esc(x.description), "prog"),
      qa("Mission", esc(D.sec("s4").text[0]), "ssp4", true),
      qa("Major components", `${lnk("6 subsystems and 20 elements", vgo("composition"))}`, "tree"),
      qa("Publicly accessible services", "None", "form", true),
      qa("Significant modification", "None at version 3", "form", true, ` ${flag("Block 1.1 is in SSP 3 since Nov 13")}`),
    ].join(""));
    const s3 = sec("3", "Authorizing official and authorization boundary", [
      qa("AO boundary", `<b>Weapons</b> <details class="v8b-more"><summary>1 of ${AO_BOUNDS.length} AF AO boundaries</summary><span class="v8b-opts">${AO_BOUNDS.map((b) => `<span class="v8b-opt${b === "Weapons" ? " on" : ""}">${AK.check(b === "Weapons")}${esc(b)}</span>`).join("")}</span></details>`, "form", true),
      qa("Authorizing official", AK.owner("R. Calloway"), "roles"),
    ].join(""));
    const s4 = sec("4", "Operational status", qa("Status", opts(["Operational", "Under development", "Major modification"], "Under development"), "System record · lifecycle Planned"));
    const ifs = `<div class="v8b-ifs">${ifaceV3.map((i) => `<span class="v8b-if"><b>${esc(i.name)}</b>${mu(i.type)}</span>`).join("")}</div>`;
    const s5 = sec("5", "Proposed IT and the authorization boundary", [
      qa("Proposed IT", `${opts(["Information system", "Platform IT", "IT service", "IT product"], "Platform IT")} ${mu("PIT system")}`, "System record · type Platform"),
      qa("Boundary narrative", esc(D.sec("s5").text[0]), "ssp5"),
      qa(`External interfaces <span class="ct num">${ifaceV3.length}</span>`, ifs, "ic", false, ` ${flag("2 added since: Ground support telemetry and SIPRNet reachback")}`),
      qa("Wi-Fi", "None: the wireless hardware is removed from the Maintenance Laptop and the Provisioning Workstation", "nar"),
      qa("Boundary drawing", lnk("SSP 3, figure 1, drawn from the system tree", vgo("ssp")), "ssp5"),
    ].join(""), { flag: "2 interfaces since approval" });
    const yn = (q, a, f) => qa(q, opts(["Yes", "No"], a), "form", true, f ? ` ${flag(f)}` : "");
    const map = tbl({ cols: ["Baseline layer", "Controls", "From the ITCSC"], rows: LAYERS.map(([l, n, m]) => ({ cells: [esc(l), `<span class="num">${esc(n)}</span>`, esc(m)] })), pager: false, label: "How WS-X90's baseline layers map onto the ITCSC", cls: "v8b-map v8b-wrap", nm: -1 });
    const s6 = sec("6", "Overlays", [
      yn("6A Intelligence (ISR)", "No"), yn("6B Cross domain solution", "No"), yn("6C NC3", "No"), yn("6D Space platform", "No"),
      yn("6E Classified information", "No", "Yes with SIPRNet reachback"),
      qa("6F Mission or function specific", `${opts(["Yes", "No"], "Yes")} <b>Mission Assurance; Deployed Platform</b>`, "base"),
    ].join(""), { after: `<div class="v8b-sub"><div class="v8b-subh"><b>How WS-X90's baseline layers map onto the ITCSC</b>${lnk("Open the baseline", go("baseline"))}</div>${map}</div>` });
    const s7 = sec("7", "National security system", [
      qa("Is this an NSS?", `${opts(["Yes", "No"], "Yes")} ${mu("7C and 7D")}`, "form", true),
      yn("7A Intelligence activities", "No"), yn("7B Cryptologic activities", "No"), yn("7C Command and control of military forces", "Yes"),
      yn("7D Equipment integral to a weapon or weapons system", "Yes"), yn("7E Critical to military or intelligence missions", "No"),
      yn("7F Classified information", "No", "Yes with SIPRNet reachback"),
    ].join(""));
    const s8 = sec("8", "Cloud", [yn("8A Cloud hosted", "No"), qa("Impact level", opts(["IL2", "IL4", "IL5", "IL6", "Not applicable"], "Not applicable"), "form", true)].join(""), { note: "No: proceed to section 9" });
    const s9 = sec("9", "Privacy", [
      yn("9A Collects PII about people", "Yes"), yn("9C PII other than rolodex information", "No"),
      qa("9E PII types", ["Name", "Business e-mail", "Position or title", "Rank or grade"].map((t) => AK.chip(t)).join(" "), "form", true),
      qa("9F Adverse effect", opts(["Limited", "Serious", "Severe"], "Limited"), "form", true),
      qa("9H PII confidentiality impact", opts(["Low", "Moderate", "High"], "Low"), "form", true),
      qa("Privacy Overlay", "Not required: no PII beyond account rosters, and no Privacy layer in the baseline", "base"),
    ].join(""));
    const info = tbl({ cols: ["Information type", "Confidentiality", "Integrity", "Availability"], rows: INFO.map(([t, c, i, a]) => ({ cells: [esc(t), lv(c), lv(i), lv(a)] })).concat([{ cls: "v8b-tot", cells: ["<b>Final security categorization</b>", lv("High"), lv("High"), lv("Moderate")] }]), pager: false, label: "Information types", cls: "v8b-info", nm: -1 });
    const s10 = sec("10", "Categorization", `${info}${qa("Final categorization", "<b>C High · I High · A Moderate</b>", "sys")}${qa("Justification", "Mission plans and payload commands set confidentiality and integrity High. Losing the tactical data link degrades the mission without ending it, so availability is Moderate.", "form", true, ` ${flag("WS-X90's system record holds no rationale")}`)}`, { after: `<div class="btns">${btn("Copy the justification to the system record", tst("Justification copied to SYS-WSX90's categorization rationale"))}</div>` });
    const team = tbl({ cols: ["Title", "Name", "Email", `Organization ${EX}`, "From"], rows: TEAM.map(([t, n, e, o, s, req]) => ({ cells: [`${esc(t)}${req ? ' <span class="v8b-req">*</span>' : ""}`, AK.owner(n), e ? esc(e) : mu("Not recorded"), esc(o), s === "form" ? `${srcTag("form")}${EX}` : s === "people" ? srcTag("Program people") : srcTag("roles")] })), pager: false, label: "RMF team", cls: "v8b-team v8b-wrap", nm: -1 });
    const s11 = sec("11", "The RMF team", team, { note: "* mandatory, the minimum staffing" });
    return [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11].join("");
  }
  const SUBMITTED = "2026-08-27", PM_SIGNED = "2026-08-29", AO_SIGNED = "2026-09-02";
  function itcRail() {
    const v4 = ST.v4 ? `<div class="ak-rail-s"><div class="ak-rail-t">Version 4</div>${AK.facts([["State", pill("none", "Draft")], ["Started", ST.v4 === "imported" ? "From WS-X90_ITCSC_v4.pdf" : "From version 3"]])}${lnk("Request signatures", 'data-modal="ak-approvers" data-id="ITCSC version 4"')}</div>` : "";
    return `${AK.railCard("Details", [["Version", `3 · approved ${mdy(AO_SIGNED)} ${EX}`], ["Form", "AF ITCSC v2.0"], ["Owner", ownerEdit("itcsc", "Joel Barrantes")], ["Signed by", `<span class="v8b-2l">${AK.owner("Ray Colston")}${AK.owner("R. Calloway")}</span>`], ["Next review", AK.due("2027-09-02", { prefix: false })]])}
      ${v4}
      <div class="ak-rail-s"><div class="ak-rail-t">What it selects</div><div class="v8b-steps-l">${LAYERS.slice(0, 4).map(([l, n]) => `<div class="v8b-lay"><span>${esc(l.replace(" National Security System Allocation", "").replace("NIST SP 800-53 Rev 5 ", ""))}</span><b class="num">${esc(n.split(" · ").pop())}</b></div>`).join("")}<div class="v8b-lay t"><span>With Customer A and tailoring</span><b class="num">560</b></div></div>${lnk("Open the baseline", go("baseline"))}</div>
      <div class="ak-rail-s"><div class="ak-rail-t">Since approval <span class="v8b-ct num">3</span></div>
        ${li(gl("diamond"), `<b>2 external interfaces</b> added`, "", go("interconnections-no-agreement"))}
        ${li(gl("clock"), "SECRET via SIPRNet reachback changes 6E and 7F", "", go("interconnections"))}
        ${li(gl("ring"), "Block 1.1 in SSP 3 may change §1 and §4", "", go("ssp"))}</div>`;
  }
  const itcTabs = (cur) => [["Checklist", 11, "itcsc", cur === "checklist"], ["Summary", null, "itcsc-summary", cur === "summary"], ["Approval", 2, "itcsc-approval", cur === "approval"], ["History", 3, "itcsc-history", cur === "history"], ["Comments", 3, "itcsc-comments", cur === "comments"], ["Activity", ACT_ITC().length, "itcsc-activity", cur === "activity"]];
  const itcHead = (cur) => AK.recordHead({
    crumbs: [["WS-X90", "overview"], ["ITCSC"]],
    title: "IT categorization and selection checklist",
    chip: pill("ok", "Approved and signed"),
    facts: [["Version", `3 · ${mdy(AO_SIGNED)} ${EX}`], ["Owner", ownerEdit("itcsc", "Joel Barrantes")], ["Categorization", "C High · I High · A Moderate"], ["Proposed IT", "PIT system"], ["NSS", "Yes · 7C, 7D"], ["Next review", AK.due("2027-09-02", { prefix: false })]],
    actions: `${btn("Export as AF ITCSC", tst("Export as AF ITCSC v2.0 · a PDF, filled from version 3"), false, false)}${btn("Import", go("itcsc-import"), false, false)}${btn(ST.v4 ? "Open version 4" : "Start version 4", ST.v4 ? go("itcsc-approval") : 'data-modal="v8b-itc-new"', true, false)}`,
    tabs: itcTabs(cur),
  });
  const itcBanner = () => ST.v4
    ? banner({ tone: "info", text: `<b>Version 4 is a draft</b>${ST.v4 === "imported" ? " from WS-X90_ITCSC_v4.pdf" : ""}: it names the 2 new interfaces. The PM and the AO sign it next.`, action: "Request signatures" }, 'data-modal="ak-approvers" data-id="ITCSC version 4"')
    : banner({ tone: "warn", text: "<b>2 external interfaces added since version 3</b>: re-approval needed. SIPRNet reachback carries SECRET, so 6E and 7F change.", action: "View interconnections" }, go("interconnections-no-agreement"));
  const itcPage = (cur, body, note) => h.page(`<div class="v8b-page">${itcHead(cur)}</div>`, itcBanner(), AK.withRail(body, itcRail()), AK.note(note));
  const NOTE_ITC = "Version 3, its dates and signatures, the ITIPS and eMASS numbers, the mission text, §3, §8, §9, the information types and their levels, the AODR, user representative, requirements lead and organizations are examples. The name, description, categorization, type, lifecycle, roles, emails, boundary narrative and the layers with their counts are WS-X90's.";
  S.itcsc = () => itcPage("checklist", `${ST.v4 ? AK.pendingVersion({ title: "Version 4 · draft", created: ST.v4 === "imported" ? "Applied from WS-X90_ITCSC_v4.pdf today" : "Started from version 3 today", requester: ME, approvers: [{ who: "Ray Colston", state: "waiting" }, { who: "R. Calloway", state: "waiting" }] }).replace('<span class="ak-link">View</span>', lnk("View", go("itcsc-approval"))) : ""}${checklist()}`, NOTE_ITC);

  // The form's summary page, filled in.
  function summary() {
    const box = (title, body, cls = "") => `<div class="v8b-fb${cls ? " " + cls : ""}"><div class="v8b-fbh">${esc(title)}</div>${body}</div>`;
    const kvs = (rows) => `<dl class="v8b-fkv">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
    const sig = (role, who, org, email, when) => `<div class="v8b-sig"><div class="v8b-sigh">${esc(role)}</div>${kvs([["Name", AK.owner(who)], ["Organization", `${esc(org)} ${EX}`], ["Email", email ? esc(email) : mu("Not recorded")], ["Phone (DSN)", mu("Not recorded")]])}<div class="v8b-sigbox">${gl("check")}<span><b>Digitally signed ${mdy(when)}</b><span class="s">DoD PKI certificate verified ${EX}</span></span></div></div>`;
    return `<div class="ak-card v8b-form"><div class="v8b-formh"><b>Summary</b><span class="v8b-mu">AF RMF IT categorization and selection checklist · SAF/CNZ, Dec 3, 2019</span></div>
      ${box("Describe AF IT (1)", kvs([["System name", esc(D.system.name)], ["System acronym", "WS-X90"], ["Version", "Block 1"], ["ITIPS", `31877 ${EX}`], ["DITPR#", "Not applicable"], ["eMASS#", `4417 ${EX}`]]))}
      ${box("Proposed information technology (5)", `<div class="v8b-g4">${[["Information systems", [["Major application", 0], ["Enclave", 0]]], ["Platform IT", [["PIT systems", 1], ["PIT subsystems (assess only)", 0], ["PIT components (assess only)", 0]]], ["IT services (assess only)", [["Internal", 0], ["External", 0]]], ["IT products (assess only)", [["Software", 0], ["Hardware", 0], ["Applications", 0]]]].map(([t, l]) => `<div><b class="v8b-fl">${esc(t)}</b>${checks(l)}</div>`).join("")}</div>`)}
      <div class="v8b-g4 v8b-frow">
        ${box("Overlays (6)", checks([["Security", 0], ["Space platform", 0], ["Cross domain solution", 0], ["Intelligence", 0], ["Classified", 0], ["Privacy", 0], ["Nuclear (NC3)", 0], ["Mission specific: Mission Assurance; Deployed Platform", 1]]))}
        ${box("PIA complete (9A) and privacy (9J)", `${checks([["Yes", 1], ["No", 0]])}<b class="v8b-fl">Privacy (9J)</b>${checks([["Low", 1], ["Moderate", 0], ["High", 0]])}`)}
        ${box("Operational status (4)", checks([["Operational", 0], ["Under development", 1], ["Major modification", 0]]))}
        ${box("Other", checks([["NSS (7)", 1]]))}
      </div>
      ${box("Cloud impact level (8) or final IT categorization (10)", `<div class="v8b-g2 v8b-g2a"><div><b class="v8b-fl">Cloud impact level</b>${checks([["IL2", 0], ["IL4", 0], ["IL5", 0], ["IL6", 0], ["Not applicable", 1]])}</div><div>${tbl({ cols: ["Information types", "C", "I", "A"], rows: INFO.map(([t, c, i, a]) => ({ cells: [esc(t), lv(c), lv(i), lv(a)] })).concat([{ cls: "v8b-tot", cells: ["<b>Final IT categorization</b>", lv("High"), lv("High"), lv("Moderate")] }]), pager: false, label: "Final IT categorization", cls: "v8b-info v8b-wrap", nm: -1 })}<p class="v8b-p"><b>Justification.</b> Mission plans and payload commands set confidentiality and integrity High; availability is Moderate. ${EX}</p></div></div>`)}
      ${box("Approval", `<div class="v8b-g2">${sig("Authorizing official", "R. Calloway", "Weapons AO office", "", AO_SIGNED)}${sig("Program manager / information system owner", "Ray Colston", "Program office", "r.colston@equinox.mil", PM_SIGNED)}</div>`)}
    </div>`;
  }
  S["itcsc-summary"] = () => itcPage("summary", summary(), "The summary page is version 3's, filled from the checklist; the numbers, organizations and signatures are examples. Names, the categorization, PIT, NSS and the layers are WS-X90's.");

  S["itcsc-approval"] = () => {
    const v3 = AK.approval({ title: "Version 3 · approved", sub: `Requested by Joel Barrantes on ${mdy(SUBMITTED)}`, facts: [["Requested by", AK.owner("Joel Barrantes")], ["Completed", mdy(AO_SIGNED)], ["Signatures", "2 of 2"]],
      steps: [{ label: "Step 1 · Program manager / information system owner", approvers: [{ who: "Ray Colston", role: "System owner, signs as PM", state: "approved", when: mdy(PM_SIGNED) }] }, { label: "Step 2 · Authorizing official", approvers: [{ who: "R. Calloway", role: "AO · Weapons", state: "approved", when: mdy(AO_SIGNED) }] }],
      note: "Each signature is a DoD PKI digital signature on the exported form; both match the version they signed." });
    const v4 = AK.approval({ title: ST.v4 ? "Version 4 · draft" : "Version 4 · not started", sub: ST.v4 ? "Signatures start when you request them" : "Start version 4 for the 2 interfaces added since version 3",
      steps: [{ label: "Step 1 · Program manager / information system owner", approvers: [{ who: "Ray Colston", role: "System owner, signs as PM", state: "waiting" }] }, { label: "Step 2 · Authorizing official", approvers: [{ who: "R. Calloway", role: "AO · Weapons", state: "waiting" }] }],
      decision: ST.v4 ? "Request signatures" : "Start version 4" });
    const v4w = v4.replace(`<span class="btn sm ink">${ST.v4 ? "Request signatures" : "Start version 4"}</span>`, ST.v4 ? '<button type="button" class="btn sm ink" data-modal="ak-approvers" data-id="ITCSC version 4">Request signatures</button>' : '<button type="button" class="btn sm ink" data-modal="v8b-itc-new">Start version 4</button>').replace('<span class="btn sm" aria-label="More">', '<span class="btn sm" aria-label="More" role="button" tabindex="0">');
    const certs = AK.card(`${cardH("Signatures on version 3", 2)}${tbl({ cols: ["Signer", "Role", "Signed", "Certificate", "Document"], rows: [["Ray Colston", "Program manager", PM_SIGNED], ["R. Calloway", "Authorizing official", AO_SIGNED]].map(([w, r, d]) => ({ cells: [AK.owner(w), esc(r), mdy(d), `DoD PKI · CAC ${EX}`, pill("ok", "Matches version 3")] })), pager: false, label: "Signatures", nm: -1 })}`);
    return itcPage("approval", `${v4w}${v3}${certs}`, "The approval steps, their dates and the certificates are examples; the signers hold WS-X90's AO and system owner roles.");
  };

  // History: each version, what changed and what it did to the baseline.
  const VERS = [
    { v: 4, st: "Needed", by: "", changes: [["§5 External interfaces", "7", "9"], ["§6E Classified information", "No", "Yes"], ["§7F Classified information", "No", "Yes"]], effect: "Classified Information Overlay to add · not in the overlay library" },
    { v: 3, st: "Approved", on: AO_SIGNED, by: "R. Calloway, Ray Colston", changes: [["§5 External interfaces", "6", "7: depot maintenance enclave"], ["§6F Mission or function specific", "Mission Assurance", "Mission Assurance; Deployed Platform"], ["§1 eMASS#", "Not recorded", "4417"]], effect: "Deployed Platform Overlay: +1 at its place, 550 before Customer A and tailoring" },
    { v: 2, st: "Superseded", on: "2026-06-08", by: "R. Calloway, Ray Colston", changes: [["§10 Availability", "Low", "Moderate"]], effect: "CNSSI 1253 allocates by each objective, so its layer and the baseline changed" },
    { v: 1, st: "Superseded", on: "2026-03-16", by: "R. Calloway, Ray Colston", changes: [["First version", "", "C High · I High · A Low · an NSS (7C, 7D) · Mission Assurance in §6F"]], effect: "High baseline with CNSSI 1253 and the Mission Assurance Overlay" },
  ];
  S["itcsc-history"] = () => itcPage("history", `${AK.card(`${cardH("Versions", VERS.length)}${tbl({ cols: ["Version", "State", "Approved", "What changed", "Baseline"], rows: VERS.map((x) => ({ id: String(x.v), cells: [`<b>Version ${x.v}</b>`, pill(x.st === "Approved" ? "ok" : x.st === "Needed" ? "warn" : "none", x.st === "Approved" ? "Current" : x.st), x.on ? mdy(x.on) : mu("Not signed"), clip(esc(x.changes.map((c) => c[0].replace(/^§\S+ /, "")).join(" · ")), 200, x.changes.map((c) => `${c[0]}: ${c[1]} → ${c[2]}`).join("; ")), clip(esc(x.effect), 170, x.effect)] })), panel: "v8b-itv", pager: false, label: "ITCSC versions", cls: "v8b-dense" })}`)}`, "Versions 1 and 2, their dates and their changes are examples; the effect of each on the baseline follows WS-X90's real layers.");
  P["v8b-itv"] = (id) => {
    LASTP = { kind: "v8b-itv", id };
    const x = VERS.find((v) => String(v.v) === String(id)) || VERS[1];
    const head = AK.recordHead({ title: `ITCSC version ${x.v}`, chip: pill(x.st === "Approved" ? "ok" : x.st === "Needed" ? "warn" : "none", x.st), actions: x.v === 4 ? btn(ST.v4 ? "Open version 4" : "Start version 4", ST.v4 ? go("itcsc-approval") : 'data-modal="v8b-itc-new"', true) : btn("Export as AF ITCSC", tst(`Export of version ${x.v} as AF ITCSC v2.0`)) });
    const facts = AK.facts([["Approved", x.on ? mdy(x.on) : mu("Not signed")], ["Signed by", x.by ? esc(x.by) : mu("Nobody yet")], ["Form", "AF ITCSC v2.0"]]);
    const ch = AK.section("What changed", x.changes.map(([f, a, b]) => li("", `<b>${esc(f)}</b>`, a ? AK.change(a, b) : esc(b))).join(""), { count: x.changes.length });
    const ef = AK.section("Baseline", `<p class="v8b-p">${esc(x.effect)}.</p>${lnk("Open the baseline", go("baseline"))}`);
    return { label: "Version preview", body: pan(`${head}${facts}${ch}${ef}${AK.note(x.v === 3 || x.v === 4 ? "Dates and signers are examples." : "This version is an example.")}`) };
  };
  const ITC_COMMENTS = [
    { who: "Joel Barrantes", role: "ISSM", when: "Oct 28", text: "SIPRNet reachback makes 7F yes, and 6E with it. We need version 4 signed before the ISA goes to DISA." },
    { who: "Priya Raghavan", role: "ISSO", when: "Oct 29", text: "The ground support telemetry exchange is new since version 3 too. Its interim approval ends Dec 15." },
    { who: ME, role: "Security engineer", when: "Nov 16", text: `${AK.mention("Joel Barrantes")} I can draft version 4's section 5 from the interconnection register.` },
  ];
  S["itcsc-comments"] = () => itcPage("comments", AK.card(`${cardH("Comments", ITC_COMMENTS.length, EX)}${AK.comments({ items: ITC_COMMENTS, you: ME })}`), "The comments are invented.");
  function ACT_ITC() {
    return [
      ...(ST.v4 ? [{ who: ME, what: ST.v4 === "imported" ? "applied WS-X90_ITCSC_v4.pdf as version 4, a draft" : "started version 4 from version 3", when: "Today" }] : []),
      { who: null, what: `flagged re-approval: <b>2 external interfaces</b> added since version 3`, when: "Oct 27" },
      { who: "Joel Barrantes", what: `added SIPRNet reachback to ${lnk("Interconnections", go("interconnections"))}`, when: "Oct 27" },
      { who: "Priya Raghavan", what: `added Ground support telemetry to ${lnk("Interconnections", go("interconnections"))}`, when: "Oct 6" },
      { who: "R. Calloway", what: "signed version 3 as authorizing official", when: md(AO_SIGNED) },
      { who: "Ray Colston", what: "signed version 3 as program manager", when: md(PM_SIGNED) },
      { who: "Joel Barrantes", what: "requested signatures on version 3", when: md(SUBMITTED) },
      { who: "Joel Barrantes", what: `imported WS-X90_ITCSC_v3.pdf · the ITCSC reader read 39 of 41 fields`, when: "Aug 26" },
    ];
  }
  S["itcsc-activity"] = () => itcPage("activity", AK.card(`${cardH("Activity", ACT_ITC().length)}${AK.activity(ACT_ITC())}`), "The activity is invented, except what the interconnection register holds.");
  M["v8b-itc-new"] = () => ({ title: "Start version 4", body: `<p class="ak-desc">Version 3 stays approved until version 4 is signed. Start from a copy of version 3 or read a completed form.</p>
      <div class="v8b-radios" role="radiogroup" aria-label="Start from"><span class="v8b-radio on" role="radio" aria-checked="true">${AK.check(true)}<span><b>Copy version 3 and edit</b><span class="s">37 answers carry over; section 5 adds the 2 interfaces from the register</span></span></span>
      <span class="v8b-radio" role="radio" aria-checked="false" ${go("itcsc-import")}>${AK.check(false)}<span><b>Import a completed ITCSC</b><span class="s">PDF or Word, read by the ITCSC reader</span></span></span></div>
      ${field("What changes", `<ul class="v8b-ul"><li>§5 External interfaces: 7 → 9</li><li>§6E and §7F: SIPRNet reachback carries SECRET</li></ul>`)}`,
    footer: foot("Start version 4", 'data-v8b-v4="started"') });

  // ═════════════ The ITCSC import ═════════════
  const PNI = PA.pnITCSC || { file: "CustomerD_X800-EL_ITCSC.pdf", name: "X800 Missile · Eject Launch · Customer D", acronym: "X800-EL-CUSD", signed: [["Sarah Chen", "", "2026-11-06"], ["R. Calloway", "", "2026-11-12"]], interfaces: [] };
  const FILES = {
    wsx90: { file: "WS-X90_ITCSC_v4.pdf", by: "Joel Barrantes", size: "1.4 MB", when: "Today 9:12", secs: 14, sys: "WS-X90 Sentinel Mission System" },
    custd: { file: PNI.file, by: "Sarah Chen", size: "1.2 MB", when: "Today 9:20", secs: 12, sys: PNI.name },
  };
  // The form's 41 fields as the reader returns them: [section, field, read from WS-X90's file, confidence, WS-X90 records, its state, lands in,
  // read from Customer D's file, confidence, where it fills the new program]. State: same, conflict, new, unread.
  const W = "Program details", SY = "System record", BL = "Baseline layers", RO = "Program roles", CO = "Composition notes", IR = "ITCSC record";
  const FLD = [
    ["1", "System name", "WS-X90 Sentinel Mission System", 99, "WS-X90 Sentinel Mission System", "same", W, PNI.name, 99, "Program: name"],
    ["1", "System acronym", "WS-X90", 99, "WS-X90", "same", W, PNI.acronym, 99, "Systems: code"],
    ["1", "Version", "Block 1.1", 97, "Block 1 (version 3)", "conflict", W, "Block 1", 97, IR],
    ["1", "ITIPS", "", 0, "31877 (version 3)", "unread", IR, "", 0, IR, "Blank on the form"],
    ["1", "DITPR#", "", 0, "Not applicable (version 3)", "unread", IR, "", 0, IR, "Blank on the form"],
    ["1", "eMASS#", "4417", 98, "4417 (version 3)", "same", W, "4502", 98, IR],
    ["2", "Technical description", "WS-X90 Sentinel carries a payload, navigates on its own timing source and reports over a tactical data link. Block 1.1 adds reachback over SIPRNet.", 92, D.system.description, "conflict", W, "Fields X800 Missile's Eject Launch configuration on Customer D's launcher, with the ground equipment that loads and tests it.", 93, "Program: mission"],
    ["3", "AO boundary", "Weapons", 99, "Weapons (version 3)", "same", IR, "Weapons", 99, IR],
    ["4", "Operational status", "Major modification", 96, "Planned (system record lifecycle)", "conflict", SY, "Under development", 96, IR],
    ["5", "Proposed IT", "PIT system", 99, "Platform (system record type)", "same", SY, "PIT system", 99, "Systems: type"],
    ["5", "Boundary narrative", "Names 10 external interfaces: removable media, RF, Ethernet and a VPN over DISN. No Wi-Fi.", 91, "SSP 3 §5 names the identity provider only", "new", CO, `Names ${PNI.interfaces.length || 4} external interfaces: Ethernet, removable media, RF and a maintenance port.`, 92, "Systems: draft interconnections"],
    ["6", "6A Intelligence (ISR)", "No", 99, "No such layer", "same", BL, "No", 99, IR],
    ["6", "6B Cross domain solution", "No", 99, "No such layer", "same", BL, "No", 99, IR],
    ["6", "6C NC3", "No", 99, "No such layer", "same", BL, "No", 99, IR],
    ["6", "6D Space platform", "No", 99, "No such layer", "same", BL, "No", 99, IR],
    ["6", "6E Classified information", "Yes", 98, "No Classified Information Overlay in the baseline", "conflict", BL, "No", 98, IR],
    ["6", "6F Mission or function specific", "Yes: Mission Assurance; Deployed Platform", 95, "Mission Assurance and Deployed Platform layers", "same", BL, "Yes: Deployed Platform", 95, "Baseline: overlay"],
    ["7", "7A Intelligence activities", "No", 99, "No (version 3)", "same", IR, "No", 99, IR],
    ["7", "7B Cryptologic activities", "No", 99, "No (version 3)", "same", IR, "No", 99, IR],
    ["7", "7C Command and control", "Yes", 99, "Yes (version 3)", "same", IR, "Yes", 99, "Baseline: CNSSI 1253"],
    ["7", "7D Integral to a weapons system", "Yes", 99, "Yes (version 3)", "same", IR, "Yes", 99, "Baseline: CNSSI 1253"],
    ["7", "7E Critical to military missions", "No", 99, "No (version 3)", "same", IR, "No", 99, IR],
    ["7", "7F Classified information", "Yes", 98, "No (version 3)", "conflict", IR, "No", 98, IR],
    ["8", "8A Cloud hosted", "No", 99, "No (version 3)", "same", IR, "No", 99, IR],
    ["9", "9A Collects PII", "Yes", 97, "Yes (version 3)", "same", IR, "Yes", 97, IR],
    ["9", "9C PII beyond rolodex", "No", 97, "No Privacy layer in the baseline", "same", BL, "No", 97, IR],
    ["9", "9E PII types", "Name, business e-mail, position, rank", 93, "The same (version 3)", "same", IR, "Name, business e-mail", 92, IR],
    ["9", "9G Examples of harm", "A maintainer roster could help target people", 88, "The same (version 3)", "same", IR, "", 0, IR, "Handwritten, not legible"],
    ["9", "9H PII confidentiality impact", "Low", 98, "Low (version 3)", "same", IR, "Low", 98, IR],
    ["10", "Information types", "6 types, each rated C, I and A", 94, "6 types (version 3)", "same", SY, "4 types, each rated C, I and A", 94, "Systems: information types"],
    ["10", "Final categorization", "High · High · Moderate", 99, "High · High · Moderate (system record)", "same", SY, "High · High · Moderate", 99, "Systems: levels"],
    ["10", "Justification", "Mission plans and payload commands set C and I High; losing the data link degrades the mission, so A is Moderate.", 90, "No rationale recorded", "new", SY, "Fire control data and key material set C and I High; the launcher holds a ready spare, so A is Moderate.", 91, "Systems: rationale"],
    ["11", "Authorizing official", "R. Calloway", 99, "R. Calloway (program roles)", "same", RO, "R. Calloway", 99, "Team: AO"],
    ["11", "AODR", "", 0, "Lena Marsh (version 3)", "unread", IR, "M. Okonkwo", 90, IR, "The name is struck through and rewritten"],
    ["11", "Program manager", "Ray Colston", 99, "Ray Colston (system owner)", "same", RO, PNI.signed[0][0], 99, "Systems: owner"],
    ["11", "SCA", "D. Okafor", 99, "D. Okafor (lead assessor)", "same", RO, "D. Okafor", 99, "Team: lead assessor"],
    ["11", "ISSM", "Joel Barrantes", 99, "Joel Barrantes (program roles)", "same", RO, "Joel Barrantes", 99, "Team: ISSM"],
    ["11", "Director of engineering / ISSE", ME, 98, `${ME} (security engineer)`, "same", IR, "Amara Bell", 98, IR],
    ["11", "User representative", "", 0, "Capt. T. Abara (version 3)", "unread", IR, "", 0, IR, "Blank on the form"],
    ["11", "Requirements lead", "Sam Ortega", 96, "Not a program role", "new", IR, "Sam Ortega", 96, IR],
    ["11", "Primary POC", "Priya Raghavan", 99, "Priya Raghavan (ISSO)", "same", RO, "Nadia Fournier", 99, "Team: ISSO"],
  ];
  const SECT = { 1: "System identification", 2: "Technical description and purpose", 3: "Authorizing official", 4: "Operational status", 5: "Proposed IT and boundary", 6: "Overlays", 7: "National security system", 8: "Cloud", 9: "Privacy", 10: "Categorization", 11: "The RMF team" };
  const PAGE = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 5, 11: 6 };
  const DEST = { [W]: "overview", [SY]: "composition", [BL]: "baseline", [RO]: "people-roles", [CO]: "composition", [IR]: "itcsc" };
  // One field as the current file reads it.
  const fld = (i, file = ST.file) => {
    const r = FLD[i], ws = file === "wsx90";
    const v = ws ? r[2] : r[7], c = ws ? r[3] : r[8];
    const state = ws ? r[5] : !v ? "unread" : r[9] === IR ? "record" : "fills";
    return { i, sec: r[0], label: r[1], v, conf: c, rec: r[4], state, dest: ws ? r[6] : r[9], why: r[10] || "Not read" };
  };
  const ROWS = () => FLD.map((_, i) => fld(i));
  const STATE = { same: ["ok", "Same"], conflict: ["warn", "Conflict"], new: ["info", "New"], unread: ["none", "Not read"], fills: ["info", "Fills the walkthrough"], record: ["none", "ITCSC record"] };
  const confBar = (c) => (c ? `<span class="v8b-conf${c < 90 ? " lo" : ""}"><i style="width:${c}%"></i></span><span class="num">${c}%</span>` : mu("—"));
  const use = (f) => CHOICE[f.i] || "itcsc";
  const useSeg = (f) => `<span class="v8b-useg" role="group" aria-label="Which value to keep">${[["itcsc", "ITCSC"], ["keep", "WS-X90's"]].map(([k, l]) => `<button type="button" class="v8b-ub${use(f) === k ? " on" : ""}" aria-pressed="${use(f) === k}" data-v8b-use="${f.i}|${k}">${l}</button>`).join("")}</span>`;
  const destLink = (d) => (DEST[d] ? lnk(d, vgo(DEST[d])) : `<span class="v8b-step">${esc(d)}</span>`);
  const counts = (file = ST.file) => { const c = {}; FLD.forEach((_, i) => { const s = fld(i, file).state; c[s] = (c[s] || 0) + 1; }); return c; };
  // The 10 interfaces WS-X90's file names: the 9 in the register, and one it doesn't hold.
  const NEW_IF = { name: "Flight test range telemetry", type: "RF", flows: "Block 1.1 flight test telemetry out" };

  S["itcsc-import"] = () => {
    const c = counts("wsx90");
    const up = `<div class="ak-card v8b-up" id="v8b-up"><button type="button" class="v8b-drop" data-v8b-read="wsx90">${AK.i("upload")}<b>Drop a completed AF ITCSC here</b><span class="s">PDF or Word · AF ITCSC v2.0 · up to 25 MB</span><span class="btn sm">Choose a file</span></button>
      <div class="v8b-subh"><b>Or read a sample</b>${EX}</div>
      ${li(AK.i("upload"), `<b>${esc(FILES.wsx90.file)}</b> ${mu("WS-X90's version 4, filled offline by Joel Barrantes")}`, btn("Read", 'data-v8b-read="wsx90"'))}
      ${li(AK.i("upload"), `<b>${esc(FILES.custd.file)}</b> ${mu("a new system's signed ITCSC")}`, btn("Read", 'data-v8b-read="custd"'))}</div>`;
    const waiting = AK.section("Waiting for review", tbl({ cols: ["File", "Read", "Fields read", "Conflicts", ""], rows: [{ id: "wsx90", go: "itcsc-import-review", cells: [`<b>${esc(FILES.wsx90.file)}</b>`, `${esc(FILES.wsx90.when)} · ITCSC reader`, `<span class="num">${41 - (c.unread || 0)} of 41</span>`, `<span class="num">${c.conflict || 0}</span>`, lnk("Review", go("itcsc-import-review"))] }], pager: false, label: "Waiting for review" }), { count: 1 });
    const earlier = AK.section("Earlier imports", tbl({ cols: ["File", "Read", "Applied by", "Became"], rows: [["WS-X90_ITCSC_v3.pdf", "Aug 26", "Joel Barrantes", "Version 3"], ["WS-X90_ITCSC_v2.docx", "Jun 2", "Joel Barrantes", "Version 2"]].map(([f, d, b, v]) => ({ go: "itcsc-history", cells: [esc(f), esc(d), AK.owner(b), esc(v)] })), pager: false, label: "Earlier imports" }), { count: 2 });
    const rail = `${AK.railCard("ITCSC reader", [["Kind", "AI agent"], ["Reads", "11 sections and the summary"], ["Returns", "Each value with its confidence"], ["Writes", "Nothing until a person applies it"]])}
      <div class="ak-rail-s"><div class="ak-rail-t">Where answers land</div>${[["Program details", "overview"], ["Categorization", "composition"], ["Overlays → baseline layers", "baseline"], ["Team → program roles", "people-roles"], ["Boundary narrative → composition notes", "composition"], ["Each interface → a draft interconnection", "interconnections"]].map(([t, r]) => li(gl("info"), esc(t), "", go(r))).join("")}${lnk("Open in AI agents", go("ai-drafts"))}</div>`;
    return h.page(`<div class="v8b-page">${AK.recordHead({ crumbs: [["WS-X90", "overview"], ["ITCSC", "itcsc"], ["Import"]], title: "Import a completed ITCSC", desc: "A filled AF ITCSC, PDF or Word. The ITCSC reader reads it; you review every field before anything changes.", actions: btn("Open the ITCSC", go("itcsc"), false, false) })}</div>`,
      `<div class="v8b-steps">${AK.steps(["Upload", "Read", "Review", "Apply"], 0)}</div>`, AK.withRail(`${up}${waiting}${earlier}`, rail),
      AK.note("Both sample files, what they hold and the earlier imports are examples; where each answer lands is the app's."));
  };
  function readFile(file) {
    ST.file = file; ST.qv = "all";
    const box = document.getElementById("v8b-up");
    const done = () => { location.hash = "itcsc-import-review"; };
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!box || reduced) { done(); return; }
    const STEPS = ["§1 System identification", "§2 Technical description", "§5 Proposed IT and the boundary", "§6 Overlays", "§7 National security system", "§9 Privacy", "§10 Categorization", "§11 The RMF team", "Summary and signatures"];
    box.innerHTML = `<div class="v8b-reading" role="status" aria-live="polite"><div class="v8b-agent">${AK.i("sparkle")}<b>ITCSC reader</b>${mu("is reading " + FILES[file].file)}</div><div class="v8b-bar"><i id="v8b-rbar" style="width:4%"></i></div><p class="v8b-p" id="v8b-rtxt">Page 1 of 7 · §1 System identification · 0 of 41 fields</p></div>`;
    let k = 0;
    const tick = () => {
      k++;
      const bar = document.getElementById("v8b-rbar"), txt = document.getElementById("v8b-rtxt");
      if (!bar || !txt) return;
      const p = Math.min(100, Math.round((k / STEPS.length) * 100)), n = Math.min(37, Math.round((k / STEPS.length) * 37));
      bar.style.width = p + "%";
      txt.textContent = `Page ${Math.min(7, Math.ceil(k * 7 / STEPS.length))} of 7 · ${STEPS[Math.min(k, STEPS.length - 1)]} · ${n} of 41 fields`;
      if (k < STEPS.length) setTimeout(tick, 170); else setTimeout(done, 260);
    };
    setTimeout(tick, 170);
  }

  S["itcsc-import-review"] = () => {
    const F = FILES[ST.file], ws = ST.file === "wsx90", c = counts();
    const read = 41 - (c.unread || 0);
    const QV = ws ? [["all", "All", 41], ["conflict", "Conflicts", c.conflict || 0], ["unread", "Not read", c.unread || 0], ["new", "New", c.new || 0], ["same", "Same", c.same || 0]]
      : [["all", "All", 41], ["fills", "Fills the walkthrough", c.fills || 0], ["record", "ITCSC record", c.record || 0], ["unread", "Not read", c.unread || 0]];
    if (!QV.some((x) => x[0] === ST.qv)) ST.qv = "all";
    const reason = ws ? "This ITCSC names WS-X90 itself: apply it to WS-X90 instead." : `This ITCSC names another system, ${F.sys}: create a program from it.`;
    const actions = ws
      ? `${btn("Create a program from this ITCSC", `aria-disabled="true" title="${esc(reason)}" ${tst(reason)}`, false, false)}${btn("Apply to WS-X90", 'data-modal="v8b-apply"', true, false)}`
      : `${btn("Apply to WS-X90", `aria-disabled="true" title="${esc(reason)}" ${tst(reason)}`, false, false)}${btn("Create a program from this ITCSC", 'data-v8b-create="1"', true, false)}`;
    const head = AK.recordHead({ crumbs: [["WS-X90", "overview"], ["ITCSC", "itcsc"], ["Import", "itcsc-import"], [F.file]], title: F.file, chip: AK.chip("Read by the ITCSC reader", { tone: "info", icon: "sparkle" }),
      facts: [["Fields read", `<span class="num">${read} of 41</span>`], ws ? ["Conflicts", `<span class="num">${c.conflict || 0}</span>`] : ["Fills the walkthrough", `<span class="num">${c.fills || 0}</span>`], ["System", esc(F.sys)], ["Signatures", ws ? mu("None yet") : "PM and AO"], ["Read", `${esc(F.when)} · ${F.secs} s`], ["Uploaded by", AK.owner(F.by)]],
      actions });
    const seg = `<div class="v8b-seg" role="group" aria-label="File">${Object.entries(FILES).map(([k, x]) => `<button type="button" class="v8b-segb${k === ST.file ? " on" : ""}" aria-pressed="${k === ST.file}" data-v8b-file="${k}">${esc(x.file)}</button>`).join("")}</div>`;
    const bnr = ws ? banner({ tone: "warn", text: `<b>${c.conflict} conflicts</b> with what WS-X90 records and <b>${c.unread} fields</b> not read. Nothing changes until you apply.`, action: "Show conflicts" }, 'data-v8b-qv="conflict"')
      : banner({ tone: "info", text: `<b>A new system:</b> ${esc(F.sys)}. ${c.fills} answers fill the walkthrough; ${c.record} stay on the new program's ITCSC record.`, action: "Create a program from this ITCSC" }, 'data-v8b-create="1"');
    const views = `<div class="views v8b-views" role="group" aria-label="Quick views">${QV.map(([k, l, n]) => `<button type="button" class="qv${ST.qv === k ? " on" : ""}" aria-pressed="${ST.qv === k}" data-v8b-qv="${k}">${esc(l)} <span class="num">${n}</span></button>`).join("")}</div>`;
    const list = ROWS().filter((f) => ST.qv === "all" || f.state === ST.qv);
    const rows = [];
    let last = "";
    list.forEach((f) => {
      if (f.sec !== last) { last = f.sec; rows.push({ group: `§${f.sec} ${esc(SECT[f.sec])} ${mu("· page " + PAGE[f.sec])}` }); }
      const val = f.v ? clip(esc(f.v), ws ? 200 : 300, f.v) : none(f.why);
      const st = pill(STATE[f.state][0], STATE[f.state][1]);
      rows.push({ id: `${ST.file}|${f.i}`, cls: f.state === "conflict" ? "v8b-hl" : "", cells: ws
        ? [`<b>${esc(f.label)}</b>`, val, confBar(f.conf), clip(esc(f.rec), 165, f.rec), destLink(f.dest), f.state === "conflict" ? useSeg(f) : st]
        : [`<b>${esc(f.label)}</b>`, val, confBar(f.conf), destLink(f.dest), st] });
    });
    const table = tbl({ cols: ws ? ["Field", "Read", "Confidence", "WS-X90 records", "Lands in", "Use"] : ["Field", "Read", "Confidence", "Lands in", "State"], rows, panel: "v8b-fld", total: list.length, label: "Fields read", pager: false, cls: "v8b-dense" });
    const IFS = ws ? IC.map((x) => ({ go: null, panel: "v8b-ic", id: x.id, cells: [`<b>${esc(x.name)}</b>`, esc(x.type), esc(x.flows), `${pill("ok", "Linked")} ${mu(x.id)}`] })).concat([{ panel: "", cells: [`<b>${esc(NEW_IF.name)}</b>`, esc(NEW_IF.type), esc(NEW_IF.flows), pill("info", "New draft interconnection")] }])
      : (PNI.interfaces.length ? PNI.interfaces : [["Launcher umbilical", "Ethernet", ""]]).map(([n, t, fl]) => ({ panel: "", cells: [`<b>${esc(n)}</b>`, esc(t), esc(fl), pill("info", "Draft interconnection in the new program")] }));
    const ifSec = AK.section("External interfaces named in §5", tbl({ cols: ["Interface", "Type", "Data", ws ? "In WS-X90's register" : "Lands as"], rows: IFS, pager: false, label: "External interfaces" }), { count: IFS.length });
    const takes = (d) => ROWS().filter((f) => f.dest === d && ((f.state === "conflict" && use(f) === "itcsc") || f.state === "new")).length;
    const lands = ws
      ? [[W, takes(W)], [SY, takes(SY)], [BL, takes(BL)], [RO, takes(RO)], [CO, takes(CO)], ["Interconnections", "9 linked · 1 draft"], [IR, "Version 4, a draft"]]
      : [["Program step", 2], ["Systems step", 7], ["Baseline step", 3], ["Team step", 4], ["ITCSC record", c.record || 0], ["Draft interconnections", PNI.interfaces.length || 4]];
    const rail = `<div class="ak-rail-s"><div class="ak-rail-t">${ws ? "What applying changes" : "What the new program takes"}</div><dl class="ak-kv">${lands.map(([k, v]) => `<dt>${esc(k)}</dt><dd class="num">${typeof v === "number" ? (v ? plural(v, "field") : mu("No change")) : esc(v)}</dd>`).join("")}</dl>${ws ? `<p class="v8b-p v8b-mu">6E needs the Classified Information Overlay, which the overlay library doesn't hold yet.</p>` : ""}</div>
      ${AK.railCard("The read", [["Agent", `${AK.i("sparkle")} ITCSC reader`], ["Pages", "7 of 7"], ["Took", `${F.secs} s`], ["Form", "AF ITCSC v2.0 · 20191203"]])}`;
    return h.page(`<div class="v8b-page">${head}</div>`, `<div class="v8b-steps">${AK.steps(["Upload", "Read", "Review", "Apply"], 2)}${seg}</div>`, bnr,
      `${views}${table}${ifSec}<div class="v8b-g2 v8b-below">${rail}</div>`,
      AK.note("Both files, the values read, the confidences, the flight test interface and the Customer D answers are examples; WS-X90's recorded values are its own."));
  };
  P["v8b-fld"] = (id) => {
    LASTP = { kind: "v8b-fld", id };
    const [file, i] = String(id).split("|"), f = fld(+i || 0, file === "custd" ? "custd" : "wsx90"), ws = file !== "custd";
    const head = AK.recordHead({ title: f.label, chip: pill(STATE[f.state][0], STATE[f.state][1]) });
    const facts = AK.facts([["Section", `§${f.sec} ${esc(SECT[f.sec])}`], ["Page", num(PAGE[f.sec])], ["Confidence", f.conf ? `${f.conf}%` : mu("Not read")], ["Lands in", destLink(f.dest)]]);
    const readS = AK.section("Read from the file", f.v ? `<div class="v8b-snip"><span class="k">${esc(FILES[ws ? "wsx90" : "custd"].file)} · page ${PAGE[f.sec]}</span><p>${esc(f.v)}</p></div>` : `${none(f.why)}${field("Type the value", inp("What the form says"))}${btn("Save value", `${tst(`Saved ${f.label}`)}`)}`);
    const recS = ws ? AK.section("WS-X90 records", `<p class="v8b-p">${esc(f.rec)}</p>`) : "";
    const decide = ws && f.state === "conflict" ? AK.section("Which value to keep", `<div class="v8b-radios">${[["itcsc", "Use the ITCSC's value", f.v], ["keep", "Keep WS-X90's", f.rec]].map(([k, t, v]) => `<button type="button" class="v8b-radio${use(f) === k ? " on" : ""}" role="radio" aria-checked="${use(f) === k}" data-v8b-use="${f.i}|${k}">${AK.check(use(f) === k)}<span><b>${esc(t)}</b><span class="s">${esc(v)}</span></span></button>`).join("")}</div>${f.label.startsWith("6E") ? `<p class="v8b-p v8b-mu">Using it records 6E as yes; the baseline changes only once the Classified Information Overlay exists and is added with Edit overlays.</p>` : ""}`) : "";
    return { label: "Field preview", body: pan(`${head}${facts}${readS}${recS}${decide}`) };
  };
  M["v8b-apply"] = () => {
    const conf = FLD.map((_, i) => fld(i)).filter((f) => f.state === "conflict"), kept = conf.filter((f) => use(f) === "keep").length;
    return { title: "Apply to WS-X90", body: `<p class="ak-desc">Nothing is final until the PM and the AO sign version 4.</p>
      <dl class="ak-kv v8b-akv"><dt>ITCSC record</dt><dd>Version 4, a draft: 37 answers, ${41 - 37} left to fill</dd>
      <dt>Program details</dt><dd>${conf.filter((f) => f.dest === W && use(f) === "itcsc").map((f) => esc(f.label)).join(" · ") || mu("No change")}</dd>
      <dt>System record</dt><dd>${conf.some((f) => f.dest === SY && use(f) === "itcsc") ? "Lifecycle · " : ""}categorization rationale</dd>
      <dt>Baseline layers</dt><dd>${conf.some((f) => f.label.startsWith("6E") && use(f) === "itcsc") ? "Classified Information Overlay needed: create it first" : mu("No change")}</dd>
      <dt>Composition notes</dt><dd>The boundary narrative</dd><dt>Interconnections</dt><dd>9 linked · ${esc(NEW_IF.name)} as a draft</dd><dt>Program roles</dt><dd>${mu("No change")}</dd></dl>
      <p class="v8b-p">${plural(conf.length - kept, "conflict")} take the ITCSC's value${kept ? `; ${plural(kept, "keeps", "keep")} WS-X90's` : ""}.</p>`,
      footer: foot("Apply to WS-X90", 'data-v8b-apply="1"') };
  };

  // ═════════════ Interconnections (CA-3) ═════════════
  const IC_T = [["All", "all", "interconnections"], ["Expiring in 90 days", "expiring", "interconnections-expiring"], ["No agreement", "no-agreement", "interconnections-no-agreement"], ["Expired", "expired", "interconnections-expired"]];
  function icPage(tab) {
    const list = IC.filter(icIn[tab]), ids = list.map((x) => x.id);
    const head = AK.indexHead({ title: "Interconnections", desc: `${plural(IC.length, "connection")} cross WS-X90's boundary · CA-3 ${stPill("CA-3")} · ${lnk("2 added since ITCSC version 3", go("interconnections-no-agreement"))}`,
      actions: `${btn("Export", tst("Exported 9 interconnections as CSV"), false, false)}${btn(`${AK.i("plus")}Add interconnection`, 'data-modal="v8b-ic-new"', true, false)}` });
    const tabs = AK.tabs(IC_T.map(([l, k, r]) => [l, IC.filter(icIn[k]).length, r, k === tab]), "Interconnections");
    const tools = SEL.size ? `<div class="tools v8b-tools"><span class="in">Search interconnections</span>${bulk()}</div>` : filters("Search interconnections", ["Type", "Agreement", "Boundary element", "Owner"]);
    const rows = list.map((x) => ({ id: x.id, cls: SEL.has(x.id) ? "sel" : "", cells: [cb(x.id, `Select ${x.name}`), clip(`<b>${esc(x.name)}</b>`, 155, x.since ? `${x.name} · added after ITCSC version 3` : x.name), clip(esc(x.to), 125, `${x.to} · ${x.org} · AO ${x.ao}`), esc(x.type), `${clsTag(x.cls)} ${mu(x.dir)}`, esc(x.enc), agrPill(x.agr), expTbl(x.agr), face(ownerOf("ic:" + x.id, x.owner))] }));
    const table = tbl({ cols: [cbAll(ids), "Connection", `Connects to ${EX}`, "Type", "Data", "Encryption", "Agreement", "Expires", "Owner"], rows, panel: "v8b-ic", label: "Interconnections", nm: 1, cls: "v8b-dense" });
    return h.page(head, tabs, tools, table, AK.note("Connected systems, organizations, AOs, agreements and dates are examples, except what WS-X90's SSP says: CA-3's signed tactical data link agreement and its draft telemetry agreement, the gateway's two external ports, and the inherited identity service."));
  }
  IC_T.forEach(([, k, r]) => { S[r] = () => icPage(k); });
  P["v8b-ic"] = (id) => {
    LASTP = { kind: "v8b-ic", id };
    const x = ICBY[id] || IC[0], a = x.agr, own = ownerOf("ic:" + x.id, x.owner);
    const days = a.exp ? AK.days(a.exp) : null, expiring = a.st === "Signed" && days <= 90;
    const primary = a.st === "Draft" ? (x.appr[0] === "sent" ? btn("Remind approvers", tst(`Reminder sent to R. Calloway about ${a.ref}`), true) : btn("Send for signature", `data-modal="v8b-renew" data-id="${x.id}"`, true))
      : a.st === "Expired" ? btn("Renew agreement", `data-modal="v8b-renew" data-id="${x.id}"`, true)
      : expiring ? (x.appr[0] === "sent" ? btn("Remind approvers", tst(`Reminder sent to R. Calloway about ${a.ref}`), true) : btn("Request renewal", `data-modal="v8b-renew" data-id="${x.id}"`, true))
      : btn("Edit", tst("Edit interconnection opens its form (prototype)"));
    const head = AK.recordHead({ title: x.name, chip: agrPill(a), actions: primary });
    const facts = AK.facts([["Owner", ownerEdit("ic:" + x.id, x.owner)], ["Expires", expCell(a)], ["Type", esc(x.type)], ["Data", `${clsTag(x.cls)} ${esc(x.dir)}`]]);
    const parts = [];
    if (x.since) parts.push(banner({ tone: "warn", text: `Added ${md(x.added)}, after ITCSC version 3: the ITCSC needs re-approval.`, action: "Open the ITCSC" }, go("itcsc")));
    parts.push(AK.section("Crosses the boundary at", x.els.map((c, i) => li(code(EL[c] && EL[c].lru ? EL[c].lru : c), `<b>${esc(elName(c))}</b> ${mu(i ? "where it terminates" : EL[EL[c] && EL[c].parent] ? EL[EL[c].parent].name : "")}`, "", go("composition"))).join("") + lnk("Open in Composition", go("composition")), { count: x.els.length }));
    parts.push(AK.section("Connected system", `<dl class="ak-kv"><dt>System</dt><dd>${esc(x.to)}</dd><dt>Organization</dt><dd>${esc(x.org)} ${x.real ? "" : EX}</dd><dt>Its AO</dt><dd>${esc(x.ao)}</dd><dt>Data</dt><dd>${esc(x.flows)}</dd><dt>Encryption</dt><dd>${esc(x.enc)} · ${mu(x.encBy)}</dd></dl>`));
    const ps = PPS.filter((p) => p.ic === x.id);
    parts.push(AK.section("Ports and protocols", ps.length ? ps.map((p) => li(code(p.port), `${esc(p.proto)} · ${esc(p.svc)}`, pill(CAL[p.cal], p.cal), `data-panel="v8b-pps" data-id="${p.id}" role="button" tabindex="0"`)).join("") + lnk("Open in Ports & protocols", go("ppsm")) : `${none(x.type === "Removable media" ? "None: removable media carries no network service" : "None recorded")}`, { count: ps.length }));
    const doc = a.st === "Not required" ? `${li(gl("info"), esc(a.why), "")}<p class="v8b-p v8b-mu">Recorded as not required by ${esc(a.by)} on ${mdy(a.on)}.</p>`
      : `${li(AK.i("link"), `<b>${esc(a.ref)}</b> · ${a.st === "Draft" ? "draft, Word" : "signed PDF"}`, lnk("Open evidence", go("evidence")))}<dl class="ak-kv"><dt>Kind</dt><dd>${a.kind === "ISA" ? "Interconnection security agreement" : a.kind === "MOA" ? "Memorandum of agreement" : "Memorandum of understanding"}</dd>${a.signed ? `<dt>Signed</dt><dd>${mdy(a.signed)}</dd>` : ""}${a.exp ? `<dt>Expires</dt><dd>${exp(a.exp)}</dd>` : ""}${a.interim ? `<dt>Interim approval</dt><dd>${exp(a.interim, "To ")} · R. Calloway</dd>` : ""}</dl>`;
    const st0 = x.appr ? x.appr[0] : "waiting", when0 = x.appr && x.appr[1] ? mdy(x.appr[1]) : "";
    const appr = a.st === "Not required" ? "" : AK.approval({ title: a.st === "Draft" ? "Signature by both AOs" : a.st === "Signed" && !expiring ? "Signed by both AOs" : "Renewal by both AOs",
      sub: a.st === "Signed" && !expiring ? `Renewal opens 90 days before ${md(a.exp)}` : a.st === "Expired" ? `Expired ${md(a.exp)}: renew it, or stop the exchange` : x.id === "IC-105" ? "Waits on ITCSC version 4" : "",
      steps: [{ label: "WS-X90's AO", approvers: [{ who: "R. Calloway", role: "AO · Weapons", state: st0 === "approved" ? "approved" : st0 === "sent" ? "sent" : "waiting", when: st0 === "approved" ? when0 : when0 }] }, { label: "The connected system's AO", approvers: [{ who: x.ao, role: x.org, state: st0 === "approved" ? "approved" : "waiting", when: st0 === "approved" ? when0 : "" }] }] });
    const remind = x.remind ? AK.remind({ last: x.remind, label: "Remind" }).replace('<span class="btn sm">', `<button type="button" class="btn sm" ${tst("Reminder sent to R. Calloway")}>`).replace(/<\/span><\/span>$/, "</button></span>") : "";
    parts.push(AK.section("Agreement", `${doc}${appr}${remind}`));
    parts.push(AK.section("Controls", x.ctl.map((c) => ctlRow(c, "ic:" + x.id)).join(""), { count: x.ctl.length, action: lnk("Open in Controls", go("controls")) }));
    if (x.src.length) parts.push(AK.section("What WS-X90's SSP says", x.src.map(([c, t]) => quote(c, t)).join("")));
    const next = addYear(x.review[0]);
    parts.push(AK.section("Review", `<dl class="ak-kv"><dt>Last review</dt><dd>${mdy(x.review[0])} · ${esc(x.review[1])} ${EX}</dd><dt>Next review</dt><dd>${exp(next)}</dd><dt>Recorded</dt><dd>${mdy(x.added)}</dd></dl>`));
    parts.push(AK.section("Comments", AK.comments({ items: x.comments, you: ME }), { count: x.comments.length }));
    return { label: "Interconnection preview", body: pan(`${head}${facts}${parts.join("")}${own !== x.owner ? "" : ""}`) };
  };
  M["v8b-ic-new"] = () => ({ title: "Add interconnection", body: `<p class="ak-desc">A connection that crosses WS-X90's boundary. CA-3 asks for an agreement unless the exchange needs none.</p>
      ${field("Connection", inp("Name the connection"), "", true)}${field("Connected system", inp("The system on the other side"), "", true)}
      <div class="v8b-two">${field("Owning organization", inp("Who runs it"))}${field("Its AO", sel("Search people or type a name"))}</div>
      <div class="v8b-two">${field("Type", sel("Ethernet"), "Ethernet, RF data link, removable media, maintenance port or VPN over DISN")}${field("Boundary element", sel("Protected Network Gateway · LRU-007"))}</div>
      <div class="v8b-two">${field("Classification", sel("CUI"))}${field("Direction", sel("Both ways"))}</div>
      <div class="v8b-two">${field("Encryption", sel("FIPS 140-3"), "NSA Type 1, FIPS 140-3 or CSfC")}${field("Agreement", sel("ISA · Draft"))}</div>
      ${field("Owner", sel(ME))}`, footer: foot("Add interconnection", tst("Interconnection added as a draft · IC-110")) });
  M["v8b-renew"] = (id) => {
    const many = id === "selected", x = ICBY[id];
    const names = many ? IC.filter((i) => SEL.has(i.id)).map((i) => i.name) : [x ? x.name : ""];
    return { title: many ? `Request renewal of ${plural(names.length, "agreement")}` : x && x.agr.st === "Draft" ? `Send ${x.agr.ref} for signature` : `Renew ${x ? x.agr.ref : "the agreement"}`,
      body: `<p class="ak-desc">${many ? esc(names.join(", ")) : "Both AOs sign, WS-X90's first."}</p>
        <div class="ak-stepcard"><div class="k"><span class="ak-step-n">1</span>WS-X90's AO</div>${AK.owner("R. Calloway")}</div>
        <div class="ak-stepcard"><div class="k"><span class="ak-step-n">2</span>The connected system's AO</div>${many ? mu("Each agreement's own AO") : AK.owner(x ? x.ao : "")}</div>
        <div class="v8b-two">${field("New expiry", sel("3 years from signature"))}${field("Agreement", sel(many ? "Each its own kind" : x ? x.agr.kind || "ISA" : "ISA"))}</div>
        ${field("Message", inp(many ? "Please renew these agreements before they expire." : `Please review ${x ? x.agr.ref : ""} for renewal.`, true))}`,
      footer: foot("Send for approval", tst(many ? `Renewal requested for ${plural(names.length, "agreement")}` : `Sent to R. Calloway · ${x ? x.agr.ref : ""}`)) };
  };

  // ═════════════ Ports, protocols and services ═════════════
  const PS_T = [["All", "all", "ppsm"], ["Crosses a DoD boundary", "dod", "ppsm-dod"], ["Not registered", "unregistered", "ppsm-unregistered"], ["Conditional", "conditional", "ppsm-conditional"]];
  function psPage(tab) {
    const list = PPS.filter(psIn[tab]);
    const head = AK.indexHead({ title: "Ports, protocols and services", desc: `${plural(PPS.length, "service")} WS-X90 uses · each against the DoD PPSM Category Assurance List (CAL), DoDI 8551.01 · ${lnk("SSP 3 §9 lists 4", go("ssp"))}`,
      actions: `${btn("Export", tst("Exported 12 services as the PPSM registry's CSV"), false, false)}${btn(`${AK.i("plus")}Add service`, 'data-modal="v8b-pps-new"', true, false)}` });
    const tabs = AK.tabs(PS_T.map(([l, k, r]) => [l, PPS.filter(psIn[k]).length, r, k === tab]), "Ports, protocols and services");
    const rows = list.map((x) => ({ id: x.id, cls: x.off ? "v8b-off" : "", cells: [`<b class="num">${esc(x.port)}</b>`, esc(x.proto), clip(esc(x.svc), 150, x.svc), esc(x.dir), esc(x.bnd), clip(x.ic ? esc(ICBY[x.ic].name) : `${esc(elShort(x.el))}`, 140, x.ic ? `${ICBY[x.ic].name} · ${elShort(x.el)}` : elShort(x.el)), pill(CAL[x.cal], x.cal), pill(REG[x.reg], x.reg), face(ownerOf("pps:" + x.id, x.owner))] }));
    const table = tbl({ cols: ["Port", "Protocol", "Service", "Direction", "Boundary", "Used by", `CAL ${EX}`, `Registry ${EX}`, "Owner"], rows, panel: "v8b-pps", label: "Ports, protocols and services", cls: "v8b-dense" });
    return h.page(head, tabs, filters("Search services", ["Boundary", "CAL assessment", "Registry", "Owner"]), table,
      AK.note("Ports 443, 22, 6514 and the link protocol are SSP 3 section 9's; the firmware path, the two vendor diagnostic services and the paper registration come from SC-7(8), CM-7(1) and CM-7(3). Ports 2001, 2002 and 50100, the CAL assessments, the registry states and the owners are examples."));
  }
  PS_T.forEach(([, k, r]) => { S[r] = () => psPage(k); });
  P["v8b-pps"] = (id) => {
    LASTP = { kind: "v8b-pps", id };
    const x = PSBY[id] || PPS[0], ic = x.ic ? ICBY[x.ic] : null;
    const head = AK.recordHead({ title: `${x.port} ${x.proto}`, chip: (x.portEx ? EX + " " : "") + pill(CAL[x.cal], x.cal === "Not applicable" ? "CAL: not applicable" : `CAL ${x.cal}`),
      actions: x.off ? btn("Plan the removal", tst("Task created: disable LRU-006's vendor diagnostics once the vendor firmware ships"), true) : x.reg === "Not registered" || x.reg === "Pending" ? btn(x.reg === "Pending" ? "View registration" : "Register", x.reg === "Pending" ? tst("Registration 2026-118 is with the DoD PPSM office") : 'data-modal="v8b-register" data-id="' + x.id + '"', true) : btn("Edit", tst("Edit service opens its form (prototype)")) });
    const facts = AK.facts([["Owner", ownerEdit("pps:" + x.id, x.owner)], ["Service", esc(x.svc)], ["Direction", esc(x.dir)], ["Boundary", esc(x.bnd)], ["Registry", pill(REG[x.reg], x.reg)]]);
    const parts = [];
    if (x.off) parts.push(banner({ tone: "bad", text: "<b>No approved entry.</b> Enabled in the shipped configuration; disabling it waits on a vendor firmware release (REQ-578).", action: "Open CM-7(1)" }, `data-panel="v8b-ctl" data-id="CM-7(1)|pps:${x.id}"`));
    parts.push(AK.section("Where it's used", `${ic ? li(AK.i("link"), `<b>${esc(ic.name)}</b> ${mu("· " + ic.to)}`, agrPill(ic.agr), `data-panel="v8b-ic" data-id="${ic.id}" role="button" tabindex="0"`) : ""}${li(code(EL[x.el] ? EL[x.el].lru : x.el), `<b>${esc(elName(x.el))}</b>`, "", go("composition"))}`));
    const conds = x.conds || [];
    const va = x.cal === "Not applicable" ? `<p class="v8b-p">Not an IP service: the CAL lists IP ports, protocols and services. The link is assessed with its waveform and crypto instead.</p>`
      : x.cal === "Not listed" ? `<p class="v8b-p">Not on the CAL. A local service inside the enclave would need a Component Local Services Assessment; this one should be off.</p>`
      : x.cal === "Temporary" ? `<p class="v8b-p">Temporary: no assurance colour until the vulnerability assessment is done. It can't be registered as it stands.</p>`
      : `<dl class="ak-kv"><dt>Assurance</dt><dd>${pill(CAL[x.cal], x.cal)}</dd><dt>Assessment</dt><dd>${x.cal === "Green" ? "Acceptable as configured" : "Acceptable with the conditions below"}</dd></dl>${conds.length ? `<div class="v8b-conds">${conds.map(([t, ok, c]) => li(gl(ok ? "check" : "diamond"), `${esc(t)}${c ? " " + mu("· " + c) : ""}`, ok ? mu("Met") : `<span class="v8b-bad">Not met</span>`)).join("")}</div>` : ""}`;
    parts.push(AK.section("Vulnerability assessment", va, { count: conds.length ? `${conds.length - unmet(x)} of ${conds.length} conditions met` : undefined }));
    parts.push(AK.section("Registration", `<dl class="ak-kv"><dt>DoD PPSM registry</dt><dd>${pill(REG[x.reg], x.reg)}${x.regId ? ` ${mu("· ID " + x.regId)}` : ""}</dd><dt>Needed</dt><dd>${dodB(x) ? "Yes: it crosses a DoD-managed boundary" : "No: internal only"}</dd></dl>${x.reg === "Not registered" ? `<p class="v8b-p v8b-mu">CM-7(3): registration is a paper reconciliation at release review today.</p>` : ""}`));
    parts.push(AK.section("Controls", x.ctl.map((c) => ctlRow(c, "pps:" + x.id)).join(""), { count: x.ctl.length }));
    parts.push(AK.section("Shown in SSP", x.ssp ? li(gl("check"), `SSP 3 · §9 Ports, protocols and services · row ${x.ssp}`, lnk("Open the SSP", go("ssp"))) : li(gl("ring"), "Not in SSP 3 yet", btn("Add to SSP §9", tst("Added to SSP 3 §9 as a live row"))) ));
    if (x.src && x.src.length) parts.push(AK.section("What WS-X90's SSP says", x.src.map(([c, t]) => quote(c, t)).join("")));
    return { label: "Service preview", body: pan(`${head}${facts}${parts.join("")}`) };
  };
  M["v8b-pps-new"] = () => ({ title: "Add service", body: `<p class="ak-desc">A port, protocol or service WS-X90 uses. The CAL says how it is assessed.</p>
      <div class="v8b-two">${field("Port", inp("443"), "", true)}${field("Transport", sel("TCP"))}</div>
      <div class="v8b-two">${field("Protocol", inp("HTTPS"), "", true)}${field("Service", inp("What it carries"), "", true)}</div>
      <div class="v8b-two">${field("Direction", sel("Outbound"))}${field("Boundary", sel("Enclave"), "Internal only, enclave or DISN")}</div>
      <div class="v8b-two">${field("Interconnection", sel("Mission planning network"))}${field("Element", sel("Protected Network Gateway · LRU-007"))}</div>`, footer: foot("Add service", tst("Service added · its CAL assessment is looked up")) });
  M["v8b-register"] = (id) => { const x = PSBY[id] || PPS[0]; return { title: `Register ${x.port} ${x.proto}`, body: `<p class="ak-desc">The DoD PPSM registry records each port, protocol and service that crosses a DoD-managed boundary.</p>
      <dl class="ak-kv v8b-akv"><dt>Service</dt><dd>${esc(x.svc)}</dd><dt>Boundary</dt><dd>${esc(x.bnd)}</dd><dt>CAL</dt><dd>${pill(CAL[x.cal], x.cal)}</dd>${ICBY[x.ic] ? `<dt>Interconnection</dt><dd>${esc(ICBY[x.ic].name)}</dd>` : ""}</dl>
      ${unmet(x) ? `<p class="v8b-p v8b-bad">${plural(unmet(x), "condition")} of the CAL not met: the registration notes it.</p>` : ""}${field("Justification", inp("Why WS-X90 needs it", true), "", true)}`, footer: foot("Submit registration", tst(`Registration submitted for ${x.port} ${x.proto}`)) }; };

  // ——— A control, from inside a panel ———
  P["v8b-ctl"] = (id) => {
    LASTP = { kind: "v8b-ctl", id };
    const [c, back = ""] = String(id).split("|"), x = ctl(c) || ctl("CA-3"), [bk, bid] = back.split(":");
    const parent = bk === "ic" && ICBY[bid] ? [ICBY[bid].name, "v8b-ic"] : bk === "pps" && PSBY[bid] ? [`${PSBY[bid].port} ${PSBY[bid].proto}`, "v8b-pps"] : null;
    const impl = D.IMPL[x.s] || ["Not recorded", "none"], reqs = D.requirements[x.c] || [];
    const head = AK.recordHead({ back: undefined, title: `${x.c} ${x.t}`, chip: stPill(x.c), actions: btn("Open in Controls", go(x.c === "SI-2" ? "control-si2" : "controls")) });
    const facts = AK.facts([["Implementation", pill(impl[1], impl[0])], ["Objectives mapped", num(`${x.om} of ${x.ob}`)], ["With evidence", num(`${x.oe} of ${x.ob}`)], ["Assessed", num(`${x.oa} of ${x.ob}`)]]);
    const narr = AK.section("In SSP 3", `<p class="v8b-p">${esc(x.n)}</p>`, { action: lnk("Open the SSP", go("ssp")) });
    const rq = AK.section("Requirements", reqs.length ? reqs.map(([r, t, ev]) => li(code(r), esc(t), ev ? pill("ok", "Evidence") : pill("none", "No evidence"))).join("") : none(x.r ? `${plural(x.r, "requirement")} map it` : "No requirement maps it"), { count: x.r });
    return { label: "Control preview", body: pan(`${parent ? `<button type="button" class="ak-back v8b-back" data-panel="${parent[1]}" data-id="${esc(bid)}">${AK.i("back")}${esc(parent[0])}</button>` : ""}${head}${facts}${narr}${rq}`) };
  };

  // ——— Owners ———
  M["v8b-owner"] = (key) => {
    const many = key === "ic:*", cur = many ? null : ownerOf(key, key === "itcsc" ? "Joel Barrantes" : key.startsWith("ic:") ? (ICBY[key.slice(3)] || {}).owner : key.startsWith("pps:") ? (PSBY[key.slice(4)] || {}).owner : null);
    return { title: many ? `Assign owner to ${plural(SEL.size, "interconnection")}` : "Change owner", body: `<div class="ak-pop v8b-pop" role="listbox" aria-label="Owner"><div class="ak-pop-s">${AK.i("user")}<span>Search people</span></div>
      ${PEOPLE.map(([n, r]) => `<button type="button" class="ak-pop-r v8b-popr${n === cur ? " on" : ""}" role="option" aria-selected="${n === cur}" data-v8b-own="${esc(key)}" data-v8b-who="${esc(n)}">${AK.avatar(n, 22)}<span>${esc(n === ME ? n + " (You)" : n)}</span><span class="r">${esc(r)}</span></button>`).join("")}
      <button type="button" class="ak-pop-f v8b-popr" data-v8b-own="${esc(key)}" data-v8b-who="">${AK.i("x")}Unassign owner</button></div>` };
  };

  // ——— One listener for this module's controls ———
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-v8b-toast],[data-v8b-sel],[data-v8b-desel],[data-v8b-remind],[data-v8b-qv],[data-v8b-file],[data-v8b-use],[data-v8b-read],[data-v8b-go],[data-v8b-own],[data-v8b-apply],[data-v8b-create],[data-v8b-v4]");
    if (!t) return;
    if (t.dataset.v8bToast !== undefined) { toast(t.dataset.v8bToast); if (!t.hasAttribute("data-close-modal")) { e.preventDefault(); e.stopPropagation(); } return; }
    if (t.dataset.v8bV4) { ST.v4 = t.dataset.v8bV4; toast("Version 4 started from version 3 · version 3 stays approved"); setTimeout(() => (route() === "itcsc" ? redraw() : (location.hash = "itcsc")), 0); return; }
    if (t.dataset.v8bApply) { ST.v4 = "imported"; ST.applied = true; toast("Applied to WS-X90 · ITCSC version 4 drafted", "View"); setTimeout(() => { location.hash = "itcsc"; }, 0); return; }
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.v8bGo) { location.hash = t.dataset.v8bGo; return; }
    if (t.dataset.v8bSel) {
      const id = t.dataset.v8bSel;
      if (id === "*") { const ids = (t.dataset.v8bAll || "").split("|").filter(Boolean); const all = ids.every((i) => SEL.has(i)); ids.forEach((i) => (all ? SEL.delete(i) : SEL.add(i))); }
      else if (SEL.has(id)) SEL.delete(id); else SEL.add(id);
      redraw(`[data-v8b-sel="${q(id)}"]`);
    } else if (t.dataset.v8bDesel) { SEL.clear(); redraw(); }
    else if (t.dataset.v8bRemind) { const n = new Set(IC.filter((i) => SEL.has(i.id)).map((i) => ownerOf("ic:" + i.id, i.owner)).filter(Boolean)).size; toast(`Reminders sent to ${plural(n, "owner")}`); }
    else if (t.dataset.v8bQv) { ST.qv = t.dataset.v8bQv; redraw(`[data-v8b-qv="${q(ST.qv)}"]`); }
    else if (t.dataset.v8bFile) { ST.file = t.dataset.v8bFile; ST.qv = "all"; redraw(`[data-v8b-file="${q(ST.file)}"]`); }
    else if (t.dataset.v8bUse) { const [i, k] = t.dataset.v8bUse.split("|"); CHOICE[i] = k; if (route() === "itcsc-import-review") redraw(); refreshPanel(); toast(k === "keep" ? `Keeps WS-X90's ${FLD[+i][1]}` : `Uses the ITCSC's ${FLD[+i][1]}`); }
    else if (t.dataset.v8bRead) readFile(t.dataset.v8bRead);
    else if (t.dataset.v8bCreate) { PA.pnStartFrom = "itcsc"; location.hash = "program-new"; }
    else if (t.dataset.v8bOwn !== undefined) {
      const key = t.dataset.v8bOwn, who = t.dataset.v8bWho || null;
      if (key === "ic:*") { const n = SEL.size; SEL.forEach((id) => (OWN["ic:" + id] = who)); SEL.clear(); toast(who ? `${plural(n, "interconnection")} now owned by ${who}` : `Owner removed from ${plural(n, "interconnection")}`); }
      else { OWN[key] = who; toast(who ? `Owner set to ${who}` : "Owner removed"); }
      closeModal(); redraw(); refreshPanel();
    }
  }, true);
  // Space and Enter work the role="checkbox" and role="radio" spans like buttons.
  document.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && e.target && e.target.matches && e.target.matches("[data-v8b-sel][role='checkbox'], .v8b-own, [data-v8b-go]")) { e.preventDefault(); e.target.click(); }
  });

  // ═════════════ Getting started: Import or complete the ITCSC ═════════════
  PA.decorate(/^getting-started(-owners|-gaps)?$/, (html) => {
    const m = html.match(/(\d+) of (\d+) done/);
    if (!m) return html;
    const done = +m[1] + 1, total = +m[2] + 2, p = Math.round((done / total) * 100);
    let out = html.replace(/(\d+) of (\d+) done/, `${done} of ${total} done`).replace(/(class="ak-donut" style="--p:)\d+/, `$1${p}`).replace(/· \d+%/, `· ${p}%`);
    const at = out.indexOf('aria-label="Workspace setup"');
    if (at < 0) return out;
    const first = out.indexOf('<details class="a-work-tg"', at);
    if (first < 0) return out;
    const chev = (out.slice(first).match(/<svg[^>]*a-work-tgc[\s\S]*?<\/svg>/) || [""])[0];
    const group = `<details class="a-work-tg v8b-gs" open><summary class="a-work-tgh"><span class="a-work-tile">${h.icon("itcsc")}</span><span class="a-work-tgt"><b>ITCSC</b><span>The checklist that categorizes WS-X90 and selects its baseline and overlays.</span></span><span class="a-work-tgn num">1 of 2 complete<span class="ak-donut" style="--p:50"></span></span>${chev}</summary><div class="a-work-tgb">
      <div class="a-work-ti done"><span class="ak-ring sm done"></span><s>Import or complete the ITCSC · version 3, approved Sep 2</s></div>
      <div class="a-work-ti"><span class="ak-ring sm"></span><span class="x" ${go("itcsc")}>Re-approve the ITCSC: 2 external interfaces added since version 3</span><span class="ak-link" ${go("itcsc")}>Open</span></div></div></details>`;
    return out.slice(0, first) + group + out.slice(first);
  });

  // The canon layer's decoration wrapper drops a canonical screen's __from tag; put it back once every module has run.
  setTimeout(() => ["getting-started", "getting-started-owners", "getting-started-gaps"].forEach((r) => { if (S[r] && !S[r].__from && S["after-" + r]) S[r].__from = "after-" + r; }), 0);

  // ——— Routes ———
  ["itcsc-summary", "itcsc-approval", "itcsc-history", "itcsc-comments", "itcsc-activity", "itcsc-import", "itcsc-import-review"].forEach((r) => (ROUTE_NAV[r] = "itcsc"));
  IC_T.slice(1).forEach(([, , r]) => (ROUTE_NAV[r] = "interconnections"));
  PS_T.slice(1).forEach(([, , r]) => (ROUTE_NAV[r] = "ppsm"));
  window.addEventListener("hashchange", () => { if (!/^interconnections/.test(route())) SEL.clear(); });
  PA.own(["itcsc", "itcsc-summary", "itcsc-approval", "itcsc-history", "itcsc-comments", "itcsc-activity", "itcsc-import", "itcsc-import-review", ...IC_T.map((x) => x[2]), ...PS_T.map((x) => x[2])]);
})();
