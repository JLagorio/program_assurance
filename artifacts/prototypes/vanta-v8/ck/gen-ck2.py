# Writes src/mod-zzzz-v5-ck2-data.js: one Canvas Kit mockup spec for each prototype screen that
# mod-zzzz-v5-ck.js does not draw. The data comes from ck/today.json, read from today's screens by
# ck/read-today.mjs (one entry a route in ck/today-routes.txt), so each mockup carries the screen's own words
# and rows. SPEC below says, for each screen, where it sits and what changes; it overrides the parts read.
#   python3 -I ck/gen-ck2.py
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
today = json.load(open(os.path.join(here, "today.json")))
routes = dict(l.split(":", 1) for l in open(os.path.join(here, "today-routes.txt")).read().split())


def split_n(t):
    m = re.match(r"^(.*?)\s*(\d[\d,]*)$", t)
    return [m.group(1), m.group(2)] if m and m.group(1) else [t, None]


def find(t):
    return t.replace("Search ", "Find ", 1) if t.startswith("Search ") else t


def tb_of(v):
    tb = v.get("tb")
    if not tb:
        return None
    items = [i for i in tb["items"] if i]
    prim = None
    if items and re.match(r"^(Add|Create|Plan|Share|Import|Request|Generate|Run)\b", items[-1]):
        prim = items.pop()
    filters = []
    for i in items:
        w = i.split(" ")[0].replace("⌄", "").strip()
        if w in ("More", "Clear") or not w:
            continue
        if i.endswith("⌄"):
            w = i.replace("⌄", "").strip()
        filters.append(w)
    return {"ph": find(tb["ph"] or ""), "filters": filters[:4], "primary": prim}


def table_block(b, h=None, rows=8):
    t = b["table"]
    return {"k": "table", "h": b["h"] if h is None else h, "cols": t["cols"], "rows": t["rows"][:rows], "n": t["n"], "foot": b.get("foot", "")}


def default(id_):
    v = today[id_]
    s = {
        "h1": v["title"], "status": (v["pills"] or [None])[0], "acts": [[re.sub(r"\s*⌄$", "", a), p] for a, p in v["acts"]],
        "sub": v["sub"], "tabs": [], "tabOn": None, "seg": [], "segOn": None, "tb": tb_of(v), "main": [], "side": [], "crumbs": v["crumbs"],
    }
    for t, on in v["tabs"]:
        lab, n = split_n(t)
        s["tabs"].append([lab, n])
        if on:
            s["tabOn"] = lab
    for t, on in v["views"]:
        lab, n = split_n(t)
        s["seg"].append([lab, n])
        if on and not s["segOn"]:
            s["segOn"] = lab
    if v["next"]:
        s["next"] = v["next"].replace("NEXT STEP ", "")
    for b in v["blocks"]:
        if b.get("table"):
            blk = table_block(b)
        elif b.get("dl"):
            blk = {"k": "dl", "h": b["h"], "rows": b["dl"]}
        elif b.get("li"):
            blk = {"k": "list", "h": b["h"], "items": [split_n(x) for x in b["li"]]}
        else:
            blk = {"k": "text", "h": b["h"], "p": b.get("text", "")}
        (s["side"] if b["aside"] else s["main"]).append(blk)
    return s


# ——— What each screen is, where it sits and what changes ———
PROG = ["Programs", "WS-X90"]
SPEC = {}

SPEC["activity"] = dict(title="Program activity", group="The program", on="Overview", crumbs=PROG, status=None,
    notes=["Activity is a tab of the program beside Overview and Team, as today, and its rows are a Canvas Table.",
           "Who did it is an Avatar; the daily job, which is nobody, stays plain text.",
           "Kind and Who are Selects in the toolbar; the search reads Find activity."])
