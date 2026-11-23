import json, sys
p = sys.argv[1]; d = json.load(open(p))
P = {x["id"]: x for x in d["pairs"]}
P["b-evidence-register"]["changes"].append({"n": 8, "rec": 9, "title": "STIG checklists join the list", "text": "V3's seven STIG checklists are rows of the register, Source STIG checklist, each with its run date and renewal; a saved view lists them, and the drawer shows their open rules by CAT.", "drata": "Evidence collected by a connection sits in the one library beside uploaded files, marked by where it came from.", "ev": ["images/ux/evidence/drata-evidence-library-sync--01.png"]})
P["b-evidence-record"]["changes"].append({"n": 6, "rec": 8, "title": "One store for every link", "text": "Link controls here, in the picker or on the Drata control record, and it is one link: the control record's evidence and the renewal check read the same store, and a renewal here lowers the check's count.", "drata": "Evidence and controls are linked once and shown from both sides.", "ev": ["images/ux/evidence/evidence-overview--01.png"]})
ix = [x["id"] for x in d["pairs"]].index("b-evidence-automated") + 1
d["pairs"].insert(ix, {"id": "b-evidence-checklist", "title": "STIG checklist as evidence", "group": "evidence", "new": False,
  "current": {"route": "stigs-mission-computer-rhel9", "note": "A checklist is its own page under Evidence's STIG kind: no renewal date, no evidence status, no controls it evidences"},
  "after": {"route": "dr-evidence--ckl-mission-computer-rhel9"},
  "changes": [
    {"n": 1, "rec": 9, "title": "A checklist is fixed evidence", "text": "Each STIG checklist is evidence from its source: every import is a fixed version, with no delete, and the record offers Fix or disable the source.", "drata": "Evidence pulled from a connection is read-only and versioned; it is fixed at the source.", "ev": ["images/ux/evidence/delete-evidence-new-experience--02.png"]},
    {"n": 2, "rec": 9, "title": "Its open rules on the record", "text": "The record lists the open rules by CAT (2 · 21 · 6 for RHEL 9), the first five with a link to all, and Results: rules, not a finding, not applicable, not reviewed, compliance.", "drata": "Evidence a test produced shows what the test found beside the artifact.", "ev": ["images/ux/evidence/drata-evidence-library-sync--06.png"]},
    {"n": 3, "rec": 7, "title": "Renewal is the next import", "text": "The renewal date is the next import V3 schedules (RHEL 9: Jan 11, 2027; the switch: Nov 16, past due). A run of its source on the sources screens renews it.", "drata": "Evidence from a connection renews with each sync.", "ev": ["images/ux/evidence/drata-evidence-library-sync--06.png"]},
    {"n": 4, "rec": 8, "title": "The controls it evidences", "text": "Its linked controls are its source's (CM-6, CM-7, CM-2, IA-5, AU-12 and their enhancements in the baseline), each a code chip with its status, cited by its rules.", "drata": "Evidence shows the controls it maps to, each with its readiness.", "ev": ["images/ux/evidence/evidence-overview--01.png"]}]})
ix = [x["id"] for x in d["pairs"]].index("b-import") + 1
d["pairs"].insert(ix, {"id": "b-import-poam", "title": "Import a POA&M spreadsheet", "group": "evidence", "new": True,
  "current": {"route": "findings-poam", "note": "POA&M items are created one at a time under Findings; nothing imports a POA&M sheet"},
  "after": {"route": "dr-import--poam"},
  "changes": [
    {"n": 1, "rec": 10, "title": "The POA&M's own columns", "text": "Map columns lists a POA&M sheet's headers (item ID, weakness, security control number, milestones, scheduled completion, status, POC, severity) with WS-X90's first three items as their values and the preview.", "drata": "Bulk import maps each incoming column to a destination field, with a preview.", "ev": ["images/ux/assets/bulk-import-assets--03.png"]},
    {"n": 2, "rec": 10, "title": "Its status words become ours", "text": "Ongoing, Completed, Risk Accepted and Not Applicable map to WS-X90's POA&M statuses; Not Applicable rows are skipped unless mapped.", "drata": "Value mapping turns the sheet's words into the product's options.", "ev": ["images/ux/tasks/bulk-import-custom-tasks--04.png"]},
    {"n": 3, "rec": 10, "title": "Red blocks, amber updates", "text": "21 of WS-X90's POA&M items and three open CAT I STIG rules not on it yet: unknown control codes and missing completion dates are red; a changed status or date is amber.", "drata": "Invalid cells are red and block Submit; a yellow cell updates a record that exists.", "ev": ["images/ux/assets/bulk-import-assets--06.png", "images/ux/assets/bulk-import-assets--08.png"]},
    {"n": 4, "rec": 27, "title": "Counts before it runs", "text": "Confirm counts the POA&M items it creates and updates, and the rows it leaves alone, before Import.", "drata": "The confirmation states the create and update counts.", "ev": ["images/ux/assets/bulk-import-assets--12.png"]}]})
for c in d["components"]:
    if c["id"] == "sheet": c["used"] = "dr-import, Review: All / Valid / Invalid with red and amber cells, for an SCTM and for a POA&M"
    if c["id"] == "steps": c["used"] = "dr-import: the five-step flow, with each sheet's own columns and values"
d["derived"] += [
  "STIG checklists as evidence: V3's seven checklists, read as V3's evidence register reads them (the old STIG register's rows and each checklist's preview); renewal date = the next import V3 schedules; a finished run of its source on lane C's screens renews it; its controls are its source's (lane C).",
  "POA&M sample: 21 of WS-X90's open POA&M items that name a weakness and a control, each with a team member as POC (the items record none); three new rows from the RHEL 9 and Windows 11 checklists' open CAT I rules (CM-6, due 30 days after import); one row each Completed, Risk Accepted and Not Applicable; every fifth date 60 days later; four cells wrong on purpose.",
  "PA.drB.renewalCheck counts evidence with an artifact (not an automated item in error): failing = past renewal or inside its upcoming window. 56 of 297 at reset (V3's own test says 54)."]
d["open"] = []
d["added"] = [
  {"text": "STIG checklists are evidence: fixed versions, open rules by CAT, renewal at the next import", "pair": "b-evidence-checklist", "route": "dr-evidence--ckl-mission-computer-rhel9"},
  {"text": "The seven checklists in the evidence register, Source STIG checklist", "pair": "b-evidence-register", "route": "dr-evidence"},
  {"text": "Importing a POA&M: its own columns, status words and WS-X90's own items", "pair": "b-import-poam", "route": "dr-import--poam"},
  {"text": "One store for links and renewals: the control record and the renewal check show them", "pair": "b-evidence-record", "route": "dr-evidence--v3x-ev-270"}]
json.dump(d, open(p, "w"), indent=1, ensure_ascii=False)
print("B pairs", [(x["id"], len(x["changes"])) for x in d["pairs"]])
