# Writes proto/mod-ssp-0data.js and .css: the shared SSP document for the SSP editor, its version history and program creation.
# Real parts come from controls.json (exported from the local database, read only); the rest is marked "ex" (an example).
# Run: python3 -I sspdata.py
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.join(HERE, "..", "proto")
raw = json.load(open(os.path.join(HERE, "controls.json")))

TAIL = re.compile(r"\s*This narrative is synthetic demo content\.\s*$")
def clean(t):
    return TAIL.sub("", (t or "").strip())

PLACE = "satisfies the tailored intent"
controls = []
for x in raw:
    n = clean(x["n"])
    row = {"c": x["c"], "t": x["t"], "f": x["f"], "s": x["s"], "n": n, "rv": x["rv"], "up": x["up"],
           "cs": x["cs"], "db": x["db"], "r": x["r"], "e": x["e"], "ob": x["ob"], "om": x["om"], "oe": x["oe"], "oa": x["oa"]}
    if PLACE in n: row["ph"] = 1
    if x["s2"] or x["n2"]:
        row["was"] = {"s": x["s2"] or x["s"], "n": clean(x["n2"]) if x["n2"] else n}
    controls.append(row)
by = {c["c"]: c for c in controls}
fam = collections.OrderedDict()
for x in raw:
    fam.setdefault(x["f"], {"f": x["f"], "t": x["ft"], "n": 0})
    fam[x["f"]]["n"] += 1
families = list(fam.values())

def codes(pred):
    return [c["c"] for c in controls if pred(c)]

ph = codes(lambda c: c.get("ph"))
ph_sat = codes(lambda c: c.get("ph") and c["cs"] == "satisfied")
under = codes(lambda c: c["s"] == "partial" and c["cs"] == "satisfied")
over = codes(lambda c: c["s"] == "implemented" and c["cs"] in ("other_than_satisfied", "partially_satisfied"))
noreq = codes(lambda c: c["cs"] == "no_requirement")
changed = codes(lambda c: "was" in c)
impl = collections.Counter(c["s"] for c in controls)
cstat = collections.Counter(c["cs"] for c in controls)

def has(code, quote):
    assert quote in by[code]["n"], (code, quote)
    return quote

elements = [
    ["CN-109000", "WS-X90 Sentinel Mission System", "other", None, None],
    ["CN-109001", "Mission Computing Subsystem", "subsystem", "CN-109000", None],
    ["CN-109002", "Navigation & Timing Subsystem", "subsystem", "CN-109000", None],
    ["CN-109003", "Communications Subsystem", "subsystem", "CN-109000", None],
    ["CN-109004", "Payload Interface Subsystem", "subsystem", "CN-109000", None],
    ["CN-109005", "Platform Management Subsystem", "subsystem", "CN-109000", None],
    ["CN-109006", "Ground Support Subsystem", "subsystem", "CN-109000", None],
]
names = ["Mission Computer", "Secure Boot Controller", "Cryptographic Services Module", "Navigation Processor", "Timing Receiver",
         "Navigation Sensor Interface", "Protected Network Gateway", "Tactical Data Radio", "Internal Ethernet Switch",
         "Payload Interface Controller", "Payload Safety Interlock", "Payload Telemetry Unit", "Platform Management Controller",
         "Maintenance Access Gateway", "Secure Storage Module", "Update & Recovery Controller", "Provisioning Workstation",
         "Security Log Collector", "Maintenance Laptop", "Configuration Repository"]
parents = ["CN-109001"] * 3 + ["CN-109002"] * 3 + ["CN-109003"] * 3 + ["CN-109004"] * 3 + ["CN-109005"] * 4 + ["CN-109006"] * 4
for i, nm in enumerate(names, start=1):
    typ = "software" if nm in ("Security Log Collector", "Configuration Repository") else "hardware"
    elements.append(["CN-1091%02d" % i, nm, typ, parents[i - 1], "LRU-%03d" % i])