SPEC["gate"] = dict(title="Lifecycle gate (PDR)", group="The program", on="Overview", crumbs=PROG + ["Overview", "PDR"],
    notes=["The gate's status moves into Details, the first line, so the header holds the name and the actions alone.",
           "Next step is an info Banner with its action (Open 14 controls), not a strip of grey text.",
           "Deliverables and criteria are Tables in cards counted in their headings (2 of 5 ready); Ready and Met read as StatusIndicators.",
           "Record as Marcus Ryde stays the one primary."])
SPEC["itcsc"] = dict(title="IT categorization and selection checklist", group="The program", on="Documents", crumbs=PROG + ["Documents", "ITCSC"],
    acts=[["Export as AF ITCSC", False], ["Import", False], ["Start version 4", True]],
    notes=["The re-approval notice is a caution Banner with View interconnections.",
           "Checklist, Summary, Approval, History, Comments and Activity are Tabs with Count badges.",
           "The information types and their impact levels are a Table whose High, Moderate and Low read as StatusIndicators.",
           "The baseline the checklist selects is a card of layers with the running count."])
SPEC["programnew"] = dict(title="Create program", group="The program", nav="workspace", on="Programs", crumbs=["Programs", "Create program"])
SPEC["providers"] = dict(title="Host and providers", group="The program", on="System", crumbs=PROG, h1="System",
    notes=["Host and providers is a tab of System with its count, beside Components, Connected systems and Connections.",
           "Authorized and Not authorized read as StatusIndicators; each provider's AO is an Avatar.",
           "Add provider is the toolbar's small primary."])
SPEC["connected"] = dict(title="Connected systems", group="The program", on="System", crumbs=PROG, h1="System",
    notes=["An expired MOU reads in critical and a draft ISA in caution, each with its icon, not colour alone.",
           "Agreement is a Select in the toolbar with its counts.",
           "Add connected system is the toolbar's small primary."])
SPEC["connections"] = dict(title="Connections", group="The program", on="System", crumbs=PROG, h1="System",
    notes=["Each connection names its link under its title; the direction arrow sits between its two ends.",
           "Boundary, Agreement and PPSM are Selects in one toolbar row.",
           "Crosses reads as a caution StatusIndicator and Inside as neutral."])
SPEC["syscomp"] = dict(title="System component (Mission Computer)", group="The program", on="System",
    crumbs=PROG + ["System", "Mission Computing Subsystem", "Mission Computer"],
    acts=[["More", False], ["Add", True]],
    notes=["The component's code and where it sits (Inside the boundary) move into Details, so the header holds the name and the actions.",
           "Take version 2 is an info Banner's action, since version 2 fixes CVE-2024-6387.",
           "Completion is a card with the share satisfied as a big number and a bar, and the two measures under it.",
           "Owner reads Unassigned with an Assign tertiary button, beside the other facts."])
SPEC["coverage"] = dict(title="Controls coverage by component", group="Controls and requirements", on="Controls", crumbs=PROG,
    notes=["Coverage is a tab of Controls beside List and Workbook; Heatmap and Table are a Segmented Control.",
           "Each cell is a count tinted on Canvas's blue scale, and a zero is left blank.",
           "Component rows keep their tree indent; the totals row and column are bold."])
SPEC["gap"] = dict(title="Gap assessment", group="Workspace and library", nav="library", on="Frameworks & overlays", crumbs=["Library", "Frameworks & overlays"],
    notes=["Gap assessment is a tab beside Baselines and Overlays.",
           "Where WS-X90 stands is a stacked bar per baseline; the gap is a link to the controls it leaves out.",
           "Removed by a layer and Never selected are a Segmented Control over the table of controls left out."])
SPEC["evsources"] = dict(title="Evidence sources", group="Evidence, documents and assessments", on="Evidence", crumbs=PROG,
    notes=["Sources is a tab of Evidence with its count.",
           "Overdue, Import failed and Importing read as StatusIndicators with icons.",
           "Add source is the toolbar's small primary."])
