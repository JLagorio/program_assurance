# Jobs for the v2 screenshots: python3 -I jobs2.py <SP> <html> → v2/ba/jobs-v2.json (and jobs-v2new.json for the screens v2 adds)
import json, os, sys, glob
SP, html = sys.argv[1], sys.argv[2]; V = SP + "/vanta"; BA = V + "/v2/ba"
old = open(V + "/proto/mod-zz-compare-data.js").read(); old = json.loads(old[old.index("{"):old.rindex("}") + 1])
pn = json.load(open(BA + "/pairs-new.json"))
# The record and panel pairs of version 6 were drawn with the preview open: open the first preview on the screen.
PANEL = {"evidence-record", "policy-record", "integration-drawer", "person-drawer", "access-review", "risk-record", "supplier-record"}
ROUTE = {"policy-editor": "policy-editor", "role-task-sets": "people-task-sets"}
jobs = []
for p in old["pairs"]:
    r = ROUTE.get(p["id"]) or p.get("route") or p.get("afterRoute")
    j = {"file": p["id"] + "-v2.png", "html": html, "route": r}
    if p["id"] in PANEL: j["panel"] = "first"
    if p["id"] == "test-page": j = {"file": j["file"], "html": html, "route": None, "steps": [{"go": "checks", "wait": 600}, {"jsclick": '#main [data-panel="a-tests-check"]'}], "expect": "checks"}
    jobs.append(j)
for p in pn["pairs"]:
    jobs.append({"file": p["id"] + "-v2.png", "html": html, "route": p["route"]})
json.dump(jobs, open(BA + "/jobs-v2.json", "w"), indent=0)
# Screens the chain agents added (newscreens.json). v2: the screen; v1: what v1 showed instead (the preview whose ↗ did nothing,
# or the same place in v1), shot from the frozen v1 build with the same recipe.
V1 = V + "/proto/out/prototype-v1.html"
src = {x["id"]: x for x in json.load(open(BA + "/findsrc.json"))} if os.path.exists(BA + "/findsrc.json") else {}
REQ = '#main [data-panel="v7p-req"][data-id="REQ-200"]'
WIZ = [{"go": "program-new", "wait": 800}, {"repeat": '[data-pn="next"]', "untilHash": "program-new-review", "max": 8, "wait": 450}, {"click": '[data-pn="create"]', "wait": 3800}]
GATE = '#main [data-panel="a-work-gate"][data-id="pdr"], #main [data-panel="risk-gate"][data-id="pdr"]'
SYS = [{"go": "program-new", "wait": 800}, {"repeat": '[data-pn="next"]', "untilHash": "program-new-systems", "max": 3, "wait": 450}]
C2 = {  # id: (v2 job, v1 job)
  "new-program-page": ({"route": None, "steps": WIZ, "page": "prog"}, {"route": None, "steps": WIZ, "page": "prog"}),
  "new-program-empty": ({"route": None, "steps": [{"click": '#main .pn-trow [data-go="requirements"]', "wait": 600}], "page": "prog"},
                        {"route": None, "steps": [{"click": '#main [data-go="requirements"]', "wait": 600}], "page": "prog"}),
  "onboarding-task": ({"route": "person-local-developer-onboarding", "click": '#main [data-panel="v8d-ob"]'}, {"route": "person-local-developer-onboarding"}),
  "add-person": ({"route": "people", "click": '#main [data-modal="v2c-add-person"]'}, {"route": "people"}),
  "campaign-controls": ({"route": "campaign-controls"}, {"route": "campaign"}),
  "added-asset": ({"route": None, "steps": [{"go": "inventory"}, {"click": '#main [data-modal="v2c-add-asset"]'}, {"fill": ["#v2c-a-name", "Ground Test Set"]}, {"fill": ["#v2c-a-lru", "LRU-021"]}, {"click": '#modal [data-v2c-act="add-asset"]', "wait": 800}], "page": "asset"}, {"route": "inventory"}),
  "campaign-conmon": ({"route": "campaign-conmon"}, {"route": "assessments"}),
  # The requirement's page folded into its preview on Requirements (Josef, 19 Nov): shoot the preview with its Chain card.
  "rec-requirement": ({"route": "requirements", "click": REQ}, {"route": "requirements", "click": REQ}),
  # Wave 4 (19 Nov): the lifecycle (G) and host systems with the authorization boundary (H). v1 is the place it lived, or nearest.
  "lifecycle": ({"route": "lifecycle-increment-2"}, {"route": "schedule"}),
  "gate-pdr": ({"route": "lifecycle-pdr-2"}, {"route": "schedule", "click": GATE}),
  "gate-ato": ({"route": "lifecycle-ato-1"}, {"route": "authorization"}),
  "overview-strip": ({"route": "overview"}, {"route": "overview"}),
  "schedule-tasks": ({"route": "schedule"}, {"route": "schedule"}),
  "my-work-due": ({"route": "my-work"}, {"route": "my-work"}),
  "programs-stage": ({"route": "portfolio"}, {"route": "portfolio"}),
  "boundary-ato": ({"route": "boundary"}, {"route": "interconnections"}),
  "hosts": ({"route": "hosts"}, {"route": "common-controls"}),
  "program-new-host": ({"route": None, "steps": SYS, "page": "pnh", "expect": "program-new-systems"}, {"route": None, "steps": SYS, "page": "pnh", "expect": "program-new-systems"}),
}
# What a screen is now, where its agent's newscreens.json says what it was.
OV = {"rec-requirement": {"title": "A requirement's chain, in its preview", "route": "rec--v7p-req--REQ-200",
                          "v1": "The requirement preview listed the controls it maps, and its ↗ did nothing. The chain was on no screen."},
      "boundary-ato": {"v1": "No boundary page. Interconnections listed the external connections; the bubble was a figure in the SSP, with no host system, provider or interface crossing the line."},
      "lifecycle": {"also": ["lifecycle"]},
      "hosts": {"v1": "No host system. Settings › Common control providers listed four providers, and only the identity provider's 15 controls applied to WS-X90."}}
