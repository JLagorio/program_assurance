import json, sys
p = sys.argv[1]; d = json.load(open(p))
d["pairs"].append({"id": "c-checklist-scope", "title": "A checklist's Scope and Matching", "group": "automation", "new": False,
  "current": {"route": "evidence-sources", "panel": {"kind": "v3w-source", "id": "stig-sw"}, "note": "The switch's checklists: a preview with state, cadence and imports; nothing says which host it read, which component it counts for, or which rules"},
  "after": {"route": "dr-source--stig-sw--scope"},
  "changes": [
    {"n": 1, "rec": 14, "title": "Every source has the same tabs", "text": "A STIG checklist, an SBOM and a container scan now open on Overview, Scope, Matching and Runs, as ACAS and the identity source do; a source not connected says so on each.", "drata": "Every connection opens on the same tabs, whatever it connects.", "ev": ["images/ux/connections/understanding-connections-in-drata--03.png"]},
    {"n": 2, "rec": 14, "title": "Scope: its component and its rules", "text": "The switch's scope is one component and the rules of its two STIGs: 65 rules, 4 not applicable, 61 in scope, 6 open, from V3's checklists, each a link to its checklist.", "drata": "Scoping says which resources a connection counts, with live counts.", "ev": ["images/ux/connections/aws-integration-guide-infrastructure-user-access-review--03.png"]},
    {"n": 3, "rec": 13, "title": "Matching: the host it ran on", "text": "Matching shows the host the checklist ran on, lru-009-esw at 10.20.3.31, matched to the Internal Ethernet Switch by the checklist's asset.", "drata": "Each resource a connection reads is linked to a person or an asset, with its link state.", "ev": ["images/ux/connections/map-accounts-to-personnel-in-drata-new-experience--02.png"]}]})
d["pairs"].append({"id": "c-runs", "title": "Runs that finish", "group": "automation", "new": False,
  "current": {"route": "evidence-sources", "panel": {"kind": "v3w-source", "id": "stig-gw"}, "note": "Import file adds a row that stays queued; ACAS's November import reads Importing for days"},
  "after": {"route": "dr-source--stig-gw", "click": "#main .drk-head-a .btn.ink"},
  "changes": [
    {"n": 1, "rec": 11, "title": "A run moves, then finishes", "text": "Import file, Run now and Connect queue a run that reads Queued, then Running while the sync steps light one by one, then Done within four seconds.", "drata": "A sync shows its state while it runs and its result when it is done.", "ev": ["images/ux/connections/understanding-connections-in-drata--03.png"]},
    {"n": 2, "rec": 11, "title": "Counts from the last run", "text": "A finished run reads what V3 holds for the source (the gateway: 139 rules, 11 open); Last run, Health and the register update, and its checklists' evidence renews.", "drata": "A connection's last sync and health update when a sync finishes.", "ev": ["images/ux/connections/understanding-connections-in-drata--04.png"]},
    {"n": 3, "rec": 11, "title": "It holds across pages", "text": "A run's state follows from when it was asked, kept in the session, so leaving the page and coming back shows it done, and the register updates while open.", "drata": "Syncs run in the background while the user works elsewhere.", "ev": ["images/ux/connections/ad-hoc-identity-and-account-resync--02.png"]}]})
d["derived"] += [
  "A checklist source's host: the scanner's host for its component's LRU (lru-001-mc, lru-009-esw, lru-007-pngw, lru-019-mlt); SBOM and container images named for their component; its rules and their counts are V3's checklists, read through lane B.",
  "A STIG source's cadence: its checklists' own next import as V3 schedules it (RHEL 9, switch and gateway 90 days, ASD 180, Windows 11 30), so a source and its checklist evidence agree; it was 30 days for all.",
  "Run timing: Queued for 1.5 s, Running until 4 s, then Done, from the moment it was asked (kept in the session). A run reads the source's last applied import from V3; a source that never ran reads, for the inventory export, V3's component inventory, and for Jira no count.",
  "A V3 import still pending (ACAS's November scan, the switch's queued checklist, the PIC's SBOM) is taken over by a run asked here, which finishes it."]
d["open"] = []
d["added"] = [
  {"text": "A STIG checklist source has Scope: its one component and the rules of its STIGs", "pair": "c-checklist-scope", "route": "dr-source--stig-sw--scope"},
  {"text": "Matching shows the host the checklist ran on, matched to its component", "pair": "c-checklist-scope", "route": "dr-source--stig-sw--matching"},
  {"text": "Import file queues a run: Queued, Running, Done, and the source updates", "pair": "c-runs", "route": "dr-source--stig-gw", "click": "#main .drk-head-a .btn.ink"}]
json.dump(d, open(p, "w"), indent=1, ensure_ascii=False)
print("C pairs", [(x["id"], len(x["changes"])) for x in d["pairs"]])