SPEC["artifact"] = dict(title="Evidence artifact", group="Evidence, documents and assessments", on="Evidence", crumbs=PROG + ["Evidence", "Authorized internal-connection register…"],
    notes=["Waiting on review moves into Details; Accept stays the one primary and Request changes is secondary.",
           "Cited by and Versions are Tables in cards with their counts.",
           "Renew by reads Set a date as a tertiary button."])
SPEC["policy"] = dict(title="Policy (AC-1)", group="Evidence, documents and assessments", on="Documents", crumbs=PROG + ["Documents", "Access control"])
SPEC["plan"] = dict(title="Contingency plan (editor)", group="Evidence, documents and assessments", on="Documents", crumbs=PROG + ["Documents", "Contingency plan"])
SPEC["ssphistory"] = dict(title="SSP version history", group="Evidence, documents and assessments", on="Documents", crumbs=PROG + ["Documents", "SSP", "Version history"])
SPEC["isa"] = dict(title="Connection and its agreement (ISA)", group="The program", on="System", crumbs=PROG + ["System", "Connections", "Ground data link"],
    acts=[["More", False], ["Add port", True]],
    notes=["Agreement signed moves into Details; Add port is the one primary.",
           "Ports and protocols, Controls it bears on and Components it joins are Tables in cards with counts.",
           "The agreement's dates and parties are a card of labelled facts."])
SPEC["cybertest"] = dict(title="Cyber test", group="Evidence, documents and assessments", on="Assessments", crumbs=PROG + ["Assessments", "Cyber tests", "CVI FY2027"],
    acts=[["Plan the test", True]],
    notes=["Planned moves into Details; with no test plan yet, Plan the test is the one primary and the Banner says why.",
           "Overview and Findings are Tabs with counts.",
           "The lead is an Avatar in Details."])
SPEC["check"] = dict(title="Monitoring check", group="Evidence, documents and assessments", on="Assessments", crumbs=PROG + ["Assessments", "Monitoring checks", "Privileged account review"],
    notes=["Due soon moves into Details as the check's Status; Record a run is the one primary.",
           "What it covers is a Table of controls with their status.",
           "Overview, Runs and Findings are Tabs with counts."])
SPEC["checks"] = dict(title="Monitoring checks", group="Evidence, documents and assessments", on="Assessments", crumbs=PROG, h1="Assessments",
    notes=["Monitoring checks is a segment of the assessment kinds; Overdue, Due soon and On schedule read as StatusIndicators.",
           "Under way and Needs attention are cards above the table: a big number with its bar, and counts that open the rows.",
           "Plan an assessment is the toolbar's small primary."])
SPEC["sar"] = dict(title="Assessment results", group="Evidence, documents and assessments", on="Assessments", crumbs=PROG + ["Assessments", "Expanded control set assessment"],
    acts=[["More", False], ["Publish results", True]],
    notes=["Results is a tab of the campaign with its count; Publish results is the one primary.",
           "The Banner says a draft decides nothing until the lead assessor publishes it.",
           "Published and Draft read as StatusIndicators; who published is an Avatar."])
SPEC["finding"] = dict(title="Finding record", group="Findings and risks", on="Findings", crumbs=PROG + ["Findings", "Operational issues", "Payload arm and release commands…"],
    notes=["Critical moves into Details as its Severity, so the header holds the name and the actions.",
           "Nobody owns it is a caution Banner whose action is Assign owner, the one primary.",
           "The plan's milestones are a Table where Past its date reads in critical, with Mark reached as a tertiary button.",
           "Risk, Control and Components are cards with their counts."])
SPEC["risk"] = dict(title="Risk record", group="Findings and risks", on="Risks", crumbs=PROG + ["Risks", "Payload arm and release records…"],
    notes=["Critical moves into Details as its Severity.",
           "Nobody owns it is a caution Banner with Assign owner, the one primary.",
           "Findings behind it and ATT&CK techniques are Tables in cards; technique IDs are set in mono.",
           "Response and Assessment are labelled facts with tertiary Change and Edit buttons."])
