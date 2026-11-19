// After screens for the risk group (a-risk-): Risks, a risk, Findings, POA&M, Suppliers, a supplier, Package room and Data calls,
// each drawn from BA/dev/risk.final.json with the after kit (window.PA.AK). Values are WS-X90's, copied from mod-risk.js,
// mod-platform.js and mod-system.js (read from the local database on 17 Nov 2026); anything the data does not hold carries Example.
(function () {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const AK = window.PA.AK;
  const { esc, fmt, pct, gl, pill, tag, who, bar, sevPill, dueOf, dueCell } = h;
  const TODAY = data.TODAY;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  // ——— Data copied from mod-risk.js: WS-X90's 44 open operational issues, 41 POA&M items with their milestones, 40 risks, a sample of the 313 determinations ———
  const ISS_RAW = [["1f680dd7","critical","2026-10-21","","Publish the retired key history and reissue the audit direction","Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)","AU-10:other_than_satisfied"],["a4823e25","critical","2026-11-13","","Remove the password-only path and make the switch exchange mutual","Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))","IA-2(2):other_than_satisfied"],["85973641","high","2026-08-07","","Remediate REQ-100","Unmet requirement REQ-100","CM-4:other_than_satisfied"],["e9c669c2","high","2026-08-10","","Remediate REQ-008","Unmet requirement REQ-008","AC-11:other_than_satisfied,AU-4:other_than_satisfied"],["28b99485","high","2026-08-13","","Remediate REQ-068","Unmet requirement REQ-068",""],["a76a9dc1","high","2026-09-24","","Restore state-level visibility and operator attribution at the boundary gateway","Session-table occupancy missing from the gateway counter export, leaving low-rate state exhaustion undetectable (SC-5(3))","SC-5(3):other_than_satisfied"],["4d5a5dfc","high","2026-10-02","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Mission data sessions over the tactical radio never presented to platform monitoring (SI-4(10))","SI-4(10):other_than_satisfied"],["e4560090","high","2026-10-04","","Restore state-level visibility and operator attribution at the boundary gateway","Egress denial records attribute maintenance-origin traffic to a device instead of an operator (SC-7(9))","SC-7(9):other_than_satisfied"],["77d97586","high","2026-10-08","","Evidence the interlock trust basis and fit provisioned hardware identity","Payload Safety Interlock carries an asserted trustworthiness basis with no supplier assurance case (SA-8(9))","SA-8(9):other_than_satisfied"],["6578da17","high","2026-10-09","","Seal the maintenance service connector and confirm the interface inventory","Maintenance Access Gateway service connector locked but unsealed, so an unauthorized connection leaves no trace (SC-7(14))","SC-7(14):other_than_satisfied"],["c0fdce4e","high","2026-10-10","Ingrid Solberg","Remediate CVE-2024-6387 on the Mission Computer","CVE-2024-6387 in the OpenSSH server (regreSSHion)",""],["cc34d8ab","high","2026-10-19","","Derive bay access from the facility roster and export the reader log","Protected bay access list transcribed by hand, so a facility removal leaves bay access standing (PE-3(1))","PE-3(1):other_than_satisfied"],["f40812b7","high","2026-10-31","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Navigation, timing and payload firmware violations raise an alert without driving the restricted state (SI-7(5))","SI-7(5):other_than_satisfied"],["963823be","high","2026-11-05","","Route in-partition failures into the platform secure state","In-partition failures never reach the Secure Boot Controller, so the platform does not enter its defined secure state (SC-24)","SC-24:other_than_satisfied"],["fee2cf4d","moderate","2026-08-07","","Remediate REQ-119","Unmet requirement REQ-119",""],["4264643b","moderate","2026-08-07","","Remediate REQ-024","Unmet requirement REQ-024","CM-2:partially_satisfied"],["c772d10a","moderate","2026-08-07","","Remediate REQ-062","Unmet requirement REQ-062","SC-28:partially_satisfied"],["9f9fbd16","moderate","2026-08-09","","Remediate REQ-083","Unmet requirement REQ-083","AC-12:partially_satisfied"],["42eedb4e","moderate","2026-08-15","","Remediate REQ-032","Unmet requirement REQ-032","CM-11:partially_satisfied"],["42b96885","moderate","2026-08-17","","Remediate REQ-053","Unmet requirement REQ-053","RA-3:partially_satisfied"],["1f77e9bd","moderate","2026-08-18","","Remediate REQ-092","Unmet requirement REQ-092","AU-11:partially_satisfied,CA-8:partially_satisfied"],["c9ad506f","moderate","2026-09-16","","Evidence the interlock trust basis and fit provisioned hardware identity","Expired acquisition procedures can still be cited in a live procurement package (SA-1)","SA-1:partially_satisfied"],["f0ff0fae","moderate","2026-10-01","","Close the mission-link monitoring blind spot and widen the restricted-state trigger","Monitoring and boot-integrity enhancement procedures still marked draft in the signed SI set (SI-1)","SI-1:partially_satisfied"],["b0f430d2","moderate","2026-10-07","","Add insider-threat and spillage handling to the incident procedures","Incident response procedures name no insider-threat branch or spillage roles after the scope expansion (IR-1)","IR-1:partially_satisfied"],["0d7e1855","moderate","2026-10-24","","Terminate failed-inspection sessions and reissue the unsigned access procedures","Seven access control procedures in field packages carry no current owner signature (AC-1)","AC-1:partially_satisfied"],["ac339ae5","moderate","2026-10-25","","Terminate failed-inspection sessions and reissue the unsigned access procedures","UDP-bearing approved tunnel outlives a failed inspection past the five-second termination bound (AC-4(4))","AC-4(4):partially_satisfied"],["9bdc5d1b","moderate","2026-10-26","","Make the privileged access review reduce privilege by itself","Unreconfirmed privileged assignments flagged on the Platform Management Controller but never reduced (AC-6(7))","AC-6(7):partially_satisfied"],["942ef213","moderate","2026-10-30","","Exercise a whole-article recovery against the four-hour objective","Recovery exercise restored one partition, leaving the four-hour objective unproven for the article (CP-4)","CP-4:partially_satisfied"],["ec5d8c5f","moderate","2026-11-03","","Automate the second reporting route for weakness reports","Two of four weakness reports reached the second recipient past the five-working-day bound (IR-6(2))","IR-6(2):partially_satisfied"],["b3646a99","moderate","2026-11-04","","Abort a baseline scan on a stale signature set","Baseline scan ran to completion on a thirty-hour-old signature set without aborting (RA-5(2))","RA-5(2):partially_satisfied"],["fe939b44","moderate","2026-11-07","","Trigger the post-campaign reconciliation and sign the outstanding procedures","Four of eleven configuration management procedures unsigned and flagged review-overdue (CM-1)","CM-1:partially_satisfied"],["315fbe31","moderate","2026-11-08","","Gate payload telemetry maintenance instead of recording it afterwards","Payload Telemetry Unit maintained on retrospective paperwork outside the work-order gate (MA-2(2))","MA-2(2):partially_satisfied"],["d054753e","moderate","2026-11-08","","Trigger the post-campaign reconciliation and sign the outstanding procedures","Post-campaign change review has no trigger and runs only when somebody remembers (CM-3(7))","CM-3(7):partially_satisfied"],["ab332f61","moderate","2026-11-09","","Evidence the interlock trust basis and fit provisioned hardware identity","Six LRUs fall back to a maintenance-record serial number for hardware identity at power-on (SA-10(3))","SA-10(3):partially_satisfied"],["cf162cda","moderate","2026-11-13","","Remove the password-only path and make the switch exchange mutual","Timing Receiver port admitted to the mission VLAN on a one-sided certificate exchange (IA-3(1))","IA-3(1):partially_satisfied"],["ecb1e2a1","moderate","2026-11-13","","Sign the ground-support telemetry agreement before the exchange continues","Ground-support telemetry exchange carrying traffic on an interim approval with no signed agreement (CA-3)","CA-3:partially_satisfied"],["b61b983c","moderate","2026-11-14","","Put compromised-credential screening on a scheduled refresh","Compromised-password screening list refreshed ad hoc, so an accepted credential may already be public (IA-5(1))",""],["82ba14e2","low","2026-08-09","","Remediate REQ-045","Unmet requirement REQ-045","MA-3:partially_satisfied"],["ac70a0fd","low","2026-08-16","","Remediate REQ-109","Unmet requirement REQ-109","CP-10:partially_satisfied"],["8c7f42de","low","2026-08-17","","Remediate REQ-015","Unmet requirement REQ-015","AU-6:partially_satisfied,CA-2:partially_satisfied"],["81ab0471","low","2026-09-23","","Restore state-level visibility and operator attribution at the boundary gateway","SC policy baseline carries an issue date but no recorded review decision in the Configuration Repository (SC-1)","SC-1:partially_satisfied"],["f24ba0a0","low","2026-10-11","","Reissue the personnel security procedure to match enforced gating","Personnel security procedure describes weaker gating than the Provisioning Workstation enforces (PS-1)","PS-1:partially_satisfied"],["29919692","low","2026-10-13","","Publish the retired key history and reissue the audit direction","Audit procedures still written to the original 74-control scope in the Configuration Repository (AU-1)","AU-1:partially_satisfied"],["55517d12","low","2026-10-31","","Re-home the alternate bearer off the shared port group","Primary and alternate bearers converge on one Internal Ethernet Switch port group (CP-8(2))","CP-8(2):partially_satisfied"]];
  const POAM_RAW = [["0344afc0","Remediate REQ-024","in_progress","","2026-09-08",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["4264643b"],"Close implementation and evidence gap for REQ-024 across LRU-017, LRU-020, LRU-001."],["ccb452ad","Remediate REQ-045","in_progress","","2026-09-11",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["82ba14e2"],"Close implementation and evidence gap for REQ-045 across LRU-013, LRU-014, LRU-017."],["96e50cb7","Remediate REQ-068","in_progress","","2026-09-14",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["28b99485"],"Close implementation and evidence gap for REQ-068 across LRU-013, LRU-016."],["d1f095da","Remediate REQ-092","in_progress","","2026-09-17",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["1f77e9bd"],"Close implementation and evidence gap for REQ-092 across LRU-018, LRU-001."],["a99b735e","Remediate REQ-114","completed","","2026-09-20",null,["4a718961"],"Close implementation and evidence gap for REQ-114 across LRU-014, LRU-017, LRU-001."],["04339e87","Remediate REQ-008","in_progress","","2026-10-06",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["e9c669c2"],"Close implementation and evidence gap for REQ-008 across LRU-013, LRU-014."],["217100a1","Remediate REQ-032","in_progress","","2026-10-09",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["42eedb4e"],"Close implementation and evidence gap for REQ-032 across LRU-013, LRU-016."],["7f342a9e","Remediate REQ-053","in_progress","","2026-10-12",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["42b96885"],"Close implementation and evidence gap for REQ-053 across LRU-001, LRU-013."],["c674a57a","Remediate REQ-074","completed","","2026-10-15",null,["7813f01e"],"Close implementation and evidence gap for REQ-074 across LRU-003, LRU-017."],["4be4ddde","Remediate REQ-100","in_progress","","2026-10-18",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["85973641"],"Close implementation and evidence gap for REQ-100 across LRU-020."],["cb6336b6","Remediate REQ-119","in_progress","","2026-10-21",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["fee2cf4d"],"Close implementation and evidence gap for REQ-119 across LRU-017, LRU-019."],["bd54cb23","Remediate REQ-015","in_progress","","2026-11-07",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["8c7f42de"],"Close implementation and evidence gap for REQ-015 across LRU-015, LRU-018, LRU-001."],["1c554589","Remediate REQ-039","completed","","2026-11-10",null,["fdb85e36"],"Close implementation and evidence gap for REQ-039 across LRU-014, LRU-017, LRU-001."],["75421dca","Remediate REQ-062","in_progress","","2026-11-13",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["c772d10a"],"Close implementation and evidence gap for REQ-062 across LRU-003, LRU-007."],["ca8301dc","Remediate REQ-083","in_progress","","2026-11-16",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["9f9fbd16"],"Close implementation and evidence gap for REQ-083 across LRU-013, LRU-014."],["96bd4063","Remediate REQ-109","in_progress","","2026-11-19",[[1,"Correct implementation or configuration","in_progress",null,null,""],[2,"Collect replacement evidence","planned",null,null,""],[3,"Reassess affected requirement","planned",null,null,""]],["ac70a0fd"],"Close implementation and evidence gap for REQ-109 across LRU-015."],["dccc2343","Order the compiled audit trail on source time","completed","","2026-12-05",[[1,"Stamp source time on records relayed by LRU-009 before they leave the switch","completed","2026-10-03","2026-10-03",""],[2,"Rebuild the compiled trail on origin time and re-run the seeded ordering sequence","completed","2026-10-24","2026-10-24",""],[3,"Confirm the order tolerance against the LRU-005 reference under a congested segment","completed","2026-11-14","2026-11-14",""]],["d370ad92"],"The relay path now stamps a source time before a record leaves the switch, and the compiled trail is rebuilt on that stamp so ordering holds across every source rather than across most of them. The work completed inside the assessment windo"],["9a43f6a8","Block out-of-window privileged commands at the maintenance gateway","completed","","2026-12-07",[[1,"Promote the scheduled-window test at LRU-014 from advisory to a blocking admission check","completed","2026-10-05","2026-10-05",""],[2,"Refuse an out-of-window privileged command with its reason code in the session log","completed","2026-10-26","2026-10-26",""],[3,"Retest the three admission checks from LRU-019 including the window leg","completed","2026-11-16","2026-11-16",""]],["0299f647"],"The scheduled-window leg of the admission decision was wired as advisory and is now a blocking check, so a command issued outside a window is refused rather than narrated. The retest exercised all three admission checks from the laptop and "],["def9d690","Remediate CVE-2024-6387 on the Mission Computer","open","Ingrid Solberg","2026-12-08",[[1,"Set LoginGraceTime 0 on the maintenance interface","planned","2026-11-17",null,"Ingrid Solberg"],[2,"Take Mission Computer version 2","planned","2026-12-01",null,"Ingrid Solberg"],[3,"Rescan LRU-001","planned","2026-12-08",null,"Ingrid Solberg"]],["c0fdce4e"],"Close the race on the maintenance interface now, take version 2 of the Mission Computer, which carries OpenSSH server 9.8p1, and rescan LRU-001 to confirm the fix."],["20b24018","Refuse unlisted hardware on every switch port","completed","","2026-12-09",[[1,"Reflash the four lagging LRU-009 ports to the enforcement build","completed","2026-10-07","2026-10-07",""],[2,"Confirm an unlisted device is refused a data path on all twelve switch ports","completed","2026-10-28","2026-10-28",""],[3,"Check the refusal reaches the platform log inside the thirty-second bound","completed","2026-11-18","2026-11-18",""]],["884b66de"],"The four ports running firmware that predated the enforcement build were reflashed, so an unlisted device is now refused a path on all twelve rather than reported on four of them. The objective retested clean inside the assessment window wi"],["1e855acc","Alert on privileged tool use outside an open work order","completed","","2026-12-11",[[1,"Build the out-of-work-order alert rule on the collector","completed","2026-10-09","2026-10-09",""],[2,"Seed an out-of-order privileged invocation through LRU-014 and confirm the alert fires","completed","2026-10-30","2026-10-30",""],[3,"Route the alert to the maintenance review queue with the technician identity attached","completed","2026-11-20","2026-11-20",""]],["fe5baef3"],"The rule had been specified for the collector and never built, so this item builds it and routes what it raises to the maintenance review queue with the technician identity attached. A seeded out-of-order invocation raised the alert on rete"],["7d023346","Automate the second reporting route for weakness reports","in_progress","","2026-12-27",[[1,"Automate dispatch to the second recipient off the same trigger as the first","completed","2026-10-06","2026-10-06",""],[2,"Re-report the two late cases and record the corrected timeline against each","in_progress","2026-11-06",null,""],[3,"Measure elapsed time from containment on the next four weakness reports","planned","2026-12-06",null,""]],["ec5d8c5f"],"Dispatch to the second recipient is automated off the same trigger as the first, which is the only arrangement under which one bound covers both. The two cases that ran late are re-reported and the next four are measured from their recorded"],["03c0317f","Publish the retired key history and reissue the audit direction","in_progress","","2026-12-29",[[1,"Publish the retired signing key identifiers from LRU-003 to the collector","completed","2026-10-08","2026-10-08",""],[2,"Re-verify the stranded arm and release records against the republished key history","in_progress","2026-11-08",null,""],[3,"Reissue the audit procedures to the current control scope and describe the correlation behaviour now running","planned","2026-12-08",null,""]],["29919692","d63206a4","1f680dd7"],"Publishing the retired signing key identifiers to the collector is what makes a signature resolvable after a rotation, so it leads and the stranded arm and release records are re-verified behind it. The AU-1 procedure reissue is carried in "],["2647a7d2","Put compromised-credential screening on a scheduled refresh","in_progress","","2027-01-04",[[1,"Put the compromised-password list refresh on a scheduled quarterly job feeding LRU-003","completed","2026-10-14","2026-10-14",""],[2,"Re-screen the credentials already held in the LRU-015 region against the refreshed list","in_progress","2026-11-14",null,""],[3,"Retest IA-5(1) with a candidate published after the previous refresh","planned","2026-12-14",null,""]],["b61b983c"],"Screening quality is a scheduling problem rather than a mechanism problem, so the list moves onto a quarterly job and what is already stored is re-screened against it. The objective is retested with a candidate published since the previous "],["6c99b283","Exercise a whole-article recovery against the four-hour objective","in_progress","","2027-01-10",[[1,"Release the flight-configuration article for a full recovery exercise","completed","2026-10-20","2026-10-20",""],[2,"Restore the platform management and payload interface partitions from the sealed LRU-015 set","in_progress","2026-11-20",null,""],[3,"Measure the whole-article restore against the four-hour objective and lodge the record","planned","2026-12-20",null,""]],["942ef213"],"Nothing changes on the platform under this item; what is missing is a whole-article exercise, so the flight-configuration article is released and the untested partitions are restored from a sealed backup set. The elapsed time then becomes a"],["08b61d0b","Restore state-level visibility and operator attribution at the boundary gateway","in_progress","","2027-01-26",[[1,"Publish session-table and buffer occupancy counters in the LRU-007 telemetry export","completed","2026-10-05","2026-10-05",""],[2,"Set collector thresholds on the new counters so a low-rate excursion alerts at LRU-018","completed","2026-11-05","2026-11-05",""],[3,"Carry maintenance session identity into the denial record so a denied flow names an operator","in_progress","2026-12-05",null,""],[4,"Lodge the SC policy annual review as a Configuration Repository workflow step and retest all three objectives","planned","2027-01-05",null,""]],["81ab0471","a76a9dc1","e4560090"],"Extending the gateway telemetry export is the load-bearing change here, because the same export feeds both the SC-5(3) occupancy question and the thresholds the collector evaluates. Carrying maintenance session identity into the SC-7(9) den"],["875a2892","Seal the maintenance service connector and confirm the interface inventory","in_progress","","2027-01-27",[[1,"Fit tamper-evident seals to the LRU-014 service connector and record each against its key holder","in_progress","2026-11-06",null,""],[2,"Add the seal state to the boundary interface inspection sheet used at the flightline","planned","2026-12-06",null,""],[3,"Re-verify the physical interface inventory with the independent assessor","planned","2027-01-06",null,""]],["6578da17","7bb62aeb"],"Seals are specified and on order, so this item fits them to the LRU-014 service connector, records each against its key holder and adds the seal state to the sheet an inspector actually works from. SC-7(14) is retested against the physical "],["24b7225c","Make the privileged access review reduce privilege by itself","in_progress","","2027-02-01",[[1,"Make a non-reconfirmed assignment on LRU-013 expire instead of raising a flag","completed","2026-10-11","2026-10-11",""],[2,"Reduce the two privileged assignments left standing by the last review","completed","2026-11-11","2026-11-11",""],[3,"Report each reduction to the collector so a downgrade is auditable after the fact","planned","2026-12-11",null,""],[4,"Retest AC-6(7) across a full review cycle with a seeded non-reconfirmation","planned","2027-01-11",null,""]],["9bdc5d1b"],"Expiry replaces the flag, so an assignment a review leaves unreconfirmed loses its privilege without waiting for somebody to remember. The two assignments still standing from the last cycle are reduced first and the objective is then retest"],["4d7b5e23","Gate payload telemetry maintenance instead of recording it afterwards","in_progress","","2027-02-08",[[1,"Bring payload telemetry maintenance inside the LRU-016 work-order gate","in_progress","2026-11-18",null,""],[2,"Withdraw the retrospective paper route so no action starts without an open order","planned","2026-12-18",null,""],[3,"Extend the LRU-013 stale-record flag over the newly gated equipment","planned","2027-01-18",null,""]],["315fbe31"],"The equipment moves inside the work-order gate and the retrospective paper route is withdrawn, so no action proceeds without an open order behind it. The stale-record flag is extended over the newly gated equipment so coverage becomes visib"],["e2f0b4d9","Sign the ground-support telemetry agreement before the exchange continues","in_progress","","2027-02-13",[[1,"Draft the control responsibility split for the ground-support telemetry exchange","completed","2026-10-23","2026-10-23",""],[2,"Obtain the other party's signature and record the impact level on the agreement","planned","2026-11-23",null,""],[3,"Bind the signed agreement identifier to the exchange entry in the LRU-007 policy set","planned","2026-12-23",null,""],[4,"Disable any exchange whose agreement is not current at the next policy set review","planned","2027-01-23",null,""]],["ecb1e2a1"],"The exchange keeps carrying traffic only until its agreement is signed, so the control responsibility split is drafted, signed and bound to the entry in the gateway policy set. Enforcement then happens at the policy review, where any exchan"],["f4938b99","Abort a baseline scan on a stale signature set","in_progress","","2027-02-14",[[1,"Compare the mirrored signature set timestamp against the freshness window before a scan starts","planned","2026-11-24",null,""],[2,"Abort a scan running on a stale set and surface the reason to the operator","planned","2026-12-24",null,""],[3,"Print the signature set identifier in the scan report header","planned","2027-01-24",null,""]],["b3646a99"],"A freshness comparison and an abort are what the requirement asks for and what the workstation does not implement, so both are built. Lifting the signature set identifier into the report header is what afterwards lets a reviewer tell a clea"],["aedcd7ce","Derive bay access from the facility roster and export the reader log","in_progress","","2027-02-28",[[1,"Derive the bay reader list from the facility roster instead of transcribing it","completed","2026-11-07","2026-11-07",""],[2,"Remove bay access automatically when a holder leaves the facility roster","planned","2026-12-07",null,""],[3,"Export the bay reader log for correlation against current platform access","planned","2027-01-07",null,""],[4,"Retest PE-3(1) with a credential withdrawn at the facility level","planned","2027-02-07",null,""]],["cc34d8ab"],"The bay reader list stops being transcribed and starts being derived, so a removal at the facility level takes bay access with it rather than waiting for somebody to remember. Exporting the reader log for correlation is what allows a bay en"],["e35d68ed","Reissue the personnel security procedure to match enforced gating","in_progress","","2027-03-01",[[1,"Reissue the personnel security procedure to match the eligibility gating LRU-017 enforces","planned","2026-12-08",null,""],[2,"Record the national eligibility change against the approved revision in LRU-020","planned","2027-01-08",null,""],[3,"Re-disseminate to every provisioning role and capture the acknowledgements","planned","2027-02-08",null,""]],["f24ba0a0"],"The published procedure is reissued to describe the eligibility gating the workstation actually enforces, and the national eligibility change is recorded against the approved revision. Re-dissemination with acknowledgements closes the objec"],["c1f073e7","Terminate failed-inspection sessions and reissue the unsigned access procedures","in_progress","","2027-03-03",[[1,"Tear down a UDP-bearing tunnel on inspection failure rather than discarding its packets","in_progress","2026-12-10",null,""],[2,"Reissue the seven unsigned access control procedures with a current owner signature","planned","2027-01-10",null,""],[3,"Make the LRU-017 package check test the signature state of every procedure it assembles","planned","2027-02-10",null,""]],["0d7e1855","ac339ae5"],"Two independent corrections sit under this item: a tunnel that fails inspection is torn down inside the bound instead of being drained packet by packet, and the seven procedures published without a current owner signature are reissued. The "],["65d17707","Remove the password-only path and make the switch exchange mutual","in_progress","","2027-03-06",[[1,"Ship the offline credential verifier in the LRU-019 baseline so a disconnected session still needs a hardware credential","completed","2026-11-13","2026-11-13",""],[2,"Withdraw the password-only local logon from the Maintenance Laptop image","in_progress","2026-12-13",null,""],[3,"Require the Timing Receiver to present its own certificate before LRU-009 admits the port","planned","2027-01-13",null,""],[4,"Retest both authentication objectives with the laptop off the ground support network","planned","2027-02-13",null,""]],["a4823e25","cf162cda"],"The offline credential verifier for the laptop baseline is the only thing that forecloses the password-only path, so it leads and the local logon is withdrawn behind it. The IA-3(1) half changes the Timing Receiver end of the link to presen"],["de5e5c65","Close the mission-link monitoring blind spot and widen the restricted-state trigger","in_progress","","2027-03-08",[[1,"Decide whether to terminate the LRU-008 mission link for inspection or record a formal metadata-only acceptance","completed","2026-11-15","2026-11-15",""],[2,"Extend the restricted-state response to navigation, timing and payload firmware violations","planned","2026-12-15",null,""],[3,"Sign the draft monitoring and boot-integrity procedures into the issued SI set","planned","2027-01-15",null,""],[4,"Retest the monitoring coverage and restricted-state objectives on the integration rig","planned","2027-02-15",null,""]],["f0ff0fae","4d5a5dfc","f40812b7"],"The open decision on the mission link is taken first, because everything else depends on whether the link is terminated for inspection or metadata-only visibility is formally accepted. The restricted-state response is then widened across th"],["8b91a4ee","Trigger the post-campaign reconciliation and sign the outstanding procedures","in_progress","","2027-03-09",[[1,"Open a reconciliation against the LRU-018 event stream whenever LRU-020 records a campaign closing","planned","2026-12-16",null,""],[2,"Sign the four outstanding configuration management procedures and clear the review-overdue flag","planned","2027-01-16",null,""],[3,"Run the post-campaign review against the next planned campaign and record both exception classes","planned","2027-02-16",null,""]],["fe939b44","d054753e"],"A campaign closing in the repository becomes the event that opens a reconciliation, which is what the requirement asks for and what nothing currently provides. The four unsigned procedures are signed in the same pass because they cover the "],["866eeaad","Re-home the alternate bearer off the shared port group","in_progress","","2027-03-14",[[1,"Re-home the LRU-008 radio path off the shared LRU-009 port group","in_progress","2026-11-21",null,""],[2,"Rebuild the primary and alternate traces from live interface and routing state","planned","2026-12-21",null,""],[3,"Withdraw the accepted single point of failure entry once the traces are disjoint","planned","2027-01-21",null,""],[4,"Retest CP-8(2) with the shared port group failed","planned","2027-02-21",null,""]],["55517d12"],"Moving the radio path off the shared port group is the only change that makes the two traces disjoint on the platform side of the demarcation. The accepted single point of failure entry is withdrawn once the traces are rebuilt from live sta"],["1e65bd58","Evidence the interlock trust basis and fit provisioned hardware identity","in_progress","","2027-03-15",[[1,"Obtain the supplier assurance case for LRU-011 and review the basis behind the dependency entry","in_progress","2026-12-22",null,""],[2,"Fit a provisioned identity part to the six units still identified from a maintenance record","planned","2027-01-22",null,""],[3,"Reissue the acquisition procedures to the current scope and stop an expired revision being citable","planned","2027-02-22",null,""]],["c9ad506f","77d97586","ab332f61"],"The supplier assurance case behind the interlock is the missing side of the comparison, so obtaining and reviewing it is this item's first obligation. Fitting a provisioned identity part to the six units still identified from a maintenance "],["0ad5eb72","Add insider-threat and spillage handling to the incident procedures","in_progress","","2027-03-26",[[1,"Name the insider-threat branch and its decision authority in the incident response procedures","in_progress","2026-12-05",null,""],[2,"Assign the spillage roles the expanded control set introduces","planned","2027-01-05",null,""],[3,"Stage the reissued procedure set on LRU-017 and confirm the digest matches the repository","planned","2027-02-05",null,""],[4,"Exercise both new branches and record the corrective actions they produce","planned","2027-03-05",null,""]],["b0f430d2"],"The procedure set is reviewed against the expanded escalation chain, naming the insider-threat branch and assigning the spillage roles the added enhancements introduce. The reissued set is staged for ground support and both branches are exe"],["f07580fc","Route in-partition failures into the platform secure state","in_progress","","2027-03-28",[[1,"Route partition-level integrity and watchdog failures to LRU-002 rather than the partition handler","planned","2026-12-07",null,""],[2,"Define the whole-platform secure state transition for an in-flight partition failure","planned","2027-01-07",null,""],[3,"Demonstrate the transition on the rig with a mission partition failed in the air-mode profile","planned","2027-02-07",null,""],[4,"Retest SC-24 against an induced in-partition failure and record the elapsed transition time","planned","2027-03-07",null,""]],["963823be"],"Failures raised inside a mission partition are handed to that partition's own handler today, and this item routes them to LRU-002 and defines the whole-platform transition the requirement describes. The demonstration is run in the air-mode "]];
  const RISKS_RAW = [["0a21dc94","A password on its own reaches WS-X90 at the flightline","critical","moderate","high","","Anyone holding the Maintenance Laptop on a dispersed flightline who guesses or replays its local password and opens a privileged maintenance session.","2026-12-13",[["T1078","Valid Accounts"],["T1110","Brute Force"]]],["d3902bc5","Payload arm and release records become unverifiable as signing keys rotate","critical","moderate","high","","Someone who alters or disowns an arm or release command once its signing key has rotated, knowing the record can no longer be checked.","2026-11-02",[["T1553","Subvert Trust Controls"],["T1565","Data Manipulation"]]],["7ddbc65b","A hand-kept bay list leaves standing physical access to key and recovery material","high","moderate","high","","A person removed from the program who still badges into the protected bay and attaches hardware to, or lifts credentials from, the Mission Computer, the Cryptographic Services Module or the Secure Storage Module.","2026-12-18",[["T1200","Hardware Additions"],["T1552","Unsecured Credentials"]]],["5828fe17","A partition that has failed its own integrity check keeps flying the mission","high","moderate","high","","A modified image in a mission partition, or tampering below its operating system, that fails the partition's own integrity check in flight and keeps producing mission output.","2027-01-04",[["T1542","Pre-OS Boot"],["T1601","Modify System Image"]]],["79e3025e","An unsealed service connector leaves a physical route into the maintenance path","high","moderate","high","","A visitor on the flightline who seats a cable or a device at the Maintenance Access Gateway's service connector between inspections to reach the mission computing chain.","2026-12-08",[["T1091","Replication Through Removable Media"],["T1200","Hardware Additions"]]],["ccc13a34","Low-rate exhaustion and unattributable egress at the WS-X90 external boundary","high","moderate","high","","A patient adversary who drains the Protected Network Gateway's session state below the profiled rate and pushes data out through a maintenance session.","2026-11-22",[["T1048","Exfiltration Over Alternative Protocol"],["T1499","Endpoint Denial of Service"]]],["4cb2d6a3","Risk arising from REQ-008","high","moderate","high","","Activity under AC-11 and AU-4 on the Maintenance Access Gateway and Platform Management Controller that goes unwatched until its consequences show.","2026-10-09",[]],["d7e16faf","Risk arising from REQ-039","high","moderate","high","","An unauthorized change to the Maintenance Access Gateway, Mission Computer and Provisioning Workstation, by a technician or an attacker with access, that nothing rejects.","2026-10-02",[]],["ec94501b","Risk arising from REQ-068","high","moderate","high","","Activity under SI-7 on the Platform Management Controller and Update & Recovery Controller that goes unwatched until its consequences show.","2026-10-12",[]],["146be363","Risk arising from REQ-100","high","moderate","high","","Activity under CM-4 on the Configuration Repository that goes unwatched until its consequences show.","2026-10-06",[]],["602c1b5d","The mission link is unmonitored and three firmware domains cannot force the restricted state","high","moderate","high","","A compromised navigation, timing or payload component that keeps producing mission output over the Tactical Data Radio, whose traffic nobody inspects.","2026-11-30",[["T1040","Network Sniffing"],["T1495","Firmware Corruption"]]],["d726f6b1","The payload interlock's trust basis is asserted and six units identify themselves from paperwork","high","moderate","high","","A substituted or counterfeit part in the Payload Safety Interlock, or in one of six units that identify themselves from paperwork.","2026-11-15",[["T1036","Masquerading"],["T1195","Supply Chain Compromise"]]],["c9f087a6","A disallowed session survives at the boundary while field procedures go unsigned","moderate","moderate","moderate","","An outside party who holds a tunnel open through the Protected Network Gateway after inspection has refused it, to come back in or ride a remote session.","2027-02-21",[["T1133","External Remote Services"],["T1563","Remote Service Session Hijacking"]]],["1a0778b3","A publicly known password is still a valid WS-X90 credential","moderate","moderate","moderate","","An attacker replaying passwords from public breach collections against the provisioning path.","2027-03-14",[["T1078","Valid Accounts"],["T1110","Brute Force"]]],["579ecff1","A scan on a stale signature set reports clean and the program acts on it","moderate","moderate","moderate","","Exploitation of a newly published vulnerability in the WS-X90 build during the window in which the program's own scanning cannot see it.","2027-03-04",[["T1562","Impair Defenses"]]],["d0c7d0ad","Insider threat and spillage have an escalation path and no named owner","moderate","moderate","moderate","","An insider who copies data from a WS-X90 system and carries it off on removable media, or a classified spillage that spreads while the response is organized.","2027-02-04",[["T1005","Data from Local System"],["T1052","Exfiltration Over Physical Medium"]]],["065fc910","Payload telemetry maintenance happens outside the work-order gate","moderate","moderate","moderate","","Someone with access to the payload telemetry equipment who does unsanctioned work on it remotely and files the paperwork afterwards.","2027-03-08",[["T1021","Remote Services"]]],["85db8319","Platform telemetry crosses to a party nobody has signed a responsibility split with","moderate","moderate","moderate","","A ground-support partner whose own compromise or mishandling turns the telemetry exchange into a channel out of WS-X90.","2027-03-13",[["T1020","Automated Exfiltration"],["T1199","Trusted Relationship"]]],["4fad3c91","Privilege that survived its own review still reaches platform management","moderate","moderate","moderate","","An attacker who compromises one of the two holders whose privilege the review revoked on paper, or who adjusts the account to keep it.","2027-02-23",[["T1078","Valid Accounts"],["T1098","Account Manipulation"]]],["a4e6d677","Risk arising from REQ-024","moderate","high","high","","Activity under CM-2 on the Configuration Repository, Mission Computer and Provisioning Workstation that goes unwatched until its consequences show.","2026-12-05",[]],["54a7538a","Risk arising from REQ-032","moderate","low","moderate","","Activity under CM-11 on the Platform Management Controller and Update & Recovery Controller that goes unwatched until its consequences show.","2026-12-13",[]],["a69bb505","Risk arising from REQ-053","moderate","high","high","","Use of the Mission Computer and Platform Management Controller that the policy under RA-3 forbids, going ahead unchecked.","2026-12-15",[]],["8393c795","Risk arising from REQ-062","moderate","low","moderate","","A weakness in SC-28 on the Cryptographic Services Module and Protected Network Gateway that stays hidden because nobody can verify the implementation.","2026-12-05",[]],["54e57a74","Risk arising from REQ-083","moderate","high","high","","An unauthorized change to the Maintenance Access Gateway and Platform Management Controller, by a technician or an attacker with access, that nothing rejects.","2026-12-07",[]],["03162c69","Risk arising from REQ-092","moderate","low","moderate","","Activity under AU-11 and CA-8 on the Mission Computer and Security Log Collector that goes unwatched until its consequences show.","2026-12-16",[]],["25938cff","Risk arising from REQ-114","moderate","high","high","","A weakness in IA-8 on the Maintenance Access Gateway, Mission Computer and Provisioning Workstation that stays hidden because nobody can verify the implementation.","2026-12-19",[]],["41330f8c","Risk arising from REQ-119","moderate","low","moderate","","An unauthorized change to the Maintenance Laptop and Provisioning Workstation, by a technician or an attacker with access, that nothing rejects.","2026-12-05",[]],["c6f53950","The four-hour recovery objective has never been measured on a whole article","moderate","moderate","moderate","","An attack or failure that destroys data or disables recovery and forces a real restore of partitions nobody has exercised.","2027-02-27",[["T1485","Data Destruction"],["T1490","Inhibit System Recovery"]]],["576c965f","The widest configuration divergence WS-X90 produces has no review behind it","moderate","moderate","moderate","","An unapproved change, or a modified image, slipped in during a change campaign while the configuration is furthest from the approved one.","2027-03-07",[["T1601","Modify System Image"]]],["ba874b40","Weakness reports reach their second recipient after the reporting bound","moderate","moderate","moderate","","Another program on the same baseline, exploited through a weakness WS-X90 reported to it late.","2027-03-03",[]],["a5f7ee46","Out-of-window privileged maintenance was recorded rather than refused","low","low","low","","A privileged account used for maintenance outside its window through a remote service on the Maintenance Access Gateway.","2027-05-10",[["T1021","Remote Services"],["T1078","Valid Accounts"]]],["f659e4b2","Out-of-work-order privileged tool use was recorded and never surfaced","low","low","low","","An insider who uses privileged maintenance tools with no work order behind them and clears what traces they can.","2027-05-10",[["T1070","Indicator Removal on Host"],["T1072","Software Deployment Tools"]]],["23c37f1c","Primary and alternate bearers converge on one switch port group","low","low","low","","A fault in, or a denial of service against, the one Internal Ethernet Switch port group both bearers cross.","2027-04-29",[["T1498","Network Denial of Service"]]],["c23dcfa0","Relayed audit records carried a second ordering inside the platform trail","low","low","low","","Someone who reorders or blurs the platform trail during congestion to hide cause and effect.","2027-04-25",[["T1070","Indicator Removal on Host"],["T1565","Data Manipulation"]]],["39802516","Risk arising from REQ-015","low","moderate","moderate","","An unauthorized change to the Mission Computer, Secure Storage Module and Security Log Collector, by a technician or an attacker with access, that nothing rejects.","2027-02-13",[]],["8974368f","Risk arising from REQ-045","low","moderate","moderate","","Use of the Maintenance Access Gateway, Platform Management Controller and Provisioning Workstation that the policy under MA-3 forbids, going ahead unchecked.","2027-02-05",[]],["f644b3d4","Risk arising from REQ-074","low","moderate","moderate","","A weakness in SR-11 on the Cryptographic Services Module and Provisioning Workstation that stays hidden because nobody can verify the implementation.","2027-02-15",[]],["4cefa004","Risk arising from REQ-109","low","moderate","moderate","","Use of the Secure Storage Module that the policy under CP-10 forbids, going ahead unchecked.","2027-02-12",[]],["a7e6c40b","The personnel procedure and the provisioning gate no longer agree","low","low","low","","An account created to the looser written procedure once the gate is relaxed to match it.","2027-04-09",[["T1078","Valid Accounts"],["T1136","Create Account"]]],["0ec14b7b","Unlisted hardware was announced onto the internal segment and then carried","low","low","low","","An unlisted device attached to the internal segment to listen to or relay its traffic.","2027-05-04",[["T1200","Hardware Additions"],["T1557","Man-in-the-Middle"]]]];
  const AF_RAW = [["AC-11","Device Lock","other_than_satisfied","init","2026-08-10",false],["AU-4","Audit Log Storage Capacity","other_than_satisfied","init","2026-08-10",false],["AU-10","Non-repudiation","other_than_satisfied","inc1","2026-10-21",false],["CM-4","Impact Analyses","other_than_satisfied","init","2026-08-07",false],["IA-2(2)","Multi-factor Authentication to Non-privileged Accounts","other_than_satisfied","inc2","2026-11-13",false],["IA-5","Authenticator Management","other_than_satisfied","init","2026-08-03",false],["PE-3(1)","System Access","other_than_satisfied","inc1","2026-10-19",false],["SA-8(9)","Trusted Components","other_than_satisfied","inc1","2026-10-08",false],["SC-5(3)","Detection and Monitoring","other_than_satisfied","inc1","2026-09-24",false],["SC-7(9)","Restrict Threatening Outgoing Communications Traffic","other_than_satisfied","inc1","2026-10-04",false],["SC-7(14)","Protect Against Unauthorized Physical Connections","other_than_satisfied","inc1","2026-10-09",false],["SC-24","Fail in Known State","other_than_satisfied","inc1","2026-11-05",false],["SI-4(10)","Visibility of Encrypted Communications","other_than_satisfied","inc1","2026-10-02",false],["SI-7(5)","Automated Response to Integrity Violations","other_than_satisfied","inc1","2026-10-31",false],["AC-1","Policy and Procedures","partially_satisfied","inc1","2026-10-24",false],["AC-4(4)","Flow Control of Encrypted Information","partially_satisfied","inc1","2026-10-25",false],["AC-6(7)","Review of User Privileges","partially_satisfied","inc1","2026-10-26",false],["AC-12","Session Termination","partially_satisfied","init","2026-08-09",false],["AC-17(4)","Privileged Commands and Access","partially_satisfied","inc2","2026-11-11",false],["AU-1","Policy and Procedures","partially_satisfied","inc1","2026-10-13",false],["AU-6","Audit Record Review, Analysis, and Reporting","partially_satisfied","init","2026-08-17",false],["AU-6(3)","Correlate Audit Record Repositories","partially_satisfied","inc1","2026-10-03",false],["AU-11","Audit Record Retention","partially_satisfied","init","2026-08-18",false],["AU-12(1)","System-wide and Time-correlated Audit Trail","partially_satisfied","inc1","2026-10-27",false],["CA-2","Control Assessments","partially_satisfied","init","2026-08-17",false],["CA-3","Information Exchange","partially_satisfied","inc2","2026-11-13",false],["CA-8","Penetration Testing","partially_satisfied","init","2026-08-18",false],["CM-1","Policy and Procedures","partially_satisfied","inc1","2026-11-07",false],["CM-2","Baseline Configuration","partially_satisfied","init","2026-08-07",false],["CM-3(7)","Review System Changes","partially_satisfied","inc1","2026-11-08",false],["CM-7(9)","Prohibiting The Use of Unauthorized Hardware","partially_satisfied","inc1","2026-11-05",false],["CM-11","User-installed Software","partially_satisfied","init","2026-08-15",false],["CP-4","Contingency Plan Testing","partially_satisfied","inc1","2026-10-30",false],["CP-8(2)","Single Points of Failure","partially_satisfied","inc1","2026-10-31",false],["CP-10","System Recovery and Reconstitution","partially_satisfied","init","2026-08-16",false],["IA-3(1)","Cryptographic Bidirectional Authentication","partially_satisfied","inc2","2026-11-13",false],["IA-8","Identification and Authentication (Non-organizational Users)","partially_satisfied","init","2026-08-21",false],["IR-1","Policy and Procedures","partially_satisfied","inc1","2026-10-07",false],["IR-6(2)","Vulnerabilities Related to Incidents","partially_satisfied","inc1","2026-11-03",false],["MA-2(2)","Automated Maintenance Activities","partially_satisfied","inc1","2026-11-08",false],["MA-3","Maintenance Tools","partially_satisfied","init","2026-08-09",false],["MA-3(5)","Execution with Privilege","partially_satisfied","inc2","2026-11-11",false],["PS-1","Policy and Procedures","partially_satisfied","inc1","2026-10-11",false],["RA-3","Risk Assessment","partially_satisfied","init","2026-08-17",false],["RA-5(2)","Update Vulnerabilities to Be Scanned","partially_satisfied","inc1","2026-11-04",false],["SA-1","Policy and Procedures","partially_satisfied","inc1","2026-09-16",false],["SA-10(3)","Hardware Integrity Verification","partially_satisfied","inc1","2026-11-09",false],["SC-1","Policy and Procedures","partially_satisfied","inc1","2026-09-23",false],["SC-18","Mobile Code","partially_satisfied","inc1","2026-10-26",false],["SC-28","Protection of Information at Rest","partially_satisfied","init","2026-08-07",false],["SI-1","Policy and Procedures","partially_satisfied","inc1","2026-10-01",false],["SR-11","Component Authenticity","partially_satisfied","init","2026-08-19",false],["AC-2(12)","Account Monitoring for Atypical Usage","not_assessed","inc1","2026-10-25",false],["AC-16","Security and Privacy Attributes","not_assessed","inc1","2026-10-28",false],["AC-16(7)","Consistent Attribute Interpretation","not_assessed","inc1","2026-10-28",false],["AC-23","Data Mining Protection","not_assessed","inc1","2026-10-30",false],["AT-2","Literacy Training and Awareness","not_assessed","inc1","2026-11-05",false],["AT-2(4)","Suspicious Communications and Anomalous System Behavior","not_assessed","inc1","2026-11-05",false],["AT-2(6)","Cyber Threat Environment","not_assessed","inc1","2026-11-05",false],["AT-6","Training Feedback","not_assessed","inc1","2026-11-06",false],["AC-2","Account Management","satisfied","init","2026-08-20",false],["AC-2(1)","Automated System Account Management","satisfied","inc1","2026-10-24",false],["AC-2(2)","Automated Temporary and Emergency Account Management","satisfied","inc1","2026-10-24",false],["AC-2(3)","Disable Accounts","satisfied","inc1","2026-10-25",false],["AC-2(4)","Automated Audit Actions","satisfied","inc1","2026-10-25",false],["AC-3","Access Enforcement","satisfied","init","2026-08-21",false],["AC-4","Information Flow Enforcement","satisfied","init","2026-08-05",false],["AC-5","Separation of Duties","satisfied","init","2026-08-06",false]];
  // ——— From mod-system.js (NIST SP 800-160 Vol. 2 Appendix F): the controls each technique's table prints, and each control's title and whether WS-X90's baseline selects it ———
  const TT = {"T1078":["AC-6(7)","AU-6(3)","SC-30(4)","SI-20","SI-4(16)"],"T1200":["AC-6(10)","AC-6(3)","CM-8(3)","IA-3(1)","SC-30(4)"],"T1110":["AU-6","CA-7(5)","IA-2(13)","SA-17(9)","SC-30(4)","SI-20"],"T1565":["AC-4(2)","AC-4(21)","IR-4(2)","PL-8(1)","SC-11","SC-26","SC-28(1)","SC-7(29)","SI-15","SI-22","SI-7","SI-7(1)","SR-10"],"T1601":["AC-6(5)","IA-5(7)","SC-16(1)","SC-16(3)","SC-28(1)","SI-14(1)","SI-7","SI-7(1)","SI-7(15)","SI-7(6)","SI-7(9)","SR-4(3)"],"T1021":["AC-6(7)","AU-6(3)","AU-6(5)","IR-4(2)","SC-26","SC-30(4)","SC-7(15)","SC-7(20)","SC-7(21)"],"T1070":["AU-9(1)","AU-9(2)","AU-9(3)","AU-9(6)","IR-4(13)","SC-26","SC-28(1)","SC-8(4)","SI-14(2)","SI-4(2)"],"T1553":["AC-4(17)","AC-4(3)","CM-7(5)","IR-4(2)","IR-4(3)","SC-23(3)","SC-25","SC-26","SC-30(4)","SC-7(21)","SI-14(2)","SI-21","SI-4(13)","SI-7(6)"],"T1036":["CM-7(4)","IR-4(13)","SC-26","SC-30(4)","SC-7(21)","SI-4(2)","SI-4(24)","SI-7(15)"],"T1040":["AU-6(8)","IA-2(13)","IR-4(13)","SC-30","SC-30(4)","SC-8(1)","SC-8(5)","SI-14(3)","SI-20","SI-4(2)","SI-4(4)"],"T1048":["IR-4(13)","SC-26","SC-30(4)","SC-7","SC-7(3)","SC-7(5)","SI-20","SI-23","SI-4(18)","SI-4(4)"],"T1091":["CM-7(2)","CM-8(3)","SC-7(20)","SI-14"],"T1195":["CM-14","PL-8(2)","SA-9(7)","SI-7","SI-7(1)","SR-10","SR-3(1)","SR-3(2)","SR-4","SR-4(1)","SR-4(2)","SR-4(3)","SR-4(4)","SR-6(1)","SR-9"],"T1495":["AC-2(6)","AC-6(5)","CM-5(5)","CP-2(5)","IR-4(2)","IR-4(3)","SA-17(9)","SA-20","SA-23","SC-29","SC-48","SC-48(1)","SC-51","SC-7(20)","SI-4(1)","SI-7","SI-7(10)","SI-7(9)"],"T1499":["AC-4(3)","AU-5(3)","CP-2(8)","IR-4(13)","IR-4(2)","RA-9","SC-2","SC-26","SC-30(4)","SC-32","SC-5(2)","SC-5(3)","SC-7(11)","SC-7(20)","SC-7(21)","SI-4(1)","SI-7","SI-7(1)"],"T1542":["IR-4(12)","IR-4(13)","SC-51","SI-14(1)","SI-4(16)","SI-6","SI-7","SI-7(1)","SI-7(9)"],"T1552":["AU-6(3)","AU-6(5)","IA-2(6)","SC-2","SC-2(1)","SC-28(1)","SC-3(3)","SC-30(4)","SC-32","SC-32(1)","SI-20"],"T1005":["IR-4(13)","SC-2","SC-2(1)","SC-28(1)","SC-32","SC-32(1)","SI-4(2)"],"T1020":["AC-4(27)","AC-4(29)","AC-4(30)","AU-6","CA-8","IR-4(13)","SC-26","SC-30(4)","SC-7(10)","SI-20","SI-23","SI-4(18)","SI-4(2)","SI-4(4)"],"T1052":["CM-7(2)","CM-8(3)","IR-4(13)","SC-26","SC-30(4)","SI-20","SI-23","SI-4(2)"],"T1098":["AC-2(12)","AC-4(21)","AC-6(2)","AU-6(5)","IA-2(13)","SC-30(4)","SC-7","SC-7(20)","SC-7(21)","SI-20"],"T1133":["AC-4(2)","AC-4(21)","CM-7(2)","IA-2(13)","SC-10","SC-23(3)","SC-7","SC-7(21)","SC-7(22)","SI-14(3)","SI-4(13)","SI-4(16)"],"T1199":["PM-16","PM-30(1)","SC-7","SC-7(21)","SI-10(3)"],"T1485":["AC-4(2)","AC-4(3)","AC-4(8)","CP-2(5)","CP-2(8)","CP-9","CP-9(6)","IR-4(13)","IR-4(2)","IR-4(9)","RA-9","SA-9(7)","SC-30(3)","SC-36","SI-22","SI-23","SI-4(1)","SI-4(2)","SI-7","SI-7(1)"],"T1490":["AC-2(6)","CP-2(5)","CP-2(8)","CP-9","CP-9(6)","CP-9(8)","IR-4(13)","IR-4(2)","IR-4(3)","RA-9","SA-17(9)","SA-20","SA-23","SC-29","SC-48","SC-48(1)","SC-7(20)","SI-4(1)","SI-4(2)","SI-4(24)","SI-7","SI-7(1)"],"T1562":["AC-6(1)","IR-4(13)","SC-25","SC-26","SC-30(4)","SC-34","SC-34(1)","SC-7(21)","SI-4(2)"],"T1563":["AC-12","AC-2(12)","AC-4(2)","AC-4(21)","SC-23(3)","SC-30(2)","SC-7","SI-14(3)"],"T1072":["AC-4(3)","AC-6(4)","AC-6(5)","AC-6(7)","AU-6(3)","AU-6(5)","CM-7(6)","IR-4(2)","IR-4(3)","PM-16","PM-30(1)","SC-26","SC-30(4)","SC-7(21)","SI-14(1)","SI-4(17)"],"T1136":["CA-7(5)","IR-4(13)","SI-4(2)"],"T1498":["AC-4(3)","AU-5(3)","IR-4(13)","IR-4(2)","SC-22","SC-5(2)","SC-5(3)","SC-7(11)","SC-7(20)"],"T1557":["AC-4(3)","AC-6(3)","CM-7(2)","IR-4(13)","IR-4(2)","IR-4(3)","SC-26","SC-3(3)","SC-7","SC-7(11)","SC-7(21)","SC-7(22)","SI-10(5)","SI-4(4)"]};
  const TC = {"AC-6(7)":["Review of User Privileges",1],"AU-6(3)":["Correlate Audit Record Repositories",1],"SC-30(4)":["Misleading Information",0],"SI-20":["Tainting",0],"SI-4(16)":["Correlate Monitoring Information",1],"AC-6(10)":["Prohibit Non-privileged Users from Executing Privileged Functions",1],"AC-6(3)":["Network Access to Privileged Commands",1],"CM-8(3)":["Automated Unauthorized Component Detection",1],"IA-3(1)":["Cryptographic Bidirectional Authentication",1],"AU-6":["Audit Record Review, Analysis, and Reporting",1],"CA-7(5)":["Consistency Analysis",1],"IA-2(13)":["Out-of-band Authentication",0],"SA-17(9)":["Design Diversity",0],"AC-4(2)":["Processing Domains",0],"AC-4(21)":["Physical or Logical Separation of Information Flows",1],"IR-4(2)":["Dynamic Reconfiguration",0],"PL-8(1)":["Defense in Depth",1],"SC-11":["Trusted Path",0],"SC-26":["Decoys",0],"SC-28(1)":["Cryptographic Protection",1],"SC-7(29)":["Separate Subnets to Isolate Functions",1],"SI-15":["Information Output Filtering",1],"SI-22":["Information Diversity",0],"SI-7":["Software, Firmware, and Information Integrity",1],"SI-7(1)":["Integrity Checks",1],"SR-10":["Inspection of Systems or Components",1],"AC-6(5)":["Privileged Accounts",1],"IA-5(7)":["No Embedded Unencrypted Static Authenticators",1],"SC-16(1)":["Integrity Verification",1],"SC-16(3)":["Cryptographic Binding",1],"SI-14(1)":["Refresh from Trusted Sources",1],"SI-7(15)":["Code Authentication",1],"SI-7(6)":["Cryptographic Protection",0],"SI-7(9)":["Verify Boot Process",1],"SR-4(3)":["Validate as Genuine and Not Altered",0],"AU-6(5)":["Integrated Analysis of Audit Records",1],"SC-7(15)":["Networked Privileged Accesses",1],"SC-7(20)":["Dynamic Isolation and Segregation",0],"SC-7(21)":["Isolation of System Components",1],"AU-9(1)":["Hardware Write-once Media",0],"AU-9(2)":["Store on Separate Physical Systems or Components",1],"AU-9(3)":["Cryptographic Protection",1],"AU-9(6)":["Read-only Access",1],"IR-4(13)":["Behavior Analysis",1],"SC-8(4)":["Conceal or Randomize Communications",0],"SI-14(2)":["Non-persistent Information",0],"SI-4(2)":["Automated Tools and Mechanisms for Real-time Analysis",1],"AC-4(17)":["Domain Authentication",0],"AC-4(3)":["Dynamic Information Flow Control",0],"CM-7(5)":["Authorized Software — Allow-by-exception",1],"IR-4(3)":["Continuity of Operations",1],"SC-23(3)":["Unique System-generated Session Identifiers",1],"SC-25":["Thin Nodes",0],"SI-21":["Information Refresh",1],"SI-4(13)":["Analyze Traffic and Event Patterns",1],"CM-7(4)":["Unauthorized Software — Deny-by-exception",0],"SI-4(24)":["Indicators of Compromise",1],"AU-6(8)":["Full Text Analysis of Privileged Commands",0],"SC-30":["Concealment and Misdirection",0],"SC-8(1)":["Cryptographic Protection",1],"SC-8(5)":["Protected Distribution System",0],"SI-14(3)":["Non-persistent Connectivity",0],"SI-4(4)":["Inbound and Outbound Communications Traffic",1],"SC-7":["Boundary Protection",1],"SC-7(3)":["Access Points",1],"SC-7(5)":["Deny by Default — Allow by Exception",1],"SI-23":["Information Fragmentation",0],"SI-4(18)":["Analyze Traffic and Covert Exfiltration",0],"CM-7(2)":["Prevent Program Execution",1],"SI-14":["Non-persistence",1],"CM-14":["Signed Components",1],"PL-8(2)":["Supplier Diversity",1],"SA-9(7)":["Organization-controlled Integrity Checking",0],"SR-3(1)":["Diverse Supply Base",1],"SR-3(2)":["Limitation of Harm",1],"SR-4":["Provenance",1],"SR-4(1)":["Identity",0],"SR-4(2)":["Track and Trace",0],"SR-4(4)":["Supply Chain Integrity — Pedigree",0],"SR-6(1)":["Testing and Analysis",1],"SR-9":["Tamper Resistance and Detection",1],"AC-2(6)":["Dynamic Privilege Management",0],"CM-5(5)":["Privilege Limitation for Production and Operation",1],"CP-2(5)":["Continue Mission and Business Functions",0],"SA-20":["Customized Development of Critical Components",0],"SA-23":["Specialization",0],"SC-29":["Heterogeneity",1],"SC-48":["Sensor Relocation",0],"SC-48(1)":["Dynamic Relocation of Sensors or Monitoring Capabilities",0],"SC-51":["Hardware-based Protection",0],"SI-4(1)":["System-wide Intrusion Detection System",1],"SI-7(10)":["Protection of Boot Firmware",1],"AU-5(3)":["Configurable Traffic Volume Thresholds",0],"CP-2(8)":["Identify Critical Assets",1],"RA-9":["Criticality Analysis",1],"SC-2":["Separation of System and User Functionality",1],"SC-32":["System Partitioning",0],"SC-5(2)":["Capacity, Bandwidth, and Redundancy",1],"SC-5(3)":["Detection and Monitoring",1],"SC-7(11)":["Restrict Incoming Communications Traffic",1],"IR-4(12)":["Malicious Code and Forensic Analysis",1],"SI-6":["Security and Privacy Function Verification",1],"IA-2(6)":["Access to Accounts —separate Device",1],"SC-2(1)":["Interfaces for Non-privileged Users",0],"SC-3(3)":["Minimize Nonsecurity Functionality",0],"SC-32(1)":["Separate Physical Domains for Privileged Functions",0],"AC-4(27)":["Redundant/Independent Filtering Mechanisms",0],"AC-4(29)":["Filter Orchestration Engines",0],"AC-4(30)":["Filter Mechanisms Using Multiple Processes",0],"CA-8":["Penetration Testing",1],"SC-7(10)":["Prevent Exfiltration",1],"AC-2(12)":["Account Monitoring for Atypical Usage",1],"AC-6(2)":["Non-privileged Access for Nonsecurity Functions",1],"SC-10":["Network Disconnect",1],"SC-7(22)":["Separate Subnets for Connecting to Different Security Domains",1],"PM-16":["Threat Awareness Program",0],"PM-30(1)":["Suppliers of Critical or Mission-essential Items",0],"SI-10(3)":["Predictable Behavior",1],"AC-4(8)":["Security and Privacy Policy Filters",0],"CP-9":["System Backup",1],"CP-9(6)":["Redundant Secondary System",0],"IR-4(9)":["Dynamic Response Capability",0],"SC-30(3)":["Change Processing and Storage Locations",0],"SC-36":["Distributed Processing and Storage",1],"CP-9(8)":["Cryptographic Protection",1],"AC-6(1)":["Authorize Access to Security Functions",1],"SC-34":["Non-modifiable Executable Programs",1],"SC-34(1)":["No Writable Storage",0],"AC-12":["Session Termination",1],"SC-30(2)":["Randomness",0],"AC-6(4)":["Separate Processing Domains",0],"CM-7(6)":["Confined Environments with Limited Privileges",0],"SI-4(17)":["Integrated Situational Awareness",0],"SC-22":["Architecture and Provisioning for Name/Address Resolution Service",1],"SI-10(5)":["Restrict Inputs to Trusted Sources and Approved Formats",1]};

  // ——— Dates and small parts ———
  const D = (iso) => new Date(iso + "T12:00:00");
  const diffDays = (d) => Math.round((d - TODAY) / 86400000);
  const fromDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() !== 2026 ? { year: "numeric" } : {}) });
  const dd = (iso) => (iso ? fromDate(D(iso)) : "");
  const dfull = (iso) => D(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const ring = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const dueC = (d) => (d.getFullYear() !== 2026 ? `<span class="num">${fromDate(d)}</span>` : dueCell(d));
  const tr = (s, w) => `<span class="a-risk-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const mu = (t) => `<span class="a-risk-mu">${t}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const co = (n) => AK.co(n).replace('class="ak-co"', 'class="ak-co a-risk-co"');
  const plain = (t) => `<p class="note-p">${t}</p>`;
  const go = (route) => `data-go="${esc(route)}" role="link" tabindex="0"`;
  const dl = `<svg class="ak-i" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v8M5 8l3 3 3-3M3 13h10"/></svg>`;
  const btn = (label, attrs = "", ink = false) => `<span class="btn sm${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const SEVR = { critical: 0, high: 1, moderate: 2, low: 3 };
  const ctlKey = (c) => { const m = c.match(/^([A-Z]+)-(\d+)(?:\((\d+)\))?/); return m ? [m[1], +m[2], m[3] ? +m[3] : 0] : [c, 0, 0]; };
  const ctlSort = (a, b) => { const x = ctlKey(a), y = ctlKey(b); return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1] || x[2] - y[2]; };

  // ——— Rows shaped as mod-risk.js shapes them ———
  const ISS = ISS_RAW.map(([id, sev, opened, owner, poam, title, from]) => {
    const due = dueOf(opened, sev); const left = diffDays(due);
    return { id, sev, opened, owner, poam, title, due, left, late: left < 0, soon: left >= 0 && left <= 14, from: from ? from.split(",").map((x) => x.split(":")) : [] };
  });
  const byDue = ISS.slice().sort((a, b) => a.due - b.due);
  const POAM = POAM_RAW.map(([id, title, status, owner, planned, ms, issues, plan]) => {
    const its = (issues || []).map((x) => ISS.find((i) => i.id === x)).filter(Boolean);
    const deadline = its.length ? new Date(Math.min(...its.map((i) => i.due))) : null;
    const mss = (ms || []).map(([seq, t, s, pd, cd, o]) => ({ seq, title: t, status: s, planned: pd, done: cd, owner: o, item: id }));
    return { id, title, status, owner, planned, ms: mss, issues: its, plan, deadline, fromF: its.some((i) => i.from.length), reached: mss.filter((m) => m.status === "completed").length,
      lateVs: deadline && planned && status !== "completed" ? diffDays(D(planned)) - diffDays(deadline) : 0 };
  });
  const MILESTONES = POAM.flatMap((p) => p.ms);
  const poamById = (id) => POAM.find((p) => p.id === id) || POAM[0];
  const PSTAT = { in_progress: ["warn", "In progress"], completed: ["ok", "Completed"], open: ["none", "Not started"], planned: ["none", "Planned"] };
  const pstat = (s) => pill(PSTAT[s][0], PSTAT[s][1]);
  const RISKS = RISKS_RAW.map(([id, title, sev, lik, imp, owner, threat, due, tech]) => ({ id, title, sev, lik, imp, owner, threat, due, tech }));
  const riskById = (id) => RISKS.find((r) => r.id === id) || RISKS[0];
  const RISK1 = RISKS[0].id;
  const AF = AF_RAW.map(([code, title, det, res, date]) => ({ id: `${code}|${res}`, code, title, det, res, date }));
  const DET = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["info", "Not assessed"] };
  const RES = { init: "SAR · initial authorization", inc1: "SAR · expanded set, increment 1", inc2: "Interim results, increment 2" };

  // ——— v2 (C1): the assurance chain (mod-zzzz-v2-1chain.js) ———
  // The operational issues its published results opened, the POA&M items and risks a reader created, and the assessment
  // findings its walks recorded join these lists at draw time (sync), ahead of WS-X90's own; every count below is read from
  // the lists, so a count and the rows it opens agree [B7]. A risk shows on the issue and the item it rests on [B12].
  const CH = () => window.PA.v2 && window.PA.v2.chain;
  const ISS0 = ISS.slice(), POAM0 = POAM.slice(), RISKS0 = RISKS.slice(), AF0 = AF.slice();
  const shapeIss = ({ id, sev, opened, owner = "", poam = "", title, from = [] }) => { const due = dueOf(opened, sev); const left = diffDays(due); return { id, sev, opened, owner, poam, title, due, left, late: left < 0, soon: left >= 0 && left <= 14, from, chain: true }; };
  function sync() {
    const ch = CH();
    const cPoam = ch ? ch.poams() : [];
    const cIss = ch ? ch.issues().map((i) => shapeIss({ id: i.id, sev: i.sev, opened: i.opened, title: i.title, from: [[i.ctl, ch.view(i.ctl).det || "other_than_satisfied"]] })) : [];
    // v2 (F): an item the POA&M register's own Create made may answer several issues (also: the rest of the issues chosen).
    const answers = (x, i) => x.issue === i.id || (x.also || []).includes(i.id);
    ISS0.forEach((i) => { if (i._poam0 === undefined) i._poam0 = i.poam; const p = cPoam.find((x) => answers(x, i)); i.poam = p ? p.title : i._poam0; });
    cIss.forEach((i) => { const p = cPoam.find((x) => answers(x, i)); i.poam = p ? p.title : ""; });
    ISS.splice(0, ISS.length, ...cIss, ...ISS0);
    byDue.splice(0, byDue.length, ...cIss, ...ISS0.slice().sort((a, b) => a.due - b.due)); // what a reader just opened is listed first
    const items = cPoam.map((p) => { const its = ISS.filter((i) => answers(p, i)); const deadline = its.length ? new Date(Math.min(...its.map((i) => i.due))) : null; return { id: p.id, title: p.title, status: "open", owner: p.owner, planned: p.planned, ms: [], issues: its, plan: p.plan, deadline, fromF: its.some((i) => i.from.length), reached: 0, lateVs: deadline && p.planned ? diffDays(D(p.planned)) - diffDays(deadline) : 0, chain: true, created: p.created }; });
    POAM.splice(0, POAM.length, ...items, ...POAM0);
    const cRisk = ch ? ch.risks().map((r) => ({ id: r.id, title: r.title, sev: r.sev, lik: r.lik, imp: r.imp, owner: r.owner, threat: r.threat || "", due: "", tech: [], chain: true, issue: r.issue, poam: r.poam, created: r.created })) : [];
    RISKS.splice(0, RISKS.length, ...cRisk, ...RISKS0);
    const cAF = ch ? ch.afs().map((x) => ({ id: `${x.code}|${x.res}`, code: x.code, title: x.title, det: x.det, res: x.res, resLabel: x.resLabel, date: x.date, chain: true })) : [];
    AF.splice(0, AF.length, ...cAF, ...AF0);
  }
  const accOf = (r) => (CH() ? CH().acc(r.id) : null);
  const accPillOf = (r) => (CH() ? CH().accPill(accOf(r)) : pill("none", "Not requested"));
  // The risk an issue or an item rests on: one the chain created on it, else WS-X90's "Risk arising from REQ-…" for an unmet requirement.
  const riskOfIssue = (i) => { if (!i) return null; const c = RISKS.find((r) => r.chain && r.issue === i.id); if (c) return c; const m = i.title.match(/^Unmet requirement (REQ-\d+)/); return m ? RISKS.find((r) => r.title === `Risk arising from ${m[1]}`) || null : null; };
  const riskOfPoam = (p) => { if (!p) return null; const c = RISKS.find((r) => r.chain && r.poam === p.id); if (c) return c; for (const i of p.issues) { const r = riskOfIssue(i); if (r) return r; } const m = p.title.match(/^Remediate (REQ-\d+)/); return m ? RISKS.find((r) => r.title === `Risk arising from ${m[1]}`) || null : null; };
  const issueOfRisk = (r) => (r.chain ? ISS.find((i) => i.id === r.issue) : (() => { const m = r.title.match(/^Risk arising from (REQ-\d+)/); return m ? ISS.find((i) => i.title === `Unmet requirement ${m[1]}`) : null; })());
  // v2 (F): byTitle finds a record a chain names by its title (a traceability chain cuts long titles), all() the lists as drawn.
  const findTitle = (L, t) => { const k = String(t || "").replace(/…$/, "").trim(); return L.find((x) => x.title === k) || (k.length > 30 ? L.find((x) => x.title.startsWith(k)) : null) || null; };
  window.PA.riskLookup = { issue: (id) => (sync(), ISS.find((i) => i.id === id) || null), risk: (id) => (sync(), RISKS.find((r) => r.id === id) || null), poam: (id) => (sync(), POAM.find((p) => p.id === id) || null),
    byTitle: (kind, t) => { sync(); return findTitle(kind === "issue" ? ISS : kind === "risk" ? RISKS : POAM, t); }, all: () => (sync(), { ISS, RISKS, POAM }) };
  const sevCounts = (list) => ({ critical: list.filter((x) => x.sev === "critical").length, high: list.filter((x) => x.sev === "high").length, moderate: list.filter((x) => x.sev === "moderate").length, low: list.filter((x) => x.sev === "low").length });
  const afDelta = (det) => AF.filter((x) => x.chain && x.det === det).length;
  // The first risk's rationale and description, from risk_revisions.
  const RATIONALE = "Moderate likelihood: it needs the laptop in hand, but the flightline is where it is used most and watched least. High impact: one secret stands between an outsider and privileged maintenance on a platform categorized high for confidentiality.";
  // WS-X90's nine closed operational issues (operational_issues, status closed). closed_at is empty for all nine, so the closing days are Example.
  const CLOSED = [
    ["fdb85e36", "high", "2026-08-03", "Unmet requirement REQ-039", "2026-11-10"],
    ["4a718961", "moderate", "2026-08-21", "Unmet requirement REQ-114", "2026-09-20"],
    ["7813f01e", "low", "2026-08-19", "Unmet requirement REQ-074", "2026-10-15"],
    ["d63206a4", "moderate", "2026-10-03", "Maintenance session transcripts sat outside the correlation key space on the Security Log Collector (AU-6(3))", "2026-11-04"],
    ["7bb62aeb", "moderate", "2026-10-26", "Provisioning Workstation tooling screened for interpreted-code technologies by review rather than at build (SC-18)", "2026-11-12"],
    ["884b66de", "low", "2026-11-05", "Four Internal Ethernet Switch ports reported unlisted hardware without refusing it a data path (CM-7(9))", "2026-11-13"],
    ["d370ad92", "low", "2026-10-27", "Switch-relayed audit records ordered on arrival rather than origin in the compiled trail (AU-12(1))", "2026-11-14"],
    ["fe5baef3", "low", "2026-11-11", "Out-of-work-order privileged tool use discoverable only by query on the Security Log Collector (MA-3(5))", "2026-11-15"],
    ["0299f647", "low", "2026-11-11", "Out-of-window remote privileged commands logged and then admitted by the Maintenance Access Gateway (AC-17(4))", "2026-11-16"],
  ].map(([id, sev, opened, title, closed]) => { const due = dueOf(opened, sev); const late = diffDays(D(closed)) - diffDays(due); return { id, sev, opened, title, closed, due, late }; });
  const ASSET_NAMES = ["Mission Computer", "Secure Boot Controller", "Cryptographic Services Module", "Navigation Processor", "Timing Receiver", "Navigation Sensor Interface", "Protected Network Gateway", "Tactical Data Radio", "Internal Ethernet Switch", "Payload Interface Controller", "Payload Safety Interlock", "Payload Telemetry Unit", "Platform Management Controller", "Maintenance Access Gateway", "Secure Storage Module", "Update & Recovery Controller", "Provisioning Workstation", "Security Log Collector", "Maintenance Laptop", "Configuration Repository"];
  const ASSETS = ASSET_NAMES.map((name, i) => {
    const n = String(i + 1).padStart(3, "0");
    const its = ISS.filter((x) => x.title.toLowerCase().includes(name.toLowerCase()) || (name === "Mission Computer" && x.id === "c0fdce4e"));
    const worst = its.length ? its.slice().sort((a, b) => SEVR[a.sev] - SEVR[b.sev])[0].sev : null;
    const next = its.length ? new Date(Math.min(...its.map((x) => x.due))) : null;
    return { id: `AST-109${n}`, lru: `LRU-${n}`, name, issues: its, worst, next, cves: name === "Mission Computer" ? 1 : 0, sbom: name === "Mission Computer" };
  });
  const VULNS = [
    { id: "CVE-2024-6387", ex: false, title: "Signal handler race in OpenSSH's sshd (regreSSHion)", sev: "high", cvss: "8.1", asset: "Mission Computer · LRU-001", iava: null, opened: "2026-10-10", status: ["warn", "Fix in version 2"] },
    { id: "CVE-2023-48795", ex: true, title: "SSH prefix truncation (Terrapin)", sev: "moderate", cvss: "5.9", asset: "Maintenance Access Gateway · LRU-014", iava: "IAVB 2024-B-0011", opened: "2026-09-02", status: ["warn", "Patch staged"] },
    { id: "CVE-2023-4911", ex: true, title: "glibc dynamic loader buffer overflow (Looney Tunables)", sev: "high", cvss: "7.8", asset: "Provisioning Workstation · LRU-017", iava: "IAVA 2023-A-0532", opened: "2026-10-28", status: ["none", "Not started"] },
    { id: "CVE-2024-3596", ex: true, title: "RADIUS response forgery (Blast-RADIUS)", sev: "critical", cvss: "9.0", asset: "Protected Network Gateway · LRU-007", iava: "IAVA 2024-A-0402", opened: "2026-11-06", status: ["info", "Awaiting rescan"] },
  ].map((v) => ({ ...v, due: dueOf(v.opened, v.sev) }));
  const DEACT = [
    { id: "d1", finding: "STIG V-230264, package signature check (CAT II)", scope: "Provisioning Workstation", reason: "Not applicable", evidence: "Media signing procedure, revision 4", by: "Joel Barrantes", ends: "2027-02-15" },
    { id: "d2", finding: "ACAS plugin 187201, weak SSH MAC offered", scope: "Maintenance Laptop", reason: "Compensating control", evidence: "Flight configuration export, build 4.2.1", by: "Priya Raghavan", ends: "2026-11-24" },
    { id: "d3", finding: "Screen lock after 15 minutes (AC-11)", scope: "Navigation Processor", reason: "Not applicable", evidence: null, by: "Priya Raghavan", ends: "2027-03-01" },
    { id: "d4", finding: "STIG V-257777, FIPS mode for TLS (CAT I)", scope: "Timing Receiver", reason: "False positive", evidence: "CMVP certificate and vendor letter", by: "Joel Barrantes", ends: "2027-05-30" },
  ];
  const TIERS = { 1: ["Tier 1", "Quarterly", ["Attestation", "SBOM", "HBOM", "CMMC Level 2", "Counterfeit plan"]], 2: ["Tier 2", "Twice a year", ["Attestation", "SBOM", "CMMC Level 2"]], 3: ["Tier 3", "Yearly", ["Attestation", "CMMC Level 1"]] };
  const SUPPLIERS = [
    { id: "x800", n: "X800 Missile component set", kind: "Component set", tier: 1, owner: "Priya Raghavan", line: "Air Defense", comps: 18, note: "1 SBOM · 1 open CVE", flags: [["bad", "Open CVE"]], next: "2027-01-15", got: 1 },
    { id: "g25", n: "G25 launch control component set", kind: "Component set", tier: 1, owner: "Marcus Ryde", line: "Mission Systems", comps: 8, note: "No SBOM", flags: [], next: "2027-01-15", got: 0 },
    { id: "g40", n: "G40 ground terminal component set", kind: "Component set", tier: 2, owner: null, line: null, comps: 4, note: "No SBOM", flags: [], next: "2027-03-01", got: 0 },
    { id: "r210", n: "R210 launcher electronics component set", kind: "Component set", tier: 2, owner: null, line: null, comps: 3, note: "No SBOM", flags: [], next: "2027-03-01", got: 0 },
    { id: "ald", n: "Aldergrove Microelectronics", kind: "Hardware", tier: 1, owner: "Priya Raghavan", line: null, ex: true, comps: 2, note: "Mission Computer, Cryptographic Module", flags: [["bad", "Counterfeit alert"]], next: "2026-11-30", got: 0 },
    { id: "kes", n: "Kestrel Power Systems", kind: "Hardware", tier: 2, owner: "Marcus Ryde", line: null, ex: true, comps: 1, note: "Launcher Power Supply", flags: [["warn", "DMSMS notice"]], next: "2027-02-01", got: 0 },
    ...["Larkspur Cloud", "Northwind Analytics", "Tessellate Support", "Cobalt Mail", "Meridian Payroll", "Pinehurst Legal"].map((n) => ({ id: n.split(" ")[0].toLowerCase(), n, kind: "Organization", tier: 3, owner: null, line: null, comps: 0, note: "Workspace supplier", flags: [], next: "2027-06-01", got: 0 })),
  ];
  const OPENBSD = { id: "openbsd", n: "OpenBSD project (OpenSSH)", kind: "Open source", tier: 2, owner: null, line: null, comps: 1, flags: [["bad", "Open CVE"]], next: "2026-12-01" };
  const supById = (id) => SUPPLIERS.find((s) => s.id === id) || SUPPLIERS[0];
  const RECIPIENTS = [
    { id: "ao", n: "R. Calloway", role: "Authorizing official", acc: "Full package · sign", exp: "2027-09-17" },
    { id: "la", n: "D. Okafor", role: "Lead assessor", acc: "Full package", exp: "2027-03-31" },
    { id: "issm", n: "Joel Barrantes", role: "ISSM", acc: "Full package · share", exp: "2027-09-17" },
    { id: "isso", n: "Priya Raghavan", role: "ISSO", acc: "Full package · share", exp: "2027-09-17" },
    { id: "so", n: "Ray Colston", role: "System owner", acc: "Read only", exp: "2027-09-17" },
    { id: "navy", n: "Receiving AO's representative", role: "Reciprocity reviewer", acc: "SSP, SAR, POA&M · no download", exp: "2026-12-15", ex: true, last: "Nov 16" },
    { id: "cssp", n: "CSSP analyst", role: "Cybersecurity service provider", acc: "SSP and POA&M", exp: "2027-01-31", ex: true, last: "Nov 15" },
  ];
  const ACCESS = [
    ["Nov 16, 14:02", "Receiving AO's representative", "Opened the SAR (version 1)", "Watermarked view"],
    ["Nov 15, 09:41", "CSSP analyst", "Downloaded the POA&M (OSCAL JSON)", "Watermarked file"],
    ["Nov 14, 16:20", "Joel Barrantes", "Shared with the receiving AO's representative", "Expires Dec 15"],
    ["Nov 12, 11:05", "R. Calloway", "Opened the SSP (version 1)", "Watermarked view"],
  ];
  const DOCS_V1 = [["System security plan", "SSP 2 · published Jul 25"], ["Security assessment plan", "Initial authorization"], ["Security assessment report", "68 determinations · Aug 28"], ["Annual incident response capability test report", "Evidence"], ["Independent penetration test report, external boundary and technician session path", "Evidence"], ["Contingency planning policy and recovery procedure set, revision 3.1", "Evidence"]];
  const CONDITIONS = [["Close the high-severity remediation items within 90 days", "2026-12-17"], ["Complete the expanded control set assessment", "2026-11-20"], ["Report the SA-24 design review at the annual authorization review", "2027-09-18"]];
  const DC = [
    { id: "fisma", name: "FY2027 FISMA annual data call", from: "DoD CIO via the PEO", due: "2026-12-11", q: 48, drafted: 41, conflicts: 2, review: ["warn", "In review"], owner: "Joel Barrantes", approver: null, comments: 1 },
    { id: "ready", name: "Cyber readiness data call — Q1 FY2027", from: "Component cyber command", due: "2026-11-24", q: 22, drafted: 22, conflicts: 1, review: ["warn", "In review"], owner: "Priya Raghavan", approver: null, comments: 0 },
    { id: "scrm", name: "SCRM data call — microelectronics provenance", from: "PEO supply chain office", due: "2026-11-20", q: 15, drafted: 9, conflicts: 3, review: ["bad", "Needs answers"], owner: "Ray Colston", approver: null, comments: 0 },
    { id: "cusa", name: "Customer A security questionnaire — rail integration", from: "Customer A", due: "2026-12-04", q: 64, drafted: 38, conflicts: 0, review: ["none", "Drafting"], owner: null, approver: null, comments: 0 },
    { id: "fy26", name: "FY2026 FISMA annual data call", from: "DoD CIO via the PEO", due: "2025-12-12", q: 46, drafted: 46, conflicts: 0, review: ["ok", "Sent"], owner: "Joel Barrantes", approver: "Ray Colston", comments: 0 },
  ];
  const QA = [
    ["Does the system hold a current authorization to operate?", "Yes: authorized with conditions by R. Calloway on Sep 18, 2026; it expires Sep 17, 2029.", "Authorization decision · package version 1", "ok", "Matches"],
    ["Are credentialed vulnerability scans run at least weekly?", "ACAS scans the mission network; the last completed scan is Oct 10, 2026 (1,284 results, 26 hosts).", "Scanner ingestion · SSP 3 RA-5", "bad", "Conflict"],
    ["How many POA&M items are open?", "41 items: 7 completed, 33 in progress, 1 not started.", "POA&M · WS-X90", "ok", "Matches"],
    ["Is multifactor authentication enforced for privileged accounts?", "Yes: tested on LRU-013 and LRU-014, build 4.2.1, and accepted Nov 12.", "Evidence · privileged two-factor enforcement test report", "warn", "Needs review"],
    ["Do you keep a software bill of materials for mission software?", "Yes for the Mission Computer image (CycloneDX 1.5, 13 components, Nov 12); the Payload Interface Controller firmware SBOM is being validated.", "SBOMs · Mission Computer", "ok", "Matches"],
    ["When was incident response capability last tested?", "Annual incident response capability test report, injected detection and account-abuse cases.", "Package version 1 · document", "warn", "Needs a date"],
  ];

  // ——— State: chosen rows and quick views, kept while the prototype is open ———
  const SEL = {};
  const QS = {};
  const SEVF = {}; // v2 F [B2]: a Severity filter a question applied (My work's Treat 2 critical risks), shown as a removable chip
  const sel = (key, defaults = []) => SEL[key] || (SEL[key] = new Set(defaults));
  const redraw = (focus) => {
    const r = (location.hash || "#home").slice(1);
    if (!S[r]) return;
    const main = document.getElementById("main");
    const top = main.scrollTop;
    main.innerHTML = S[r]();
    main.scrollTop = top;
    const el = focus && main.querySelector(focus);
    if (el) el.focus();
  };
  const act = (e) => {
    const sc = e.target.closest("[data-arsevclr]");
    if (sc) { e.stopPropagation(); e.preventDefault(); delete SEVF[sc.dataset.arsevclr]; redraw(".a-risk-tools .in"); return true; }
    const c = e.target.closest("[data-arsel]");
    if (c) {
      e.stopPropagation(); e.preventDefault();
      const key = c.dataset.arsel, id = c.dataset.arid, s = sel(key);
      if (id === "*") { const ids = c.dataset.arall.split(","); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      redraw(`[data-arsel="${key}"][data-arid="${CSS.escape(id)}"]`);
      return true;
    }
    const d = e.target.closest("[data-ardesel]");
    if (d) { e.stopPropagation(); e.preventDefault(); SEL[d.dataset.ardesel] = new Set(); redraw(`[data-arsel="${d.dataset.ardesel}"][data-arid="*"]`); return true; }
    const q = e.target.closest("[data-arq]");
    if (q) { e.stopPropagation(); e.preventDefault(); QS[q.dataset.arq] = q.dataset.arv; redraw(`[data-arq="${q.dataset.arq}"][data-arv="${q.dataset.arv}"]`); return true; }
    // v2: a quick view that lives on another screen (Suppliers' Found in SBOMs and back): set the view, then open it.
    const qg = e.target.closest("[data-arqgo]");
    if (qg) { e.stopPropagation(); e.preventDefault(); const [k, v, r] = qg.dataset.arqgo.split("|"); QS[k] = v; location.hash = r; return true; }
    return false;
  };
  document.addEventListener("click", act, true);
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-arsel], [data-ardesel]")) act(e); }, true);

  // ——— Shared pieces: checkboxes, tables, quick views, toolbars, line tabs with callouts, menus ———
  const cb = (key, id, on, label) => `<span class="a-risk-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-arsel="${esc(key)}" data-arid="${esc(id)}">${AK.check(on)}</span>`;
  const cbAll = (key, ids, label) => { const s = sel(key); const all = ids.length > 0 && ids.every((i) => s.has(i)); return `<span class="a-risk-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : s.size ? "mixed" : "false"}" aria-label="${esc(label)}" data-arsel="${esc(key)}" data-arid="*" data-arall="${esc(ids.join(","))}">${AK.check(all)}</span>`; };
  function tbl({ cols, rows, total, panel = "", nm = 0, cls = "", empty = "Nothing matches this view.", pager = true }) {
    const body = rows.length ? rows.map((r) => {
      const p = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` data-go="${esc(r.go)}"` : p ? ` data-panel="${esc(p)}" data-id="${esc(r.id || "")}"` : "";
      return `<tr tabindex="0"${r.sel ? ' class="sel"' : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="a-risk-empty"><td colspan="${cols.length}">${ring(empty)}</td></tr>`;
    return `<div class="frame ${cls}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }
  function qv(key, list, after = "") {
    const on = QS[key] || list[0][0];
    return `<div class="views a-risk-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv a-risk-qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-arq="${esc(key)}" data-arv="${esc(v)}">${l}${n != null ? ` <span class="num">${fmt(n)}</span>` : ""}</button>`).join("")}${after}</div>`;
  }
  const filters = (search, list, { reset = true, extra = "" } = {}) => `<div class="tools a-risk-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span>${reset ? `<span class="flt sub">Reset</span>` : ""}<span class="end">${extra}<span class="ib" title="Columns">▥</span><span class="ib" title="Settings">⚙</span></span></div>`;
  function bulk(key, n, actions, { co: c = "", after = {}, attrs = {}, extra = "" } = {}) {
    let html = AK.bulk({ count: n, actions });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-ardesel="${esc(key)}">Deselect</span>${c}`);
    for (const [label, a] of Object.entries(attrs)) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${a}>${esc(label)}</span>`);
    for (const [label, c2] of Object.entries(after)) html = html.replace(new RegExp(`(<span class="btn sm"[^>]*>${reEsc(esc(label))}</span>)`), `$1${c2}`);
    return extra ? html.replace(/<\/div>$/, `${extra}</div>`) : html;
  }
  // The search stays; once a row is chosen the selection bar takes the filters' place, as Vanta's registers do.
  const toolbar = (key, search, list, actions, opt = {}) => {
    const n = sel(key).size;
    return n ? `<div class="tools a-risk-selbar"><span class="in">${esc(search)}</span>${bulk(key, n, actions, { ...opt, extra: opt.bulkExtra || "" })}</div>` : filters(search, list, opt);
  };
  const tabs = (list, cos = {}, end = "", label) => {
    let html = AK.tabs(list, label);
    for (const [lab, n] of Object.entries(cos)) html = html.replace(new RegExp(`(>${reEsc(esc(lab))}(?:<span class="ct num">[^<]*</span>)?)(</span>)`), `$1${co(n)}$2`);
    return end ? html.replace(/<\/div>$/, `${end}</div>`) : html;
  };
  // Line tabs inside a panel re-open the same preview on another tab, so the reader never leaves the list.
  const ptabs = (kind, base, list, cur, cos = {}, end = "") => tabs(list.map(([k, l, n]) => [l, n, `@p:${k}`, k === cur]), cos, end, "Record sections")
    .replace(/data-go="@p:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`);
  const more = (label, items) => `<details class="a-risk-more"><summary class="btn" aria-label="${esc(label)}" title="${esc(label)}">${AK.i("dots")}</summary><div class="a-risk-menu" role="menu">${items.map(([l, a]) => `<span role="menuitem" tabindex="0" class="a-risk-mi" ${a || ""}>${esc(l)}</span>`).join("")}</div></details>`;
  const cardT = (title, c = "", right = "") => `<div class="t"><b class="a-risk-tt">${esc(title)}${c}</b>${right ? `<span class="num">${right}</span>` : ""}</div>`;
  // A deadline card: lines by when, each a quick view.
  const statusCard = ({ title, c = "", right = "", rows, foot = "" }) => `<div class="card a-risk-scard">${cardT(title, c, right)}<div class="rows">${rows.map(([g, l, n, q, extra]) => {
    const tagName = q ? "button" : "div";
    return `<${tagName}${q ? ` type="button" data-arq="${q[0]}" data-arv="${q[1]}"` : ""} class="row a-risk-srow">${gl(g)}<span class="a-risk-sl">${l}</span>${extra ? `<span class="a-risk-sx">${extra}</span>` : ""}<b class="num">${typeof n === "number" ? fmt(n) : n}</b></${tagName}>`;
  }).join("")}</div>${foot}</div>`;
  const sevCard = ({ title, c = "", counts, note = "" }) => {
    const total = counts.critical + counts.high + counts.moderate + counts.low;
    const parts = [["critical", "Critical", "var(--bad)", ""], ["high", "High", "var(--bad)", "opacity:.6;"], ["moderate", "Moderate", "var(--warn)", ""], ["low", "Low", "var(--ink-4)", ""]];
    // v2 F [A3]: the card's title says the total once ("44 open"); the big figure under it said it again.
    return `<div class="card a-risk-scard">${cardT(title, c, `${total} open`)}<div class="stack">${parts.filter(([k]) => counts[k]).map(([k, , col, o]) => `<i style="flex:${counts[k]};background:${col};${o}"></i>`).join("")}</div><div class="legend">${parts.map(([k, l, col, o]) => `<span style="--c:${o ? "color-mix(in srgb, var(--bad) 60%, var(--canvas))" : col}">${l} ${counts[k]}</span>`).join("")}</div>${note}</div>`;
  };
  const deadlineFoot = (c) => `<div class="a-risk-cfoot">${AK.i("clock")}<span class="a-risk-cft">Deadlines: critical 15 · high 30 · moderate 90 · low 180 days · IAVA and IAVB from the notice</span><span class="ak-link" ${go("deadlines")}>Edit</span>${c}</div>`;
  const grid2 = (a, b) => `<div class="grid2 a-risk-cards">${a}${b}</div>`;
  const li = (lead, main, end = "") => `<div class="a-risk-li">${lead}<span class="x">${main}</span>${end ? `<span class="a-risk-le">${end}</span>` : ""}</div>`;
  const sectH = (title, count, action = "", c = "") => `<div class="a-risk-ch"><b>${esc(title)}</b>${count != null ? `<span class="ct num">${esc(count)}</span>` : ""}${c}${action ? `<span class="a-risk-push">${action}</span>` : ""}</div>`;
  const field = (label, control, hint = "", flag = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const req = ' <span class="req">Required</span>';
  const opt = ' <span class="opt">Optional</span>';
  const select = (v) => `<div class="ak-select">${esc(v)} ${AK.i("down")}</div>`;
  const radio = (label, on, hint = "") => `<div class="a-risk-radio${on ? " on" : ""}"><span class="a-risk-dot" aria-hidden="true"></span><span>${label}${hint ? `<small>${hint}</small>` : ""}</span></div>`;
  const checkRow = (label, on, hint = "") => `<div class="a-risk-check">${AK.check(on)}<span>${label}${hint ? `<small>${hint}</small>` : ""}</span></div>`;
  const foot = (primary) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal>${esc(primary)}</button>`;
  const ownerBtn = (name, what) => `<span class="a-risk-pick" role="button" tabindex="0" data-modal="a-risk-owner" data-id="${esc(what)}" title="Change owner">${AK.owner(name, { label: "No owner" })}</span>`;

  // ═════════════ 1. Risks register ═════════════
  const pastResp = RISKS.filter((r) => r.due && D(r.due) < TODAY).length;
  const riskHead = (c) => h.header("Risks", `<span>WS-X90 risk register</span><span>Open <b>${RISKS.length}</b></span><span>Last decision snapshot <b>Sep 18</b></span>`,
    `${more("More risk register actions", [["Take snapshot", 'data-modal="a-risk-snap-new"'], ["Generate risk report", 'data-modal="v2k-export" data-id="the risk report"']])}${c}<button type="button" class="btn" data-modal="v2k-export" data-id="risks">Export</button><button type="button" class="btn ink" data-modal="a-risk-new-risk">Create risk</button>`);
  const awaiting = (r) => { const a = accOf(r); return !!a && a.state === "requested"; };
  const reassessCell = () => `<span class="a-risk-hc" tabindex="0">${pill("none", "Reassess by Dec 12")}<span class="a-risk-hcard" role="tooltip"><b>Reassessment</b><span>Start date November 12, 2026</span><span>Due by December 12, 2026</span><span>Due in 25 days · recurs every 3 months</span></span></span>`;
  // Severity keeps likelihood × impact one hover away, so the register keeps its Assessment and Acceptance columns in the frame.
  const sevLI = (r) => `<span class="a-risk-sev" title="${esc(cap(r.lik))} likelihood × ${esc(r.imp)} impact">${sevPill(r.sev)}</span>`;
  function riskRegister(key, withCo) {
    sync();
    // v2 F [B2]: a question asking for one severity ({ filter: { sev } }, PA.v2.go) is taken here and applied as the Severity filter.
    const V2 = window.PA.v2, q = V2 && key === "risks" && !(window.PA.v2hubs && window.PA.v2hubs.drawing()) ? V2.peek("risks") : null;
    if (q && q.filter && q.filter.sev) { V2.take("risks"); QS[key] = "all"; SEVF[key] = q.filter.sev; }
    const v = QS[key] || "all", sevF = SEVF[key] || null;
    const f = { all: () => true, high: (r) => r.sev === "critical" || r.sev === "high", noowner: (r) => !r.owner, pastresp: (r) => r.due && D(r.due) < TODAY, awaiting }[v] || (() => true);
    const list = RISKS.filter(f).filter((r) => !sevF || r.sev === sevF);
    const shown = list.slice(0, 25);
    const s = sel(key, withCo ? [RISKS[0].id, RISKS[1].id] : []);
    const c = (n) => (withCo ? co(n) : "");
    const n = s.size;
    return h.page(
      riskHead(c(4)),
      tabs([["Register", RISKS.length, null, true], ["Snapshots", 1, "after-risk-register-snapshots"]], {}, "", "Risk register"),
      qv(key, [["all", "All", RISKS.length], ["high", "Critical or high", RISKS.filter((r) => r.sev === "critical" || r.sev === "high").length], ["noowner", "No owner", RISKS.filter((r) => !r.owner).length], ["pastresp", "Response date passed", pastResp], ["awaiting", "Awaiting acceptance", RISKS.filter(awaiting).length]], c(1)),
      toolbar(key, "Search risks", ["Severity", "Likelihood", "Impact", "Assessment", "Acceptance", "ATT&CK technique", "Owner"], ["Assign owner", "Request acceptance", "Start reassessment"],
        { co: c(3), attrs: { "Assign owner": `data-modal="a-risk-owner" data-id="${n} risk${n === 1 ? "" : "s"}"`, "Request acceptance": `data-modal="a-risk-accept" data-id="${n} risks"` } })
        .replace('<span class="flt">Severity ⌄</span>', sevF ? `<button type="button" class="flt a-risk-flt-on" data-arsevclr="${esc(key)}" aria-label="Remove the filter Severity: ${esc(cap(sevF))}">Severity: ${esc(cap(sevF))} <span aria-hidden="true">✕</span></button>` : '<span class="flt">Severity ⌄</span>'),
      tbl({
        cols: [cbAll(key, shown.map((r) => r.id), "Select every risk on this page"), "Risk", `<span title="Severity, from likelihood × impact">Severity</span>`, "ATT&amp;CK techniques", "Response due", `Assessment ${EX}`, `Acceptance${c(2)}`, "Owner", `<span class="a-risk-sr">Row actions</span>`],
        rows: shown.map((r, i) => ({ id: `${r.id}|overview`, sel: s.has(r.id), cells: [
          cb(key, r.id, s.has(r.id), `Select ${r.title}`), tr(r.title, 236), sevLI(r),
          r.tech.length ? r.tech.map((t) => tag(t[0])).join(" ") : ring("None"), r.due ? dueC(D(r.due)) : ring("Not set"), r.chain ? mu("Assessed today") : reassessCell(),
          accPillOf(r), who(r.owner || null), `<span class="a-risk-dots" aria-hidden="true">${AK.i("dots")}</span>`,
        ] })),
        total: list.length, panel: "a-risk-risk", nm: 1, cls: "a-risk-tight",
      }),
      AK.note("The 3-month reassessment cadence, counted from the Sep 12 assessment, is invented. Every response of WS-X90's own 40 risks is Mitigate, and none had asked for acceptance."),
    );
  }
  S["after-risk-register"] = () => riskRegister("risks", true);

  S["after-risk-register-snapshots"] = () => h.page(
    riskHead(""),
    tabs([["Register", 40, "after-risk-register"], ["Snapshots", 1, null, true]], {}, "", "Risk register"),
    tbl({
      cols: ["Snapshot", "Decision", "Taken", "Risks", "Critical or high", "Locked by", "State", `Download${co(4)}`],
      rows: [
        { id: "v1", cells: ["Package version 1", tag("ATO with conditions"), num("Sep 18, 2026"), num(40), num(12), who("R. Calloway"), pill("ok", "Locked"), btn(`${dl}PDF`)] },
        { id: "v2", cells: ["Package version 2", ring("Pending decision"), mu("At signing"), mu("40 now"), mu("12 now"), ring("Not locked"), pill("none", "Not taken"), mu("Locks first")] },
        { id: "ex", cells: [`${tr("Risk acceptance · bearer port group", 190)} ${EX}`, tag("Risk accepted"), mu("—"), num(1), num(0), who("R. Calloway"), pill("ok", "Locked"), btn(`${dl}PDF`)] },
      ],
      total: 3, panel: "a-risk-snap", cls: "a-risk-tight",
    }),
    AK.note("The third row, a single risk acceptance, is invented. A snapshot locks each risk's severity, likelihood, impact, threat and response as the decision maker saw them."),
  );
  P["a-risk-snap"] = (id) => {
    if (id === "ex") return { label: "Snapshot preview", body: `<div class="a-risk-pan">${AK.recordHead({ title: "Risk acceptance · bearer port group" })}<p>${EX}</p>${AK.facts([["Decision", tag("Risk accepted")], ["Signed", "In order by Priya Raghavan, Joel Barrantes and R. Calloway"]])}</div>` };
    const v2 = id === "v2";
    return { label: "Snapshot preview", body: `<div class="a-risk-pan">
      ${AK.recordHead({ title: v2 ? "Package version 2 · pending" : "Package version 1 · ATO with conditions", actions: v2 ? "" : btn(`${dl}Download`) })}
      ${AK.facts([["Decision", v2 ? ring("Pending") : tag("ATO with conditions")], ["Taken", v2 ? "Locks when the AO signs" : "Sep 18, 2026"], ["Locked by", AK.owner(v2 ? null : "R. Calloway", { label: "Not locked" })], ["Risks", num("40 · 2 critical, 10 high, 18 moderate, 10 low")]])}
      ${v2 ? "" : AK.card(`${sectH("Compare with today")}<p class="a-risk-mu">No risk changed since Sep 18. Since the snapshot:</p>${li(gl("diamond"), "Operational issues opened", num(36))}${li(gl("diamond"), "Critical issues opened", num(2))}${li(gl("info"), "Assessment results published", num(1))}${li(gl("ring"), "Risks reassessed", num(0))}${li(gl("ring"), "Risks added", num(0))}`)}
      ${AK.card(`${sectH("Critical and high", 12)}${RISKS.filter((r) => r.sev === "critical" || r.sev === "high").map((r) => li(gl("diamond"), `<span class="a-risk-lk" data-panel="a-risk-risk" data-id="${r.id}|overview" role="link" tabindex="0">${esc(r.title)}</span>`)).join("")}`)}
      ${v2 ? "" : AK.card(`${sectH("Conditions of the decision", 3)}${CONDITIONS.map(([t, d]) => li(gl("clock"), esc(t), dd(d))).join("")}`)}</div>` };
  };

  // ═════════════ 2. A risk (the after version of the risk preview) ═════════════
  const counterOf = (r) => [...new Set(r.tech.flatMap((t) => TT[t[0]] || []))].map((c) => ({ code: c, title: TC[c] ? TC[c][0] : c, inBase: !!(TC[c] && TC[c][1]) }))
    .sort((a, b) => (b.inBase - a.inBase) || ctlSort(a.code, b.code));
  const assessCard = (r, open) => AK.card(`
    ${sectH("Assessment", null, open ? pill("warn", "Reassessing") : btn("Start reassessment", `data-panel="a-risk-risk" data-id="${r.id}|reassess"`), co(2))}
    <dl class="ak-kv"><dt>Last assessed</dt><dd>Sep 12, 2026</dd><dt>Likelihood</dt><dd>${esc(cap(r.lik))}</dd><dt>Impact</dt><dd>${esc(cap(r.imp))}</dd><dt>Reassess</dt><dd>Nov 12 – Dec 12, 2026 · every 3 months ${EX}</dd></dl>
    ${open ? `<div class="a-risk-rf">${[["Likelihood", cap(r.lik)], ["Impact", cap(r.imp)], ["Response", "Mitigate"]].map(([k, v]) => `<div class="a-risk-rfr"><span class="k">${k}</span><span class="ak-chg-v">${esc(v)}</span>${AK.i("down", "a-risk-rt")}${select(v)}</div>`).join("")}
      ${AK.reviewComment({ label: "Review comment", help: "Required when the likelihood, the impact or the response changes. It stays in History and in the next snapshot.", primary: "Submit to Priya Raghavan" })}</div>` : ""}`, { cls: "a-risk-acard" });
  // v2 (C1) [B1 B7]: the acceptance reads what was asked and decided (v1 drew step 1 as sent while the facts said Not requested).
  const acceptance = (r) => {
    const a = accOf(r);
    const STEP = [["Step 1 · ISSO", "Priya Raghavan"], ["Step 2 · ISSM", "Joel Barrantes"], ["Step 3 · Authorizing official", "R. Calloway"]];
    const when = (k) => { const e = a && (a.log || []).find((x, i) => i === k + 1); return e ? dd(e[2]) : a ? dd(a.log[0][2]) : ""; };
    const stateOf = (k) => (!a ? "waiting" : a.state === "accepted" ? "approved" : k + 1 < a.step ? "approved" : k + 1 === a.step ? (a.state === "returned" ? "changes" : "sent") : "waiting");
    const html = AK.approval({
      title: "Acceptance, in order", co: co(3),
      sub: !a ? "Not requested yet. Request acceptance sends it to step 1." : a.state === "accepted" ? `Accepted by R. Calloway on ${dd(a.at)}, until ${dd(a.until)}` : a.state === "returned" ? "Sent back to the risk's owner" : `Step ${a.step} of 3 waits on ${STEP[a.step - 1][1]}`,
      steps: STEP.map(([label, w], k) => ({ label, approvers: [{ who: w, state: stateOf(k), when: when(k) }] })),
      decision: a && a.state === "requested" ? "Record decision" : null,
      note: a ? `Reason given: ${esc(a.reason || "")}` : "Record decision shows to whoever holds the current step. An acceptance expires after 12 months, or with the ATO on Sep 17, 2029, whichever comes first.",
    });
    return html.replace(/<span class="btn sm" aria-label="More">[\s\S]*?<\/span>(?=<\/div>)/, "").replace('<span class="btn sm ink">Record decision</span>', `<span class="btn sm ink" role="button" tabindex="0" data-modal="v2k-decide" data-id="${esc(r.id)}">Record decision</span>`);
  };
  // v2 (C1) [B12]: what the risk rests on, each a link to its preview.
  const restsOn = (r) => {
    const i = issueOfRisk(r), p = r.chain ? POAM.find((x) => x.id === r.poam) : i ? POAM.find((x) => x.title === i.poam) : null;
    if (!i && !p) return "";
    return AK.card(`${sectH("Rests on", (i ? 1 : 0) + (p ? 1 : 0))}${i ? li(gl(i.sev === "critical" || i.sev === "high" ? "diamond" : "clock"), `<span class="a-risk-lk" data-panel="a-risk-issue" data-id="${esc(i.id)}" role="link" tabindex="0">${esc(i.title)}</span>`, "Operational issue") : ""}${p ? li(gl("clock"), `<span class="a-risk-lk" data-panel="a-risk-poam" data-id="${esc(p.id)}|overview" role="link" tabindex="0">${esc(p.title)}</span>`, "POA&amp;M item") : ""}`);
  };
  const riskOverview = (r, open) => `
    ${r.chain ? "" : assessCard(r, open)}
    ${restsOn(r)}
    ${r.threat ? AK.card(`${sectH("Threat")}<p class="a-risk-p">${esc(r.threat)}</p>`) : ""}
    ${r.chain ? "" : AK.card(`${sectH("ATT&CK techniques", r.tech.length)}${r.tech.length ? r.tech.map(([c, t]) => li(gl("info"), `<span class="ak-code">${esc(c)}</span> ${esc(t)}`, "Enterprise")).join("") : ring("None linked")}`)}
    ${acceptance(r)}
    ${r.chain ? "" : AK.note("The 3-month reassessment cadence is invented.")}`;
  const riskTreatment = (r, ctl) => {
    const inB = ctl.filter((c) => c.inBase).length;
    const first = r.id === RISK1;
    const pm = POAM.find((p) => p.title.startsWith("Remove the password-only path"));
    const rows = ctl.length ? ctl.map((c) => `<div class="a-risk-ctl"><div class="a-risk-ctl-t"><span class="ak-code">${esc(c.code)}</span><span>${esc(c.title)}</span></div>${c.inBase ? pill("ok", "In baseline") : pill("none", "Not selected")}${c.inBase ? "" : `<span class="ak-link a-risk-add" role="button" tabindex="0">${AK.i("plus")}Add to tailoring</span>`}</div>`).join("")
      : `${ring("No ATT&CK technique linked")}<p class="a-risk-mu">Countering controls come from the techniques a risk names (NIST SP 800-160 Vol. 2, Appendix F).</p>`;
    return `${AK.card(`${sectH("Countering controls", ctl.length ? `${ctl.length} · ${inB} in baseline` : 0)}${rows}`, { cls: "a-risk-list" })}
      ${AK.card(`${sectH("POA&M items", 0, btn(`${AK.i("link")}Link POA&amp;M item`))}${ring("No POA&M item answers this risk yet")}${first ? `<div class="a-risk-sugg"><span class="a-risk-mu">Suggested ${EX}</span><b>${esc(pm.title)}</b><span class="a-risk-mu">${pm.reached} of ${pm.ms.length} milestones · planned ${dd(pm.planned)}</span>${btn("Link")}</div>` : ""}`)}
      ${first ? AK.note("The suggestion is invented: that item answers the IA-2(2) issue this risk rests on.") : ""}`;
  };
  const riskHistory = (r) => r.chain ? AK.activity([{ who: ME, what: `created the risk, resting on <b>${esc((issueOfRisk(r) || {}).title || "its issue")}</b>`, when: dd(r.created) }, ...((accOf(r) || {}).log || []).map(([w, what, at]) => ({ who: w, what: esc(what), when: dd(at) }))]) : `
    ${AK.card(`${sectH("Assessed", null, mu("Sep 12, 2026"))}${AK.facts([["Severity", sevPill(r.sev)], ["Likelihood × impact", `${esc(cap(r.lik))} × ${esc(cap(r.imp))}`], ["Response", "Mitigate"]])}${r.id === RISK1 ? `<p class="a-risk-p">${esc(RATIONALE)}</p>` : ""}`)}
    ${AK.card(`${sectH("Locked in the Package version 1 snapshot", null, mu("Sep 18, 2026"))}${AK.facts([["Decision", tag("ATO with conditions")], ["Locked by", AK.owner("R. Calloway")]])}`)}
    <p class="a-risk-mu">Each reassessment, acceptance step and owner change joins this list, with who and when.</p>`;
  const riskComments = (r) => r.id === RISK1
    ? `${AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [{ who: "Priya Raghavan", role: "ISSO", when: "Nov 14, 10:12", text: `${AK.mention("Joel Barrantes")} IA-2(2) on the Maintenance Laptop is still in draft results; hold acceptance until D. Okafor publishes increment 2. ${EX}` }] })}${AK.note("The comment is invented.")}`
    : AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [] });
  P["a-risk-risk"] = (id) => {
    sync();
    const [rid, tab0] = String(id || "").split("|");
    const r = riskById(rid);
    const tab = tab0 || "overview";
    const ctl = counterOf(r);
    // v2 (C1) [B1 B17]: Request acceptance and Record decision are wired; menu items that opened nothing are cut.
    const a = accOf(r);
    const accBtn = !a || a.state === "returned" ? btn("Request acceptance", `data-modal="v2k-accept" data-id="${esc(r.id)}"`, true) : a.state === "requested" ? btn("Record decision", `data-modal="v2k-decide" data-id="${esc(r.id)}"`, true) : "";
    const head = AK.recordHead({ title: r.title, actions: `${r.chain ? "" : btn("Start reassessment", `data-panel="a-risk-risk" data-id="${r.id}|reassess"`)}${accBtn}${more("More risk actions", [["Assign owner", `data-modal="a-risk-owner" data-id="${esc(r.title)}"`]])}` });
    const facts = `<div class="a-risk-facts">${AK.facts([["Severity", sevPill(r.sev)], ["Acceptance", accPillOf(r)], ["Owner", ownerBtn(r.owner || null, r.title)], ["Response", r.chain ? "Accept, if the AO agrees" : `Mitigate · ${r.due ? AK.due(r.due) : "no due date"}`]])}${co(5)}</div>`;
    const strip = ptabs("a-risk-risk", r.id, [["overview", "Overview"], ["treatment", "Treatment", ctl.length], ["history", "History", 2], ["comments", "Comments", r.id === RISK1 ? 1 : 0]], tab === "reassess" ? "overview" : tab, { Treatment: 6, History: 4, Comments: 1 });
    const body = tab === "treatment" ? riskTreatment(r, ctl) : tab === "history" ? riskHistory(r) : tab === "comments" ? riskComments(r) : riskOverview(r, tab === "reassess");
    return { label: "Risk preview", body: `<div class="a-risk-pan">${head}${facts}${strip}${body}</div>` };
  };
  S["after-risk-record"] = () => riskRegister("risks-record", false);

  // ═════════════ 3. Findings and their deadlines ═════════════
  // v2 (C1) [B7 B9]: the head counts the lists; Import scan and Create operational issue open their dialogs.
  const findHead = () => { sync(); return h.header("Findings", `<span>WS-X90 · SYS-WSX90</span><span>Open issues <b>${ISS.length}</b></span><span>Open CVEs <b>${VULNS.length}</b></span><span>Determinations <b>${313 + AF.filter((x) => x.chain).length}</b></span>`,
    `<button type="button" class="btn" data-modal="v2k-import-scan">Import scan</button>${more("More findings actions", [["Deadlines", go("deadlines")], ["Export", 'data-modal="v2k-export" data-id="findings"']])}<button type="button" class="btn ink" data-modal="v2k-create-issue">Create operational issue</button>`); };
  // v2 (C1) [B7]: each tab counts the rows it lists (v1: Vulnerabilities 1 and Open CVEs 1 over a list of 4 open).
  const FT = () => [["issue", "By issue", ISS.length, "after-findings-deadlines"], ["vulns", "Vulnerabilities", VULNS.length, "after-findings-deadlines-vulns"], ["assets", "By asset", 20, "after-findings-deadlines-assets"], ["assessment", "Assessment findings", 313 + AF.filter((x) => x.chain).length, "after-findings-deadlines-assessment"], ["deact", "Deactivated", null, "after-findings-deadlines-deactivated"], ["history", "History", null, "after-findings-deadlines-history"]];
  const findTabs = (cur) => { sync(); return tabs(FT().map(([k, l, n, r]) => [l, n, k === cur ? null : r, k === cur]), cur === "deact" || cur === "history" ? {} : { Deactivated: 2, History: 5 }, "", "Findings"); };
  const issueActions = ["Assign owner", "Create POA&M item", "Deactivate…"];
  const issueBar = (key, search, list, ids) => toolbar(key, search, list, issueActions, { co: co(3), after: { "Deactivate…": co(4) },
    attrs: { "Deactivate…": `data-modal="a-risk-deactivate" data-id="${esc(ids.join(","))}"`, "Assign owner": `data-modal="a-risk-owner" data-id="${ids.length} finding${ids.length === 1 ? "" : "s"}"`, "Create POA&M item": `data-modal="a-risk-poam-new" data-id="${esc(ids.join(","))}"` } });
  S["after-findings-deadlines"] = () => {
    sync();
    const key = "iss";
    const v = QS[key] || "all";
    const late = ISS.filter((i) => i.late).length, soon = ISS.filter((i) => i.soon).length, sc = sevCounts(ISS);
    const f = { all: () => true, late: (i) => i.late, soon: (i) => i.soon, later: (i) => !i.late && !i.soon, critical: (i) => i.sev === "critical", high: (i) => i.sev === "high", fromf: (i) => i.from.length, noowner: (i) => !i.owner }[v] || (() => true);
    const list = byDue.filter(f);
    const shown = list.slice(0, 12);
    const s = sel(key, byDue.slice(0, 3).map((i) => i.id));
    return h.page(
      findHead(),
      findTabs("issue"),
      grid2(
        statusCard({ title: "Remediate-by status", c: co(1), right: `${ISS.length} open`, rows: [["diamond", "Overdue", late, [key, "late"]], ["clock", "Due within two weeks", soon, [key, "soon"]], ["ring", "Due later", ISS.length - late - soon, [key, "later"]]], foot: deadlineFoot(co(6)) }),
        sevCard({ title: "Open issues by severity", counts: sc }),
      ),
      qv(key, [["all", "All", ISS.length], ["late", "Past due", late], ["soon", "Due soon", soon], ["critical", "Critical", sc.critical], ["high", "High", sc.high], ["fromf", "From assessment findings", ISS.filter((i) => i.from.length).length], ["noowner", "No owner", ISS.filter((i) => !i.owner).length]]),
      issueBar(key, "Search findings", ["Severity", "Owner", "Remediate by", "Control"], [...s]),
      tbl({
        cols: [cbAll(key, shown.map((i) => i.id), "Select every issue on this page"), "Operational issue", "Severity", "From finding", "Opened", "Remediate by", "POA&M item", "Owner"],
        rows: shown.map((i) => ({ id: i.id, sel: s.has(i.id), cells: [cb(key, i.id, s.has(i.id), `Select ${i.title}`), tr(i.title, 290), sevPill(i.sev),
          i.from.length ? `${tag(i.from[0][0])}${i.from.length > 1 ? ` ${mu(`+${i.from.length - 1}`)}` : ""}` : ring("None"), num(dd(i.opened)), dueC(i.due), i.poam ? tr(i.poam, 180) : ring("None"), who(i.owner || null)] })),
        total: list.length, panel: "a-risk-issue", nm: 1, cls: "a-risk-tight",
      }),
      plain("Remediate by counts from the day an issue opens. From finding is the published determination the issue rests on."),
    );
  };
  // v2 (C1) [B12 B17]: an issue with a POA&M item offers Open POA&M item, not Create; the preview shows the risk it carries.
  P["a-risk-issue"] = (id) => {
    sync();
    const i = ISS.find((x) => x.id === id) || byDue[0];
    const p = POAM.find((x) => x.title === i.poam);
    const r = riskOfIssue(i);
    const ctl = CH() && i.chain ? i.from[0][0] : null;
    const primary = p ? btn("Open POA&amp;M item", `data-panel="a-risk-poam" data-id="${p.id}|overview"`, true) : btn("Create POA&amp;M item", `data-modal="v2k-poam" data-id="${esc(i.id)}"`, true);
    return { label: "Operational issue preview", body: `<div class="a-risk-pan">
      ${AK.recordHead({ title: i.title, actions: `${btn("Deactivate…", `data-modal="a-risk-deactivate" data-id="${i.id}"`)}${primary}` })}
      ${AK.facts([["Severity", sevPill(i.sev)], ["Opened", dfull(i.opened)], ["Remediate by", `${dueC(i.due)} <span class="ak-link" ${go("deadlines")}>Edit deadline</span>`], ["Owner", ownerBtn(i.owner || null, i.title)]])}
      ${AK.card(`${sectH("Assessment findings", i.from.length)}${i.from.length ? i.from.map(([c, d]) => li(gl(DET[d][0] === "bad" ? "diamond" : DET[d][0] === "ok" ? "check" : "part"), `<span class="ak-code">${esc(c)}</span> ${esc(DET[d][1])}`, ctl ? `<span class="ak-link" data-v2k-go="${esc(CH().ctlRoute(ctl))}" role="link" tabindex="0">Open ${esc(ctl)}</span>` : "")).join("") : mu("Raised from an SBOM import or an unmet requirement, not an assessment.")}`)}
      ${AK.card(`${sectH("POA&M item", p ? 1 : 0)}${p ? `<span class="a-risk-lk" data-panel="a-risk-poam" data-id="${p.id}|overview" role="link" tabindex="0">${esc(p.title)}</span><div class="a-risk-prog">${bar(p.ms.length ? pct(p.reached, p.ms.length) : 0)}<span class="num">${p.reached} of ${p.ms.length} milestones · planned ${p.planned ? dd(p.planned) : "not set"}</span></div>` : ring("No POA&M item yet")}`)}
      ${AK.card(`${sectH("Risk", r ? 1 : 0, !r && p ? btn("Create risk", `data-modal="v2k-risk" data-id="${esc(i.id)}"`) : "")}${r ? li(sevPill(r.sev), `<span class="a-risk-lk" data-panel="a-risk-risk" data-id="${esc(r.id)}|overview" role="link" tabindex="0">${esc(r.title)}</span>`, CH() ? esc(CH().accWords(accOf(r))) : "") : ring(p ? "No risk rests on this issue yet" : "A risk rests on the issue once its POA&M item exists")}`)}</div>` };
  };
  S["after-findings-deadlines-vulns"] = () => {
    const key = "vul";
    const s = sel(key, ["CVE-2024-6387"]);
    return h.page(
      findHead(), findTabs("vulns"),
      grid2(
        statusCard({ title: "Remediate-by status", c: co(1), right: "4 open", rows: [["diamond", "Overdue", 1, null, "CVE-2024-6387 · Nov 9 · 8d late"], ["clock", `Due within two weeks ${EX}`, 3], ["ring", "Due later", 0]], foot: deadlineFoot(co(6)) }),
        sevCard({ title: "By severity", counts: { critical: 1, high: 2, moderate: 1, low: 0 }, note: `<span class="a-risk-mu">Three of the four are invented ${EX}</span>` }),
      ),
      qv(key, [["all", "All", 4], ["late", "Past due", 1], ["iava", "IAVA", 2], ["iavb", "IAVB", 1]]),
      issueBar(key, "Search CVEs", ["Severity", "Asset", "IAVM", "Remediate by"], ["c0fdce4e"]),
      tbl({
        cols: [cbAll(key, VULNS.map((x) => x.id), "Select every CVE on this page"), "CVE", "Title", "Severity", "Asset", "IAVA / IAVB", "Remediate by", "Status"],
        rows: VULNS.map((x) => ({ id: x.id, sel: s.has(x.id), panel: "", cells: [cb(key, x.id, s.has(x.id), `Select ${x.id}`), `${esc(x.id)}${x.ex ? ` ${EX}` : ""}`, tr(x.title, 165), `${sevPill(x.sev)} ${mu(`<span class="num">${x.cvss}</span>`)}`, tr(x.asset, 150), x.iava ? tag(x.iava) : ring("Not linked"), dueC(x.due), pill(x.status[0], x.status[1])] })),
        total: 4, nm: 1, cls: "a-risk-tight",
      }),
      AK.note("Only CVE-2024-6387 is WS-X90's, read from the Mission Computer SBOM (CycloneDX 1.5, Oct 8); the other three CVEs are invented."),
    );
  };
  S["after-findings-deadlines-assets"] = () => {
    const over = ASSETS.filter((a) => a.next && diffDays(a.next) < 0).length, soon = ASSETS.filter((a) => a.next && diffDays(a.next) >= 0 && diffDays(a.next) <= 14).length;
    const later = ASSETS.filter((a) => a.next && diffDays(a.next) > 14).length, clear = ASSETS.filter((a) => !a.next).length;
    const list = ASSETS.slice().sort((a, b) => (b.issues.length ? 1 : 0) - (a.issues.length ? 1 : 0) || (a.next || Infinity) - (b.next || Infinity) || a.id.localeCompare(b.id));
    const key = "ast";
    const s = sel(key);
    return h.page(
      findHead(), findTabs("assets"),
      grid2(
        statusCard({ title: "Asset remediate-by status", c: co(1), right: "20 assets", rows: [["diamond", "Overdue", over], ["clock", "Due within two weeks", soon], ["ring", "Due later", later], ["check", "Clear", clear]] }),
        statusCard({ title: "Scan coverage by source", rows: [["part", "SBOM", "1 of 20", null, bar(5)], ["ring", "STIG checklist", "0 of 20", null, bar(0)], ["clock", "ACAS", "Oct 10, 2026", null, mu("Last scan")]] }),
      ),
      toolbar(key, "Search assets", ["Element", "Severity", "SBOM"], issueActions, { co: co(3), after: { "Deactivate…": co(4) } }),
      tbl({
        cols: [cbAll(key, list.map((a) => a.id), "Select every asset on this page"), "Asset", "LRU", "Open issues", "Worst", "Open CVEs", "Next remediate-by", "SBOM"],
        rows: list.map((a) => ({ id: a.id, sel: s.has(a.id), panel: "", cells: [cb(key, a.id, s.has(a.id), `Select ${a.name}`), `${esc(a.name)} ${mu(`<span class="num">${a.id}</span>`)}`, tag(a.lru), num(a.issues.length), a.worst ? sevPill(a.worst) : ring("None"), a.cves ? num(a.cves) : mu("—"), a.next ? dueC(a.next) : mu("—"), a.sbom ? pill("ok", "CycloneDX 1.5") : ring("None")] })),
        total: 20, nm: 1, cls: "a-risk-tight",
      }),
      plain("An issue counts on an asset when it names the asset, or, for CVE-2024-6387, through the Mission Computer SBOM."),
    );
  };
  S["after-findings-deadlines-assessment"] = () => {
    sync();
    const shown = AF.slice(0, 14);
    // v2 (C1): results the chain published add their determinations here; a published increment 2 reads Published; each row opens its control.
    const i2 = CH() && CH().inc2(), extra = AF.filter((x) => x.chain);
    const resRows = CH() ? CH().camps().map((k) => [k, CH().results(k.id)]).filter(([, r]) => r).map(([k, r]) => ["check", r.title, r.n, null, `Published ${dd(r.at)}`]) : [];
    return h.page(
      findHead(), findTabs("assessment"),
      grid2(
        statusCard({ title: "Determinations", c: co(1), right: String(313 + extra.length), rows: [["check", "Satisfied", 187 + afDelta("satisfied")], ["part", "Partially satisfied", 38 + afDelta("partially_satisfied")], ["diamond", "Other than satisfied", 14 + afDelta("other_than_satisfied")], ["info", "Not assessed", 74]] }),
        statusCard({ title: "Results", rows: [["check", "SAR · initial authorization", 68, null, "Published Aug 28"], ["check", "Expanded set, increment 1", 225, null, "Published Nov 12"], [i2 ? "check" : "ring", "Increment 2", 20, null, i2 ? `Published ${dd(i2.at)}` : "Draft"], ...resRows] }),
      ),
      filters("Search assessment findings", ["Determination", "Results", "Control family", "Assessor"]),
      tbl({
        cols: ["Control", "Assessment finding", "Determination", "Results", "Determined"],
        rows: shown.map((x) => ({ id: x.id, panel: "a-tests-control", cells: [tag(x.code), tr(x.title, 340), pill(DET[x.det][0], DET[x.det][1]), `${esc(RES[x.res] || x.resLabel || "")}${x.res === "inc2" && !i2 ? ` ${pill("none", "Draft")}` : ""}`, num(dd(x.date))] })),
        total: 313 + extra.length,
      }),
      plain(`${313 + extra.length} determinations across the initial authorization SAR (68), the expanded set's increment 1 (225), its increment 2 (20, ${i2 ? "published" : "a draft"})${extra.length ? ` and ${extra.length} published here today` : ""}, worst first.`),
    );
  };
  S["after-findings-deadlines-deactivated"] = () => {
    const key = "deact";
    const s = sel(key, ["d1", "d2"]);
    return h.page(
      findHead(), findTabs("deact"),
      `<div class="a-risk-pair-h"><h4 class="subhead">Deactivated in WS-X90${co(2)}</h4></div>`,
      AK.empty({ title: "Nothing is deactivated", line: "No finding in WS-X90 is switched off today. A deactivated finding keeps its reason, evidence and end date, and returns to the register on that day." }),
      `<h4 class="subhead">How it reads with findings deactivated ${EX}</h4>`,
      toolbar(key, "Search deactivated findings", ["Reason", "Asset", "Ends"], ["Switch back on"]),
      tbl({
        cols: [cbAll(key, DEACT.map((x) => x.id), "Select every deactivated finding"), "Finding", "Asset", "Reason", "Evidence", "Deactivated by", "Switches back on"],
        rows: DEACT.map((x) => ({ id: x.id, sel: s.has(x.id), panel: "", cells: [cb(key, x.id, s.has(x.id), `Select ${x.finding}`), tr(x.finding, 240), esc(x.scope), tag(x.reason), x.evidence ? tr(x.evidence, 180) : ring("None"), who(x.by), dueC(D(x.ends))] })),
        total: 4, nm: 1, cls: "a-risk-tight",
      }),
      AK.note("Nothing is deactivated in WS-X90; the four rows are invented to show the list and its Switch back on."),
    );
  };
  S["after-findings-deadlines-history"] = () => {
    const key = "hist";
    const v = QS[key] || "all";
    const list = CLOSED.filter((c) => v === "all" || (v === "ontime" ? c.late <= 0 : c.late > 0)).sort((a, b) => b.closed.localeCompare(a.closed));
    return h.page(
      findHead(), findTabs("history"),
      qv(key, [["all", "Closed", CLOSED.length], ["ontime", "On time", CLOSED.filter((c) => c.late <= 0).length], ["missed", "Missed deadline", CLOSED.filter((c) => c.late > 0).length]], `<span class="a-risk-mu">${EX}</span>${co(5)}`),
      filters("Search closed issues", ["Severity", "Closed", "Result"], { extra: `<span class="btn sm">${dl}Export</span>` }),
      tbl({
        cols: ["Operational issue", "Severity", "Opened", "Remediate by", `Closed ${EX}`, "Result"],
        rows: list.map((c) => ({ id: c.id, panel: "", cells: [tr(c.title, 380), sevPill(c.sev), num(dd(c.opened)), num(fromDate(c.due)), num(dd(c.closed)), c.late > 0 ? pill("bad", `Missed by ${c.late} days`) : pill("ok", "On time")] })),
        total: list.length,
      }),
      AK.note("WS-X90's nine closed issues are real, but none records the day it closed, so the closing days and the on-time split are invented."),
    );
  };
  M["a-risk-deactivate"] = (id) => {
    const ids = String(id || "c0fdce4e").split(",").filter(Boolean);
    const its = ids.map((x) => ISS.find((i) => i.id === x)).filter(Boolean);
    const cve = its.some((i) => i.id === "c0fdce4e");
    const assets = ASSETS.filter((a) => a.issues.some((i) => ids.includes(i.id))).length;
    return { title: its.length > 1 ? `Deactivate ${its.length} findings` : "Deactivate finding", body: `
      ${field(its.length > 1 ? "Findings" : "Finding", `<div class="a-risk-ro">${its.length ? its.map((i) => esc(i.title)).join("<br>") : esc(ids[0])}</div>`)}
      ${field("Applies to", `<div class="a-risk-radios">${radio(`Every asset it is found on <span class="num">(${assets || "none named"})</span>`, true)}${radio("Chosen assets", false)}</div>`)}
      ${field("Reason", select("Not applicable to this system"))}
      ${field("Justification", `<div class="ak-input tall">Why this finding does not apply, in one or two sentences. The assessor and the AO see it beside the finding.</div>`, "", req)}
      ${field("Evidence", `<div class="ak-drop">${AK.i("upload")}Attach a file or choose evidence</div>`, "", opt)}
      ${field("Switches back on", select(fromDate(new Date(TODAY.getTime() + 90 * 86400000))), "At most 12 months away. The finding returns to the register that day.", req)}
      ${checkRow("Also switch back on when a fixed version is taken", cve, cve ? "Mission Computer version 2 carries OpenSSH 9.8p1, which fixes CVE-2024-6387." : "For a finding on a component, the day a version that fixes it is taken.")}`,
      footer: foot("Deactivate") };
  };

  // ═════════════ 4. POA&M items and milestones ═════════════
  const poamHead = () => { sync(); return h.header("POA&M", `<span>WS-X90 Sentinel Mission System — POA&amp;M</span><span>Items <b>${POAM.length}</b></span><span>Milestones <b>${MILESTONES.length}</b></span>`, `<button type="button" class="btn" data-modal="v2k-export" data-id="the POA&amp;M">Export</button><button type="button" class="btn ink" data-modal="a-risk-poam-new" data-id="">Create POA&amp;M item</button>`); };
  const srcOf = (p) => {
    const f = p.issues.find((i) => i.from.length);
    if (f) return `Finding ${tag(f.from[0][0])}${p.issues.length > 1 ? ` ${mu(`+${p.issues.length - 1}`)}` : ""}`;
    const rq = p.issues.map((i) => i.title.match(/^Unmet requirement (REQ-\d+)/)).find(Boolean) || (!p.issues.length && p.title.match(/(REQ-\d+)/));
    if (rq) return `Requirement ${tag(rq[1])}`;
    const cve = p.issues.find((i) => /^CVE-/.test(i.title));
    if (cve) return `Vulnerability ${tag(cve.title.split(" ")[0])}`;
    return "Operational issue";
  };
  // v2 F [N08]: milestones reached as the number alone; the bar beside it said the same.
  const progress = (p) => (p.ms.length ? `<span class="num">${p.reached} of ${p.ms.length}</span>` : mu("—"));
  const plannedC = (status, iso) => (iso ? (status === "completed" ? num(dd(iso)) : dueC(D(iso))) : ring("Not set"));
  const POAM_COMMENTS = { def9d690: 1 };
  const poamTabs = (cur) => tabs([["Items", POAM.length, cur === "items" ? null : "after-poam-tracker", cur === "items"], ["Milestones", MILESTONES.length, cur === "ms" ? null : "after-poam-tracker-milestones", cur === "ms"]], {}, "", "POA&M");
  S["after-poam-tracker"] = () => {
    sync();
    const key = "poam";
    const v = QS[key] || "all";
    const pastPlan = POAM.filter((p) => p.status !== "completed" && p.planned && D(p.planned) < TODAY).length;
    const lateVs = POAM.filter((p) => p.lateVs > 0).length;
    const f = { all: () => true, in_progress: (p) => p.status === "in_progress", open: (p) => p.status === "open", completed: (p) => p.status === "completed", pastplan: (p) => p.status !== "completed" && p.planned && D(p.planned) < TODAY, latevs: (p) => p.lateVs > 0, noowner: (p) => !p.owner }[v] || (() => true);
    // v2 (C1): an item a reader just created is listed first; the quick views count the list.
    const list = POAM.filter(f).sort((a, b) => (b.chain ? 1 : 0) - (a.chain ? 1 : 0) || (a.status === "completed") - (b.status === "completed") || (a.deadline || Infinity) - (b.deadline || Infinity));
    const byStatus = (st2) => POAM.filter((p) => p.status === st2).length;
    const shown = list.slice(0, 14);
    const s = sel(key, shown.slice(0, 2).map((p) => p.id));
    const n = s.size;
    return h.page(
      poamHead(),
      poamTabs("items"),
      qv(key, [["all", "All", POAM.length], ["in_progress", "In progress", byStatus("in_progress")], ["open", "Not started", byStatus("open")], ["completed", "Completed", byStatus("completed")], ["pastplan", "Planned date passed", pastPlan], ["latevs", "Later than remediate-by", lateVs], ["noowner", "No owner", POAM.filter((p) => !p.owner).length]], co(1)),
      toolbar(key, "Search POA&M items", ["Status", "Owner", "Planned completion", "Source"], ["Assign owner", "Change planned date…"],
        { co: co(2), attrs: { "Assign owner": `data-modal="a-risk-owner" data-id="${n} POA&amp;M item${n === 1 ? "" : "s"}"`, "Change planned date…": `data-modal="a-risk-ms-move" data-id="${n} POA&amp;M item${n === 1 ? "" : "s"}"` } }),
      tbl({
        cols: [cbAll(key, shown.map((p) => p.id), "Select every item on this page"), "POA&amp;M item", "Status", "Progress", "Planned", "Remediate by", `Source${co(3)}`, "Owner"],
        rows: shown.map((p) => ({ id: `${p.id}|overview`, sel: s.has(p.id), cells: [cb(key, p.id, s.has(p.id), `Select ${p.title}`),
          `${tr(p.title, POAM_COMMENTS[p.id] ? 128 : 190)}${POAM_COMMENTS[p.id] ? `<span class="a-risk-cmt" title="1 comment">${AK.i("chat")}<span class="num">${POAM_COMMENTS[p.id]}</span></span>${co(4)}` : ""}`,
          pstat(p.status), progress(p), plannedC(p.status, p.planned),
          p.deadline ? `${dueC(p.deadline)}${p.lateVs > 0 ? ` <span class="a-risk-plus" title="The plan ends ${p.lateVs} days after remediate-by">plan +${p.lateVs}d</span>` : ""}` : mu("—"),
          srcOf(p), who(p.owner || null)] })),
        total: list.length, panel: "a-risk-poam", nm: 1, cls: "a-risk-tight a-risk-tighter",
      }),
      plain("Remediate by is the earliest deadline among the open issues an item answers. Source is where the item came from: an assessment finding with its control, an unmet requirement or a vulnerability."),
    );
  };
  S["after-poam-tracker-milestones"] = () => {
    const key = "ms";
    const v = QS[key] || "open";
    const open = (m) => m.status !== "completed";
    const f = { open, late: (m) => open(m) && m.planned && D(m.planned) < TODAY, soon: (m) => open(m) && m.planned && diffDays(D(m.planned)) >= 0 && diffDays(D(m.planned)) <= 14, nodate: (m) => open(m) && !m.planned, done: (m) => m.status === "completed" }[v] || open;
    const list = MILESTONES.filter(f).sort((a, b) => (a.planned ? D(a.planned) : Infinity) - (b.planned ? D(b.planned) : Infinity));
    const shown = list.slice(0, 14);
    const s = sel(key);
    const n = s.size;
    return h.page(
      poamHead(),
      poamTabs("ms"),
      qv(key, [["open", "Open", MILESTONES.filter(open).length], ["late", "Overdue", MILESTONES.filter((m) => open(m) && m.planned && D(m.planned) < TODAY).length], ["soon", "Due within two weeks", MILESTONES.filter((m) => open(m) && m.planned && diffDays(D(m.planned)) >= 0 && diffDays(D(m.planned)) <= 14).length], ["nodate", "No planned date", MILESTONES.filter((m) => open(m) && !m.planned).length], ["done", "Reached", MILESTONES.filter((m) => m.status === "completed").length]], co(1)),
      toolbar(key, "Search milestones", ["Status", "Owner", "Planned date"], ["Assign owner", "Change planned date…"],
        { co: co(2), extra: `${btn(`${AK.i("plus")}Add milestone`, 'data-modal="a-risk-ms-new" data-id=""')}${co(2)}`, attrs: { "Assign owner": `data-modal="a-risk-owner" data-id="${n} milestones"`, "Change planned date…": `data-modal="a-risk-ms-move" data-id="${n} milestones"` } }),
      tbl({
        cols: [cbAll(key, shown.map((m) => `${m.item}:${m.seq}`), "Select every milestone on this page"), "Milestone", "POA&amp;M item", "Status", "Planned", "Owner"],
        rows: shown.map((m) => { const id = `${m.item}:${m.seq}`; return { id: `${m.item}|milestones`, sel: s.has(id), cells: [cb(key, id, s.has(id), `Select ${m.title}`), tr(m.title, 360), tr(poamById(m.item).title, 250), pstat(m.status), plannedC(m.status, m.planned), who(m.owner || null)] }; }),
        total: list.length, panel: "a-risk-poam", nm: 1, cls: "a-risk-tight",
      }),
      plain("The milestones of the requirement-gap items (Remediate REQ-…) carry no planned date yet; eMASS refuses them until they do."),
    );
  };
  P["a-risk-poam"] = (id) => {
    sync();
    const [pid, tab0] = String(id || "").split("|");
    const p = poamById(pid);
    const tab = tab0 || "overview";
    const cmts = POAM_COMMENTS[p.id] || 0;
    // v2 (C1) [B12]: the item shows the risk it carries, or creates it from the issue it answers.
    const rk = riskOfPoam(p);
    const riskCard = AK.card(`${sectH("Risk it carries", rk ? 1 : 0, !rk && p.issues.length ? btn("Create risk", `data-modal="v2k-risk" data-id="${esc(p.issues[0].id)}"`) : "")}${rk ? li(sevPill(rk.sev), `<span class="a-risk-lk" data-panel="a-risk-risk" data-id="${esc(rk.id)}|overview" role="link" tabindex="0">${esc(rk.title)}</span>`, CH() ? esc(CH().accWords(accOf(rk))) : "") : ring("No risk rests on it yet")}`);
    const head = AK.recordHead({ title: p.title, actions: `${btn("Change planned date…", `data-modal="a-risk-ms-move" data-id="${esc(p.title)}"`)}${btn(`${AK.i("plus")}Add milestone`, `data-modal="a-risk-ms-new" data-id="${p.id}"`, true)}` });
    const facts = AK.facts([["Status", pstat(p.status)], ["Planned", plannedC(p.status, p.planned)], ["Remediate by", p.deadline ? dueC(p.deadline) : mu("No open issue")], ["Owner", ownerBtn(p.owner || null, p.title)]]);
    const strip = ptabs("a-risk-poam", p.id, [["overview", "Overview"], ["milestones", "Milestones", p.ms.length], ["activity", "Activity"], ["comments", "Comments", cmts]], tab, {}, co(4));
    const msRows = p.ms.length ? p.ms.map((m) => li(gl(m.status === "completed" ? "check" : m.status === "in_progress" ? "clock" : "ring"), `${esc(m.title)}<span class="a-risk-sub">${m.owner ? esc(m.owner) : "No owner"}</span>`, m.planned ? (m.status === "completed" ? num(dd(m.planned)) : dueC(D(m.planned))) : "No date")).join("") : ring("No milestone recorded");
    let body;
    if (tab === "milestones") body = AK.card(`${sectH("Milestones", p.ms.length, btn(`${AK.i("plus")}Add milestone`, `data-modal="a-risk-ms-new" data-id="${p.id}"`))}${msRows}`);
    else if (tab === "activity") body = p.id === "def9d690"
      ? `${AK.activity([{ who: "Ingrid Solberg", what: `created the item from <b>CVE-2024-6387 in the OpenSSH server</b> ${EX}`, when: "Nov 10" }, { who: "Ingrid Solberg", what: "offered CVE-2024-6387 to the Mission Computer's owner", when: "Nov 14" }, { who: "Ingrid Solberg", what: `staged LoginGraceTime 0 on the maintenance image ${EX}`, when: "Nov 16" }])}${AK.note("The first and last entries are invented; the offer to the component's owner is WS-X90's.")}`
      : `<p class="a-risk-mu">Each status change, slipped date and hand-off shows here with who and when.</p>`;
    else if (tab === "comments") body = cmts
      ? `${AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [{ who: "Ingrid Solberg", when: "Nov 16, 16:40", text: `LoginGraceTime 0 is staged on the maintenance image; ${AK.mention("Priya Raghavan")} can Mission Computer version 2 land before Dec 1? ${EX}` }] })}${AK.note("The comment is invented.")}`
      : AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [] });
    else body = `${p.ms.length || p.lateVs > 0 ? AK.card(`${sectH("Progress")}<div class="a-risk-prog wide">${bar(p.ms.length ? pct(p.reached, p.ms.length) : 0)}<span class="num">${p.reached} of ${p.ms.length} milestones</span></div>${p.lateVs > 0 ? `<div class="a-risk-warn">${gl("clock")}<span>The plan ends ${p.lateVs} days after the remediate-by date. Move a milestone or record why.</span></div>` : ""}`) : ""}
      ${AK.card(`${sectH("Answers", p.issues.length)}${p.issues.length ? p.issues.map((i) => li(gl(i.sev === "critical" || i.sev === "high" ? "diamond" : "clock"), `<span class="a-risk-lk" data-panel="a-risk-issue" data-id="${esc(i.id)}" role="link" tabindex="0">${esc(i.title)}</span>`, dueC(i.due))).join("") : mu("Its issues are closed.")}`)}
      ${riskCard}
      ${p.plan && !p.chain ? AK.card(`${sectH("Remediation plan")}<p class="a-risk-p">${esc(p.plan)}</p>`) : p.plan ? `<p class="a-risk-p">${esc(p.plan)}</p>` : ""}`;
    return { label: "POA&M item preview", body: `<div class="a-risk-pan">${head}${facts}${strip}${body}</div>` };
  };

  // ═════════════ 5. Suppliers ═════════════
  const reviewPill = (iso) => { const d = diffDays(D(iso)); return d < 0 ? pill("bad", "Overdue") : d <= 14 ? pill("warn", `Due ${dd(iso)} · in ${d}d`) : pill("none", `Due ${dd(iso)}`); };
  const supHead = () => h.header("Suppliers", `<span>Supply chain risk management · SR family</span><span>Component sets <b>4</b></span><span>Organizations <b>6</b></span><span>SBOM upstreams <b>1</b></span>`, `<button type="button" class="btn" data-modal="v2k-import" data-id="SBOM">Import SBOM</button><button type="button" class="btn ink" data-modal="a-risk-portal" data-id="">Request from a supplier</button>`);
  const supTabs = (cur, c) => tabs([["Managed", SUPPLIERS.length, cur === "m" ? null : "after-suppliers-index", cur === "m"], ["Found in SBOMs", 1, cur === "s" ? null : "after-suppliers-index-sbom", cur === "s"]], {}, c, "Suppliers");
  // v2: the Products area strip already splits the area, so the page drops its own Managed / Found in SBOMs tabs: Found in
  // SBOMs is the last of five quick views (it opens its own list), and Component sets is a value of the Kind filter. Above
  // the table: the area strip, the quick views and the filters.
  const SUPQ = () => [["all", "All", SUPPLIERS.length], ["t1", "Tier 1", SUPPLIERS.filter((s) => s.tier === 1).length], ["flag", "Flagged", SUPPLIERS.filter((s) => s.flags.length).length], ["noowner", "No owner", SUPPLIERS.filter((s) => !s.owner).length]];
  const sbomChip = (on) => `<button type="button" class="qv a-risk-qv${on ? " on" : ""}" aria-pressed="${on}"${on ? "" : ' data-go="after-suppliers-index-sbom"'}>Found in SBOMs <span class="num">1</span></button>`;
  function supplierRegister(key, withCo) {
    const v = QS[key] || "all";
    const c = (n) => (withCo ? co(n) : "");
    const list = SUPPLIERS.filter((s) => v === "all" || (v === "t1" ? s.tier === 1 : v === "flag" ? s.flags.length : v === "sets" ? s.kind === "Component set" : v === "noowner" ? !s.owner : true));
    return h.page(
      supHead(),
      qv(key, SUPQ(), sbomChip(false)),
      filters("Search suppliers", ["Tier", "Kind", "Review", "Owner"]),
      tbl({
        cols: ["Supplier", "Kind", "Tier", "Review", `Evidence${c(2)}`, "Flags", "Owner", "Business line"],
        rows: list.map((s) => ({ id: `${s.id}|overview`, cells: [`${tr(s.n, s.ex ? 150 : 205)}${s.ex ? ` ${EX}` : ""}`, esc(s.kind), `<span class="a-risk-tier" title="${esc(TIERS[s.tier][1])} review; asks ${esc(TIERS[s.tier][2].join(", "))}">${tag(TIERS[s.tier][0])}</span>`, reviewPill(s.next), `<span class="num">${s.got} of ${TIERS[s.tier][2].length} received</span>` /* v2 F [N08]: the number without the ring beside it */, s.flags.length ? s.flags.map(([k, l]) => pill(k, l)).join(" ") : ring("None"), who(s.owner || null), s.line ? esc(s.line) : ring("Not set")] })),
        total: list.length, panel: "a-risk-sup", cls: "a-risk-tight a-risk-tighter",
      }),
      AK.note("Aldergrove and Kestrel, their counterfeit and DMSMS flags, the tiers and the review dates are invented; the component sets, their owners and business lines, and the six organizations are the workspace's."),
    );
  }
  S["after-suppliers-index"] = () => supplierRegister("sup", true);
  S["after-supplier-record"] = () => supplierRegister("sup-record", false);
  S["after-suppliers-index-sbom"] = () => h.page(
    supHead(),
    `<div class="views a-risk-views" role="group" aria-label="Quick views">${SUPQ().map(([v, l, n]) => `<button type="button" class="qv a-risk-qv" aria-pressed="false" data-arqgo="sup|${v}|suppliers">${esc(l)} <span class="num">${fmt(n)}</span></button>`).join("")}${sbomChip(true)}</div>`,
    plain("Suppliers read from an SBOM wait here until someone moves them to managed or ignores them with a reason."),
    tbl({
      cols: ["Supplier", "Found in", "Component", "Flags", `<span class="a-risk-sr">Actions</span>`],
      rows: [{ id: "openbsd", panel: "", cells: [esc(OPENBSD.n), "Mission Computer SBOM · Oct 8", tag("openssh-server 9.6p1"), pill("bad", "Open CVE"), `<span class="btns">${btn("Move to managed")}${btn("Ignore…", 'data-modal="ak-reason" data-id="Ignore OpenBSD project (OpenSSH)|It stays out of Managed; the reason shows in the list, with your name and the date."')}</span>`] }],
      total: 1, nm: 0,
    }),
  );

  // ═════════════ 6. A supplier (the after version of the supplier preview) ═════════════
  const supComments = (s, thread) => {
    const internal = s.id === "x800" ? [{ who: "Priya Raghavan", when: "Nov 15, 11:05", text: `${AK.mention("Marcus Ryde")} Mission Computer version 2 carries OpenSSH 9.8p1; ask X800 for the version 2 HBOM with the SBOM. ${EX}` }] : [];
    const sub = tabs([["Supplier comments", 0, "@t:supplier", thread === "supplier"], ["Internal comments", internal.length, "@t:internal", thread !== "supplier"]], {}, "", "Comment threads")
      .replace(/data-go="@t:([^"]+)"/g, (m, k) => `data-panel="a-risk-sup" data-id="${esc(s.id)}|comments-${k}"`);
    const body = thread === "supplier"
      ? AK.comments({ you: ME, external: true, placeholder: "Write to the supplier…", items: [] }).replace("The assessor can read it.", "The supplier reads it in the request portal.")
      : `${AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: internal })}${internal.length ? AK.note("The comment is invented.") : ""}`;
    return `<div class="a-risk-subtabs">${sub}</div>${body}`;
  };
  P["a-risk-sup"] = (id) => {
    const [sid, tab0] = String(id || "").split("|");
    const s = supById(sid);
    const tab = tab0 || "overview";
    const asks = TIERS[s.tier][2];
    const gaps = [!s.owner && "Assign an owner", !s.line && "Set a business line", !s.got && s.id !== "x800" && "Send the first request"].filter(Boolean);
    const cmts = s.id === "x800" ? 1 : 0;
    const head = AK.recordHead({ title: s.n, actions: `${btn("Start review", `data-panel="a-risk-sup" data-id="${s.id}|reviews"`)}${btn("Send a request", `data-modal="a-risk-portal" data-id="${s.id}"`, true)}` });
    const facts = `<div class="a-risk-facts">${AK.facts([["Tier", `${tag(TIERS[s.tier][0])} ${esc(TIERS[s.tier][1])}`], ["Review", AK.due(s.next)], ["Owner", ownerBtn(s.owner, s.n)], ["Business line", s.line ? esc(s.line) : ring("Not set")], ...(s.flags.length ? [["Flags", s.flags.map(([k, l]) => pill(k, l)).join(" ")]] : [])])}${gaps.length ? "" : co(1)}</div>`;
    const check = gaps.length ? AK.card(`${sectH("Complete this supplier", `${gaps.length} to do`, "", co(1))}${gaps.map((g) => `<div class="a-risk-li"><span class="ak-ring sm"></span><span class="x">${esc(g)}</span><span class="ak-link" role="button" tabindex="0">${g.startsWith("Assign") ? "Assign" : g.startsWith("Set") ? "Set" : "Send"}</span></div>`).join("")}<div>${btn("Get started")}</div>`, { cls: "a-risk-gaps" }) : "";
    const strip = ptabs("a-risk-sup", s.id, [["overview", "Overview"], ["reviews", "Reviews"], ["requests", "Requests", asks.length], ["comments", "Comments", cmts]], tab.startsWith("comments") ? "comments" : tab, { Reviews: 2, Requests: 3, Comments: 5 });
    const flagRow = ([k, l]) => l === "Open CVE"
      ? `<div class="a-risk-flag">${gl("diamond")}<div class="x"><b>Open CVE</b><span>CVE-2024-6387 in openssh-server 9.6p1, fixed in 9.8p1</span><span class="a-risk-fl">${AK.i("link")}<span class="a-risk-lk" data-panel="a-risk-issue" data-id="c0fdce4e" role="link" tabindex="0">CVE-2024-6387 in the OpenSSH server (regreSSHion)</span></span><span class="a-risk-mu">${AK.owner("Ingrid Solberg")} · remediate by Nov 9 · <span class="a-risk-bad">8d late</span></span></div></div>`
      : `<div class="a-risk-flag">${gl(k === "bad" ? "diamond" : "clock")}<div class="x"><b>${esc(l)} ${EX}</b><span>${l === "DMSMS notice" ? "End of life for the converter module in Q3 2027" : "A lot of FPGAs failed authentication at receiving (SR-11)"}</span><span class="a-risk-mu">No operational issue tracks it</span></div>${btn("Open operational issue")}</div>`;
    let body;
    if (tab === "reviews") body = `${AK.card(`${sectH(`${TIERS[s.tier][1]} review`, null, btn("Start review", "", true), "")}${AK.facts([["Due", AK.due(s.next)], ["Assigned to", AK.owner(s.owner || null)], ["State", pill("none", "Not started")]])}<p class="a-risk-mu">A finished review ends with Record decision: Approved, Approved with conditions or Not approved, each with a reason.</p><div>${btn("Record decision", 'aria-disabled="true" title="Waits until the review is finished"')}</div>`)}
      ${AK.card(`${sectH("Past reviews", 0)}${ring("No review recorded yet")}`)}${s.owner ? AK.note("Assigning the review to the supplier's owner is invented.") : ""}`;
    else if (tab === "requests") {
      const rows = asks.map((a) => {
        if (a === "SBOM" && s.got) return li(gl("check"), "<b>SBOM</b> · Mission Computer", "Received Oct 8 (v1), Nov 12 (v2)");
        if (a === "Attestation" && s.id === "x800") return `<div class="a-risk-reqx">${li(gl("clock"), `<b>Attestation of provenance (SR-4)</b> ${EX}<span class="a-risk-sub">Asked Nov 17 · due Dec 17 · weekly reminders</span>`, "Waiting on the supplier")}<div class="a-risk-rem">${AK.remind({})}</div></div>`;
        return li(gl("ring"), esc(a), "Not asked yet");
      }).join("");
      body = `${AK.card(`${sectH("Asked by its tier", asks.length)}<div class="a-risk-prog wide">${bar(pct(s.got, asks.length))}<span class="num">${s.got} of ${asks.length} received</span></div>${rows}<p class="a-risk-mu">Answers from the request portal land here, a 'We don't have this' with its reason.</p>`)}
        ${s.id === "x800" ? AK.note("The attestation request is invented: today X800 has not been asked for it.") : ""}`;
    } else if (tab.startsWith("comments")) body = supComments(s, tab === "comments-supplier" ? "supplier" : "internal");
    else body = `${check}
      ${s.flags.length ? AK.card(`${sectH("Flags", s.flags.length, "", co(4))}${s.flags.map(flagRow).join("")}`) : AK.card(`${sectH("Flags", 0, "", co(4))}${ring("No flag raised")}`)}
      ${AK.card(`${sectH("Supplies")}${s.comps ? `<span>${s.comps} component${s.comps > 1 ? "s" : ""} · ${esc(s.note)}</span>` : `<span>${esc(s.note)}</span>`}`)}
      ${s.id === "x800" ? AK.card(`${sectH("Components in WS-X90's use", 1)}${li(gl("clock"), `Mission Computer<span class="a-risk-sub">Version 1 in use · version 2 published Nov 12</span>`)}`) : ""}
      ${s.ex ? AK.note("This supplier and its flag are invented.") : ""}`;
    return { label: "Supplier preview", body: `<div class="a-risk-pan">${head}${facts}${strip}${body}</div>` };
  };
  M["a-risk-portal"] = (id) => {
    const s = SUPPLIERS.find((x) => x.id === id);
    return { title: "Request from a supplier", body: `
      ${field("Supplier", select(s ? s.n : SUPPLIERS[0].n))}
      ${field("Ask for", `<div class="a-risk-checks">${[["SBOM (CycloneDX or SPDX)", true], ["HBOM", true], ["Supplier attestation of provenance (SR-4)", true], ["CMMC status and SPRS score", false], ["Counterfeit avoidance plan (SR-11)", false]].map(([l, on]) => checkRow(esc(l), on)).join("")}</div>`)}
      <div class="a-risk-row2">${field("Due", select("Dec 17, 2026"))}${field("Reminders", select("Weekly until answered"))}</div>
      ${plain("The supplier answers each item in the request portal, or says 'We don't have this' with a reason; every item is tracked on the supplier's Requests tab.")}`, footer: foot("Send request") };
  };

  // ═════════════ 7. Package room ═════════════
  const PR = "after-package-room-trust";
  const pkgHead = () => h.header("Package room", `<span>WS-X90 Sentinel Mission System authorization package</span><span>Version 1 <b>published</b></span><span>Version 2 <b>draft</b></span>`,
    `<button type="button" class="btn" data-modal="v2k-export" data-id="the package">Export</button><span class="btn" ${go(PR + "-preview")}>Preview as recipient</span><span class="btn ink" role="button" tabindex="0" data-modal="a-risk-share" data-id="">Share the package</span>`);
  // v2 (C1) [B7]: version 2's readiness is counted from what it waits on: the POA&M, SSP 3's approval and increment 2's publication.
  const v2Ready = () => { const ch = CH(); const ssp = ch ? ch.ssp3() === "approved" : false, i2 = ch ? !!ch.inc2() : false; return { n: 1 + (ssp ? 1 : 0) + (i2 ? 1 : 0), line: [["POA&M current", true], ["SSP 3 approved", ssp], ["increment 2 results published", i2]].filter(([, ok]) => !ok).map(([t]) => t) }; };
  const cui = `<div class="a-risk-cui"><b>CUI</b><span>Controlled by: Program Office · Category: CTI · Distribution D</span>${EX}</div>`;
  const pkgCards = (c) => `<div class="a-risk-pkgrow">
    <div class="card a-risk-pkg"><div class="a-risk-thumb" aria-hidden="true"><b>CUI</b><i></i><i></i><i class="s"></i><i></i><span>v1</span></div>
      <div class="a-risk-pkgb"><div class="a-risk-pkgt"><b>WS-X90 Sentinel Mission System authorization package</b>${c(1)}</div>
        <span class="a-risk-mu">Version 1 · ATO with conditions · Sep 18, 2026</span>
        <div>${AK.chip("Version 2 draft", { icon: "pen" })}</div>
        <div class="btns">${btn("Preview as recipient", go(PR + "-preview"))}${c(4)}${btn("Open version 2", go(PR + "-versions"))}${btn("Share the package", 'data-modal="a-risk-share" data-id=""', true)}</div></div></div>
    <div class="card a-risk-count" ${go(PR + "-requests")}><div class="a-risk-cl">Access requests ${EX}</div><div class="a-risk-cv"><b class="num">1</b><span aria-hidden="true">›</span></div><span class="a-risk-mu">Waiting on you</span></div>
    <div class="card a-risk-count" ${go("authorization")}><div class="a-risk-cl">Version 2: items ready to submit</div><div class="a-risk-cv"><b class="num">${v2Ready().n} of 3</b><span aria-hidden="true">›</span></div><span class="a-risk-mu">${v2Ready().line.length ? `Waits on ${esc(v2Ready().line.join(" and "))}` : "Ready: submit it from Authorization"}</span></div></div>`;
  const pkgTabs = (cur, withCo) => tabs([["Recipients", 7, "", "rec"], ["Access requests", 1, "-requests", "req"], ["Versions", 2, "-versions", "ver"], ["Access log", 4, "-log", "log"], ["Room settings", null, "-settings", "set"]].map(([l, n, r, k]) => [l, n, k === cur ? null : PR + r, k === cur]),
    withCo ? { "Access requests": 2, "Room settings": 5 } : {}, withCo ? co(3) : "", "Package room");
  const pkgPage = (cur, body, note) => h.page(pkgHead(), cui, pkgCards(cur === "rec" ? co : () => ""), pkgTabs(cur, cur === "rec"), ...body, note || "");
  S[PR] = () => pkgPage("rec", [tbl({
    cols: ["Recipient", "Role", "Can open", "Expires", "Last opened"],
    rows: RECIPIENTS.map((r) => ({ id: r.id, panel: "", cells: [r.ex ? `${esc(r.n)} ${EX}` : who(r.n), esc(r.role), esc(r.acc), dueC(D(r.exp)), r.last ? num(r.last) : ring("Not logged yet")] })),
    total: 7, cls: "a-risk-tight",
  })], AK.note("The access request, the two non-program recipients, the access log and the CUI banner's wording are invented; the package, its versions and the role holders are WS-X90's."));
  S[PR + "-requests"] = () => {
    const key = "acc";
    const s = sel(key, ["r1"]);
    return pkgPage("req", [
      `<div class="a-risk-reqh">${co(2)}<span class="ak-link" role="button" tabindex="0">${AK.i("history")} Request history</span></div>`,
      toolbar(key, "Search access requests", ["Organization", "Wants", "Asked"], ["Approve", "Deny"], { attrs: { Approve: 'data-modal="a-risk-share" data-id="r1"', Deny: 'data-modal="ak-reason" data-id="Deny access request|The requester is told the request was denied; the reason stays in Request history."' } }),
      tbl({
        cols: [cbAll(key, ["r1"], "Select every request"), "Requester", "Organization", "Asked", "Reason", "Wants", `<span class="a-risk-sr">Approve or deny</span>`],
        rows: [{ id: "r1", sel: s.has("r1"), panel: "", cells: [cb(key, "r1", s.has("r1"), "Select the request from the test lead"), `Cooperative vulnerability identification test lead ${EX}`, "Test organization", num("Nov 16"), "Planning the Jan 11 event", "SSP and POA&amp;M", `<span class="btns a-risk-yn"><span class="btn sm" role="button" tabindex="0" title="Approve" data-modal="a-risk-share" data-id="r1">${AK.i("check")}</span><span class="btn sm" role="button" tabindex="0" title="Deny" data-modal="ak-reason" data-id="Deny access request|The requester is told the request was denied; the reason stays in Request history.">${AK.i("x")}</span></span>`] }],
        total: 1, nm: 1, cls: "a-risk-tight",
      }),
    ], AK.note("The request is invented: the test lead plans the cooperative vulnerability identification event of Jan 11, 2027. Approve opens Share the package filled from it; Deny asks a reason."));
  };
  S[PR + "-versions"] = () => pkgPage("ver", [tbl({
    cols: ["Version", "State", "Published", "Submitted", "Decision", "Holds"],
    rows: [
      { id: "2", panel: "", cells: ["Version 2", pill("none", "Draft"), mu("—"), mu("—"), ring("Pending"), `${tr("FY2027 annual update: SSP 3 with the Block 1.1 configuration and the expanded control set results once published", 360)}`] },
      { id: "1", panel: "", cells: ["Version 1", pill("ok", "Published"), num("Sep 2 · Priya Raghavan"), num("Aug 29"), pill("ok", "ATO with conditions"), tr("Initial authorization: SSP 2, the initial assessment plan and report, and key test evidence", 360)] },
    ], total: 2,
  }), AK.card(`${sectH("Version 2 ready to submit", "1 of 3")}${li(gl("check"), "POA&amp;M current: 41 items", "Done")}${li(gl("ring"), "SSP 3 published", "Draft today")}${li(gl("ring"), "Increment 2 results published", "20 findings in draft")}`)]);
  S[PR + "-log"] = () => pkgPage("log", [tbl({
    cols: ["When", "Who", "What", "Protection"],
    rows: ACCESS.map((a, k) => ({ id: String(k), panel: "", cells: [num(a[0]), esc(a[1]), `${esc(a[2])} ${EX}`, tag(a[3])] })), total: 4,
  })], AK.note("The access log entries are invented."));
  S[PR + "-settings"] = () => pkgPage("set", [AK.card(`${sectH("Room settings", null, "", co(5))}
    ${li(gl("check"), "Watermark: viewer, time and CUI banner", "<b>On</b>")}
    ${li(gl("check"), "Every open and download logged", "<b>On</b>")}
    ${li(gl("clock"), "Access expires by default after", "<b>90 days</b>")}
    ${li(gl("ring"), "Downloads for reciprocity reviewers", "<b>Off</b>")}
    ${li(gl("check"), `Require a CUI handling acknowledgment before the first open ${EX}`, "<b>On</b>")}`)], AK.note("The acknowledgment's wording is invented."));
  S[PR + "-preview"] = () => h.page(
    `<div class="a-risk-prevbar">${AK.back("Back to the package room", PR)}<span class="a-risk-mu">Previewing as <b>Receiving AO's representative</b> ${EX} · SSP, SAR, POA&amp;M · no download</span>${co(4)}</div>`,
    `<div class="a-risk-recip"><div class="a-risk-wm" aria-hidden="true">${Array.from({ length: 36 }, () => "<span>Receiving AO's representative · Nov 17, 2026 · CUI</span>").join("")}</div>
      ${cui}
      <div class="a-risk-recip-h"><div><span class="a-risk-mu">Authorization package</span><h3>WS-X90 Sentinel Mission System · authorization package</h3></div>${btn("Request more access", "", true)}</div>
      ${tabs([["Overview", null, null, true], ["Documents", 6, "@x"], ["POA&M", 41, "@x"], ["Updates", null, "@x"]], {}, "", "Package").replace(/ data-go="@x"/g, "")}
      <div class="grid2 a-risk-cards">${AK.card(`${sectH("Decision")}${AK.facts([["Decision", pill("ok", "ATO with conditions")], ["Signed", "Sep 18, 2026"], ["ATD", "Sep 17, 2029"], ["AO", AK.owner("R. Calloway")], ["Conditions", num(3)]])}${CONDITIONS.map(([t, d]) => li(gl("clock"), esc(t), dd(d))).join("")}`)}
        ${AK.card(`${sectH("Documents you can open", "3 of 6")}${DOCS_V1.map(([t, s], i) => li(gl([0, 2].includes(i) ? "check" : "ring"), esc(t), [0, 2].includes(i) ? esc(s) : "Not shared with you")).join("")}${li(gl("check"), "POA&amp;M · 41 items", "OSCAL JSON")}`)}</div></div>`,
    AK.note("The previewed recipient and the watermark's wording are invented; the decision, the conditions and the documents are WS-X90's."),
  );
  M["a-risk-share"] = (id) => {
    const fromReq = id === "r1";
    return { title: "Share the package", body: `
      ${fromReq ? AK.banner({ tone: "info", text: `Filled from the access request of Nov 16 ${EX}` }) : ""}
      ${field("Recipient", fromReq ? `<div class="a-risk-ro">Cooperative vulnerability identification test lead · Test organization</div>` : select("Name or .mil address"))}
      <div class="a-risk-row2">${field("Role", select(fromReq ? "Cyber test lead" : "Reciprocity reviewer"))}${field("Version", select("Version 1 · published"))}</div>
      ${field("Documents", `<div class="a-risk-checks">${[["System security plan", true], ["Security assessment report", !fromReq], ["POA&M", true], ["Evidence (3 documents)", false]].map(([l, on]) => checkRow(esc(l), on)).join("")}</div>`)}
      <p class="a-risk-will">${AK.i("eye")}Will share: ${fromReq ? "SSP and POA&amp;M of version 1" : "SSP, SAR and POA&amp;M of version 1"}</p>
      <div class="a-risk-row2">${field("Access expires", select(fromReq ? "Feb 5, 2027" : "Feb 15, 2027"), "Every share expires.")}${field("Downloads", select("Watermarked view only"))}</div>
      ${checkRow(`Require a CUI handling acknowledgment before the first open ${EX}`, true, "The recipient confirms CUI handling once, and the access log records it.")}`, footer: foot(fromReq ? "Approve and share" : "Share") };
  };

  // ═════════════ 8. Data calls ═════════════
  const DCR = "after-data-calls-questionnaires";
  const dcHead = () => h.header("Data calls", `<span>FISMA and readiness data calls and customer questionnaires, answered from what the program already holds</span>`, `<span class="btn" ${go(DCR + "-kb")}>Knowledge base</span><button type="button" class="btn ink" data-modal="v2k-import" data-id="data call">Import data call</button>`);
  const dcTabs = (cur) => tabs([["Data calls", 5, cur === "dc" ? null : DCR, cur === "dc"], ["Knowledge base", 6, cur === "kb" ? null : DCR + "-kb", cur === "kb"]], cur === "dc" ? { "Knowledge base": 4 } : {}, "", "Data calls");
  const dcDue = (d) => (d.review[1] === "Sent" ? mu(dd(d.due)) : dueC(D(d.due)));
  S[DCR] = () => {
    const key = "dc";
    const v = QS[key] || "open";
    const f = { open: (d) => d.review[1] !== "Sent", month: (d) => d.due.slice(0, 7) === "2026-11", conf: (d) => d.conflicts, sent: (d) => d.review[1] === "Sent", all: () => true }[v] || (() => true);
    const list = DC.filter(f);
    return h.page(
      dcHead(),
      dcTabs("dc"),
      AK.banner({ tone: "warn", text: "<b>6 drafted answers</b> conflict with a source.", action: "Review conflicts", co: co(1) }).replace('<span class="btn sm">Review conflicts</span>', `<span class="btn sm" role="button" tabindex="0" data-arq="${key}" data-arv="conf">Review conflicts</span>`),
      qv(key, [["open", "Open", 4], ["month", "Due this month", 2], ["conf", "Conflicts", 3], ["sent", "Sent", 1], ["all", "All", 5]]),
      filters("Search data calls", ["From", "Review", "Owner", "Approver", "Due"], { reset: false }),
      tbl({
        cols: [`Data call ${EX}`, "Progress", "Due", "Review", "Owner", `Approver${co(2)}`, "Comments"],
        rows: list.map((d) => ({ id: d.id, go: `${DCR}-${d.id}`, cells: [`${tr(d.name, 262)}${d.id === "fisma" ? co(3) : ""}`, `<span class="a-risk-pc">${AK.progress(d.drafted, d.q, "drafted")}${d.conflicts ? `<span class="a-risk-bad num">· ${d.conflicts} conflict${d.conflicts > 1 ? "s" : ""}</span>` : ""}</span>`, dcDue(d), pill(...d.review), who(d.owner), d.approver ? who(d.approver) : AK.owner(null), `<span class="a-risk-cmt${d.comments ? "" : " none"}">${AK.i("chat")}<span class="num">${d.comments}</span></span>`] })),
        total: list.length, cls: "a-risk-tight a-risk-tighter",
      }),
      AK.note("The data calls, their approvers and their comments are invented. Their drafted answers quote WS-X90's records: the authorization decision, ACAS imports, the POA&M, evidence and SBOMs."),
    );
  };
  const dcRecord = (d, tab) => {
    const needs = d.q - d.drafted;
    const head = AK.recordHead({
      crumbs: [["Data calls", DCR], [d.name]], title: d.name, chip: EX,
      facts: [["Review", `<span class="a-risk-dd">${pill(...d.review)}${AK.i("down")}</span>`], ["Due", d.review[1] === "Sent" ? dfull(d.due) : AK.due(d.due)], ["Owner", AK.owner(d.owner)], ["Approver", AK.owner(d.approver)], ["From", esc(d.from)]],
      actions: `${btn(`${dl}Export`)}<span class="btn sm ink a-risk-wait" role="button" tabindex="0" aria-disabled="true" title="Waits until all ${d.q} answers are approved">Mark as sent</span>`,
      tabs: [["Questions", d.q, tab === "q" ? null : `${DCR}-${d.id}`, tab === "q"], ["Comments", d.comments, tab === "c" ? null : `${DCR}-${d.id}-comments`, tab === "c"]],
      co: co(3),
    });
    const wait = `<p class="a-risk-mu a-risk-waitn">${AK.i("clock")} Mark as sent waits until all ${d.q} answers are approved: 0 of ${d.q} so far.</p>`;
    const comment = { who: "Joel Barrantes", role: "ISSM", when: "Nov 16, 09:20", text: `${AK.mention("Priya Raghavan")} the last ACAS scan is Oct 10, so weekly doesn't hold; answer as it stands, or rescan first? ${EX}` };
    if (tab === "c") return h.page(head, wait, d.comments ? `${AK.card(`<span class="a-risk-mu">On “Are credentialed vulnerability scans run at least weekly?”</span>${AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [comment] })}`)}` : AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [] }), AK.note("The data call and its comment are invented."));
    const qs = QA.map(([q, a, src, k, st], i) => {
      const open = d.id === "fisma" && i === 1;
      return `<div class="a-risk-q${open ? " open" : ""}"><div class="a-risk-qh"><b>${esc(q)}</b>${k === "ok" ? pill("info", "Matches a source") : pill(k, st)}</div><p>${esc(a)}</p>
        <div class="a-risk-qm"><span class="a-risk-mu">From ${esc(src)}</span>${AK.owner(null)}<span class="ak-link">${AK.i("chat")} Comments (${open ? 1 : 0})</span>${btn("Approve &amp; next")}</div>
        ${open ? AK.comments({ you: ME, placeholder: "Comment, or mention someone with @", items: [comment] }) : ""}</div>`;
    }).join("");
    return h.page(head, wait,
      `<div class="views a-risk-views">${[["All", d.q], ["Needs answer", needs], ["Conflict", d.conflicts], ["Approved", 0]].map(([l, n], i) => `<span class="qv${i ? "" : " on"}">${esc(l)} <span class="num">${n}</span></span>`).join("")}<span class="a-risk-mu">${EX}</span></div>`,
      `<div class="a-risk-qs">${qs}</div>`,
      AK.note(`The data call, its counts and the comment are invented; each drafted answer quotes WS-X90's records, and ${QA.length} of its ${d.q} questions are shown.`));
  };
  DC.forEach((d) => { S[`${DCR}-${d.id}`] = () => dcRecord(d, "q"); S[`${DCR}-${d.id}-comments`] = () => dcRecord(d, "c"); ROUTE_NAV[`${DCR}-${d.id}`] = "before-after"; ROUTE_NAV[`${DCR}-${d.id}-comments`] = "before-after"; });
  const KB = [
    ["SSP 3", "System security plan", pill("warn", "Draft"), "Priya Raghavan", null, null, true],
    ["SSP 2", "System security plan", `${pill("ok", "Published")} ${num("Jul 25")}`, "Priya Raghavan", "2026-07-25", "2027-07-25"],
    ["IA policy and IA procedure set, revision 2.4", "Policy", pill("ok", "Accepted"), "Joel Barrantes", null, "2027-05-01"],
    ["WS-X90 contingency planning policy and recovery procedure set, revision 3.1", "Policy", mu("In package 1"), "Joel Barrantes", null, "2027-03-01"],
    ["Evidence · 368 artifacts", "Evidence", mu("226 of 368 accepted"), null, null, null],
    ["Authorization decision, POA&M (41 items), SBOMs (2)", "Records", pill("ok", "With conditions"), null, null, null],
  ];
  S[DCR + "-kb"] = () => h.page(
    dcHead(),
    dcTabs("kb"),
    filters("Search the knowledge base", ["Kind", "Owner", "Last verified", "Expires"]),
    tbl({
      cols: ["Source", "Kind", "State", `Owner ${EX}${co(4)}`, "Last verified", "Expires", `<span class="a-risk-sr">Verify</span>`],
      rows: KB.map(([n, k, st, o, ver, exp, draft], i) => ({ id: String(i), panel: "", cells: [tr(n, 230), esc(k), st, o ? `${who(o)}` : mu("Per artifact"), ver ? num(dd(ver)) : ring("Not verified"), exp ? num(dd(exp)) : mu("—"), draft ? mu("Draft, never a source") : k === "Evidence" || k === "Records" ? mu("Per record") : btn("Mark as verified")] })),
      total: 6, cls: "a-risk-tight",
    }),
    AK.note("Owners, verified days and expiry dates are invented. Answers never cite a draft as fact: a draft source marks the answer for review."),
  );

  // ——— Dialogs the after screens open ———
  M["a-risk-owner"] = (id) => ({ title: "Assign owner", body: `<p class="ak-desc">${esc(id ? `Give ${id} one owner, a person or an organization. It replaces any owner they have now.` : "Choose an owner.")}</p>${AK.ownerPicker({ you: ME, people: [["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"], ["Marcus Ryde", "Engineer"], ["D. Okafor", "Lead assessor"]] })}`, footer: foot("Assign owner") });
  M["a-risk-accept"] = (id) => ({ title: "Request acceptance", body: `
    ${field("Risk", `<div class="a-risk-ro">${esc(id || "")}</div>`)}
    ${AK.steps(["ISSO · Priya Raghavan", "ISSM · Joel Barrantes", "Authorizing official · R. Calloway signs"], 0)}
    ${field("Residual risk statement", `<div class="ak-input tall">What remains after the planned mitigation, and why it is acceptable for operational use</div>`, "", req)}
    <div class="a-risk-row2">${field("Acceptance expires", select("Nov 17, 2027"), "At most 12 months, and never after the ATD, Sep 17, 2029.")}${field("Review cadence", select("Every 3 months"))}</div>
    ${checkRow("Lock a snapshot of the risk with the request", true)}`, footer: foot("Send to Priya Raghavan") });
  M["a-risk-decision"] = (id) => ({ title: "Record decision", body: `
    ${field("Risk", `<div class="a-risk-ro">${esc(id || "")}</div>`)}
    ${field("Decision", `<div class="a-risk-radios">${radio("Accept", true, "Step 2, the ISSM, gets the request next.")}${radio("Return", false, "The request goes back to its sender.")}</div>`)}
    ${field("Reason", `<div class="ak-input tall">Required when returning; it stays in the risk's History.</div>`)}`, footer: foot("Record decision") });
  M["a-risk-poam-new"] = (id) => ({ title: "Create POA&M item", body: `
    ${field("Answers", `<div class="a-risk-ro">${esc(id ? `${id} chosen finding${id === "1" ? "" : "s"}` : "Choose operational issues, risks or findings")}</div>`)}
    ${field("Title", `<div class="ak-input">What the item fixes, in one line</div>`, "", req)}
    <div class="a-risk-row2">${field("Owner", select("No owner"))}${field("Planned completion", select("Dec 17, 2026"))}</div>
    ${plain("The item joins the WS-X90 POA&amp;M and exports to eMASS and OSCAL with its milestones.")}`, footer: foot("Create POA&M item") });
  M["a-risk-ms-new"] = (id) => ({ title: "Add milestone", body: `
    ${field("POA&M item", id ? `<div class="a-risk-ro">${esc(poamById(id).title)}</div>` : select("Choose a POA&M item"))}
    ${field("Milestone", `<div class="ak-input">What is done, in one line</div>`, "", req)}
    <div class="a-risk-row2">${field("Planned date", select("Dec 15, 2026"))}${field("Owner", select("No owner"))}</div>`, footer: foot("Add milestone") });
  M["a-risk-ms-move"] = (id) => ({ title: "Change planned date", body: `
    ${field("Changing", `<div class="a-risk-ro">${esc(id || "")}</div>`)}
    ${field("New planned date", select("Jan 15, 2027"))}
    ${field("Reason for the change", `<div class="ak-input tall">Why the date moves; it stays in the item's history and the eMASS export.</div>`, "", req)}`, footer: foot("Change planned date") });
  M["a-risk-snap-new"] = () => ({ title: "Take snapshot", body: `
    <p class="ak-desc">A snapshot locks each of the 40 risks' severity, likelihood, impact, threat and response as they read now.</p>
    ${field("Name", `<div class="ak-input">Risk snapshot, Nov 17, 2026</div>`)}
    ${checkRow("Share with the authorizing official", false, "R. Calloway can open it from the package room.")}`, footer: foot("Take snapshot") });
  M["a-risk-new-risk"] = () => ({ title: "Create risk", body: `
    ${field("Title", `<div class="ak-input">What could happen, to what, in one sentence</div>`, "", req)}
    ${field("Threat", `<div class="ak-input tall">Who or what, and how</div>`)}
    <div class="a-risk-row2">${field("Likelihood", select("Moderate"))}${field("Impact", select("High"))}</div>
    <div class="a-risk-row2">${field("Response", select("Mitigate"))}${field("Owner", select("No owner"))}</div>`, footer: foot("Create risk") });

  ["after-risk-register", "after-risk-register-snapshots", "after-risk-record", "after-findings-deadlines", "after-findings-deadlines-vulns", "after-findings-deadlines-assets", "after-findings-deadlines-assessment",
    "after-findings-deadlines-deactivated", "after-findings-deadlines-history", "after-poam-tracker", "after-poam-tracker-milestones", "after-suppliers-index", "after-suppliers-index-sbom", "after-supplier-record",
    PR, PR + "-requests", PR + "-versions", PR + "-log", PR + "-settings", PR + "-preview", DCR, DCR + "-kb"].forEach((r) => { ROUTE_NAV[r] = "before-after"; });
})();