D = {
    "note": "Narratives, statuses, revisions, the system tree, roles, requirements and evidence are WS-X90's (the demo seed). Everything with ex: 1 is an example.",
    "program": {"code": "PRG-1090", "name": "WS-X90 Sentinel Mission System"},
    "system": {"code": "SYS-WSX90", "name": "WS-X90 Sentinel Mission System", "type": "Platform", "lifecycle": "Planned",
               "authorization": "In progress", "cia": ["High", "High", "Moderate"], "rationale": "",
               "description": "Synthetic mission platform used only to exercise security engineering, compliance, assessment, SSP, and POA&M workflows.",
               "baseline": "WS-X90 Tailored Security Baseline", "catalog": "NIST SP 800-53 Rev 5 (5.2.0)"},
    "doc": {"title": "WS-X90 System Security Plan", "revision": 3, "state": "Draft"},
    "revisions": [
        {"v": 1, "state": "Superseded", "controls": 546,
         "description": "First draft, written against the original 546-control set."},
        {"v": 2, "state": "Published", "published": "2026-07-25", "controls": 560, "frozen": 1,
         "description": "SSP for the initial authorization: the tailored control baseline, the Block 1 configuration and the identity services inherited from the corporate identity provider."},
        {"v": 3, "state": "Draft", "started": "2026-11-13", "controls": 560,
         "description": "Working draft for FY2027 continuous monitoring: the Block 1.1 configuration and the progress of the tailored-in cyber resiliency controls."},
    ],
    "counts": {"implementation": dict(impl), "controlStatus": dict(cstat), "placeholders": len(ph)},
    "families": families,
    "controls": controls,
    "changed": changed,
    "elements": elements,
    "roles": [
        ["authorizing_official", "Authorizing official", "R. Calloway"],
        ["security_manager", "ISSM", "Joel Barrantes"],
        ["security_officer", "ISSO", "Priya Raghavan"],
        ["system_owner", "System owner", "Ray Colston"],
        ["lead_assessor", "Lead assessor (SCA)", "D. Okafor"],
        ["assessor", "Assessor", "Nadia Fournier"],
    ],
    "requirements": {
        "AC-2": [["REQ-001", "AC Enforcement Requirement 001", "Evidence for REQ-001"], ["REQ-075", "AC Configuration Requirement 075", "Evidence for REQ-075"]],
        "AC-2(3)": [["REQ-439", "Platform accounts disabled within 72 hours of expiry, disassociation or policy violation", "Account disable trigger test report - expiry, disassociation and policy violation, LRU-013"],
                    ["REQ-440", "Ground support accounts disabled after 90 days without a successful authentication", "Ground support inactivity sweep log, 30-day sample, LRU-017"]],
        "IA-2(1)": [["REQ-598", "Two distinct factors before any privileged administrative command", None]],
    },
    # Who is in the document now (example). Colours are core tokens only.
    "people": [
        {"name": "Ingrid Solberg", "role": "Security engineer", "you": 1, "access": "Editor", "color": "var(--ink-2)"},
        {"name": "Priya Raghavan", "role": "ISSO", "access": "Editor", "color": "var(--brand)", "at": "AC-2", "doing": "Editing", "ex": 1},
        {"name": "Joel Barrantes", "role": "ISSM", "access": "Editor", "color": "var(--ok)", "at": "s5", "doing": "Viewing", "ex": 1},
        {"name": "Marcus Ryde", "role": "Component owner", "access": "Editor", "color": "var(--warn)", "at": "s8", "doing": "Editing", "ex": 1},
        {"name": "D. Okafor", "role": "Lead assessor (SCA)", "access": "Commenter", "color": "var(--ink-3)", "at": "SI-14(1)", "doing": "Viewing", "assessor": 1, "ex": 1},
    ],
    "access": [["Ray Colston", "System owner", "Editor"], ["R. Calloway", "Authorizing official", "Viewer"], ["Nadia Fournier", "Assessor", "Commenter"]],
    # The document's outline. kind: data (filled from records), diagram (drawn from records), authored, controls, custom.
    "sections": [
        {"id": "s1", "n": "1", "t": "System identification", "kind": "data", "src": "System record SYS-WSX90"},
        {"id": "s2", "n": "2", "t": "Security categorization", "kind": "data", "src": "System record SYS-WSX90"},
        {"id": "s3", "n": "3", "t": "Roles and responsibilities", "kind": "data", "src": "Program roles"},
        {"id": "s4", "n": "4", "t": "Mission and purpose", "kind": "authored", "ex": 1,
         "text": ["WS-X90 Sentinel carries a payload, navigates on its own timing source and reports over a tactical data link. Ground support provisions it before each mission, maintains it between missions and keeps its security log.",
                  "The system processes mission plans, navigation state, payload commands and telemetry. Its operators are platform crews and ground support technicians; no system outside the boundary can command the payload."]},
        {"id": "s5", "n": "5", "t": "Authorization boundary", "kind": "diagram", "src": "System tree, 27 elements",
         "text": ["The boundary is SYS-WSX90 and everything inside it: six subsystems and the twenty elements they hold. The Maintenance Laptop and the Provisioning Workstation sit inside the boundary wherever they are; identity services come from the corporate identity provider outside it."]},
        {"id": "s6", "n": "6", "t": "Architecture and data flows", "kind": "diagram", "src": "System tree and interconnections", "ex": 1},
        {"id": "s7", "n": "7", "t": "Interconnections", "kind": "data", "src": "Interconnection records", "ex": 1},
        {"id": "s8", "n": "8", "t": "Hardware and software inventory", "kind": "data", "src": "System tree, 20 elements"},
        {"id": "s9", "n": "9", "t": "Ports, protocols and services", "kind": "data", "src": "PPSM records", "ex": 1},
        {"id": "s10", "n": "10", "t": "Control baseline", "kind": "data", "src": "WS-X90 Tailored Security Baseline"},
        {"id": "s11", "n": "11", "t": "Control implementations", "kind": "controls", "src": "560 control implementations"},
        {"id": "s12", "n": "12", "t": "Cyber resiliency approach", "kind": "custom", "ex": 1,
         "text": ["WS-X90 designs for cyber resiliency under SA-24: the mission must keep flying through a compromised element. The goals and techniques the program chose are recorded in its control baseline; the design review of the remaining approaches is planned for Block 1.1."]},
        {"id": "s13", "n": "13", "t": "Continuous monitoring strategy", "kind": "custom", "template": "Continuous monitoring strategy", "ex": 1,
         "text": ["Monthly: ACAS scans of every element that runs software, STIG checks of the Provisioning Workstation and the Maintenance Laptop, and a review of the security log. Quarterly: a sample of control implementations is reassessed. Annually: the SSP is reviewed against the baseline."]},
        {"id": "a1", "n": "A", "t": "Inherited controls", "kind": "data", "src": "Common control providers", "ex": 1},
        {"id": "a2", "n": "B", "t": "Plan of action and milestones", "kind": "data", "src": "POA&M"},
        {"id": "a3", "n": "C", "t": "Change log", "kind": "data", "src": "Version history"},
    ],
    "templates": ["Blank section", "Continuous monitoring strategy", "Contingency plan summary", "Incident response summary",
                  "Supply chain risk management", "Privacy summary", "Cyber resiliency approach", "Acronyms"],
    "interconnections": [
        {"to": "Corporate identity provider (PRG-1013)", "kind": "Inherited service", "via": "Platform Management Controller", "data": "Identities and group membership", "agreement": "Common control provider record"},
        {"to": "Mission planning network", "kind": "Interconnection", "via": "Protected Network Gateway", "data": "Mission plans in, mission reports out", "agreement": "ISA, signed 2026-06-30", "ex": 1},
        {"to": "Tactical data link", "kind": "Interconnection", "via": "Tactical Data Radio", "data": "Position reports and tasking", "agreement": "ISA, renewal due 2027-01-15", "ex": 1},
        {"to": "Depot maintenance enclave", "kind": "Interconnection", "via": "Maintenance Access Gateway", "data": "Maintenance commands and logs", "agreement": "MOA, signed 2026-03-02", "ex": 1},
    ],
    "ppsm": [
        ["Protected Network Gateway", "TLS 1.3", "443/tcp", "Mission plan transfer", "Outbound to mission planning network"],
        ["Maintenance Access Gateway", "SSH", "22/tcp", "Maintenance sessions", "Inbound from the depot enclave"],
        ["Security Log Collector", "Syslog over TLS", "6514/tcp", "Security log forwarding", "Inside the boundary"],
        ["Tactical Data Radio", "Link protocol", "n/a", "Position reports and tasking", "Over the air"],
    ],
    # Comment threads (example). at: a section id or a control code; quote: the exact words the thread is pinned to.
    "comments": [
        {"id": "c1", "at": "AC-2(3)", "quote": has("AC-2(3)", "disables an account within 72 hours of expiry"), "audience": "assessor",
         "thread": [["D. Okafor", "Lead assessor (SCA)", "2026-11-16T15:02", "Is 72 hours the value WS-X90's baseline sets? The baseline records no value for AC-2(3), so I can't test against it."],
                    ["Priya Raghavan", "ISSO", "2026-11-16T15:40", "It's the CNSSI 1253 value. I'll set it in the program tailoring so the baseline and the narrative agree."]], "ex": 1},
        {"id": "c2", "at": "SI-14(1)", "quote": has("SI-14(1)", "the signing step is automated for two of three image types"), "audience": "assessor",
         "thread": [["D. Okafor", "Lead assessor (SCA)", "2026-11-17T08:51", "Which image type is still signed by hand? I need it for the test plan."],
                    ["Priya Raghavan", "ISSO", "2026-11-17T09:20", "The Maintenance Laptop image. @Marcus Ryde can confirm when its signing is automated."]],
         "task": {"to": "Marcus Ryde", "due": "2026-12-04"}, "ex": 1},
        {"id": "c3", "at": "SA-24", "quote": has("SA-24", "the design review of the remaining approaches is planned for Block 1.1"), "audience": "internal",
         "thread": [["Joel Barrantes", "ISSM", "2026-11-17T09:12", "@Ray Colston please confirm the Block 1.1 design review date before I sign this revision."]],
         "task": {"to": "Ray Colston", "due": "2026-11-21"}, "ex": 1},
        {"id": "c4", "at": "IA-2(1)", "quote": has("IA-2(1)", "There is no reduced-privilege fallback session"), "audience": "internal",
         "thread": [["Joel Barrantes", "ISSM", "2026-11-16T11:05", "Good. Point to AC-7 for the PIN retry limit so the assessor finds it."]], "ex": 1},
        {"id": "c5", "at": "AC-1", "quote": has("AC-1", "seven procedures currently lack a current owner signature"), "audience": "internal",
         "thread": [["Ray Colston", "System owner", "2026-11-15T16:30", "Reissue is scheduled for December. I'll own it."]], "ex": 1},
        {"id": "c6", "at": "SC-34", "quote": has("SC-34", "verified by the secure boot controller (LRU-002)"), "audience": "internal", "resolved": 1,
         "thread": [["Marcus Ryde", "Component owner", "2026-11-14T10:10", "LRU-002 is the Secure Boot Controller, CN-109102. Confirmed."],
                    ["Priya Raghavan", "ISSO", "2026-11-14T10:22", "Thanks, resolving."]], "ex": 1},
        {"id": "c7", "at": "s2", "quote": "Categorization rationale", "audience": "internal",
         "thread": [["Joel Barrantes", "ISSM", "2026-11-17T09:14", "The rationale is empty. eMASS won't accept the categorization without one."]], "ex": 1},
        {"id": "c8", "at": "s5", "quote": "The Maintenance Laptop and the Provisioning Workstation sit inside the boundary wherever they are", "audience": "internal", "resolved": 1,
         "thread": [["Joel Barrantes", "ISSM", "2026-11-16T10:02", "Is the laptop inside the boundary when it's off the platform?"],
                    ["Priya Raghavan", "ISSO", "2026-11-16T10:15", "Yes. It's CN-109119 under Ground Support; the boundary follows it."]], "ex": 1},
    ],
    # Suggested edits (example). Nothing an AI writes lands without a person accepting it.
    "suggestions": [
        {"id": "g1", "at": "AC-2", "by": "AI draft", "for": "Priya Raghavan", "kind": "replace", "ai": 1, "ex": 1,
         "text": "Accounts on WS-X90 exist only through the account service on the Platform Management Controller (LRU-013); its account store is sealed, and every create, modify, enable, disable and remove action reaches the Security Log Collector (LRU-018) within 60 seconds. Temporary and emergency maintenance accounts expire within 72 hours. Platform accounts are disabled within 72 hours of expiry, loss of programme association or a policy violation, and ground support accounts after 90 days without a successful authentication. Each account change is audited to the Secure Storage Module (LRU-015) before it takes effect.",
         "sources": [["Control", "AC-2(1) implementation"], ["Control", "AC-2(2) implementation"], ["Control", "AC-2(3) implementation"], ["Control", "AC-2(4) implementation"],
                     ["Requirement", "REQ-439 Platform accounts disabled within 72 hours of expiry, disassociation or policy violation"],
                     ["Evidence", "Account disable trigger test report - expiry, disassociation and policy violation, LRU-013"],
                     ["Evidence", "Ground support inactivity sweep log, 30-day sample, LRU-017"]],
         "why": "The narrative is placeholder text, while the assessor judged all 26 of AC-2's objectives satisfied."},
        {"id": "g2", "at": "s2", "by": "AI draft", "for": "Joel Barrantes", "kind": "insert", "ai": 1, "ex": 1,
         "text": "Confidentiality is high because the system holds mission plans and cryptographic keys whose disclosure would endanger the mission. Integrity is high because a corrupted navigation state or payload command could cause loss of the platform. Availability is moderate because a mission can be postponed and the platform recovered from its safe mode.",
         "sources": [["System", "SYS-WSX90 categorization High / High / Moderate"], ["Control", "CP-12 implementation"], ["Element", "Cryptographic Services Module"]],
         "why": "Joel's comment: eMASS needs a rationale."},
        {"id": "g3", "at": "SI-14(1)", "by": "Joel Barrantes", "kind": "replace", "ex": 1,
         "from": "two of three image types", "text": "two of the three image types; the Maintenance Laptop image is still signed by hand"},
    ],
    # Versions inside revision 3, newest first (example), then the revisions before it.
    "versions": [
        {"id": "now", "at": "2026-11-17T10:42", "kind": "current", "who": ["Priya Raghavan", "Ingrid Solberg"], "changes": [["AC-2", "Narrative edited"]], "ops": 214, "ex": 1},
        {"id": "v41", "at": "2026-11-17T09:15", "who": ["Joel Barrantes", "D. Okafor"], "changes": [["s2", "2 comments"], ["SA-24", "Comment"], ["SI-14(1)", "Comment"]], "ops": 38, "ex": 1},
        {"id": "v40", "at": "2026-11-16T16:20", "kind": "named", "name": "Ready for ISSM review", "by": "Priya Raghavan", "who": ["Priya Raghavan", "Marcus Ryde"], "changes": [["s5", "Boundary text edited"], ["IA-2(1)", "Narrative edited"]], "ops": 512, "ex": 1},
        {"id": "v39", "at": "2026-11-16T14:05", "who": ["Marcus Ryde"], "changes": [["s8", "2 elements described"]], "ops": 141, "ex": 1},
        {"id": "v38", "at": "2026-11-15T11:30", "who": ["Priya Raghavan"], "changes": [["s12", "Section added from a template: Cyber resiliency approach"]], "ops": 96, "ex": 1},
        {"id": "v37", "at": "2026-11-13T15:10", "who": ["Priya Raghavan"], "changes": [[c, "Status and narrative"] for c in changed], "ops": 388, "real": 1},
        {"id": "v36", "at": "2026-11-13T09:00", "kind": "start", "name": "Revision 3 started from revision 2", "by": "Priya Raghavan", "who": ["Priya Raghavan"], "changes": [], "ops": 0},
        {"id": "r2", "at": "2026-07-25T14:00", "kind": "published", "name": "Revision 2 published", "by": "R. Calloway", "who": ["Joel Barrantes", "R. Calloway"], "frozen": 1,
         "approvals": [["ISSM", "Joel Barrantes", "2026-07-21"], ["Authorizing official", "R. Calloway", "2026-07-25"]], "changes": [], "ex": 1},
    ],
    # What the assistant finds when it checks the SSP against WS-X90's records (counts and codes are real).
    "checks": [
        {"id": "k1", "sev": "high", "title": "%d narratives are placeholder text" % len(ph), "detail": "%d of them are on controls the assessor found satisfied, so the SSP doesn't describe what was assessed." % len(ph_sat), "codes": ph, "action": "Draft %d narratives" % len(ph)},
        {"id": "k2", "sev": "medium", "title": "%d controls say partially implemented; the assessor found them satisfied" % len(under), "detail": "Update their implementation status, or say what is still missing.", "codes": under, "action": "Review %d statuses" % len(under)},
        {"id": "k3", "sev": "high", "title": "%d controls say implemented; the assessor found otherwise" % len(over), "detail": "The SSP claims more than the assessment found.", "codes": over, "action": "Review %d controls" % len(over)},
        {"id": "k4", "sev": "medium", "title": "%d controls have no requirement" % len(noreq), "detail": "No requirement maps them, so nothing supports their narratives.", "codes": noreq, "action": "Open in Controls"},
        {"id": "k5", "sev": "medium", "title": "AC-2(3) names values the baseline doesn't set", "detail": "Its narrative says 72 hours and 90 days; WS-X90's program tailoring sets neither parameter.", "codes": ["AC-2(3)"], "action": "Set the parameters"},
        {"id": "k6", "sev": "medium", "title": "Mission Computer version 2 changed 2 controls", "detail": "AC-17(2) and SC-23 cite version 1; version 2, published Nov 12, leaves them to review.", "codes": ["AC-17(2)", "SC-23"], "action": "Review the change"},
        {"id": "k7", "sev": "low", "title": "The categorization has no rationale", "detail": "Section 2 is empty where eMASS asks for the reasoning behind High / High / Moderate.", "codes": [], "at": "s2", "action": "Draft a rationale"},
    ],
    "lists": {"placeholders": ph, "placeholdersSatisfied": ph_sat, "understated": under, "overstated": over, "noRequirement": noreq},
}