SPEC["threats"] = dict(title="Threats (ATT&CK)", group="Findings and risks", on="Risks", crumbs=PROG,
    notes=["Threats is a tab of Risks with its count, beside Register.",
           "Each technique's ID is set in mono before its name; Worst reads as a StatusIndicator.",
           "Matrix and Risks are Selects; Create risk is the toolbar's small primary."])
SPEC["poam"] = dict(title="POA&M", group="Findings and risks", on="Findings", crumbs=PROG,
    notes=["On the POA&M is a saved view of Findings, shown as a selected Pill.",
           "Planned completion reads in critical once it is past; Milestones show as a ring.",
           "Owner is an Avatar, Unassigned with its empty avatar."])
for k, t in [("decisions", "Authorization decisions"), ("conditions", "Authorization conditions"), ("monitoring", "Ongoing authorization"), ("sharing", "Package sharing")]:
    SPEC[k] = dict(title=t, group="The program", on="Authorization", crumbs=PROG)
SPEC["decisions"]["notes"] = ["Decisions is a tab of Authorization with its count; ATO with conditions stays in the line under the title, its status first.",
    "Planned and Decided read as StatusIndicators; Record decision is a tertiary button on the rows still to decide."]
SPEC["conditions"]["notes"] = ["Each open condition has its progress, an Avatar owner, a due date and a tertiary Close.",
    "Open reads as an info StatusIndicator; the count of open conditions sits in the tab."]
SPEC["monitoring"]["notes"] = ["What ongoing authorization owes is a Table whose Overdue, Due soon and On schedule read as StatusIndicators.",
    "Significant changes is its own card with Report a change as a secondary action."]
SPEC["sharing"]["notes"] = ["Who can open the package is a Table with Avatars and what each can do.",
    "Share with a person is the one primary, in the toolbar."]
SPEC["sharing"]["tb"] = {"ph": "Find recipients", "filters": ["Role"], "primary": "Share with a person"}

W = dict(nav="workspace", group="Workspace and library")
SPEC["home"] = dict(W, title="Home", on="Home", crumbs=[])
SPEC["approvals"] = dict(W, title="My work: needs my approval", on="My work", crumbs=[])
SPEC["airuns"] = dict(nav="ai", group="Library and AI agents", title="AI agent runs", on="Runs", crumbs=["AI agents"],
    notes=["AI agents have their own side panel (Runs, Agents) under Workspace.",
           "Waiting, Approved, Partly approved and Rejected are a Segmented Control with counts.",
           "Each run's outcome is a StatusIndicator; who started it is an Avatar; Run an agent is the one primary."])
SPEC["agents"] = dict(nav="ai", group="Library and AI agents", title="AI agents", on="Agents", crumbs=["AI agents"],
    notes=["Each agent says what it reads and what it may write, as suggestions only.",
           "On is a Canvas Switch in the row.",
           "Templates are Pills under the table."])
S = dict(nav="settings", group="Workspace settings", crumbs=["Settings"])
SPEC["wsetup"] = dict(S, title="Workspace setup", on="Workspace setup")
SPEC["deadlines"] = dict(S, title="Deadlines", on="Deadlines")
SPEC["notifications"] = dict(S, title="Notifications", on="Notifications")
SPEC["permissions"] = dict(S, title="Roles & permissions", on="Roles & permissions")
SPEC["enclaves"] = dict(S, title="Enclaves & markings", on="Enclaves & markings")
SPEC["provider"] = dict(S, title="Provider catalog", on="Provider catalog")
SPEC["eventlog"] = dict(S, title="Event log", on="Event log", acts=[["Export CSV", False]],
    notes=["The event log is a Settings page; its kinds are Tabs with counts and All programs or WS-X90 a Segmented Control.",
           "Who is an Avatar; the daily job stays plain text.",
           "The table pages 25 at a time with Canvas Pagination."])
