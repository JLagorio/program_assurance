import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda s: "provisional: " + s
F = []
def f(i, st, v1, v2, ev): F.append({"id": i, "status": st, "v1": v1, "v2": v2, "evidence": ev})
# Flows
f("B1","partly","52 of 74 dialogs change nothing (27 toast success, 25 close silently)","Same 74 openers: 49 say 'Not saved: … isn't wired', 13 change state, 1 toast only, 0 silent. The chain's page-header openers (Plan an assessment a-tests-plan, Create POA&M item, Create risk, Request acceptance, Link evidence, Create task, Assign a role, SI-2 Add evidence) still change nothing; C1's preview-side verbs not yet re-walked","R/flows/msr-v2.json (adapted modalsweep2)")
f("B2","partly","11 of 11 My work rows land unfiltered","9 of 11 land filtered or with the record open; 'Treat 2 critical risks' still lands on Risks Register 40 / All 40; 'Resolve 17…' row not yet re-tested (label changed)","R/flows/out-j2b.txt")
f("B3","partly",P("↗ dead on 46 of 54 previews"),P("↗ navigates on 40 of 41 previews that opened with the review's keys; 13 previews still to open by fallback"),"R/flows/panelsweep-v2.json")
f("B4","partly","SA-24's Map a requirement, header Map a requirement and Add a note do nothing","Preview and header Map a requirement open a dialog; Add a note gone; status movement not yet re-walked","R/flows/out-j3b.txt")
f("B5","partly","SSP submit and Victor's reassignment don't reach My work, Review, Authorization, People","Authorization row reads In review, waits on Joel Barrantes; My work drops 'Submit SSP 3'; access review names Nadia Fournier, Victor 'No open tasks'; Review queue listing not confirmed","R/flows/out-j7f.txt, out-j8c.txt")
f("B6","fixed","New program keeps WS-X90's switcher and links; gone once you leave (Programs All 9)","Switcher names PRG-2301; starter guide opens its own empty Requirements, Sources, SSP, Assessments; Programs All 10; Home lists it","R/flows/out-j1c.txt")
f("B7","partly",P("nine pairs of numbers disagree"),P("Campaign tracker 368 = All 368; Findings Vulnerabilities 4 = 4 open; other pairs not yet re-read"),"R/flows/out-j6b.txt, out-j2c.txt")
f("B8","partly",P("10 registers arrive with rows ticked"),P("Controls and Vulnerabilities arrive with nothing ticked; full sweep pending"),"R/flows/out-j3b.txt, out-j2d.txt")
f("B9","partly",P("~17 header actions do nothing"),P("Controls Map a requirement opens its dialog; others pending"),"R/flows/out-j3b.txt")
f("B10","partly","22 dialogs close with Required fields empty; Upload › Add evidence with no file toasts 'Added, pending review'","Required fields now hold the primary and name the field; Upload › Add evidence with no file still closes and toasts 'Added, pending review' (count stays 368)","R/flows/out-j4b.txt, R/flows/msr-v2.json trails")
f("B11","partly","SSP fixes land at the top; SI-2 campaign → list; Home offer → register","Draft a rationale lands on section 2, focused and in view; SI-2 and Home not yet re-walked","R/flows/out-j7c.txt")
f("B12","fixed","Issue and POA&M previews don't show the risk; issue offers Create POA&M item though it has one","Issue preview lists POA&M item 1 and Risk 1 'Risk arising from REQ-100', offers Open POA&M item","R/flows/out-j5b.txt")
f("B13","partly",P("no Add person; onboarding tasks can't open"),P("not yet re-walked"),"pending")
f("B14","partly","Keep/Revoke don't move 11 of 18; Complete does nothing","Keep moves the count (j8c: 11→10, the 2nd Keep un-decided an account); Complete review not yet read with v2's toast","R/flows/out-j8c.txt")
f("B15","partly",P("step 2 / step 3 references wrong"),P("not yet re-read"),"pending")
f("B16","partly",P("Home has no Create program"),P("not yet re-read"),"pending")
f("B17","partly",P("Control, Asset, Inheritance, Risk, Gate preview actions do nothing"),P("Control preview's Add a note gone; rest pending"),"pending")
# Distance
for i in ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12","A13","A14","A15","A16","A17","A18","A19","A20","A21","A22"]:
    F.append({"id": i, "status": "partly", "v1": P("see gap/distance/findings.json"), "v2": P("not yet re-measured"), "evidence": "pending"})
for i in ["N%02d" % k for k in range(1, 20)]:
    F.append({"id": i, "status": "partly", "v1": P("see gap/noise/findings.json"), "v2": P("not yet re-measured"), "evidence": "R/noise/raw-v2 (measure.mjs ran; analysis pending)"})
new = [
 {"where": "assessments, poam, risks (page headers)", "what": "Two paths to one verb: C1 wired Plan an assessment (v2k-plan) and Create POA&M item / Create risk from previews, but the old header openers (a-tests-plan, a-risk-poam-new, a-risk-new-risk) remain and now say 'Not saved: … isn't wired'", "severity": "high", "how to see it": "#assessments: two 'Plan an assessment' spans, data-modal v2k-plan and a-tests-plan; #poam header Create POA&M item → fill Title → 'Not saved'"},
 {"where": "evidence › Add evidence › Upload a file", "what": "Still a fake success: Add evidence with no file closes and toasts 'Added, pending review'; All stays 368", "severity": "medium", "how to see it": "#evidence → Add evidence → Upload a file → Add evidence"},
]
out = {"reviewer": "R", "state": "FIRST PASS (21:31): entries marked 'provisional' are not yet re-measured; statuses will change",
       "build": {"file": "SP/vanta/proto/out/prototype.html", "md5": "3677abb92ab7424b7da8cc3079b45d12", "snapshot": "SP/vanta/v2/R/v2-snap.html (21:19)"},
       "findings": F, "new": new}
json.dump(out, open(os.path.join(R, "review.json"), "w"), indent=1, ensure_ascii=False)
print("wrote", len(F))