js = r"""// Shared SSP data: the SSP editor, its version history and program creation read it. Generated by ../ssp/sspdata.py; never edit by hand.
// It is large (~%d KB). NEVER print the whole file: read this header, then inspect with node, e.g.
//   node ssp-peek.js            (one line per key)      node ssp-peek.js AC-2 SA-24   (whole controls)
// window.PA.SSP:
//   note, program {code,name}, system {code,name,type,lifecycle,authorization,cia[3],rationale,description,baseline,catalog}
//   doc {title,revision,state}, revisions [{v,state,published?,started?,controls,description,frozen?}]
//   counts {implementation{implemented,partial,planned,not_implemented}, controlStatus{...}, placeholders}
//   families [{f,t,n}]  (18, in catalog order)
//   controls [{c code, t title, f family, s implementation status (implemented|partial|planned|not_implemented), n narrative,
//              rv record revision, up updated, cs control status (satisfied|partially_satisfied|other_than_satisfied|not_assessed|no_evidence|no_requirement),
//              db determined by, r requirements, e requirements with evidence, ob objectives, om mapped, oe with evidence, oa assessed,
//              ph 1 if the narrative is placeholder text, was {s,n} the published revision 2's status and text where revision 3 changed it}]  (560, catalog order)
//   changed [codes changed since revision 2], elements [[code,name,type,parentCode,lru]], roles [[key,label,name]]
//   requirements {code: [[req, title, evidence title|null]]}
//   people [{name,role,access,color,at,doing,you?,assessor?,ex}], access [[name,role,access]]
//   sections [{id,n,t,kind: data|diagram|authored|controls|custom, src?, text?[], template?, ex?}], templates [names]
//   interconnections [{to,kind,via,data,agreement,ex?}], ppsm [[element,protocol,port,service,direction]]
//   comments [{id,at (section id or control code),quote (exact words in that narrative or section),audience internal|assessor,resolved?,task?{to,due},thread [[who,role,iso,text]],ex}]
//   suggestions [{id,at,by,for?,kind replace|insert,ai?,text,from?,sources?[[kind,label]],why?,ex}]
//   versions [{id,at,kind? current|named|start|published,name?,by?,who[],changes [[at,what]],ops,approvals?,frozen?,real?|ex?}]  (newest first)
//   checks [{id,sev high|medium|low,title,detail,codes[],at?,action}], lists {placeholders,placeholdersSatisfied,understated,overstated,noRequirement}
// Session: PA.SSP.now() -> ISO on the simulated clock, PA.SSP.session [] (newest first), PA.SSP.log({who,what,at,kind}), PA.SSP.ui.toast(text, linkText)
// UI: PA.SSP.ui.av(name,size) avatar in the person's colour, .c(name) style attr, .when(iso), .group(iso), .diff(a,b,name) word redline, .esc
// Helpers: PA.SSP.ctl(code) -> control, PA.SSP.ofFamily(f) -> controls, PA.SSP.person(name) -> person,
//   PA.SSP.sec(id) -> section, PA.SSP.IMPL / PA.SSP.STATUS -> [label, pill kind], PA.fullWindow(prefix) (see below), PA.own([routes]) (version 7: claim a redrawn route).
(function () {
  const PA = window.PA;
  const D = %s;
  const byCode = new Map(D.controls.map((c) => [c.c, c]));
  D.ctl = (code) => byCode.get(code) || null;
  D.ofFamily = (f) => D.controls.filter((c) => c.f === f);
  D.person = (name) => D.people.find((p) => p.name === name) || { name, role: "", color: "var(--ink-3)" };
  D.sec = (id) => D.sections.find((s) => s.id === id) || null;
  D.IMPL = { implemented: ["Implemented", "ok"], partial: ["Partially implemented", "part"], planned: ["Planned", "none"], not_implemented: ["Not implemented", "bad"] };
  D.STATUS = { satisfied: ["Satisfied", "ok"], partially_satisfied: ["Partially satisfied", "part"], other_than_satisfied: ["Other than satisfied", "bad"], not_assessed: ["Not assessed", "warn"], no_evidence: ["No evidence", "none"], no_requirement: ["No requirement", "none"] };

  // Small shared pieces, so the editor and the version history draw people, moments and changes alike.
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const ini = (n) => String(n).replace(/\./g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const TODAY = (PA.data && PA.data.TODAY) || new Date("2026-11-17T12:00:00");
  const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  D.ui = {
    esc,
    // style="--c:<person colour>" for any element that should wear a person's colour
    c: (name) => `style="--c:${D.person(name).color}"`,
    av: (name, size = 26) => `<span class="sd-av" style="--c:${D.person(name).color};--s:${size}px" title="${esc(name)}">${esc(ini(name))}</span>`,
    // "10:42 AM" today, "Yesterday, 4:20 PM", "Nov 13, 3:10 PM", "Jul 25, 2026" for another year
    when: (iso) => {
      const d = new Date(iso.length > 10 ? iso : iso + "T12:00:00"), diff = Math.round((day0(TODAY) - day0(d)) / 86400000);
      const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      if (diff === 0) return t;
      if (diff === 1) return "Yesterday, " + t;
      if (d.getFullYear() === TODAY.getFullYear()) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + t;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    // "Today", "Yesterday", "This week", "Earlier": the version list's groups
    group: (iso) => { const diff = Math.round((day0(TODAY) - day0(new Date(iso))) / 86400000); return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This week" : "Earlier"; },
    // Word-level redline of a -> b, as <del class="sd-del"> and <ins class="sd-ins">. Pass a name to wear that person's colour.
    diff: (a, b, name) => {
      const A = String(a || "").split(/(\s+)/), B = String(b || "").split(/(\s+)/), n = A.length, m = B.length;
      const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      const st = name ? ` style="--c:${D.person(name).color}"` : "";
      let out = "", i = 0, j = 0, del = "", ins = "";
      const flush = () => { if (del) out += `<del class="sd-del"${st}>${esc(del)}</del>`; if (ins) out += `<ins class="sd-ins"${st}>${esc(ins)}</ins>`; del = ins = ""; };
      while (i < n && j < m) { if (A[i] === B[j]) { flush(); out += esc(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) del += A[i++]; else ins += B[j++]; }
      while (i < n) del += A[i++]; while (j < m) ins += B[j++]; flush();
      return out;
    },
  };

  // The session: the editor logs what the reader changes, and the version history shows it above the saved versions.
  // The clock starts at 10:43 AM on the prototype's today (Nov 17) and runs with real time, so new versions sort after "now".
  const T0 = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 10, 43).getTime(), START = Date.now();
  D.now = () => { const d = new Date(T0 + (Date.now() - START)); const p = (x) => String(x).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
  D.session = [];
  // D.log({ who, what, at?: code or section id, kind?: "edit" | "accept" | "comment" | "section" | "restore" | "submit" })
  D.log = (e) => { const entry = Object.assign({ at: null, who: "Ingrid Solberg", kind: "edit" }, e, { time: D.now() }); D.session.unshift(entry); return entry; };
  // A toast at the bottom of the window: PA.SSP.ui.toast("Saved to AC-2's implementation", "Undo")
  D.ui.toast = (text, link) => {
    const host = document.getElementById("proto") || document.body; let box = host.querySelector(".sd-toasts");
    if (!box) { box = document.createElement("div"); box.className = "sd-toasts"; host.appendChild(box); }
    const t = document.createElement("div"); t.innerHTML = PA.AK ? PA.AK.toast(text, link) : `<div class="ak-toast" role="status">${esc(text)}</div>`;
    const el = t.firstElementChild; box.appendChild(el); setTimeout(() => el.remove(), 4500); return el;
  };
  PA.SSP = D;

  // Full-window routes: the app's top bar and navigation step aside, and the route draws its own header with a way out.
  // PA.fullWindow("ssp") makes "ssp" and every "ssp-..." route full window.
  const FULL = new Set();
  const proto = () => document.getElementById("proto");
  const apply = () => { const r = (location.hash || "#home").slice(1); const on = [...FULL].some((p) => r === p || r.startsWith(p + "-")); const el = proto(); if (el) el.classList.toggle("fullwin", on); };
  PA.fullWindow = (prefix) => { FULL.add(prefix); apply(); };
  // Version 7: a module that redraws a screen under its existing route name claims it, so the last module (mod-zzz-canon.js)
  // doesn't alias a redesigned "after" screen over it: PA.own(["overview", "composition", ...]).
  PA.OWNED = PA.OWNED || new Set();
  PA.own = (list) => { (Array.isArray(list) ? list : [list]).forEach((r) => PA.OWNED.add(r)); };
  // Add to a screen or a panel another module draws: fn(html, route) returns the new html. route is a name or a RegExp.
  // The canon layer applies these last, to the canonical screens, so links in what you add are canonical too.
  PA.DECOR = PA.DECOR || []; PA.decorate = (route, fn) => PA.DECOR.push([route, fn]);
  PA.PDECOR = PA.PDECOR || []; PA.decoratePanel = (key, fn) => PA.PDECOR.push([key, fn]);
  window.addEventListener("hashchange", apply);
})();
"""