P = dict(nav="products", group="Workspace and library")
SPEC["components"] = dict(P, title="Components", on="Components", crumbs=["Products", "Components"], acts=[["More", False], ["Create component", True]],
    notes=["Components is a register of the product library, in its own side panel.",
           "Behind reads in caution and an open CVE in critical, each with its icon.",
           "Published, Draft, Assessed and Consumers behind are Pills with counts."])
SPEC["suppliers"] = dict(P, title="Suppliers", on="Suppliers", crumbs=["Products", "Suppliers"],
    notes=["Flags read as StatusIndicators (Open CVE, Counterfeit alert, DMSMS notice).",
           "Tier, Review and Owner are Selects; Request from a supplier is the one primary.",
           "A review due soon reads in caution."])
SPEC["delta"] = dict(P, title="Variant delta", on="Products", crumbs=["Products"], h1="Products", acts=[["More", False], ["Create product", True]],
    notes=["Variant delta is a tab beside Products with its count.",
           "The delta is a stacked bar of Inherited, Shared, Changed here and Program only, with the numbers beside it.",
           "Plan delta assessment is an info Banner's action over the table."])
L = dict(nav="library", group="Library and AI agents")
SPEC["integrations"] = dict(L, title="Integrations", on="Integrations", crumbs=["Library"])
SPEC["datacalls"] = dict(L, title="Data calls", on="Data calls", crumbs=["Library"], acts=[["Knowledge base", False], ["Import data call", True]],
    notes=["The conflicts read as a caution Banner with Review conflicts.",
           "Open, Due this month, Conflicts, Sent and All are a Segmented Control.",
           "Progress is a bar with its count and its conflicts in critical."])
SPEC["kb"] = dict(L, title="Data call knowledge base", on="Data calls", crumbs=["Library", "Data calls"], h1="Data calls", acts=[["Import data call", True]],
    notes=["Knowledge base is a tab beside Data calls.",
           "Each source's state and whether it was verified read as StatusIndicators.",
           "Mark as verified is a tertiary button in the row."])
SPEC["datacall"] = dict(L, title="Data call (FY2027 FISMA)", on="Data calls", crumbs=["Library", "Data calls", "FY2027 FISMA annual data call"])
SPEC["reports"] = dict(L, title="Reports & exports", on="Reports & exports", crumbs=["Library"], acts=[["Generate", True]],
    notes=["Each report says who made it, its format and what it reads from, in one Table.",
           "Format, Schedule and Created by are Selects; Generate is the one primary.",
           "Each row's actions are an overflow IconButton."])
SPEC["overlays"] = dict(L, title="Overlays", on="Frameworks & overlays", crumbs=["Library"], h1="Frameworks & overlays", acts=[["Import OSCAL", False], ["Create overlay", True]],
    notes=["Overlays is a tab with its count beside Baselines.",
           "Published, Draft, Applied and Not applied read as StatusIndicators.",
           "What each overlay adds and removes are numbers, right-aligned."])
SPEC["baseline"] = dict(L, title="Baseline (NIST High)", on="Frameworks & overlays", crumbs=["Library", "Frameworks & overlays", "NIST SP 800-53 Rev 5 High"],
    notes=["Overview, Controls and Gap are Tabs with counts.",
           "Completion is a card with the share satisfied, a bar and three counts under it.",
           "Each family is a card with its controls as a Table; status reads as StatusIndicators."])

out = []
for id_, sp in SPEC.items():
    s = default(id_)
    s.update({k: v for k, v in sp.items() if k not in ("title", "group", "notes")})
    out.append({"id": id_, "title": sp["title"], "group": sp["group"], "route": routes[id_], "notes": sp.get("notes", []), "s": s})
open(os.path.join(here, "..", "src", "mod-zzzz-v5-ck2-data.js"), "w").write(
    "// Generated by ck/gen-ck2.py from ck/today.json (today's screens, read by ck/read-today.mjs). Do not edit by hand.\n"
    "window.PA_CK2 = " + json.dumps(out, ensure_ascii=False, indent=0).replace("\n", "") + ";\n")
print(len(out), "screens")