new, pairs = [], []
for f in sorted(glob.glob(V + "/v2/*/newscreens.json")):
    try: L = json.load(open(f))
    except Exception as e: print("skip", f, e); continue
    for s in L:
        s = {**s, **OV.get(s["id"], {})}
        base = s["id"][4:] if s["id"].startswith("new-") and s["id"] not in C2 else s["id"]
        sid = "new-" + (s["id"][4:] if s["id"].startswith("new-") else s["id"])
        if s["id"] in C2:
            a, b = C2[s["id"]]
            new.append({"file": sid + "-v2.png", "html": html, **a}); new.append({"file": sid + "-v1.png", "html": V1, **b})
        elif s["route"].startswith("rec--"):
            new.append({"file": sid + "-v2.png", "html": html, "route": s["route"]})
            x = src.get(s["id"])
            if x and x.get("v1route"):
                new.append({"file": sid + "-v1.png", "html": V1, "route": x["v1route"], "click": '#main [data-panel="%s"][data-id="%s"]' % (x["kind"], x["rid"].replace('"', '\\"'))})
        else:
            j = {"file": sid + "-v2.png", "html": html, "route": s["route"]}
            if s.get("open"): j["click"] = '#main [data-panel="%s"]' % s["open"]["kind"]
            new.append(j)
        pairs.append({"id": sid, "group": "v2new", "title": s["title"], "route": s["route"] if not s["route"].startswith("program-new") else "program-new", "v1none": s.get("v1") or "v1 had no screen for this.", **({"also": s["also"]} if s.get("also") else {})})
json.dump(new, open(BA + "/jobs-v2new.json", "w"), indent=0)
grp = [{"key": "v2new", "short": "New in v2", "label": "Screens v2 adds", "intro": "Screens v1 did not have, and five whose shape a 19 November request changed (the Overview, Schedule, My work, Programs and Create program's Systems step). Where a preview's ↗, a link or a button led nowhere in v1, v2 draws the page it names; v1 shows what was there instead."}] if pairs else []
json.dump({"groups": grp, "pairs": pairs}, open(BA + "/pairs-v2new.json", "w"), indent=1)
print(len(jobs), "v2 jobs;", len(new), "jobs for", len(pairs), "new screens")