css = """/* Full-window routes (PA.fullWindow): no app top bar, no navigation; the route's own header carries the way out. */
#proto.fullwin { grid-template-rows: minmax(0, 1fr); }
#proto.fullwin > .top { display: none; }
#proto.fullwin .pt-shell { grid-template-columns: minmax(0, 1fr); }
#proto.fullwin .pt-shell > .side { display: none !important; }

/* Document surfaces shared by the SSP editor and its version history (prefix sd-). People's colours come in as --c. */
.sd-desk { background: var(--page); padding: 28px 24px 72px; display: grid; justify-items: center; align-content: start; min-width: 0; }
.sd-page { width: 100%; max-width: 816px; min-width: 0; background: var(--canvas); color: var(--ink); border: 1px solid var(--line); border-radius: 4px; box-shadow: 0 1px 2px rgb(24 24 29 / 0.05), 0 12px 32px -18px rgb(24 24 29 / 0.25); padding: 64px 72px 88px; font: 15px/24px var(--font); }
.sd-title { font: 600 28px/34px var(--font); letter-spacing: -0.02em; margin: 0 0 4px; text-wrap: balance; }
.sd-sub { color: var(--ink-3); font-size: 13px; line-height: 18px; }
.sd-h1 { font: 600 20px/28px var(--font); letter-spacing: -0.01em; margin: 40px 0 10px; display: flex; gap: 10px; align-items: baseline; scroll-margin-top: 16px; }
.sd-h2 { font: 600 16px/24px var(--font); margin: 28px 0 6px; display: flex; gap: 8px; align-items: baseline; scroll-margin-top: 16px; }
.sd-h3 { font: 600 14px/20px var(--font); margin: 16px 0 4px; }
.sd-num { color: var(--ink-4); font-variant-numeric: tabular-nums; flex: none; }
.sd-p { margin: 0 0 12px; }
.sd-ph { color: var(--ink-3); font-style: italic; }
.sd-tablebox { overflow-x: auto; max-width: 100%; margin: 8px 0 16px; }
.sd-table { width: 100%; border-collapse: collapse; font-size: 13px; line-height: 18px; }
.sd-table th, .sd-table td { border: 1px solid var(--line); padding: 7px 10px; text-align: start; vertical-align: top; }
.sd-table th { background: var(--band); font-weight: 600; color: var(--ink-2); }
.sd-live { position: relative; border-inline-start: 2px solid var(--line); padding-inline-start: 14px; margin: 10px 0 18px; }
.sd-live:hover, .sd-live:focus-within, .sd-live.on { border-inline-start-color: var(--brand); }
.sd-live-h { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; font-size: 12px; line-height: 16px; color: var(--ink-3); margin-bottom: 6px; }
.sd-live-tag { display: inline-flex; gap: 4px; align-items: center; color: var(--brand-text); font-weight: 500; }
.sd-ins { color: var(--c, var(--brand-text)); text-decoration: underline; text-decoration-color: var(--c, var(--brand)); text-underline-offset: 2px; background: color-mix(in srgb, var(--c, var(--brand)) 9%, transparent); }
.sd-del { color: var(--c, var(--brand-text)); text-decoration: line-through; opacity: 0.75; }
.sd-ai { background: var(--brand-soft); box-shadow: inset 0 -1px 0 var(--brand); }
.sd-mark { background: var(--warn-soft); box-shadow: inset 0 -2px 0 var(--warn); cursor: pointer; border-radius: 2px; }
.sd-mark.on { background: color-mix(in srgb, var(--warn) 32%, transparent); }
.sd-mark.resolved { background: transparent; box-shadow: inset 0 -1px 0 var(--line-strong); }
.sd-cur { position: relative; display: inline-block; width: 0; height: 1.25em; vertical-align: text-bottom; border-inline-start: 2px solid var(--c); margin-inline: -1px; }
.sd-cur::after { content: attr(data-name); position: absolute; bottom: 100%; inset-inline-start: -2px; white-space: nowrap; font: 500 11px/16px var(--font); padding: 0 5px; border-radius: 3px 3px 3px 0; background: var(--c); color: var(--canvas); }
.sd-sel { background: color-mix(in srgb, var(--c) 18%, transparent); }
.sd-av { --s: 26px; width: var(--s); height: var(--s); flex: none; display: inline-grid; place-items: center; border-radius: 999px; font: 600 calc(var(--s) * 0.4)/1 var(--font); color: var(--c); background: color-mix(in srgb, var(--c) 14%, var(--canvas)); box-shadow: 0 0 0 2px var(--canvas), 0 0 0 3.5px var(--c); }
.sd-fig { border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin: 10px 0 6px; background: var(--canvas); overflow-x: auto; }
.sd-fig svg { display: block; max-width: 100%; height: auto; }
.sd-cap { font-size: 12px; line-height: 16px; color: var(--ink-3); margin: 0 0 16px; }
.sd-toasts { position: fixed; inset-inline: 0; bottom: max(16px, env(safe-area-inset-bottom, 0px)); display: grid; justify-items: center; gap: 8px; z-index: 60; pointer-events: none; }
.sd-toasts > * { pointer-events: auto; box-shadow: 0 8px 24px -8px rgb(24 24 29 / 0.3); }
@media (max-width: 760px) { .sd-desk { padding: 0; } .sd-page { border: 0; border-radius: 0; box-shadow: none; padding: 24px 16px 56px; } .sd-title { font-size: 24px; line-height: 30px; } }
"""

body = json.dumps(D, ensure_ascii=False, separators=(",", ":"))
out = js % (len(body) // 1024, body)
open(os.path.join(PROTO, "mod-a-ssp-data.js"), "w").write(out)
open(os.path.join(PROTO, "mod-a-ssp-data.css"), "w").write(css)
peek = """// Print a short view of PA.SSP for module authors: node ssp-peek.js [code ...]
global.window = { PA: {}, addEventListener() {} }; global.location = { hash: "" }; global.document = { getElementById() { return null; } };
require("./mod-a-ssp-data.js");
const D = window.PA.SSP, args = process.argv.slice(2);
if (args.length) { for (const c of args) console.log(JSON.stringify(D.ctl(c), null, 1)); process.exit(0); }
const short = (o) => JSON.stringify(o).slice(0, 300);
for (const [k, v] of Object.entries(D)) if (typeof v !== "function") console.log(k.padEnd(16), Array.isArray(v) ? `[${v.length}] ` + short(v[0]) : short(v));
"""
open(os.path.join(PROTO, "ssp-peek.js"), "w").write(peek)
print("controls", len(controls), "placeholders", len(ph), "on satisfied", len(ph_sat), "understated", len(under), "overstated", len(over), "noreq", len(noreq), "changed", changed)
print("bytes", len(out))
