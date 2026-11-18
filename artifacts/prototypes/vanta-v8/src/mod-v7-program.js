// mod-v7-program (v7p-): version 7's program and system screens, redrawn in the after style on the kit (PA.AK).
// Overview, Composition (Tree, List, Configurations), Inventory's Discovered by scans, Baseline and its Parameters,
// Requirements with its Objectives and Compliance tabs, Authorization, and Continuous monitoring.
// Values are WS-X90's: from the old modules (core.js, mod-system.js, mod-compliance.js, mod-risk.js), PA.SSP and a
// SELECT-only read of the local database on Nov 18, 2026. Anything invented carries the Example badge.
(() => {
  const PA = window.PA;
  const { S, P, M, ROUTE_NAV, data, h } = PA;
  const AK = PA.AK, D = PA.SSP;
  if (!AK || !D) return;
  const { esc, fmt, pct, pill, tag, gl } = h;
  const TODAY = data.TODAY;
  const ME = "Ingrid Solberg";
  const EX = '<span class="ex">Example</span>';
  const HIGH_CODES = "AC-1 AC-2 AC-2(1) AC-2(2) AC-2(3) AC-2(4) AC-2(5) AC-2(11) AC-2(12) AC-2(13) AC-3 AC-4 AC-4(4) AC-5 AC-6 AC-6(1) AC-6(2) AC-6(3) AC-6(5) AC-6(7) AC-6(9) AC-6(10) AC-7 AC-8 AC-10 AC-11 AC-11(1) AC-12 AC-14 AC-17 AC-17(1) AC-17(2) AC-17(3) AC-17(4) AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5) AC-19 AC-19(5) AC-20 AC-20(1) AC-20(2) AC-21 AC-22 AT-1 AT-2 AT-2(2) AT-2(3) AT-3 AT-4 AU-1 AU-2 AU-3 AU-3(1) AU-4 AU-5 AU-5(1) AU-5(2) AU-6 AU-6(1) AU-6(3) AU-6(5) AU-6(6) AU-7 AU-7(1) AU-8 AU-9 AU-9(2) AU-9(3) AU-9(4) AU-10 AU-11 AU-12 AU-12(1) AU-12(3) CA-1 CA-2 CA-2(1) CA-2(2) CA-3 CA-3(6) CA-5 CA-6 CA-7 CA-7(1) CA-7(4) CA-8 CA-8(1) CA-9 CM-1 CM-2 CM-2(2) CM-2(3) CM-2(7) CM-3 CM-3(1) CM-3(2) CM-3(4) CM-3(6) CM-4 CM-4(1) CM-4(2) CM-5 CM-5(1) CM-6 CM-6(1) CM-6(2) CM-7 CM-7(1) CM-7(2) CM-7(5) CM-8 CM-8(1) CM-8(2) CM-8(3) CM-8(4) CM-9 CM-10 CM-11 CM-12 CM-12(1) CP-1 CP-2 CP-2(1) CP-2(2) CP-2(3) CP-2(5) CP-2(8) CP-3 CP-3(1) CP-4 CP-4(1) CP-4(2) CP-6 CP-6(1) CP-6(2) CP-6(3) CP-7 CP-7(1) CP-7(2) CP-7(3) CP-7(4) CP-8 CP-8(1) CP-8(2) CP-8(3) CP-8(4) CP-9 CP-9(1) CP-9(2) CP-9(3) CP-9(5) CP-9(8) CP-10 CP-10(2) CP-10(4) IA-1 IA-2 IA-2(1) IA-2(2) IA-2(5) IA-2(8) IA-2(12) IA-3 IA-4 IA-4(4) IA-5 IA-5(1) IA-5(2) IA-5(6) IA-6 IA-7 IA-8 IA-8(1) IA-8(2) IA-8(4) IA-11 IA-12 IA-12(2) IA-12(3) IA-12(4) IA-12(5) IR-1 IR-2 IR-2(1) IR-2(2) IR-3 IR-3(2) IR-4 IR-4(1) IR-4(4) IR-4(11) IR-5 IR-5(1) IR-6 IR-6(1) IR-6(3) IR-7 IR-7(1) IR-8 MA-1 MA-2 MA-2(2) MA-3 MA-3(1) MA-3(2) MA-3(3) MA-4 MA-4(3) MA-5 MA-5(1) MA-6 MP-1 MP-2 MP-3 MP-4 MP-5 MP-6 MP-6(1) MP-6(2) MP-6(3) MP-7 PE-1 PE-2 PE-3 PE-3(1) PE-4 PE-5 PE-6 PE-6(1) PE-6(4) PE-8 PE-8(1) PE-9 PE-10 PE-11 PE-11(1) PE-12 PE-13 PE-13(1) PE-13(2) PE-14 PE-15 PE-15(1) PE-16 PE-17 PE-18 PL-1 PL-2 PL-4 PL-4(1) PL-8 PL-10 PL-11 PS-1 PS-2 PS-3 PS-4 PS-4(2) PS-5 PS-6 PS-7 PS-8 PS-9 RA-1 RA-2 RA-3 RA-3(1) RA-5 RA-5(2) RA-5(4) RA-5(5) RA-5(11) RA-7 RA-9 SA-1 SA-2 SA-3 SA-4 SA-4(1) SA-4(2) SA-4(5) SA-4(9) SA-4(10) SA-5 SA-8 SA-9 SA-9(2) SA-10 SA-11 SA-15 SA-15(3) SA-16 SA-17 SA-21 SA-22 SC-1 SC-2 SC-3 SC-4 SC-5 SC-7 SC-7(3) SC-7(4) SC-7(5) SC-7(7) SC-7(8) SC-7(18) SC-7(21) SC-8 SC-8(1) SC-10 SC-12 SC-12(1) SC-13 SC-15 SC-17 SC-18 SC-20 SC-21 SC-22 SC-23 SC-24 SC-28 SC-28(1) SC-39 SI-1 SI-2 SI-2(2) SI-3 SI-4 SI-4(2) SI-4(4) SI-4(5) SI-4(10) SI-4(12) SI-4(14) SI-4(20) SI-4(22) SI-5 SI-5(1) SI-6 SI-7 SI-7(1) SI-7(2) SI-7(5) SI-7(7) SI-7(15) SI-8 SI-8(2) SI-10 SI-11 SI-12 SI-16 SR-1 SR-2 SR-2(1) SR-3 SR-5 SR-6 SR-8 SR-9 SR-9(1) SR-10 SR-11 SR-11(1) SR-11(2) SR-12";
  const DEC_CNSSI = "+AC-12(1) +AC-12(2) +AC-16 +AC-16(6) +AC-16(7) +AC-17(10) +AC-17(6) +AC-17(9) +AC-2(7) +AC-2(9) +AC-20(3) +AC-23 +AC-3(4) +AC-6(8) +AT-2(4) +AT-2(5) +AT-2(6) +AT-3(1) +AT-3(2) +AT-6 +AU-11(1) +AU-14 +AU-14(1) +AU-14(3) +AU-16 +AU-16(1) +AU-16(2) +AU-4(1) -AU-5(2) +AU-6(4) +AU-9(5) +AU-9(6) +CA-7(3) +CA-7(5) +CA-7(6) +CA-8(3) +CM-10(1) +CM-11(2) +CM-14 +CM-3(5) +CM-3(7) +CM-3(8) +CM-5(5) +CM-5(6) +CM-7(3) +CM-7(8) +CM-7(9) -CP-10(4) -CP-2(2) -CP-2(5) -CP-3(1) -CP-4(2) -CP-6(2) -CP-7(4) -CP-8(3) -CP-8(4) -CP-9(2) -CP-9(3) +IA-10 +IA-12(1) -IA-12(5) +IA-2(6) +IA-3(1) +IA-4(9) +IA-5(13) +IA-5(14) +IA-5(16) +IA-5(7) +IA-5(8) +IA-9 +IR-4(10) +IR-4(12) +IR-4(13) +IR-4(14) +IR-4(3) +IR-4(6) +IR-4(7) +IR-4(8) +IR-6(2) +IR-7(2) +IR-9 +IR-9(2) +IR-9(3) +IR-9(4) +MA-3(4) +MA-3(5) +MA-3(6) +MA-4(1) +MA-4(4) +MA-4(6) +MA-4(7) +MA-6(1) -PE-11(1) -PE-15(1) -PE-18 +PE-22 +PE-23 +PE-8(3) +PL-7 +PL-8(1) +PL-8(2) +PL-9 +PS-3(4) +PS-4(1) +PS-6(3) +RA-10 +RA-3(2) +RA-3(3) +RA-5(10) +SA-10(1) +SA-10(3) +SA-10(7) +SA-11(1) +SA-11(2) +SA-15(7) +SA-3(1) +SA-3(2) +SA-3(3) +SA-4(3) +SA-4(7) +SA-8(1) +SA-8(10) +SA-8(11) +SA-8(12) +SA-8(13) +SA-8(14) +SA-8(15) +SA-8(16) +SA-8(17) +SA-8(18) +SA-8(19) +SA-8(2) +SA-8(20) +SA-8(21) +SA-8(22) +SA-8(23) +SA-8(24) +SA-8(25) +SA-8(26) +SA-8(27) +SA-8(28) +SA-8(29) +SA-8(3) +SA-8(30) +SA-8(31) +SA-8(32) +SA-8(4) +SA-8(5) +SA-8(6) +SA-8(7) +SA-8(8) +SA-8(9) +SA-9(1) +SA-9(3) +SA-9(8) -SC-12(1) +SC-16 +SC-16(1) +SC-16(2) +SC-16(3) +SC-18(1) +SC-18(2) +SC-18(3) +SC-18(4) +SC-23(1) +SC-23(3) +SC-23(5) +SC-28(3) +SC-38 +SC-41 +SC-45 +SC-45(1) +SC-47 +SC-5(1) +SC-5(2) +SC-5(3) +SC-7(10) +SC-7(11) +SC-7(12) +SC-7(13) +SC-7(14) +SC-7(15) +SC-7(25) +SC-7(28) +SC-7(29) +SC-7(9) +SC-8(2) +SI-10(3) +SI-10(5) +SI-10(6) +SI-12(3) +SI-15 +SI-2(3) +SI-2(4) +SI-2(6) +SI-21 +SI-3(10) +SI-4(1) +SI-4(11) +SI-4(15) +SI-4(16) +SI-4(19) +SI-4(23) +SI-4(24) +SI-4(25) +SI-6(3) +SI-7(10) +SI-7(17) +SI-7(8) +SI-7(9) +SR-3(1) +SR-3(2) +SR-3(3) +SR-4 +SR-5(1) +SR-5(2) +SR-6(1) +SR-7";
  const DEC_MISSION = "-AC-18 -AC-18(1) -AC-18(3) -AC-18(4) -AC-18(5) +SC-39 +SI-16 +SR-11";
  const DEC_DEPLOYED = "+CP-10 +MA-5 +PE-18";
  const DEC_CUSTA = "-AC-20 -AC-20(1) -AC-20(2) -AC-20(3) +CA-8 +RA-5";
  const DEC_TAILOR = "+AC-4(21) +CP-11 +CP-12 +CP-13 +SA-24 +SC-29 +SC-29(1) +SC-34 +SC-36 +SC-36(1) +SC-7(22) +SI-14 +SI-14(1) +SI-4(13)";
  const DEC_CUSA = "+AC-4(21) +CM-14 -PE-17 +SC-12(2) -SC-15 +SC-32 +SI-7(6) +SR-4";
  const REQS = [["REQ-001","AC Enforcement Requirement 001","The assigned component shall enforce the applicable security policy for AC-2 and record a verifiable implementation state. This is fictional example language and not the text of the NIST control.",["CN-109002","CN-109101"],["AC-2","AC-7"],["Evidence for REQ-001"],0],["REQ-002","AC Verification Requirement 002","The assigned component shall expose sufficient evidence to verify implementation of AC-3 during assessment. This is fictional example language and not the text of the NIST control.",["CN-109107","CN-109113"],["AC-3"],["Evidence for REQ-002"],0],["REQ-003","AC Configuration Requirement 003","The assigned component shall maintain an approved configuration relevant to AC-4 and reject unauthorized changes. This is fictional example language and not the text of the NIST control.",["CN-109113","CN-109114","CN-109119"],["AC-4"],["Evidence for REQ-003"],0],["REQ-004","AC Monitoring Requirement 004","The assigned component shall produce or support telemetry sufficient to monitor the behavior governed by AC-5. This is fictional example language and not the text of the NIST control.",["CN-109002","CN-109114"],["AC-5"],[],0],["REQ-005","AC Enforcement Requirement 005","The assigned component shall enforce the applicable security policy for AC-6 and record a verifiable implementation state. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109119"],["AC-6"],["Evidence for REQ-005"],0],["REQ-006","AC Verification Requirement 006","The assigned component shall expose sufficient evidence to verify implementation of AC-7 during assessment. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109107","CN-109113"],["AC-7"],["Evidence for REQ-006"],0],["REQ-007","AC Configuration Requirement 007","The assigned component shall maintain an approved configuration relevant to AC-8 and reject unauthorized changes. This is fictional example language and not the text of the NIST control.",["CN-109107"],["AC-8"],["Evidence for REQ-007"],0],["REQ-008","AC Monitoring Requirement 008","The assigned component shall produce or support telemetry sufficient to monitor the behavior governed by AC-11. This is fictional example language and not the text of the NIST control.",["CN-109113","CN-109114"],["AC-11","AU-4"],[],0],["REQ-009","AC Enforcement Requirement 009","The assigned component shall enforce the applicable security policy for AC-12 and record a verifiable implementation state. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109114","CN-109119"],["AC-12"],["Evidence for REQ-009"],0],["REQ-010","AC Verification Requirement 010","The assigned component shall expose sufficient evidence to verify implementation of AC-17 during assessment. This is fictional example language and not the text of the NIST control.",["CN-109119"],["AC-17"],["Evidence for REQ-010"],0],["REQ-011","AU Configuration Requirement 011","The assigned component shall maintain an approved configuration relevant to AU-2 and reject unauthorized changes. This is fictional example language and not the text of the NIST control.",["CN-109115","CN-109118"],["AU-2"],["Evidence for REQ-011"],0],["REQ-012","AU Monitoring Requirement 012","The assigned component shall produce or support telemetry sufficient to monitor the behavior governed by AU-3. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109113","CN-109118"],["AU-3"],[],0],["REQ-013","AU Enforcement Requirement 013","The assigned component shall enforce the applicable security policy for AU-4 and record a verifiable implementation state. This is fictional example language and not the text of the NIST control.",["CN-109101"],["AU-4"],["Evidence for REQ-013"],0],["REQ-039","IA Configuration Requirement 039","The assigned component shall maintain an approved configuration relevant to IA-5 and reject unauthorized changes. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109114","CN-109117"],["IA-5"],["Evidence for REQ-039"],0],["REQ-054","RA Verification Requirement 054","The assigned component shall expose sufficient evidence to verify implementation of RA-5 during assessment. This is fictional example language and not the text of the NIST control.",["CN-109113","CN-109118","CN-109120"],["RA-5"],["Evidence for REQ-054"],0],["REQ-064","SI Monitoring Requirement 064","The assigned component shall produce or support telemetry sufficient to monitor the behavior governed by SI-2. This is fictional example language and not the text of the NIST control.",["CN-109116"],["SI-10","SI-2"],["Account disable trigger test report - expiry, disassociation and policy violation, LRU-013"],0],["REQ-200","Boundary counters exported and alerted on connection-rate excursions","The Protected Network Gateway (LRU-007) shall export interface utilisation, connection-rate and drop counters at least once every 60 seconds, and the Security Log Collector (LRU-018) shall raise exactly one alert when the connection-rate counter exceeds the profiled threshold for three consecutive intervals. Occupancy of the LRU-007 session table is not yet exported, so detection covers link-level indicators only. This is fictional example language and not the text of the NIST control.",["CN-109107","CN-109118"],["SC-5(3)"],["Boundary counter export sample, LRU-007 to LRU-018, one-hour capture with excursion"],0],["REQ-262","Outbound traffic profiled per mission phase for anomalies","The Protected Network Gateway (LRU-007) and the Tactical Data Radio (LRU-008) shall profile outbound traffic volume, destination set and periodicity per declared mission phase, and shall raise an anomaly event when observed outbound volume exceeds the profiled envelope for the active phase by more than 25 percent over a rolling 5-minute window. This is fictional example language and not the text of the NIST control.",["CN-109107","CN-109108"],["SI-4(11)","SI-4(13)"],[],1],["REQ-353","On-demand audit reduction that does not alter the source records","The Security Log Collector (LRU-018) shall produce filtered audit reports on demand from a stored query without writing to, reordering or re-timestamping the source records, and shall record the query text, the requesting operator and the record count in the report header. This is fictional example language and not the text of the NIST control.",["CN-109118"],["AU-7"],["Audit report generation non-alteration test report, LRU-018"],0],["REQ-360","Payload arm and release commands are signed at origin","The Payload Interface Controller (LRU-010) shall attach to every payload arm and release command it forwards a signature produced by the Cryptographic Services Module (LRU-003) covering the command, the operator identity and the Payload Safety Interlock (LRU-011) state at command time, so that the originator of a payload command cannot later be repudiated. This is fictional example language and not the text of the NIST control.",["CN-109103","CN-109110","CN-109111"],["AU-10"],["Payload command signature test report, LRU-010 with LRU-011 and LRU-003"],0],["REQ-361","Signing key custody and signature verification on ingest","The Cryptographic Services Module (LRU-003) shall hold the non-repudiation signing keys in protected storage with no export path, and the Security Log Collector (LRU-018) shall verify every command signature on ingest and mark any record whose signature fails or whose key identifier is unknown as unverifiable, retaining rather than discarding it. This is fictional example language and not the text of the NIST control.",["CN-109103","CN-109118"],["AU-10"],[],0],["REQ-436","Access control policy and procedure baseline held under signature","The Configuration Repository (LRU-020) shall hold the approved WS-X90 access control policy and its associated procedures as a single signed, version-controlled baseline, and the Provisioning Workstation (LRU-017) shall refuse to issue a technician procedure package that cites a superseded policy revision. The policy and each procedure shall carry a review record dated at least annually, which is the CNSSI 1253 parameter value for AC-1, and an additional review shall be recorded within 30 days of any change to the effective control set. This is fictional example language and not the text of the NIST control.",["CN-109117","CN-109120"],["AC-1"],["WS-X90 access control policy and procedure baseline, revision 3.2, LRU-020 signed export"],0],["REQ-439","Platform accounts disabled within 72 hours of expiry, disassociation or violation","The Platform Management Controller (LRU-013) shall disable a platform account within 72 hours of the account reaching its expiry date, of the holder ceasing to be associated with the WS-X90 programme, or of a recorded access policy violation, which is the CNSSI 1253 parameter value for AC-2(3), and shall stamp the triggering condition onto the disable record so the Security Log Collector (LRU-018) can report per-trigger counts. This is fictional example language and not the text of the NIST control.",["CN-109113","CN-109118"],["AC-2(3)"],["Account disable trigger test report - expiry, disassociation and policy violation, LRU-013"],0],["REQ-442","Technicians log out at the end of the standard work period","Provisioning and maintenance technicians shall log out of the Provisioning Workstation (LRU-017) and the Maintenance Laptop (LRU-019) at the end of their standard work period rather than leaving an authenticated session locked overnight, which is the CNSSI 1253 parameter value for AC-2(5), as directed in the WS-X90 ground support operating instruction. Each station shall display the count of sessions left open at the previous shift change to the next technician who signs on. This is fictional example language and not the text of the NIST control.",["CN-109117","CN-109119"],["AC-2(5)"],[],0],["REQ-443","Platform privilege is carried by named roles, never attached to an account","WS-X90 shall assign platform privilege only through named roles held in the Platform Management Controller (LRU-013), with no privilege attached directly to an individual account, and the Mission Computer (LRU-001) shall accept a privileged operation only when the presented role is one of the four approved privileged roles. Any change to the membership of a privileged role shall be recorded with a reviewer name and date before the next mission load. This is fictional example language and not the text of the NIST control.",["CN-109101","CN-109113"],["AC-2(7)"],["Privileged role table and membership change log export, LRU-013"],0],["REQ-599","Hardware credential and PIN for non-privileged ground support sessions","Non-privileged operator sessions on the Maintenance Laptop (LRU-019) and the Provisioning Workstation (LRU-017) shall require a hardware credential plus an operator PIN, including sessions established while the endpoint is disconnected from the ground support network, and shall offer no password-only fallback path. This is fictional example language and not the text of the NIST control.",["CN-109117","CN-109119"],["IA-2(2)"],["Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines"],0]];
  const EL = [["SYS-WSX90","WS-X90 Sentinel Mission System","platform",null,0,547,640,0,1761,1128,43,40,4,4],["CN-109000","WS-X90 Sentinel Mission System","other","SYS-WSX90",1,547,640,0,1761,1128,43,40,4,4],["CN-109001","Mission Computing Subsystem","subsystem","CN-109000",2,171,177,0,507,357,15,17,4,4],["CN-109101","Mission Computer","hardware","CN-109001",3,98,102,54,358,257,7,10,3,4],["CN-109102","Secure Boot Controller","hardware","CN-109001",3,43,42,0,91,66,5,4,3,4],["CN-109103","Cryptographic Services Module","hardware","CN-109001",3,59,60,0,147,96,7,8,4,4],["CN-109002","Navigation & Timing Subsystem","subsystem","CN-109000",2,48,48,0,118,79,0,1,0,1],["CN-109104","Navigation Processor","hardware","CN-109002",3,27,27,0,53,33,0,0,0,0],["CN-109105","Timing Receiver","hardware","CN-109002",3,21,22,0,31,16,0,1,0,1],["CN-109106","Navigation Sensor Interface","hardware","CN-109002",3,20,20,0,41,22,0,0,0,0],["CN-109003","Communications Subsystem","subsystem","CN-109000",2,112,116,0,323,181,9,10,3,4],["CN-109107","Protected Network Gateway","hardware","CN-109003",3,86,84,0,281,160,8,7,3,3],["CN-109108","Tactical Data Radio","hardware","CN-109003",3,35,34,0,73,33,2,2,2,2],["CN-109109","Internal Ethernet Switch","hardware","CN-109003",3,35,34,0,87,51,3,5,3,4],["CN-109004","Payload Interface Subsystem","subsystem","CN-109000",2,67,66,0,164,84,2,2,4,4],["CN-109110","Payload Interface Controller","hardware","CN-109004",3,34,33,0,77,26,1,1,4,4],["CN-109111","Payload Safety Interlock","hardware","CN-109004",3,31,31,0,84,36,2,2,4,4],["CN-109112","Payload Telemetry Unit","hardware","CN-109004",3,25,25,0,76,40,0,0,0,0],["CN-109005","Platform Management Subsystem","subsystem","CN-109000",2,263,280,0,817,589,16,22,3,4],["CN-109113","Platform Management Controller","hardware","CN-109005",3,125,128,0,418,308,9,10,3,3],["CN-109114","Maintenance Access Gateway","hardware","CN-109005",3,84,86,0,234,143,4,9,3,3],["CN-109115","Secure Storage Module","hardware","CN-109005",3,66,66,0,221,153,5,6,3,4],["CN-109116","Update & Recovery Controller","hardware","CN-109005",3,45,46,0,144,117,5,5,3,3],["CN-109006","Ground Support Subsystem","subsystem","CN-109000",2,354,371,0,1332,781,21,25,4,4],["CN-109117","Provisioning Workstation","hardware","CN-109006",3,138,140,0,637,407,12,16,4,4],["CN-109118","Security Log Collector","software","CN-109006",3,121,124,14,298,183,8,9,3,4],["CN-109119","Maintenance Laptop","hardware","CN-109006",3,83,83,0,241,108,2,3,4,4],["CN-109120","Configuration Repository","software","CN-109006",3,135,139,0,768,469,13,12,3,4]];
  const COMP = {"CN-109101":["LRU-001","Mission Computer",1,"X800 Missile component set",[["MC-FW 4.2.1","As assessed for the initial authorization."],["MC-FW 4.3.0","Separation kernel added for SC-29(1)."]]],"CN-109102":["LRU-002",null,null,null,[["SBC-FW 2.0.7","As assessed for the initial authorization."],["SBC-FW 2.1.0","Measured boot of every partition for SC-34."]]],"CN-109103":["LRU-003",null,null,null,[["CSM-FW 3.4.2","As assessed for the initial authorization."],["CSM-FW 3.4.2","Unchanged from Block 1."]]],"CN-109104":["LRU-004",null,null,null,[["NAV-FW 1.9.0","As assessed for the initial authorization."],["NAV-FW 1.9.0","Unchanged from Block 1."]]],"CN-109105":["LRU-005",null,null,null,[["TR-FW 5.1.3","As assessed for the initial authorization."],["TR-FW 5.1.3","Unchanged from Block 1."]]],"CN-109106":["LRU-006",null,null,null,[["NSI-FW 1.2.0","As assessed for the initial authorization."],["NSI-FW 1.2.0","Unchanged from Block 1."]]],"CN-109107":["LRU-007",null,null,null,[["PNG-FW 6.0.4","As assessed for the initial authorization."],["PNG-FW 6.1.1","Separate subnets per security domain for SC-7(22)."]]],"CN-109108":["LRU-008",null,null,null,[["TDR-FW 8.2.0","As assessed for the initial authorization."],["TDR-FW 8.3.0","Fallback protocol for CP-11."]]],"CN-109109":["LRU-009",null,null,null,[["IES-OS 15.2(7)","As assessed for the initial authorization."],["IES-OS 15.2(7)","Unchanged from Block 1."]]],"CN-109110":["LRU-010",null,null,null,[["PIC-FW 2.6.1","As assessed for the initial authorization."],["PIC-FW 2.6.1","Unchanged from Block 1."]]],"CN-109111":["LRU-011",null,null,null,[["PSI-FW 1.0.9","As assessed for the initial authorization."],["PSI-FW 1.0.9","Unchanged from Block 1."]]],"CN-109112":["LRU-012",null,null,null,[["PTU-FW 3.3.0","As assessed for the initial authorization."],["PTU-FW 3.3.0","Unchanged from Block 1."]]],"CN-109113":["LRU-013",null,null,null,[["PMC-SW 4.2.1","As assessed for the initial authorization."],["PMC-SW 4.2.1","Unchanged from Block 1."]]],"CN-109114":["LRU-014",null,null,null,[["MAG-FW 2.2.5","As assessed for the initial authorization."],["MAG-FW 2.3.0","Session non-persistence for SI-14."]]],"CN-109115":["LRU-015",null,null,null,[["SSM-FW 1.4.0","As assessed for the initial authorization."],["SSM-FW 1.5.0","Mission state replication for SC-36."]]],"CN-109116":["LRU-016",null,null,null,[["URC-FW 3.0.2","As assessed for the initial authorization."],["URC-FW 3.0.2","Unchanged from Block 1."]]],"CN-109117":["LRU-017",null,null,null,[["PWS image 2026.06","As assessed for the initial authorization."],["PWS image 2026.10","Unchanged from Block 1."]]],"CN-109118":["LRU-018","Audit Log Collector",1,"G25 launch control component set",[["SLC 4.2.1 (rule set 3.4)","As assessed for the initial authorization."],["SLC 4.3.0 (rule set 3.6)","Pattern baselining for SI-4(13)."]]],"CN-109119":["LRU-019",null,null,null,[["MLT image 2026.06","As assessed for the initial authorization."],["MLT non-persistent image 2026.10","Non-persistent image for SI-14."]]],"CN-109120":["LRU-020",null,null,null,[["CFG-REPO 2.8.0","As assessed for the initial authorization."],["CFG-REPO 2.9.0","Signed image builds for SI-14(1)."]]]};
  const ASSETS = [["AST-109001","Mission Computer","CN-109101","2026-09-12"],["AST-109002","Secure Boot Controller","CN-109102","2026-09-12"],["AST-109003","Cryptographic Services Module","CN-109103","2026-09-12"],["AST-109004","Navigation Processor","CN-109104","2026-09-12"],["AST-109005","Timing Receiver","CN-109105","2026-09-12"],["AST-109006","Navigation Sensor Interface","CN-109106","2026-09-12"],["AST-109007","Protected Network Gateway","CN-109107","2026-09-12"],["AST-109008","Tactical Data Radio","CN-109108","2026-09-12"],["AST-109009","Internal Ethernet Switch","CN-109109","2026-09-12"],["AST-109010","Payload Interface Controller","CN-109110","2026-09-12"],["AST-109011","Payload Safety Interlock","CN-109111","2026-09-12"],["AST-109012","Payload Telemetry Unit","CN-109112","2026-09-12"],["AST-109013","Platform Management Controller","CN-109113","2026-09-12"],["AST-109014","Maintenance Access Gateway","CN-109114","2026-09-12"],["AST-109015","Secure Storage Module","CN-109115","2026-09-12"],["AST-109016","Update & Recovery Controller","CN-109116","2026-09-12"],["AST-109017","Provisioning Workstation","CN-109117","2026-09-12"],["AST-109018","Security Log Collector","CN-109118","2026-09-12"],["AST-109019","Maintenance Laptop","CN-109119","2026-09-12"],["AST-109020","Configuration Repository","CN-109120","2026-09-12"]];
  const ELSUM = {"CN-109004":{"f":[["SA",19,["SA-4(2)","SA-5","SA-8","SA-8(1)"]],["SC",9,["SC-7","SC-7(21)","SC-7(29)","SC-12"]],["SI",7,["SI-6","SI-7(9)","SI-10(3)","SI-10(5)"]],["AC",5,["AC-2(11)","AC-6(10)","AC-14","AC-16(7)"]],["SR",5,["SR-3(3)","SR-5(1)","SR-6","SR-9"]],["IA",4,["IA-5(7)","IA-5(14)","IA-9","IA-11"]],["AU",3,["AU-3(1)","AU-10","AU-12(3)"]],["PE",3,["PE-9","PE-10","PE-14"]],["CA",2,["CA-3(6)","CA-9"]],["CM",2,["CM-3(8)","CM-12"]],["IR",2,["IR-4(3)","IR-4(4)"]],["MA",2,["MA-2(2)","MA-6(1)"]],["AT",1,["AT-2(4)"]],["CP",1,["CP-10(2)"]],["PL",1,["PL-8(1)"]],["RA",1,["RA-9"]]],"q":[["REQ-306","Declared mission-continuation incident classes drive payload inhibit a"],["REQ-185","Reviewed threat model per external and payload interface"],["REQ-190","Design specification shows control allocation and how mediation points"],["REQ-187","Criticality analysis recorded at each design review decision point"],["REQ-293","External data never interpreted as command syntax"],["REQ-420","Flow-down of supply chain clauses to payload sub-tier suppliers"]]},"CN-109119":{"f":[["AC",15,["AC-2","AC-2(3)","AC-2(5)","AC-2(9)"]],["MA",11,["MA-2","MA-3","MA-3(1)","MA-3(2)"]],["SA",8,["SA-2","SA-3(1)","SA-3(2)","SA-4(10)"]],["IA",7,["IA-2(2)","IA-2(6)","IA-2(12)","IA-5(8)"]],["PE",7,["PE-2","PE-5","PE-6","PE-17"]],["AT",6,["AT-2","AT-2(2)","AT-2(3)","AT-3"]],["IR",5,["IR-2","IR-2(1)","IR-4(11)","IR-7(1)"]],["SC",5,["SC-7(7)","SC-7(12)","SC-15","SC-18(4)"]],["MP",4,["MP-6","MP-6(2)","MP-6(3)","MP-7"]],["SI",3,["SI-4(19)","SI-4(20)","SI-8"]],["SR",3,["SR-10","SR-11(1)","SR-12"]],["CM",2,["CM-2(7)","CM-11(2)"]],["PL",2,["PL-4","PL-4(1)"]],["PS",2,["PS-4","PS-7"]],["CA",1,["CA-8(3)"]],["CP",1,["CP-3"]],["RA",1,["RA-5(5)"]]],"q":[["REQ-485","Recovery-role sessions gated on current contingency training"],["REQ-535","Literacy training before first account enablement and annually thereaf"],["REQ-537","Social engineering refusal exercise for provisioning and maintenance r"],["REQ-536","Insider threat indicator recognition and reporting path for maintenanc"],["REQ-433","Counterfeit detection training for provisioning and maintenance staff"],["REQ-335","Termination revokes issued credentials and recovers assigned support p"]]},"CN-109117":{"f":[["IA",16,["IA-1","IA-2","IA-2(2)","IA-2(5)"]],["PE",13,["PE-1","PE-2","PE-5","PE-6"]],["AC",12,["AC-1","AC-2(3)","AC-2(5)","AC-2(13)"]],["SA",12,["SA-1","SA-2","SA-3","SA-3(1)"]],["SC",12,["SC-1","SC-7(4)","SC-7(12)","SC-7(28)"]],["CM",11,["CM-1","CM-2","CM-2(7)","CM-3"]],["CP",10,["CP-1","CP-2","CP-6(3)","CP-7"]],["MP",10,["MP-1","MP-2","MP-3","MP-4"]],["PS",10,["PS-1","PS-2","PS-3","PS-3(4)"]],["IR",8,["IR-1","IR-2","IR-2(1)","IR-2(2)"]],["CA",5,["CA-1","CA-5","CA-7","CA-8"]],["AT",4,["AT-2","AT-2(3)","AT-3","AT-3(1)"]],["MA",4,["MA-3","MA-3(1)","MA-3(2)","MA-5"]],["SI",4,["SI-1","SI-2(4)","SI-3(10)","SI-8(2)"]],["SR",3,["SR-1","SR-11","SR-11(1)"]],["PL",2,["PL-4","PL-4(1)"]],["AU",1,["AU-6(6)"]],["RA",1,["RA-5(2)"]]],"q":[["REQ-375","Maintenance tool images inspected against the approved baseline before"],["REQ-415","Supply chain risk management procedure set for WS-X90"],["REQ-433","Counterfeit detection training for provisioning and maintenance staff"],["REQ-549","External site and social media restrictions written into the rules of "],["REQ-096","CA Monitoring Requirement 096"],["REQ-517","Unannounced physical attempts against provisioning and laptop custody"]]},"CN-109000":{"f":[["SA",67,["SA-1","SA-2","SA-3","SA-3(1)"]],["SC",60,["SC-1","SC-2","SC-3","SC-4"]],["SI",52,["SI-1","SI-2","SI-2(2)","SI-2(3)"]],["AC",51,["AC-1","AC-2","AC-2(1)","AC-2(2)"]],["CM",43,["CM-1","CM-2","CM-2(2)","CM-2(3)"]],["IA",36,["IA-1","IA-2","IA-2(1)","IA-2(2)"]],["AU",35,["AU-1","AU-2","AU-3","AU-3(1)"]],["IR",32,["IR-1","IR-2","IR-2(1)","IR-2(2)"]],["PE",26,["PE-1","PE-2","PE-3","PE-3(1)"]],["CP",24,["CP-1","CP-2","CP-2(1)","CP-2(3)"]],["SR",22,["SR-1","SR-2","SR-2(1)","SR-3"]],["MA",20,["MA-1","MA-2","MA-2(2)","MA-3"]],["CA",18,["CA-1","CA-2","CA-2(1)","CA-2(2)"]],["RA",15,["RA-1","RA-2","RA-3","RA-3(1)"]],["PS",13,["PS-1","PS-2","PS-3","PS-3(4)"]],["AT",12,["AT-1","AT-2","AT-2(2)","AT-2(3)"]],["PL",11,["PL-1","PL-2","PL-4","PL-4(1)"]],["MP",10,["MP-1","MP-2","MP-3","MP-4"]]],"q":[["REQ-350","Single central review surface for all reporting LRUs"],["REQ-368","Supervisor real-time view of an in-progress maintenance session"],["REQ-351","Monitoring and scan data joined to the audit analysis view"],["REQ-068","SI Monitoring Requirement 068"],["REQ-262","Outbound traffic profiled per mission phase for anomalies"],["REQ-288","Content screening at platform entry and exit points"]]},"CN-109109":{"f":[["SC",13,["SC-5","SC-5(2)","SC-7","SC-7(5)"]],["SA",4,["SA-4(9)","SA-8(2)","SA-8(17)","SA-8(18)"]],["SI",4,["SI-4(4)","SI-4(15)","SI-4(22)","SI-4(25)"]],["AC",2,["AC-16","AC-16(7)"]],["CM",2,["CM-7(9)","CM-8(3)"]],["PE",2,["PE-4","PE-9"]],["PL",2,["PL-8(1)","PL-8(2)"]],["AU",1,["AU-12(1)"]],["CA",1,["CA-9"]],["CP",1,["CP-8(2)"]],["IA",1,["IA-3(1)"]],["IR",1,["IR-9"]],["MA",1,["MA-4(4)"]]],"q":[["REQ-141","Per-trust-level message queues with enforced switch quotas"],["REQ-156","Composed security policy analysed across the external boundary"],["REQ-554","Three-layer payload command path with no shared configuration source"],["REQ-555","Supplier diversity between the boundary and internal segmentation enfo"],["REQ-464","Attributes travel with data across the gateway and the internal switch"],["REQ-466","One signed attribute dictionary shared by the payload and transport LR"]]},"CN-109113":{"f":[["CM",20,["CM-2(2)","CM-3(1)","CM-3(5)","CM-3(8)"]],["AC",18,["AC-2(1)","AC-2(2)","AC-2(3)","AC-2(4)"]],["AU",12,["AU-3","AU-4","AU-5","AU-5(1)"]],["PE",12,["PE-1","PE-3","PE-6(1)","PE-9"]],["SA",9,["SA-4","SA-5","SA-8(14)","SA-8(21)"]],["SI",9,["SI-2(2)","SI-2(3)","SI-4","SI-4(5)"]],["CA",8,["CA-2(1)","CA-5","CA-6","CA-7"]],["IA",7,["IA-2(1)","IA-4(4)","IA-4(9)","IA-5(1)"]],["IR",7,["IR-3","IR-3(2)","IR-4","IR-4(6)"]],["SC",6,["SC-2","SC-7(15)","SC-20","SC-22"]],["MA",5,["MA-2","MA-2(2)","MA-3","MA-4"]],["PS",4,["PS-3","PS-4","PS-4(2)","PS-5"]],["RA",3,["RA-3","RA-5","RA-7"]],["CP",2,["CP-2(1)","CP-4(1)"]],["MP",2,["MP-6","MP-6(1)"]],["PL",1,["PL-9"]]],"q":[["REQ-613","Acknowledged restriction on reusing a password across domains and priv"],["REQ-621","External identity assertions checked against the identity management p"],["REQ-556","Central management of flaw remediation and malicious code protection"],["REQ-636","Two-person sanitization record with verification before disposal"],["REQ-303","Incident response test scheduled jointly with the contingency and reco"],["REQ-308","Insider-threat branch triggered by privileged-session and account-chan"]]},"CN-109111":{"f":[["SA",11,["SA-4(2)","SA-8","SA-8(7)","SA-8(9)"]],["SI",3,["SI-6","SI-10(3)","SI-10(5)"]],["SR",3,["SR-3(3)","SR-9","SR-10"]],["AU",2,["AU-10","AU-12(3)"]],["PE",2,["PE-9","PE-10"]],["SC",2,["SC-7(21)","SC-7(29)"]],["AC",1,["AC-14"]],["CA",1,["CA-9"]],["CM",1,["CM-3(8)"]],["CP",1,["CP-10(2)"]],["IA",1,["IA-11"]],["IR",1,["IR-4(3)"]],["PL",1,["PL-8(1)"]],["RA",1,["RA-9"]]],"q":[["REQ-504","Payload command transactions replayed to a known state after reset"],["REQ-306","Declared mission-continuation incident classes drive payload inhibit a"],["REQ-519","Payload internal connections admitted by register and closed by interl"],["REQ-569","Configuration changes blocked while the platform is in an exercise or "],["REQ-462","Only two actions are permitted without identification or authenticatio"],["REQ-554","Three-layer payload command path with no shared configuration source"]]},"CN-109108":{"f":[["SC",6,["SC-5(1)","SC-5(2)","SC-7(4)","SC-8(1)"]],["SI",5,["SI-4(4)","SI-4(11)","SI-4(13)","SI-4(14)"]],["SR",4,["SR-3(2)","SR-6","SR-8","SR-10"]],["CP",3,["CP-8","CP-8(1)","CP-8(2)"]],["SA",3,["SA-4(7)","SA-8(18)","SA-9(2)"]],["CM",2,["CM-3(6)","CM-7(1)"]],["IA",2,["IA-2(8)","IA-5(14)"]],["PE",2,["PE-4","PE-22"]],["RA",2,["RA-3(1)","RA-5(4)"]],["AC",1,["AC-17(10)"]],["AU",1,["AU-16"]],["CA",1,["CA-3"]],["IR",1,["IR-6(1)"]],["MA",1,["MA-6"]],["PL",1,["PL-8(1)"]]],"q":[["REQ-553","Two independent enforcement layers between the external world and miss"],["REQ-369","Coordinated release of audit information across an organizational boun"],["REQ-220","Protected staging of mission data before and after transmission"],["REQ-198","Egress capping so the platform cannot flood an external system"],["REQ-199","Documented capacity headroom for internal transport and the radio"],["REQ-419","Blind-buy and destination obfuscation for targeted procurement"]]},"CN-109103":{"f":[["SC",12,["SC-3","SC-7(10)","SC-8(1)","SC-8(2)"]],["SA",10,["SA-4(1)","SA-4(2)","SA-4(7)","SA-8"]],["IA",9,["IA-2","IA-2(1)","IA-2(6)","IA-3"]],["SR",7,["SR-2","SR-3","SR-3(2)","SR-6(1)"]],["AC",4,["AC-4(4)","AC-6(1)","AC-17(2)","AC-17(10)"]],["SI",4,["SI-4(10)","SI-6","SI-7(15)","SI-12(3)"]],["AU",3,["AU-9(3)","AU-10","AU-16(1)"]],["CM",2,["CM-3(6)","CM-14"]],["PE",2,["PE-3(1)","PE-22"]],["CP",1,["CP-9(8)"]],["IR",1,["IR-4"]],["MA",1,["MA-4(6)"]],["MP",1,["MP-5"]],["PS",1,["PS-4"]],["RA",1,["RA-3(1)"]]],"q":[["REQ-072","SR Monitoring Requirement 072"],["REQ-419","Blind-buy and destination obfuscation for targeted procurement"],["REQ-425","Independent testing of critical supplied elements before lot acceptanc"],["REQ-335","Termination revokes issued credentials and recovers assigned support p"],["REQ-036","IA Monitoring Requirement 036"],["REQ-112","IA Monitoring Requirement 112"]]},"CN-109120":{"f":[["CM",29,["CM-1","CM-2","CM-2(2)","CM-2(3)"]],["SA",19,["SA-1","SA-3","SA-4","SA-4(3)"]],["IR",9,["IR-1","IR-4","IR-4(10)","IR-5"]],["AC",8,["AC-1","AC-3(4)","AC-16(6)","AC-17(6)"]],["CP",8,["CP-1","CP-2","CP-2(8)","CP-6"]],["SR",8,["SR-1","SR-2","SR-2(1)","SR-3"]],["CA",7,["CA-1","CA-2","CA-5","CA-6"]],["RA",7,["RA-1","RA-2","RA-3(2)","RA-5"]],["SC",7,["SC-1","SC-7(4)","SC-17","SC-18(1)"]],["PL",6,["PL-1","PL-2","PL-7","PL-8"]],["IA",5,["IA-1","IA-5(7)","IA-5(14)","IA-8(2)"]],["SI",5,["SI-1","SI-2(3)","SI-4(24)","SI-5(1)"]],["AT",4,["AT-1","AT-2(6)","AT-4","AT-6"]],["AU",4,["AU-1","AU-6(3)","AU-11(1)","AU-16(2)"]],["MA",3,["MA-1","MA-2(2)","MA-3(6)"]],["MP",3,["MP-1","MP-3","MP-7"]],["PS",2,["PS-1","PS-9"]],["PE",1,["PE-16"]]],"q":[["REQ-633","Handling markings applied to every removable volume released from prov"],["REQ-534","Awareness and training policy issued to all WS-X90 account holders"],["REQ-540","Quarterly threat bulletin reflected in the WS-X90 operating instructio"],["REQ-546","Training results reported to supervisors and the cybersecurity officia"],["REQ-203","Traffic-flow policy exceptions reviewed at least every 180 days"],["REQ-231","Mobile code category recorded and handling rules met before release"]]},"CN-109005":{"f":[["AC",33,["AC-2(1)","AC-2(2)","AC-2(3)","AC-2(4)"]],["CM",28,["CM-2","CM-2(2)","CM-2(3)","CM-3(1)"]],["AU",23,["AU-2","AU-3","AU-4","AU-4(1)"]],["SA",23,["SA-3(2)","SA-4","SA-4(5)","SA-5"]],["SI",21,["SI-2","SI-2(2)","SI-2(3)","SI-2(4)"]],["IA",19,["IA-2(1)","IA-2(5)","IA-2(6)","IA-4"]],["PE",17,["PE-1","PE-2","PE-3","PE-3(1)"]],["IR",16,["IR-3","IR-3(2)","IR-4","IR-4(1)"]],["MA",16,["MA-1","MA-2","MA-2(2)","MA-3"]],["SC",16,["SC-2","SC-4","SC-7(7)","SC-7(14)"]],["CP",14,["CP-2","CP-2(1)","CP-2(3)","CP-3"]],["CA",10,["CA-2","CA-2(1)","CA-5","CA-6"]],["PS",7,["PS-3","PS-3(4)","PS-4","PS-4(2)"]],["SR",7,["SR-4","SR-5(2)","SR-9","SR-9(1)"]],["MP",5,["MP-2","MP-4","MP-6","MP-6(1)"]],["RA",4,["RA-3","RA-5","RA-5(5)","RA-7"]],["AT",2,["AT-3","AT-3(2)"]],["PL",2,["PL-4","PL-9"]]],"q":[["REQ-600","Individual identity bound to every action taken under a shared role ac"],["REQ-612","No unencrypted static authenticator survives repository or update stag"],["REQ-613","Acknowledged restriction on reusing a password across domains and priv"],["REQ-485","Recovery-role sessions gated on current contingency training"],["REQ-490","Retrieval obstacles at the alternate storage site and their mitigation"],["REQ-482","Single declaration starts both the contingency and incident response p"]]},"CN-109112":{"f":[["SA",4,["SA-5","SA-8(6)","SA-8(20)","SA-8(22)"]],["SI",3,["SI-6","SI-11","SI-15"]],["SR",3,["SR-3(3)","SR-5(1)","SR-9"]],["AC",2,["AC-14","AC-16(7)"]],["CA",2,["CA-3(6)","CA-9"]],["IA",2,["IA-5(14)","IA-9"]],["MA",2,["MA-2(2)","MA-6(1)"]],["SC",2,["SC-16","SC-45"]],["AT",1,["AT-2(4)"]],["CM",1,["CM-12"]],["CP",1,["CP-10(2)"]],["IR",1,["IR-4(4)"]],["PE",1,["PE-14"]]],"q":[["REQ-519","Payload internal connections admitted by register and closed by interl"],["REQ-420","Flow-down of supply chain clauses to payload sub-tier suppliers"],["REQ-422","Sustainment stock for long-lead navigation, timing and telemetry items"],["REQ-593","Payload telemetry retention points documented and bounded"],["REQ-145","No buffer reuse across security domains without zeroisation"],["REQ-160","Telemetry metadata protected to the same level as telemetry content"]]},"CN-109002":{"f":[["SA",9,["SA-3(3)","SA-4(9)","SA-8(3)","SA-8(4)"]],["SR",7,["SR-2","SR-3(1)","SR-5(1)","SR-6"]],["SC",6,["SC-16","SC-16(1)","SC-16(2)","SC-16(3)"]],["SI",6,["SI-4(16)","SI-7(1)","SI-7(9)","SI-10(3)"]],["AC",3,["AC-2","AC-5","AC-7"]],["CM",3,["CM-6(1)","CM-6(2)","CM-7(1)"]],["AU",2,["AU-6(4)","AU-12(1)"]],["IA",2,["IA-3(1)","IA-9"]],["IR",2,["IR-4(3)","IR-4(13)"]],["PE",2,["PE-4","PE-14"]],["RA",2,["RA-3(1)","RA-9"]],["AT",1,["AT-2(4)"]],["CA",1,["CA-9"]],["CP",1,["CP-2(8)"]],["MA",1,["MA-6(1)"]]],"q":[["REQ-127","Dated refresh decision points for navigation and timing hardware"],["REQ-142","Navigation integrity checking separated into its own signed module"],["REQ-192","Vendor support end dates held for every inventory item with a 12-month"],["REQ-538","Operator recognition of the published anomalous-behaviour indicator se"],["REQ-418","Second qualified source for navigation and timing critical items"],["REQ-422","Sustainment stock for long-lead navigation, timing and telemetry items"]]},"CN-109115":{"f":[["AU",17,["AU-2","AU-3","AU-4","AU-4(1)"]],["CP",9,["CP-2","CP-4","CP-6","CP-6(3)"]],["SC",6,["SC-4","SC-12","SC-13","SC-24"]],["IR",5,["IR-4(1)","IR-4(12)","IR-5(1)","IR-8"]],["SA",5,["SA-3(2)","SA-8(11)","SA-8(19)","SA-8(22)"]],["AC",4,["AC-2(4)","AC-16","AC-17(6)","AC-23"]],["IA",4,["IA-4(9)","IA-5(1)","IA-5(6)","IA-7"]],["MP",3,["MP-2","MP-4","MP-6"]],["PE",3,["PE-3(1)","PE-11","PE-22"]],["SI",3,["SI-2(6)","SI-7(8)","SI-12(3)"]],["CM",2,["CM-9","CM-12"]],["MA",2,["MA-4(3)","MA-5(1)"]],["SR",2,["SR-9","SR-12"]],["CA",1,["CA-2"]]],"q":[["REQ-589","Configuration management plan held as a protected, approved configurat"],["REQ-383","Remove, clear and re-verify path for LRUs serviced off-platform"],["REQ-387","Escorted maintenance by personnel without required access approvals"],["REQ-126","Bench and maintenance endpoint handled at flight protection level whil"],["REQ-165","Recovery verifies its source or stops"],["REQ-150","Modification authority graded by component trust"]]},"CN-109110":{"f":[["SC",7,["SC-7","SC-7(21)","SC-12","SC-16"]],["SA",6,["SA-8(1)","SA-8(5)","SA-8(15)","SA-8(18)"]],["AC",4,["AC-2(11)","AC-6(10)","AC-16(7)","AC-17(10)"]],["SI",4,["SI-7(9)","SI-10(3)","SI-10(5)","SI-10(6)"]],["SR",3,["SR-3(3)","SR-6","SR-9"]],["AU",2,["AU-3(1)","AU-10"]],["IA",2,["IA-5(7)","IA-11"]],["CA",1,["CA-9"]],["CM",1,["CM-12"]],["CP",1,["CP-10(2)"]],["IR",1,["IR-4(3)"]],["PE",1,["PE-10"]],["PL",1,["PL-8(1)"]]],"q":[["REQ-466","One signed attribute dictionary shared by the payload and transport LR"],["REQ-445","Mission accounts bound to mission phase, ground station and time windo"],["REQ-612","No unencrypted static authenticator survives repository or update stag"],["REQ-420","Flow-down of supply chain clauses to payload sub-tier suppliers"],["REQ-593","Payload telemetry retention points documented and bounded"],["REQ-224","Authorization-state attributes on payload command and telemetry frames"]]},"CN-109107":{"f":[["SC",22,["SC-5","SC-5(1)","SC-5(3)","SC-7"]],["AC",12,["AC-2","AC-3","AC-4","AC-4(4)"]],["SI",9,["SI-4(1)","SI-4(4)","SI-4(10)","SI-4(11)"]],["SA",8,["SA-4(2)","SA-4(7)","SA-4(9)","SA-8(17)"]],["IA",7,["IA-2","IA-2(8)","IA-3","IA-4"]],["IR",6,["IR-4","IR-4(1)","IR-4(8)","IR-6(1)"]],["CA",4,["CA-2(2)","CA-3","CA-3(6)","CA-8(1)"]],["MA",4,["MA-2","MA-4(4)","MA-4(6)","MA-4(7)"]],["CM",3,["CM-7(1)","CM-7(3)","CM-8(3)"]],["CP",3,["CP-8","CP-8(1)","CP-8(2)"]],["PL",3,["PL-8","PL-8(1)","PL-8(2)"]],["AU",2,["AU-14(3)","AU-16"]],["RA",2,["RA-3(3)","RA-5(4)"]],["PE",1,["PE-4"]]],"q":[["REQ-552","Every allocated security function resolves to a named element in the b"],["REQ-553","Two independent enforcement layers between the external world and miss"],["REQ-555","Supplier diversity between the boundary and internal segmentation enfo"],["REQ-262","Outbound traffic profiled per mission phase for anomalies"],["REQ-288","Content screening at platform entry and exit points"],["REQ-272","Traffic visibility at external and key internal interfaces"]]},"CN-109006":{"f":[["CM",37,["CM-1","CM-2","CM-2(2)","CM-2(3)"]],["AC",32,["AC-1","AC-2","AC-2(1)","AC-2(3)"]],["SA",31,["SA-1","SA-2","SA-3","SA-3(1)"]],["AU",30,["AU-1","AU-2","AU-3","AU-3(1)"]],["IA",26,["IA-1","IA-2","IA-2(2)","IA-2(5)"]],["IR",26,["IR-1","IR-2","IR-2(1)","IR-2(2)"]],["SI",23,["SI-1","SI-2(3)","SI-2(4)","SI-3"]],["SC",19,["SC-1","SC-5(3)","SC-7(4)","SC-7(7)"]],["PE",18,["PE-1","PE-2","PE-5","PE-6"]],["CP",16,["CP-1","CP-2","CP-2(1)","CP-2(8)"]],["MA",15,["MA-1","MA-2","MA-2(2)","MA-3"]],["CA",14,["CA-1","CA-2","CA-2(1)","CA-5"]],["PS",13,["PS-1","PS-2","PS-3","PS-3(4)"]],["AT",12,["AT-1","AT-2","AT-2(2)","AT-2(3)"]],["SR",12,["SR-1","SR-2","SR-2(1)","SR-3"]],["RA",11,["RA-1","RA-2","RA-3(2)","RA-3(3)"]],["MP",10,["MP-1","MP-2","MP-3","MP-4"]],["PL",9,["PL-1","PL-2","PL-4","PL-4(1)"]]],"q":[["REQ-203","Traffic-flow policy exceptions reviewed at least every 180 days"],["REQ-231","Mobile code category recorded and handling rules met before release"],["REQ-222","Collaborative computing peripherals not controlled on support endpoint"],["REQ-288","Content screening at platform entry and exit points"],["REQ-256","Quarantined objects analysed and fed back into response and remediatio"],["REQ-271","Indicators of compromise distributed as a versioned set"]]},"CN-109106":{"f":[["SA",4,["SA-3(3)","SA-4(9)","SA-8(4)","SA-8(6)"]],["SI",3,["SI-7(9)","SI-10(3)","SI-10(5)"]],["SR",3,["SR-3(1)","SR-5(1)","SR-10"]],["AU",2,["AU-6(4)","AU-12(1)"]],["SC",2,["SC-16","SC-16(2)"]],["AT",1,["AT-2(4)"]],["CA",1,["CA-9"]],["CM",1,["CM-7(1)"]],["IA",1,["IA-3(1)"]],["IR",1,["IR-4(13)"]],["PE",1,["PE-4"]]],"q":[["REQ-127","Dated refresh decision points for navigation and timing hardware"],["REQ-143","Acyclic initialisation order rooted at the boot controller"],["REQ-145","No buffer reuse across security domains without zeroisation"],["REQ-605","Navigation and timing sources authenticate before their data is truste"],["REQ-538","Operator recognition of the published anomalous-behaviour indicator se"],["REQ-350","Single central review surface for all reporting LRUs"]]},"CN-109118":{"f":[["AU",29,["AU-1","AU-2","AU-3","AU-3(1)"]],["SI",16,["SI-3","SI-3(10)","SI-4(1)","SI-4(2)"]],["IR",14,["IR-2","IR-3","IR-4","IR-4(1)"]],["AC",8,["AC-2(1)","AC-2(3)","AC-2(4)","AC-2(12)"]],["CM",8,["CM-3(5)","CM-3(7)","CM-4(2)","CM-5(1)"]],["SA",8,["SA-8(20)","SA-8(22)","SA-9","SA-9(1)"]],["CA",7,["CA-2","CA-2(1)","CA-7(1)","CA-7(3)"]],["PE",6,["PE-6(1)","PE-6(4)","PE-8","PE-8(1)"]],["AT",5,["AT-2(2)","AT-2(4)","AT-2(5)","AT-2(6)"]],["RA",5,["RA-3(2)","RA-3(3)","RA-5","RA-5(10)"]],["SC",4,["SC-5(3)","SC-7(9)","SC-7(13)","SC-45(1)"]],["MP",3,["MP-2","MP-5","MP-6(1)"]],["CP",2,["CP-2(1)","CP-4(1)"]],["MA",2,["MA-3(5)","MA-4(1)"]],["PS",2,["PS-4(2)","PS-8"]],["IA",1,["IA-10"]],["PL",1,["PL-9"]]],"q":[["REQ-566","Automatic response when a platform baseline is changed outside the cha"],["REQ-576","Unauthorised setting change reverted to the approved value and reporte"],["REQ-594","Automated discovery of protected information types across platform com"],["REQ-342","Formal sanctions initiated and notified for defined WS-X90 policy brea"],["REQ-406","Automatic fire detection notification and event capture"],["REQ-396","Intrusion alarm and surveillance feed into the security log record"]]},"CN-109001":{"f":[["SA",31,["SA-4(1)","SA-4(2)","SA-4(3)","SA-4(7)"]],["SC",22,["SC-2","SC-3","SC-4","SC-7(10)"]],["AC",19,["AC-2","AC-2(7)","AC-2(11)","AC-3"]],["SI",19,["SI-3","SI-4","SI-4(10)","SI-4(23)"]],["CM",17,["CM-2","CM-3","CM-3(5)","CM-3(6)"]],["AU",13,["AU-2","AU-3","AU-4","AU-6"]],["IA",13,["IA-2","IA-2(1)","IA-2(6)","IA-3"]],["SR",11,["SR-2","SR-2(1)","SR-3","SR-3(2)"]],["CA",5,["CA-2","CA-2(2)","CA-5","CA-7"]],["RA",5,["RA-2","RA-3","RA-3(1)","RA-5(5)"]],["CP",4,["CP-2(3)","CP-7","CP-9(8)","CP-10(2)"]],["IR",4,["IR-4","IR-4(1)","IR-4(12)","IR-9(3)"]],["MP",2,["MP-5","MP-7"]],["PE",2,["PE-3(1)","PE-22"]],["PL",2,["PL-7","PL-8"]],["MA",1,["MA-4(6)"]],["PS",1,["PS-4"]]],"q":[["REQ-335","Termination revokes issued credentials and recovers assigned support p"],["REQ-036","IA Monitoring Requirement 036"],["REQ-328","Bounded degraded-operations partition while contaminated storage is un"],["REQ-491","Staged transfer of mission-support operations to a second integration "],["REQ-483","Essential mission functions resume within the plan's four-hour objecti"],["REQ-112","IA Monitoring Requirement 112"]]},"CN-109102":{"f":[["SA",13,["SA-4(1)","SA-8(4)","SA-8(9)","SA-8(10)"]],["SI",9,["SI-4","SI-5","SI-6","SI-7(1)"]],["SR",6,["SR-2(1)","SR-3","SR-4","SR-5"]],["CM",4,["CM-3(5)","CM-7(2)","CM-8(3)","CM-14"]],["SC",4,["SC-3","SC-13","SC-23","SC-24"]],["AC",2,["AC-3","AC-6(8)"]],["AU",1,["AU-14(1)"]],["CP",1,["CP-10(2)"]],["IA",1,["IA-3(1)"]],["IR",1,["IR-4(12)"]],["RA",1,["RA-9"]]],"q":[["REQ-566","Automatic response when a platform baseline is changed outside the cha"],["REQ-060","SC Monitoring Requirement 060"],["REQ-056","SA Monitoring Requirement 056"],["REQ-187","Criticality analysis recorded at each design review decision point"],["REQ-143","Acyclic initialisation order rooted at the boot controller"],["REQ-072","SR Monitoring Requirement 072"]]},"CN-109003":{"f":[["SC",29,["SC-5","SC-5(1)","SC-5(2)","SC-5(3)"]],["AC",14,["AC-2","AC-3","AC-4","AC-4(4)"]],["SI",11,["SI-4(1)","SI-4(4)","SI-4(10)","SI-4(11)"]],["IA",9,["IA-2","IA-2(8)","IA-3","IA-3(1)"]],["SA",9,["SA-4(2)","SA-4(7)","SA-4(9)","SA-8(2)"]],["IR",6,["IR-4","IR-4(1)","IR-4(8)","IR-6(1)"]],["CA",5,["CA-2(2)","CA-3","CA-3(6)","CA-8(1)"]],["CM",5,["CM-3(6)","CM-7(1)","CM-7(3)","CM-7(9)"]],["MA",5,["MA-2","MA-4(4)","MA-4(6)","MA-4(7)"]],["SR",4,["SR-3(2)","SR-6","SR-8","SR-10"]],["AU",3,["AU-12(1)","AU-14(3)","AU-16"]],["CP",3,["CP-8","CP-8(1)","CP-8(2)"]],["PE",3,["PE-4","PE-9","PE-22"]],["PL",3,["PL-8","PL-8(1)","PL-8(2)"]],["RA",3,["RA-3(1)","RA-3(3)","RA-5(4)"]]],"q":[["REQ-262","Outbound traffic profiled per mission phase for anomalies"],["REQ-288","Content screening at platform entry and exit points"],["REQ-264","Emitter observation reporting from the tactical radio"],["REQ-522","Annual supply chain risk assessment for the three externally procured "],["REQ-524","Current cyber threat state published to the boundary policy"],["REQ-464","Attributes travel with data across the gateway and the internal switch"]]},"CN-109114":{"f":[["AC",18,["AC-2(2)","AC-2(9)","AC-4","AC-5"]],["MA",13,["MA-1","MA-2","MA-3","MA-3(3)"]],["IA",10,["IA-2(1)","IA-2(5)","IA-2(6)","IA-4"]],["SA",6,["SA-5","SA-8(14)","SA-8(27)","SA-8(28)"]],["SC",6,["SC-7(7)","SC-7(14)","SC-7(15)","SC-10"]],["AU",4,["AU-4","AU-14","AU-14(1)","AU-14(3)"]],["IR",4,["IR-4(6)","IR-4(7)","IR-7","IR-9(4)"]],["PE",4,["PE-2","PE-6(4)","PE-17","PE-18"]],["PS",4,["PS-3(4)","PS-4","PS-7","PS-8"]],["CM",3,["CM-5(1)","CM-5(5)","CM-7(9)"]],["SI",3,["SI-4(19)","SI-4(20)","SI-8"]],["AT",2,["AT-3","AT-3(2)"]],["SR",2,["SR-10","SR-11(2)"]],["CA",1,["CA-8(1)"]],["CP",1,["CP-3"]],["MP",1,["MP-7"]],["PL",1,["PL-4"]],["RA",1,["RA-5(5)"]]],"q":[["REQ-485","Recovery-role sessions gated on current contingency training"],["REQ-368","Supervisor real-time view of an in-progress maintenance session"],["REQ-008","AC Monitoring Requirement 008"],["REQ-372","Maintenance policy and procedures reviewed at least annually"],["REQ-382","Nonlocal maintenance initiated only from a comparably protected endpoi"],["REQ-377","Release control for maintenance equipment holding platform information"]]},"CN-109116":{"f":[["SI",9,["SI-2","SI-2(2)","SI-2(4)","SI-2(6)"]],["CM",8,["CM-2","CM-2(3)","CM-3(2)","CM-5"]],["SA",7,["SA-4(5)","SA-8(8)","SA-8(23)","SA-8(24)"]],["CP",6,["CP-2","CP-2(3)","CP-4","CP-9"]],["MA",4,["MA-2(2)","MA-4(3)","MA-6","MA-6(1)"]],["SR",4,["SR-4","SR-5(2)","SR-9(1)","SR-11(2)"]],["IR",3,["IR-3","IR-3(2)","IR-4(10)"]],["SC",2,["SC-24","SC-28(1)"]],["IA",1,["IA-5(7)"]],["PL",1,["PL-9"]]],"q":[["REQ-383","Remove, clear and re-verify path for LRUs serviced off-platform"],["REQ-388","Maintenance support or spares obtained within 30 days of failure"],["REQ-389","Preventive maintenance performed at least every 12 months"],["REQ-612","No unencrypted static authenticator survives repository or update stag"],["REQ-556","Central management of flaw remediation and malicious code protection"],["REQ-303","Incident response test scheduled jointly with the contingency and reco"]]},"CN-109105":{"f":[["SA",4,["SA-3(3)","SA-8(16)","SA-8(21)","SA-22"]],["SR",4,["SR-3(1)","SR-5(1)","SR-6(1)","SR-8"]],["SI",3,["SI-4(16)","SI-7(1)","SI-21"]],["SC",2,["SC-45","SC-45(1)"]],["AU",1,["AU-12(1)"]],["CM",1,["CM-6(1)"]],["CP",1,["CP-2(8)"]],["IA",1,["IA-3(1)"]],["IR",1,["IR-4(13)"]],["MA",1,["MA-6(1)"]],["PE",1,["PE-14"]],["RA",1,["RA-3(1)"]]],"q":[["REQ-418","Second qualified source for navigation and timing critical items"],["REQ-422","Sustainment stock for long-lead navigation, timing and telemetry items"],["REQ-425","Independent testing of critical supplied elements before lot acceptanc"],["REQ-605","Navigation and timing sources authenticate before their data is truste"],["REQ-127","Dated refresh decision points for navigation and timing hardware"],["REQ-192","Vendor support end dates held for every inventory item with a 12-month"]]},"CN-109101":{"f":[["AC",16,["AC-2","AC-2(7)","AC-2(11)","AC-3"]],["SA",14,["SA-4(3)","SA-5","SA-8","SA-8(1)"]],["CM",13,["CM-2","CM-3","CM-4","CM-5"]],["SI",12,["SI-3","SI-4","SI-4(23)","SI-6"]],["SC",10,["SC-2","SC-3","SC-4","SC-7(12)"]],["AU",9,["AU-2","AU-3","AU-4","AU-6"]],["IA",6,["IA-2","IA-3","IA-3(1)","IA-5"]],["CA",5,["CA-2","CA-2(2)","CA-5","CA-7"]],["IR",4,["IR-4","IR-4(1)","IR-4(12)","IR-9(3)"]],["RA",3,["RA-2","RA-3","RA-5(5)"]],["CP",2,["CP-2(3)","CP-7"]],["PL",2,["PL-7","PL-8"]],["MP",1,["MP-7"]],["PE",1,["PE-3(1)"]]],"q":[["REQ-024","CM Monitoring Requirement 024"],["REQ-096","CA Monitoring Requirement 096"],["REQ-092","AU Monitoring Requirement 092"],["REQ-507","Specialised data-leakage and malicious-user assessments each cycle"],["REQ-190","Design specification shows control allocation and how mediation points"],["REQ-131","Supplier demonstration of the life cycle used for the shipped mission "]]},"CN-109104":{"f":[["SA",5,["SA-3(3)","SA-8(3)","SA-8(7)","SA-8(21)"]],["SC",5,["SC-16","SC-16(1)","SC-16(2)","SC-16(3)"]],["SI",4,["SI-7(1)","SI-7(9)","SI-10(5)","SI-21"]],["SR",4,["SR-2","SR-3(1)","SR-6","SR-10"]],["AU",2,["AU-6(4)","AU-12(1)"]],["CM",2,["CM-6(1)","CM-6(2)"]],["IA",2,["IA-3(1)","IA-9"]],["CP",1,["CP-2(8)"]],["IR",1,["IR-4(3)"]],["RA",1,["RA-9"]]],"q":[["REQ-605","Navigation and timing sources authenticate before their data is truste"],["REQ-350","Single central review surface for all reporting LRUs"],["REQ-225","Keyed integrity check over transmitted attribute blocks"],["REQ-226","Anti-spoofing binding for claimed navigation integrity results"],["REQ-227","Cryptographic binding of attributes to the message body"],["REQ-127","Dated refresh decision points for navigation and timing hardware"]]}};
  const SBOM = {"t":"Mission Computer maintenance image SBOM","on":"2026-10-08","parts":[["mission-computer-image","1.0.0","firmware",null,null],["busybox","1.36.1","application",null,null],["chrony","4.5","application",null,null],["dbus","1.14.10","application",null,null],["openssh-server","9.6p1","application","CVE-2024-6387","affected"],["systemd","255.4","application",null,null],["u-boot","2024.01","firmware",null,null],["glibc","2.39","library",null,null],["libpcap","1.10.4","library",null,null],["openssl","3.2.1","library",null,null],["sqlite","3.45.1","library",null,null],["zlib","1.3.1","library",null,null],["linux","6.6.21","operating-system",null,null]]};
  const MCCHG = {"kinds":["software"],"summary":"The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.","controls":["AC-17(2)","RA-5","SC-23","SI-2"]};
  const CREQ = [
    ["3.1.1", "Maintenance access", "compliant", "product", 3, "similarity", ["CA-PS-MX", "CA-SE-TS"], "The missile shall restrict maintenance functions to authenticated maintainers.", "Met by the product's maintenance port as assessed in version 1."],
    ["3.1.2", "Audit of maintenance sessions", "compliant", "product", 4, "similarity", ["CA-PS-MX", "CA-PS-TLM", "CA-SE-TS"], "The missile shall record each maintenance session and protect the record.", "Met by the product's maintenance port and telemetry unit as assessed in version 1."],
    ["3.2.1", "Datalink encryption", "partially_compliant", "variant_change", 2, "test", ["CA-CS-CRY", "CA-CS-DL"], "The datalink shall be encrypted with the customer's algorithm suite.", "The radio is the product's. The customer's algorithm suite in the cryptographic module is to be tested."],
    ["3.2.2", "Customer key management", "partially_compliant", "variant_change", 2, "demonstration", ["CA-CS-CRY", "CA-CS-KL"], "Keys shall be loaded and zeroized under the customer's key management plan.", "Key loading is the product's. Zeroization with the customer's suite is to be demonstrated."],
    ["3.2.3", "Mission data at rest", "non_compliant", "variant_change", 1, "test", ["CA-CS-CRY", "CA-GS-NAV", "CA-GS-OFP"], "Mission data held in the missile shall be protected at rest.", "Mission data is built into the flight program for this variant, and its protection at rest is not yet shown."],
    ["3.3.1", "Software integrity at load", "partially_compliant", "variant_change", 2, "test", ["CA-GS-OFP", "CA-GS-SKR", "CA-PS-BOOT"], "The missile shall verify the integrity of each software load before it runs.", "Secure boot is the product's. The customer's flight program load is to be tested against it."],
    ["3.3.2", "Signed software only", "compliant", "product", 1, "similarity", ["CA-PS-BOOT"], "The missile shall run only software signed by the approved authority.", "Met by the product's secure boot firmware as assessed in version 1."],
    ["3.3.3", "Least functionality", null, "variant_change", 1, null, ["CA-GS-OFP"], "The flight program shall include only the functions the mission needs.", null],
    ["3.4.1", "Tamper response", "compliant", "product", 1, "inspection", ["CA-GS-MC", "CA-GS-NAV", "CA-GS-SKR", "CA-LA-UMB"], "The missile shall detect and report physical tampering with its guidance section.", "Met by the product's mission computer and rail umbilical interface."],
    ["3.4.2", "Launcher interface isolation", "compliant", "variant_change", 3, "similarity", ["CA-LA-UMB", "CA-LEU-CTL", "CA-LEU-FW", "R210-STD-CUSA"], "The launcher interface shall pass only the data the launch sequence needs.", "Met by the product's rail umbilical interface unit as assessed in version 1."],
    ["3.5.1", "Waveform separation", null, "program", 2, null, ["CA-CS-CWM"], "The customer waveform shall be separated from the product's datalink.", null],
    ["3.5.2", "Waveform confidentiality", "non_compliant", "program", 1, "test", ["CA-CS-CWM"], "The customer waveform shall protect the confidentiality of what it carries.", "The waveform module is the program's own and has not been tested."],
    ["3.6.1", "Mission data loading", "not_applicable", "unallocated", 0, null, [], "Mission data shall be loaded only with the customer's loader.", "The product's mission data loader is not delivered in this variant, and the customer's loader is outside the system."],
    ["3.7.1", "Supply chain records", "compliant", "product", 2, "inspection", ["CA-LEU-PSU", "CA-PS-PWR", "X800-A-CUSA"], "The contractor shall keep supply chain records for each delivered unit.", "Met by the product's supply chain process."],
  ];

  // ——— Small pieces (the kit has the rest) ———
  const mu = (t) => `<span class="v7p-mu">${esc(t)}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const of = (a, b) => `<span class="num">${fmt(a)} of ${fmt(b)}</span>`;
  const clip = (t, w = 320) => `<span class="v7p-clip" style="max-width:${w}px" title="${esc(t)}">${esc(t)}</span>`;
  const ring = (t) => `<span class="who v7p-none">${gl("ring")}${esc(t)}</span>`;
  const go = (r) => `data-go="${esc(r)}" role="link" tabindex="0"`;
  const btn = (label, attrs = "", ink = false, sm = true) => `<button type="button" class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const link = (label, attrs) => `<span class="ak-link" role="link" tabindex="0" ${attrs}>${esc(label)}</span>`;
  const md = (iso) => AK.md(iso);
  const plural = (n, w, ws) => `${fmt(n)} ${n === 1 ? w : ws || w + "s"}`;
  const when = (iso) => { const d = new Date(iso); return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`; };
  const clock = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const toast = (t, l) => { if (D.ui && D.ui.toast) D.ui.toast(t, l); };
  const route = () => (location.hash || "#home").slice(1);
  const card = (head, body, cls = "") => `<div class="ak-card ${cls}">${head ? `<div class="v7p-cardh">${head}</div>` : ""}${body}</div>`;
  const li = (lead, text, end = "", attrs = "") => `<div class="v7p-li"${attrs ? " " + attrs : ""}>${lead}<span class="x">${text}</span>${end ? `<span class="e">${end}</span>` : ""}</div>`;
  const field = (label, control, help = "", req = false) => `<div class="ak-field"><label>${esc(label)}${req ? ' <span class="req">Required</span>' : ""}</label>${control}${help ? `<span class="s">${help}</span>` : ""}</div>`;
  const sel = (text) => `<div class="ak-select">${text}${AK.i("down")}</div>`;
  const input = (text, tall = false) => `<div class="ak-input${tall ? " tall" : ""} v7p-in">${text}</div>`;
  const foot = (primary, msg) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal data-v7p-toast="${esc(msg)}">${esc(primary)}</button>`;
  const wide = (body) => `<div class="v7p-pan v7p-wide">${body}</div>`;
  // A kit banner whose button does something.
  const remindBtn = (who) => AK.remind({}).replace('<span class="btn sm">', `<span class="btn sm" role="button" tabindex="0" data-v7p-toast="${esc("Reminder sent to " + who)}">`);
  const wire = (html, label, attrs) => html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${attrs}>${esc(label)}</span>`);
  const banner = (opt, attrs) => { const html = AK.banner(opt); return opt.action && attrs ? html.replace(`<span class="btn sm">${esc(opt.action)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${attrs}>${esc(opt.action)}</span>`) : html; };

  // The framed table every after screen uses: one line a cell, rows open a panel or a route.
  function tbl({ cols, rows, total, panel = "", pager = true, cls = "", label = "", nm = 0 }) {
    const body = rows.length ? rows.map((r) => {
      const pk = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` data-go="${esc(r.go)}" tabindex="0"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id || "")}" tabindex="0"` : "";
      return `<tr${r.sel ? ' class="sel"' : r.off ? ' class="v7p-off"' : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="v7p-empty"><td colspan="${cols.length}">${ring("Nothing matches this view.")}</td></tr>`;
    const t = total ?? rows.length;
    return `<div class="frame v7p-frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${rows.length ? `1–${fmt(rows.length)} of ${fmt(t)}` : `0 of ${fmt(t)}`}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }

  // ——— State: selections, quick views, in-page tabs, owners, the baseline what-if ———
  const SEL = { req: new Set(), host: new Set() };
  const QV = {}, TAB = {}, OWN = {}, WI = new Set();
  let LASTP = null;
  const mark = (kind, id) => { LASTP = { kind, id }; };
  const ownerOf = (key, dflt = null) => (Object.prototype.hasOwnProperty.call(OWN, key) ? OWN[key] : dflt);
  const ownerEdit = (key, dflt = null) => `<span class="v7p-own" role="button" tabindex="0" data-modal="v7p-owner" data-id="${esc(key)}" title="Change owner">${AK.owner(ownerOf(key, dflt))}${AK.i("pen")}</span>`;
  const cb = (key, id, label) => { const on = SEL[key].has(id); return `<span class="v7p-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-v7p-sel="${esc(key)}" data-v7p-id="${esc(id)}">${AK.check(on)}</span>`; };
  const cbAll = (key, ids, label) => { const s = SEL[key]; const all = ids.length > 0 && ids.every((i) => s.has(i)); const some = ids.some((i) => s.has(i)); return `<span class="v7p-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : some ? "mixed" : "false"}" aria-label="${esc(label)}" data-v7p-sel="${esc(key)}" data-v7p-id="*" data-v7p-all="${esc(ids.join("|"))}">${AK.check(all)}</span>`; };
  const views = (key, list) => { const on = QV[key] || list[0][0]; return `<div class="views v7p-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-v7p-qv="${esc(key)}" data-v7p-v="${esc(v)}">${esc(l)}${n !== undefined ? ` <span class="num">${fmt(n)}</span>` : ""}</button>`).join("")}</div>`; };
  const ptabs = (key, list, label) => AK.tabs(list.map(([k, l, n]) => [l, n, `@v7p:${key}:${k}`, (TAB[key] || list[0][0]) === k]), label).replace(/data-go="@v7p:([^:"]+):([^"]+)"/g, (m, k2, k) => `data-v7p-tab="${k2}|${k}"`);
  const panelTabs = (kind, base, list, cur) => AK.tabs(list.map(([k, l, n]) => [l, n, `@pp:${k}`, k === cur]), "Record sections").replace(/data-go="@pp:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`);
  function bulk(key, actions) {
    let html = AK.bulk({ count: SEL[key].size, actions: actions.map((a) => a[0]) });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-v7p-desel="${esc(key)}">Deselect</span>`);
    for (const [label, attrs] of actions) if (attrs) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${attrs}>${esc(label)}</span>`);
    return html;
  }
  const filters = (search, list) => `<div class="tools v7p-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span></div>`;
  const toolbar = (search, key, actions, list) => (SEL[key].size ? `<div class="tools v7p-tools"><span class="in">${esc(search)}</span>${bulk(key, actions)}</div>` : filters(search, list));

  function redraw(focus) {
    const r = route(); if (!S[r]) return;
    const main = document.getElementById("main"), top = main.scrollTop;
    main.innerHTML = S[r]();
    main.scrollTop = top;
    if (focus) { const el = main.querySelector(focus); if (el) el.focus(); }
  }
  function refreshPanel() {
    const pb = document.querySelector("#panel:not([hidden]) .pbody");
    if (pb && LASTP && P[LASTP.kind]) pb.innerHTML = P[LASTP.kind](LASTP.id).body;
  }
  const closeModal = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  const q = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v);

  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-v7p-sel],[data-v7p-desel],[data-v7p-qv],[data-v7p-tab],[data-v7p-own],[data-v7p-wi],[data-v7p-wireset],[data-v7p-toast]");
    if (!t) return;
    if (t.dataset.v7pToast !== undefined && !t.matches("[data-v7p-own],[data-v7p-wireset]")) { toast(t.dataset.v7pToast); return; }
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.v7pSel) {
      const key = t.dataset.v7pSel, id = t.dataset.v7pId, s = SEL[key];
      if (id === "*") { const ids = (t.dataset.v7pAll || "").split("|").filter(Boolean); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      redraw(`[data-v7p-sel="${key}"][data-v7p-id="${q(id)}"]`);
    } else if (t.dataset.v7pDesel) { SEL[t.dataset.v7pDesel].clear(); redraw(); }
    else if (t.dataset.v7pQv) { QV[t.dataset.v7pQv] = t.dataset.v7pV; redraw(`[data-v7p-qv="${t.dataset.v7pQv}"][data-v7p-v="${q(t.dataset.v7pV)}"]`); }
    else if (t.dataset.v7pTab) { const [k, v] = t.dataset.v7pTab.split("|"); TAB[k] = v; redraw(`[data-v7p-tab="${q(t.dataset.v7pTab)}"]`); }
    else if (t.dataset.v7pWi) { const k = t.dataset.v7pWi; if (WI.has(k)) WI.delete(k); else WI.add(k); redraw(`[data-v7p-wi="${k}"]`); refreshPanel(); }
    else if (t.dataset.v7pWireset !== undefined) { WI.clear(); redraw(); refreshPanel(); }
    else if (t.dataset.v7pOwn !== undefined) {
      const key = t.dataset.v7pOwn, who = t.dataset.v7pWho || null;
      if (key.endsWith(":*")) {
        const k = key.split(":")[0], n = SEL[k].size;
        for (const id of SEL[k]) OWN[`${k}:${id}`] = who;
        SEL[k].clear();
        toast(who ? `${plural(n, "requirement")} now owned by ${who}` : `Owner removed from ${plural(n, "requirement")}`);
      } else { OWN[key] = who; toast(who ? `Owner set to ${who}` : "Owner removed"); }
      closeModal(); redraw(); refreshPanel();
    }
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (!t || !t.matches || t.matches("button, a, input, textarea")) return;
    if (t.matches("[data-v7p-sel],[data-v7p-desel],[data-v7p-tab],[data-v7p-own],[data-v7p-wireset],.v7p-pan [data-go],.v7p-pan [data-panel],.v7p-pan [data-modal]")) { e.preventDefault(); e.stopPropagation(); t.click(); }
  }, true);
  window.addEventListener("hashchange", () => { LASTP = null; });

  // Owner: the kit's picker, each row choosing.
  const PEOPLE = [[ME, "Security engineer"], ["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"], ["Marcus Ryde", "Component owner"], ["Nadia Fournier", "Assessor"]];
  M["v7p-owner"] = (key) => {
    const many = String(key).endsWith(":*"), n = many ? SEL[key.split(":")[0]].size : 1;
    const pick = AK.ownerPicker({ you: ME, people: PEOPLE })
      .replace(/<div class="ak-pop-r">([\s\S]*?)<span>([^<]*)<\/span>/g, (m, av, nm) => `<div class="ak-pop-r" role="option" tabindex="0" data-v7p-own="${esc(key)}" data-v7p-who="${nm.replace(" (You)", "")}">${av}<span>${nm}</span>`)
      .replace('<div class="ak-pop-f">', `<div class="ak-pop-f" role="button" tabindex="0" data-v7p-own="${esc(key)}" data-v7p-who="">`);
    const what = key.startsWith("req") ? "A requirement takes its owner on its details, at their next revision, and the change is recorded in its history." : "Owner is a new field: WS-X90 records none yet, so everything starts Unassigned.";
    return { title: many ? `Assign an owner to ${plural(n, "requirement")}` : "Assign owner", body: `<p class="ak-desc">${esc(what)}</p><div class="v7p-pick">${pick}</div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button>` };
  };

  // ——— Control status vocabulary ———
  const STATUS = [["satisfied", "Satisfied", "var(--ok)", "ok"], ["partially_satisfied", "Partially satisfied", "var(--warn)", "part"], ["other_than_satisfied", "Other than satisfied", "var(--bad)", "bad"], ["not_assessed", "Not assessed", "var(--info)", "info"], ["no_evidence", "No evidence", "var(--ink-4)", "none"], ["no_requirement", "No requirement", "var(--line-strong)", "none"]];
  const stPill = (s) => { const x = STATUS.find((r) => r[0] === s) || STATUS[4]; return pill(x[3], x[1]); };
  const CS = D.counts.controlStatus, TOTAL = D.controls.length;
  const strip = (c, label) => `<div class="stack v7p-stack" role="img" aria-label="${esc(label || STATUS.map(([k, l]) => `${l} ${c[k] || 0}`).join(", "))}">${STATUS.map(([k, l, col]) => (c[k] ? `<i style="flex:${c[k]};background:${col}" title="${esc(l)}: ${c[k]}"></i>` : "")).join("")}</div>`;
  const legend = (c, target = "controls") => `<div class="legend v7p-legend">${STATUS.map(([k, l, col]) => `<span style="--c:${col}" ${go(target)}>${esc(l)} <b class="num">${fmt(c[k] || 0)}</b></span>`).join("")}</div>`;
  const ROLE = Object.fromEntries(D.roles.map(([k, , n]) => [k, n]));

  // ════════════════ Overview: WS-X90's home ════════════════
  S.overview = () => {
    const sat = CS.satisfied, mapped = TOTAL - CS.no_requirement, ev = mapped - CS.no_evidence, as = CS.satisfied + CS.partially_satisfied + CS.other_than_satisfied;
    const mini = (l, n) => `<div class="mini"><span>${esc(l)}</span><b class="num">${fmt(n)}</b>${h.bar(pct(n, TOTAL), "var(--ok)")}</div>`;
    const completion = card(`<b>Controls satisfied</b><span class="v7p-mu num">${fmt(TOTAL)} in the baseline</span>`,
      `<div class="v7p-comp"><div class="v7p-comp-l"><div class="v7p-bigrow"><span class="v7p-big num">${pct(sat, TOTAL)}%</span><span class="v7p-mu num">${fmt(sat)} of ${fmt(TOTAL)} controls · counted today</span></div>${strip(CS)}${legend(CS)}</div>
      <div class="minis v7p-minis">${mini("Mapped", mapped)}${mini("With evidence", ev)}${mini("Assessed", as)}</div></div>`);
    const WORK = [
      ["diamond", "Operational issues", 44, "17 past due · 2 critical", "findings"],
      ["clock", "Open risks", 40, "12 critical or high · 40 with no owner", "risks"],
      ["clock", "POA&M items open", 34, "of 41 · 7 completed · 33 in progress", "poam"],
      ["ring", "Evidence to revise", 54, "226 of 368 accepted · 88 waiting on review", "evidence"],
      ["ring", "Your tasks", 6, "assigned to you", "my-work"],
    ];
    const work = AK.section("Open work", `<div class="ak-card v7p-lines">${WORK.map(([g, l, n, s, r]) => `<div class="v7p-line" ${go(r)}>${gl(g)}<span class="x"><b>${esc(l)}</b><span class="v7p-mu">${esc(s)}</span></span><b class="num">${fmt(n)}</b>${AK.i("back", "v7p-chev")}</div>`).join("")}</div>`);
    const lanes = AK.section("Assessments", `<div class="ak-card v7p-lanes"><p class="v7p-p">Now until Nov 20: the Expanded Control Set Assessment, ${AK.days("2026-11-20")} days left.</p>${data.CAMPAIGNS.map(([t, s, , a, b]) => h.lane(t, s, a, b)).join("")}</div>`, { count: data.CAMPAIGNS.length, action: link("View all", 'data-go="assessments"') });
    const cur = D.versions.find((v) => v.kind === "current") || D.versions[0];
    const r2 = D.revisions.find((r) => r.v === 2), r3 = D.revisions.find((r) => r.v === 3);
    const high = D.checks.filter((c) => c.sev === "high").length;
    const ssp = card(`<b>System security plan</b>${AK.chip(`Revision ${D.doc.revision} · ${D.doc.state}`, { tone: "warn" })}`,
      `<dl class="ak-kv"><dt>Placeholders</dt><dd><b class="num">${D.counts.placeholders}</b> narratives read as template text</dd><dt>Checks</dt><dd class="num">${D.checks.length} open · ${high} high</dd><dt>Last edit</dt><dd class="num">${clock(cur.at)} by ${esc(cur.who[0])}</dd><dt>Started</dt><dd class="num">${md(r3.started)} from revision 2</dd><dt>Published</dt><dd class="num">Revision 2 · ${md(r2.published)} · frozen</dd></dl>
      <div class="btns">${btn("Open the SSP", 'data-go="ssp"')}${btn("Version history", 'data-go="ssp-history"')}</div>`, "v7p-ssp");
    const setup = card(`<b>Set up WS-X90</b>${EX}`, `${AK.progress(2, 10, "steps done")}<p class="v7p-p">Next: give records owners. None of WS-X90's 640 requirements or 560 controls has one yet.</p><div class="btns">${btn("Continue setup", 'data-go="getting-started"')}</div>`, "v7p-setup");
    const team = `<div class="ak-rail-s"><div class="v7p-cardh"><span class="ak-rail-t">Team</span>${link("People", 'data-go="people"')}</div><dl class="ak-kv">${D.roles.map(([, l, n]) => `<dt>${esc(l)}</dt><dd>${AK.owner(n)}</dd>`).join("")}<dt>Security engineer</dt><dd>${AK.owner(ME + " (You)")}</dd></dl></div>`;
    const details = AK.railCard("Details", [["Program", AK.codes([D.program.code])], ["System", AK.codes([D.system.code])], ["Type", esc(D.system.type)], ["Categorization", `C ${esc(D.system.cia[0])} · I ${esc(D.system.cia[1])} · A ${esc(D.system.cia[2])}`], ["Catalog", esc(D.system.catalog)], ["Baseline", `<span ${go("baseline")} class="v7p-factlink">${esc(D.system.baseline)}</span>`]]);
    const comment = D.comments.find((c) => c.id === "c7");
    const acts = [
      { who: ROLE.authorizing_official, what: "signed <b>ATO with conditions</b> on package version 1", when: "Sep 18" },
      { who: null, what: `published Mission Computer version 2, which fixes CVE-2024-6387`, when: "Nov 12" },
      { who: null, what: "recorded 225 determinations in the expanded control set's published results", when: "Nov 12" },
      { who: "Priya Raghavan", what: `started SSP revision 3 from revision 2 <span ${go("ssp-history")} class="v7p-factlink">History</span>`, when: "Nov 13" },
      comment ? { who: comment.thread[0][0], what: `commented on SSP section 2: “${esc(comment.thread[0][3])}” ${EX}`, when: clock(comment.thread[0][2]) } : null,
      { who: cur.who[0], what: `edited ${esc(cur.changes[0][0])}'s narrative in SSP revision 3 ${EX}`, when: clock(cur.at) },
    ].filter(Boolean);
    const activity = `<div class="ak-rail-s"><div class="ak-rail-t">Recent activity</div>${AK.activity(acts)}</div>`;
    return h.page(
      AK.recordHead({
        crumbs: [["Portfolio", "portfolio"], [D.program.code]],
        title: D.program.name,
        chip: `${AK.chip("ATO with conditions", { tone: "ok", icon: "check" })}${AK.chip("Lifecycle: " + D.system.lifecycle)}`,
        desc: esc(D.system.description),
        facts: [["Authorizing official", AK.owner(ROLE.authorizing_official)], ["ISSM", AK.owner(ROLE.security_manager)], ["Baseline", `<span ${go("baseline")} class="v7p-factlink num">${fmt(TOTAL)} controls</span>`], ["Program", AK.codes([D.program.code])], ["Next date", `<span class="v7p-next">${AK.due("2026-11-20", { prefix: false })}<span class="v7p-mu">Expanded assessment ends</span></span>`]],
        actions: `${btn(AK.i("dots"), 'aria-label="More program actions" title="More program actions"', false, false)}${btn("Open package", 'data-go="authorization"', true, false)}`,
      }),
      AK.withRail(`${completion}${work}${lanes}<div class="grid2 v7p-pair">${ssp}${setup}</div>`, `${team}${details}${activity}`),
      AK.note("The setup checklist, and the SSP edit and comment in the activity, are examples from the SSP editor's session. Every count is WS-X90's."),
    );
  };

  // ════════════════ Composition: the system tree ════════════════
  const ELS = EL.map(([code, name, type, parent, depth, ctl, req, inh, o, e, i, r, is, rs]) => ({ code, name, type, parent, depth, ctl, req, inh, o, e, i, r, is, rs }));
  const EBY = Object.fromEntries(ELS.map((x) => [x.code, x]));
  const kids = (c) => ELS.filter((x) => x.parent === c);
  const SUBS = kids("CN-109000"), LEAVES = ELS.filter((x) => x.depth === 3);
  const KIND = { platform: "Boundary", other: "System", subsystem: "Subsystem", hardware: "Hardware", software: "Software", firmware: "Firmware", application: "Application" };
  const SEV = { 4: "critical", 3: "high", 2: "moderate", 1: "low" };
  const ASSET = Object.fromEntries(ASSETS.map((a) => [a[2], a]));
  const under = (c) => { const out = new Set([c]); let grew = true; while (grew) { grew = false; for (const x of ELS) if (out.has(x.parent) && !out.has(x.code)) { out.add(x.code); grew = true; } } return out; };
  const assetsIn = (c) => { const u = under(c); return ASSETS.filter((a) => u.has(a[2])).length; };
  const libOf = (code) => { const c = COMP[code]; return c && c[1] ? { name: c[1], v: c[2], set: c[3] } : null; };
  const behind = (code) => (code === "CN-109101" ? 1 : 0);
  const pins = (code) => (COMP[code] ? COMP[code][4] : null);
  const changed = (code) => { const p = pins(code); return !!(p && p[1] && p[0][0] !== p[1][0]); };
  const nextPin = (a, b) => (a.split(" ")[0] === b.split(" ")[0] ? b.split(" ").slice(1).join(" ") : b);
  const fwKind = (v) => (/-FW /.test(v) ? "Firmware" : /-OS /.test(v) ? "Operating system" : /image/.test(v) ? "Image" : "Software");
  const CHANGED = Object.keys(COMP).filter(changed);
  const CONFIGS = [["WS-X90 Block 1 production configuration", 1, "published", "2026-07-20", 20], ["WS-X90 Block 1.1 configuration (proposed)", 2, "draft", null, 20]];
  const sevPill = (n) => (n ? h.sevPill(SEV[n]) : "");

  const compHead = (cur) => [
    AK.indexHead({ title: "Composition", desc: `SYS-WSX90 authorization boundary · ${SUBS.length} subsystems and ${LEAVES.length} components · ${esc(CONFIGS[0][0])}`, actions: `${btn("Export", 'data-v7p-toast="Composition exported (.csv)"', false, false)}${btn("Create element", 'data-modal="v7p-el-new"', true, false)}` }),
    banner({ tone: "warn", text: "<b>Mission Computer</b> (LRU-001) runs version 1 of its library component. Version 2 is published and fixes CVE-2024-6387.", action: "Review version 2" }, 'data-modal="v7p-take" data-id="CN-109101"'),
    AK.tabs([["Tree", null, "composition", cur === "tree"], ["List", ELS.length - 1, "composition-list", cur === "list"], ["Configurations", CONFIGS.length, "composition-config", cur === "config"]], "Composition"),
  ].join("");
  const elRow = (x) => {
    const c = COMP[x.code], lib = libOf(x.code), p = pins(x.code);
    const mark2 = behind(x.code) ? pill("warn", "1 behind") : changed(x.code) ? `<span class="v7p-chg" title="Block 1.1 proposes ${esc(p[1][0])}">→ ${esc((p[1][0].match(/\d+(?:\.\d+)+(?:\(\d+\))?/) || [nextPin(p[0][0], p[1][0])])[0])}</span>` : "<span></span>";
    return `<div class="v7p-elrow" role="button" tabindex="0" data-panel="v7p-el" data-id="${x.code}" aria-label="${esc(`${c ? c[0] : x.code} ${x.name}`)}"><span class="ak-code">${esc(c ? c[0] : x.code)}</span><span class="v7p-eln"><b>${esc(x.name)}</b>${lib ? `<span class="v7p-mu">Library · v${lib.v}</span>` : ""}</span>${mark2}<span class="num v7p-mu" title="Controls placed here">${fmt(x.ctl)}</span>${AK.avatar(ownerOf("el:" + x.code), 20)}</div>`;
  };
  S.composition = () => {
    const top = EBY["CN-109000"];
    return h.page(
      compHead("tree"),
      `<div class="ak-card v7p-root"><div class="v7p-root-l"><span class="v7p-mu">SYS-WSX90 · authorization boundary</span><b role="button" tabindex="0" data-panel="v7p-el" data-id="CN-109000">CN-109000 ${esc(top.name)}</b><span class="v7p-mu num">${fmt(top.ctl)} controls placed · ${fmt(top.req)} requirement allocations · ${ASSETS.length} assets</span></div><span class="ak-link" ${go("ssp")}>${AK.i("link")} Shown in SSP section 5</span></div>`,
      `<div class="v7p-subs">${SUBS.map((s) => `<div class="ak-card v7p-sub"><div class="v7p-subh" role="button" tabindex="0" data-panel="v7p-el" data-id="${s.code}"><span class="v7p-subt"><b>${esc(s.name)}</b><span class="v7p-mu">${s.code}</span></span><span class="v7p-mu num">${kids(s.code).length} components · ${fmt(s.ctl)} controls</span></div><div class="v7p-elrows">${kids(s.code).map(elRow).join("")}</div></div>`).join("")}</div>`,
      `<p class="v7p-p v7p-mu">A count is the controls the requirements' mappings place on the element and the elements inside it. An arrow is the firmware Block 1.1 proposes.</p>`,
      AK.note("Owner is a proposed field: WS-X90 records no element owner, so every element reads Unassigned until someone is picked."),
    );
  };
  S["composition-list"] = () => h.page(
    compHead("list"),
    filters("Search elements", ["Kind", "Subsystem", "Built from", "Owner"]),
    tbl({
      cols: ["Element", "Kind", "LRU", "Owner", "Built from", "Controls", "Requirements", "Assets"],
      rows: ELS.filter((x) => x.depth > 0).map((x) => { const c = COMP[x.code], lib = libOf(x.code); return { id: x.code, cells: [`<span class="v7p-ind" style="--d:${x.depth - 1}"><b>${x.code}</b> ${clip(x.name, 230)}</span>`, tag(KIND[x.type] || x.type), c ? `<span class="ak-code">${esc(c[0])}</span>` : "", ownerEdit("el:" + x.code), lib ? `${esc(lib.name)} · v${lib.v} ${behind(x.code) ? pill("warn", "1 behind") : ""}` : x.depth === 3 ? mu("No library component") : "", num(x.ctl), num(x.req), num(assetsIn(x.code))] }; }),
      total: ELS.length - 1, panel: "v7p-el", label: "Elements",
    }),
    AK.note("Owner is a proposed field: WS-X90 records no element owner yet."),
  );
  S["composition-config"] = () => h.page(
    compHead("config"),
    `<div class="grid2 v7p-pair">${card(`<b>${esc(CONFIGS[0][0])}</b>${pill("ok", "Published")}`, `<dl class="ak-kv v7p-kvw"><dt>Published</dt><dd class="num">${md(CONFIGS[0][3])}, 2026</dd><dt>Component pins</dt><dd class="num">${CONFIGS[0][4]}</dd><dt>Assessed</dt><dd>For the initial authorization</dd><dt>In the SSP</dt><dd>Revision 2, published Jul 25</dd></dl>`)}
      ${card(`<b>${esc(CONFIGS[1][0])}</b>${pill("warn", "Draft")}`, `<dl class="ak-kv v7p-kvw"><dt>Published</dt><dd>${mu("Not yet")}</dd><dt>Component pins</dt><dd class="num">${CONFIGS[1][4]}</dd><dt>Changes</dt><dd class="num">${CHANGED.length} pins against Block 1</dd><dt>In the SSP</dt><dd>Revision 3, the draft</dd></dl><div class="v7p-inl">${mu("Not submitted for approval")}${btn("Submit for approval", 'data-modal="ak-approvers" data-id="the Block 1.1 configuration"')}</div>`)}</div>`,
    AK.section("What Block 1.1 changes", tbl({
      cols: ["Component", "Block 1", "Block 1.1 proposed", "Change", "Why"],
      rows: Object.entries(COMP).map(([el, c]) => ({ id: el, cells: [`<span class="ak-code">${esc(c[0])}</span> ${clip(EBY[el].name, 190)}`, `<span class="num">${esc(c[4][0][0])}</span>`, `<span class="num">${esc((c[4][1] || c[4][0])[0])}</span>`, changed(el) ? pill("warn", "Changed") : pill("none", "Unchanged"), changed(el) ? clip(c[4][1][1], 240) : ""] })),
      total: Object.keys(COMP).length, panel: "v7p-el", label: "Component pins",
    }), { count: `${CHANGED.length} of ${Object.keys(COMP).length}` }),
    AK.note("Submitting Block 1.1 for approval is proposed: WS-X90 records the draft, not an approval workflow for it."),
  );
  P["v7p-el"] = (code) => {
    mark("v7p-el", code);
    const x = EBY[code] || EBY["CN-109000"], c = COMP[x.code], lib = libOf(x.code), p = pins(x.code), a = ASSET[x.code], sum = ELSUM[x.code], kid = kids(x.code), parent = EBY[x.parent];
    const head = AK.recordHead({ title: x.name, chip: AK.chip(KIND[x.type] || x.type), actions: btn("Edit element", 'data-v7p-toast="Edit element opens the element form (prototype)"') });
    const facts = AK.facts([["Owner", ownerEdit("el:" + x.code)], ["Code", AK.codes([x.code])], ...(c ? [["LRU", AK.codes([c[0]])]] : []), ["Inside", parent ? esc(parent.code === "SYS-WSX90" ? "Authorization boundary" : parent.name) : "—"]]);
    const parts = [];
    if (x.depth === 3) parts.push(AK.section("Built from", lib
      ? `${li(AK.i("link"), `<b>${esc(lib.name)}</b> · ${esc(lib.set)} · version ${lib.v}`, behind(x.code) ? pill("warn", "1 version behind") : pill("ok", "Current"))}${behind(x.code) ? `<div class="next">${gl("clock")}<span>Version 2 was published Nov 12 and fixes CVE-2024-6387.</span><span class="sp">${btn("Review version 2", 'data-modal="v7p-take" data-id="CN-109101"')}</span></div>` : ""}${link("Open the component", `data-go="${x.code === "CN-109101" ? "component-mc" : "components"}"`)}`
      : ring("Not built from a library component")));
    if (p) parts.push(AK.section("Software and firmware", `${li(tag(fwKind(p[0][0])), `<b class="num">${esc(p[0][0])}</b>`, pill("ok", "Block 1"))}${changed(x.code) ? li(tag(fwKind(p[1][0])), `<b class="num">${esc(p[1][0])}</b> <span class="v7p-mu">${esc(p[1][1])}</span>`, pill("warn", "Block 1.1 proposed")) : ""}${x.code === "CN-109101" ? li(tag("SBOM"), `${esc(SBOM.t)} · <span class="num">${SBOM.parts.length} parts</span>`, pill("bad", "CVE-2024-6387"), `data-go="component-mc-sbom" role="link" tabindex="0"`) : ""}`));
    if (sum) {
      const codes = []; sum.f.forEach(([, , l]) => l.forEach((k) => { if (codes.length < 12) codes.push(k); }));
      parts.push(AK.section("Controls it carries", `<div class="v7p-fchips">${sum.f.map(([f, n]) => `<span class="v7p-fchip"><b>${f}</b><span class="num">${n}</span></span>`).join("")}</div><div class="v7p-codes">${AK.codes(codes)}${x.ctl > codes.length ? mu(`and ${x.ctl - codes.length} more`) : ""}</div>`, { count: fmt(x.ctl), action: link("Open in Controls", 'data-go="controls"') }));
      parts.push(AK.section("Requirements", `${sum.q.map(([k, t]) => li(`<span class="ak-code">${esc(k)}</span>`, clip(t, 330))).join("")}${x.req > sum.q.length ? `<span class="v7p-mu num">and ${fmt(x.req - sum.q.length)} more allocated here${x.depth < 3 ? " and inside" : ""}</span>` : ""}`, { count: fmt(x.req), action: link("Open in Requirements", 'data-go="requirements"') }));
    }
    parts.push(AK.section("Posture here", `<dl class="ak-kv"><dt>Objectives mapped</dt><dd class="num">${fmt(x.o)}</dd><dt>With evidence</dt><dd class="num">${fmt(x.e)}</dd><dt>Open issues</dt><dd>${x.i ? `<span class="num">${x.i}</span> · worst ${sevPill(x.is)}` : ring("None")}</dd><dt>Open risks</dt><dd>${x.r ? `<span class="num">${x.r}</span> · worst ${sevPill(x.rs)}` : ring("None")}</dd>${a ? `<dt>Asset</dt><dd>${AK.codes([a[0]])} <span class="v7p-mu num">recorded ${md(a[3])}</span></dd>` : ""}</dl>`));
    if (kid.length) parts.push(AK.section("Contains", kid.map((k) => li(`<span class="ak-code">${esc(COMP[k.code] ? COMP[k.code][0] : k.code)}</span>`, esc(k.name), `<span class="num v7p-mu">${fmt(k.ctl)} controls</span>`, `data-panel="v7p-el" data-id="${k.code}" role="button" tabindex="0"`)).join(""), { count: kid.length }));
    return { label: "Element preview", body: wide(`${head}${facts}${parts.join("")}`) };
  };
  M["v7p-take"] = () => ({ title: "Take version 2 of Mission Computer", body: `<p class="ak-desc">LRU-001 on CN-109101 takes the X800 Missile component set's Mission Computer at version 1. Version 2 was published on Nov 12.</p>
    ${card("<b>What version 2 changes</b>", `<p class="v7p-p">${esc(MCCHG.summary)}</p>`)}
    <dl class="ak-kv v7p-kvw"><dt>Determinations</dt><dd class="num">54 taken · 52 carried forward · 2 to review</dd><dt>To review</dt><dd>${AK.codes(["AC-17(2)", "SC-23"])}</dd><dt>Also affected</dt><dd>${AK.codes(MCCHG.controls.filter((k) => !["AC-17(2)", "SC-23"].includes(k)))} <span class="v7p-mu">the program's own</span></dd><dt>Vulnerabilities</dt><dd>${pill("ok", "CVE-2024-6387 fixed")}</dd><dt>Consumers behind</dt><dd class="num">4 across 3 programs and 1 product</dd></dl>`,
    footer: foot("Take version 2", "Mission Computer version 2 taken on CN-109101 (prototype: nothing is saved)") });
  M["v7p-el-new"] = () => ({ title: "Create element", body: `${field("Name", input("Name the element"), "", true)}${field("Kind", sel("Hardware"))}${field("Inside", sel("CN-109001 Mission Computing Subsystem"))}${field("LRU", input("LRU-021"), "The line-replaceable unit it ships as, if it is one.")}`, footer: foot("Create element", "Element created under CN-109001 (prototype: nothing is saved)") });

  // ════════════════ Inventory: Discovered by scans ════════════════
  const HOSTS = [
    ["ws-x90-mlap-02", "10.20.4.17", "ACAS", "2026-11-14", "AST-109019", "3 CAT II · 1 CAT III"],
    ["prov-ws-01", "10.20.4.21", "ACAS", "2026-11-14", "AST-109017", "1 CAT I · 4 CAT II"],
    ["cfg-repo-01", "10.20.5.8", "ACAS", "2026-11-14", "AST-109020", "2 CAT II"],
    ["Unnamed host", "10.20.4.99", "ACAS", "2026-11-14", null, "1 CAT II"],
    ["flt-test-set-7", "10.20.6.40", "STIG .cklb", "2026-11-10", null, "2 CAT I"],
  ];
  const catPills = (f) => f.split(" · ").map((x) => pill(/CAT I$/.test(x) ? "bad" : /CAT II$/.test(x) ? "warn" : "none", x)).join(" ");
  const assetName = (id) => (ASSETS.find((a) => a[0] === id) || [id, id])[1];
  const OUT_REASON = "Mark not in boundary|The host leaves the import list. The reason shows under Scope changes, with your name and the date.";
  S["inventory-scans"] = () => {
    const F = { all: () => true, sug: (x) => !!x[4], none: (x) => !x[4], cat1: (x) => /CAT I(?!I)/.test(x[5]) };
    const list = HOSTS.map((x, i) => [i, x]).filter(([, x]) => (F[QV.hosts || "all"] || F.all)(x));
    const ids = list.map(([i]) => String(i));
    return h.page(
      AK.indexHead({ title: "Inventory", desc: "SYS-WSX90 authorization boundary · WS-X90 Block 1 production configuration", actions: `${btn("Import scan", 'data-modal="v7p-import-scan"', false, false)}${btn("Add asset", 'data-v7p-toast="Add asset opens the asset form (prototype)"', true, false)}` }),
      AK.tabs([["Assets", ASSETS.length, "inventory"], ["Discovered by scans", HOSTS.length, "inventory-scans", true], ["Scope changes", 16, "inventory-changes"]], "Inventory"),
      AK.banner({ tone: "info", text: "<b>No scan has been imported for SYS-WSX90.</b> These five hosts show what an ACAS repository or STIG checklist import lists: each to link to an asset or mark outside the boundary." }),
      views("hosts", [["all", "All", HOSTS.length], ["sug", "Suggested match", HOSTS.filter(F.sug).length], ["none", "No match", HOSTS.filter(F.none).length], ["cat1", "Open CAT I", HOSTS.filter(F.cat1).length]]),
      toolbar("Search hosts", "host", [["Link to asset", 'data-modal="v7p-link" data-id="*"'], ["Mark not in boundary", `data-modal="ak-reason" data-id="${esc(OUT_REASON)}"`]], ["Seen by", "Suggested asset", "CAT"]),
      tbl({
        cols: [cbAll("host", ids, "Select all hosts"), `Host ${EX}`, "Address", "Seen by", "Suggested asset", "Open findings", ""],
        rows: list.map(([i, [n, ip, by, seen, sug, f]]) => ({ id: String(i), sel: SEL.host.has(String(i)), cells: [cb("host", String(i), `Select ${n}`), esc(n), `<span class="num">${esc(ip)}</span>`, `${tag(by)} <span class="v7p-mu num">${md(seen)}</span>`, sug ? `<span class="ak-code">${esc(sug)}</span> ${clip(assetName(sug), 170)}` : ring("No match"), catPills(f), btn("Link", `data-modal="v7p-link" data-id="${i}"`)] })),
        total: HOSTS.length, panel: "v7p-host", nm: 1, label: "Hosts discovered by scans",
      }),
      AK.note("Every host here is invented, as is the import: WS-X90 has no scan results yet. The 20 assets and 16 scope changes on the other tabs are WS-X90's."),
    );
  };
  P["v7p-host"] = (i) => {
    mark("v7p-host", i);
    const [n, ip, by, seen, sug, f] = HOSTS[+i] || HOSTS[0];
    return { label: "Host preview", body: wide(`${AK.recordHead({ title: n, chip: EX, actions: btn("Link to asset", `data-modal="v7p-link" data-id="${i}"`, true) })}
      ${AK.facts([["Address", `<span class="num">${esc(ip)}</span>`], ["Seen by", tag(by)], ["Last seen", `<span class="num">${md(seen)}</span>`], ["Suggested asset", sug ? AK.codes([sug]) : ring("No match")]])}
      ${AK.section("Open findings", `<div class="v7p-pills">${catPills(f)}</div><p class="v7p-p">They join the asset's findings once the host is linked, and later scans match the host by its name.</p>`)}
      ${AK.section("Match", sug ? li(gl("info"), `<b>${esc(sug)}</b> ${esc(assetName(sug))}`, mu("By host name and address")) : li(gl("ring"), "The host is on no asset of the boundary.", ""))}
      ${AK.section("Not in the boundary?", `<p class="v7p-p">A contractor's test set or a visiting laptop leaves the list with a reason.</p><div class="btns">${btn("Mark not in boundary", `data-modal="ak-reason" data-id="${esc(OUT_REASON)}"`)}</div>`)}`) };
  };
  M["v7p-link"] = (i) => {
    const many = i === "*", x = many ? null : HOSTS[+i] || HOSTS[0];
    return { title: many ? `Link ${plural(SEL.host.size, "host")} to assets` : "Link host to an asset", body: `<p class="ak-desc">${many ? "Each host takes its suggested asset; a host with no match keeps its place in the list." : `${esc(x[0])} · ${esc(x[1])}`} ${EX}</p>
      ${many ? "" : field("Asset", sel(x[4] ? `${esc(x[4])} ${esc(assetName(x[4]))}` : "Choose an asset"), x[4] ? "Suggested from the host name." : "")}${field("Match later scans by", sel("Host name and address"))}`, footer: foot(many ? "Link hosts" : "Link host", many ? "Hosts linked to their suggested assets (prototype: nothing is saved)" : "Host linked (prototype: nothing is saved)") };
  };
  M["v7p-import-scan"] = () => ({ title: "Import scan", body: `<p class="ak-desc">Hosts and findings from an ACAS repository export or a STIG checklist join the boundary's inventory.</p>${field("Source", sel("ACAS · .nessus export"))}<div class="ak-drop">${AK.i("upload")}Drop a .nessus, .ckl or .cklb file, or choose one</div>${field("Scan date", input("Nov 14, 2026"))}`, footer: foot("Import scan", "Scan imported: 5 hosts read (prototype: nothing is saved)") });

  // ════════════════ Baseline: the stack and the parameters ════════════════
  const HIGH = HIGH_CODES.split(" "), HIGHSET = new Set(HIGH);
  const LAYERS = [
    { key: "cnssi", title: "CNSSI 1253 National Security System Allocation", kind: "Overlay", ver: 1, dec: DEC_CNSSI, changed: "2026-11-10", publisher: "CNSS", desc: "CNSSI 1253 (2022) allocates controls against confidentiality, integrity and availability independently. At C=high, I=high, A=moderate it selects 554 controls, adding 201 the SP 800-53B High baseline does not carry and withdrawing 17 it does." },
    { key: "mission", title: "Mission Assurance Overlay", kind: "Overlay", ver: 1, dec: DEC_MISSION, changed: "2026-11-10", desc: "Emphasizes isolation, integrity and supply-chain assurance; removes the wireless-specific requirement from this configuration." },
    { key: "deployed", title: "Deployed Platform Overlay", kind: "Overlay", ver: 1, dec: DEC_DEPLOYED, changed: "2026-11-10", desc: "Adds protections for deployed and fielded operation and controlled maintenance." },
    { key: "custa", title: "Customer A Tailoring", kind: "Overlay", ver: 1, dec: DEC_CUSTA, changed: "2026-11-10", desc: "Adds penetration testing and vulnerability monitoring while excluding external-system use for this isolated configuration." },
    { key: "tailor", title: "WS-X90 program tailoring", kind: "Tailoring", ver: null, dec: DEC_TAILOR, changed: "2026-11-13", params: 5, desc: "The program's own last layer: 14 controls in for cyber resiliency and separation, and SA-24's five parameters set from the mission threat assessment." },
  ];
  const CUSA = { key: "cusa", title: "Customer A rail integration", kind: "Overlay", ver: 1, dec: DEC_CUSA, changed: "2026-11-13", desc: "What Customer A's CUSA-SSRD Rev C asks of the X800 on its rail launcher beyond the High baseline." };
  function derive(layers = LAYERS, off = new Set()) {
    const s = new Set(HIGH);
    const rows = layers.map((L) => {
      if (off.has(L.key)) return { ...L, off: true, add: [], rem: [], re: [], total: s.size };
      const add = [], rem = [], re = [];
      for (const d of L.dec.split(" ")) { const c = d.slice(1); if (d[0] === "+") { if (s.has(c)) re.push(c); else { s.add(c); add.push(c); } } else if (s.has(c)) { s.delete(c); rem.push(c); } }
      return { ...L, off: false, add, rem, re, total: s.size };
    });
    return { rows, sel: s };
  }
  const SAVED = derive();
  const famOf = (c) => c.split("-")[0];
  const famCount = (set) => { const m = {}; for (const c of set) m[famOf(c)] = (m[famOf(c)] || 0) + 1; return m; };
  const FAMST = (() => { const m = {}; for (const c of D.controls) { const f = (m[c.f] = m[c.f] || {}); f[c.cs] = (f[c.cs] || 0) + 1; } return m; })();
  const codesMore = (list, max = 48) => `${AK.codes(list.slice(0, max))}${list.length > max ? ` ${mu(`and ${list.length - max} more`)}` : ""}`;
  const baseHead = (cur) => [
    AK.indexHead({ title: "Baseline", desc: `${esc(D.system.baseline)} · NIST SP 800-53 Rev 5 High, four overlays, then the program tailoring · <span class="num">${fmt(TOTAL)}</span> controls`, actions: `${btn("Gap assessment", 'data-go="frameworks-gap"', false, false)}${btn("Edit overlays", 'data-modal="v7p-overlays"', true, false)}` }),
    AK.tabs([["Stack", LAYERS.length + 1, "baseline", cur === "stack"], ["Parameters", 1048, "baseline-params", cur === "params"]], "Baseline"),
  ].join("");
  const sw = (L) => `<button type="button" class="v7p-sw" role="switch" aria-checked="${!WI.has(L.key)}" aria-label="Apply ${esc(L.title)}" data-v7p-wi="${L.key}"></button>`;
  S.baseline = () => {
    const cur = derive(LAYERS, WI), n = cur.sel.size;
    const more = [...cur.sel].filter((c) => !SAVED.sel.has(c)).length, fewer = [...SAVED.sel].filter((c) => !cur.sel.has(c)).length;
    const offNames = cur.rows.filter((r) => r.off).map((r) => r.title);
    const last = cur.rows.filter((r) => !r.off).slice(-1)[0];
    const rows = [{ id: "high", cells: [mu("0"), `<b>NIST SP 800-53 Rev 5 High baseline</b>`, tag("Baseline"), mu("Reference · NIST"), `<span class="num v7p-ok">+370</span>`, `<span class="num v7p-mu">−0</span>`, `<b class="num">370</b>`, `<span class="num">${md("2026-09-16")}</span>`, mu("Root")] }]
      .concat(cur.rows.map((r, i) => ({ id: r.key, off: r.off, cells: [mu(String(i + 1)), `<b>${esc(r.title)}</b>${r.ver ? ` <span class="v7p-mu">v${r.ver}</span>` : ""}`, tag(r.kind), r.publisher ? mu(`Reference · ${r.publisher}`) : ownerEdit("layer:" + r.key), r.off ? mu("Not applied") : `<span class="num v7p-ok">+${r.add.length}</span>`, r.off ? "" : `<span class="num ${r.rem.length ? "v7p-bad" : "v7p-mu"}">−${r.rem.length}</span>`, `<b class="num">${fmt(r.total)}</b>`, `<span class="num">${md(r.changed)}</span>`, sw(r)] })));
    const fc = famCount(cur.sel), sc = famCount(SAVED.sel);
    const fams = D.families.map(({ f, t }) => [f, t, fc[f] || 0, (fc[f] || 0) - (sc[f] || 0)]);
    const asList = (QV.baseview || "grid") === "list";
    const grid = `<div class="v7p-fams">${fams.map(([f, t, k, d]) => `<div class="v7p-fam" ${go("controls")} title="${esc(`${f} ${t}`)}"><div class="v7p-famh"><b>${f}</b><span class="num">${fmt(k)}</span></div><span class="v7p-mu v7p-ell">${esc(t)}</span>${WI.size ? `<span class="v7p-mu num">${d ? `${d > 0 ? "+" : "−"}${Math.abs(d)} against saved` : "As saved"}</span>` : strip(FAMST[f] || {}, `${f}: ${STATUS.map(([s, l]) => `${l} ${(FAMST[f] || {})[s] || 0}`).join(", ")}`)}</div>`).join("")}</div>`;
    const listTbl = tbl({
      cols: ["Family", "Controls", "From High", "Added by the stack", "Satisfied", "Short of satisfied", "Not assessed", "No evidence"],
      rows: fams.map(([f, t, k]) => { const hi = [...cur.sel].filter((c) => famOf(c) === f && HIGHSET.has(c)).length, st = FAMST[f] || {}; return { go: "controls", cells: [`<b>${f}</b> ${clip(t, 230)}`, num(k), num(hi), num(k - hi), num(st.satisfied || 0), num((st.partially_satisfied || 0) + (st.other_than_satisfied || 0)), num(st.not_assessed || 0), num((st.no_evidence || 0) + (st.no_requirement || 0))] }; }),
      total: fams.length, pager: false, label: "Controls by family",
    });
    return h.page(
      baseHead("stack"),
      WI.size
        ? banner({ tone: "info", text: `<b>What-if:</b> ${fmt(more)} more and ${fmt(fewer)} fewer controls than the saved baseline, with ${esc(offNames.join(", "))} not applied. Nothing is saved.`, action: "Back to saved" }, "data-v7p-wireset")
        : AK.banner({ tone: "warn", text: `<b>2 assessments are active.</b> A change to the stack waits until they close: the Expanded Control Set Assessment ends Nov 20.` }),
      tbl({ cols: ["#", "Layer", "Type", "Owner", "Added", "Removed", "Controls", "Last changed", "Apply"], rows, total: LAYERS.length + 1, panel: "v7p-layer", pager: false, nm: 1, label: "Baseline stack" }),
      AK.section(`${fmt(n)} controls after ${last ? last.title : "the reference baseline"}`, asList ? listTbl : `${grid}${WI.size ? "" : legend(CS)}`, { count: `${fams.length} families`, action: views("baseview", [["grid", "Grid"], ["list", "List"]]) }),
      `<p class="v7p-p v7p-mu">A switch reads the stack without that layer: every layer after it applies again to what is beneath it, from the decisions it recorded. Mission Assurance off reads 565, five more than the saved 560.</p>`,
      AK.note("Owner is a proposed field: WS-X90 records no owner for an overlay or its tailoring, so they read Unassigned. Last changed is each layer's record."),
    );
  };
  P["v7p-layer"] = (id) => {
    mark("v7p-layer", id);
    if (id === "high") {
      const out = HIGH.filter((c) => !SAVED.sel.has(c));
      return { label: "Layer preview", body: wide(`${AK.recordHead({ title: "NIST SP 800-53 Rev 5 High baseline", chip: AK.chip("Baseline"), actions: btn("Open in Frameworks", 'data-go="frameworks"') })}
        ${AK.facts([["Publisher", "NIST"], ["Release", "SP 800-53B 5.1.1"], ["Controls", num(370)], ["Loaded", `<span class="num">${md("2026-09-16")}</span>`]])}
        ${AK.section("In WS-X90", `<p class="v7p-p"><span class="num">${fmt(370 - out.length)} of 370</span> stay after the layers above it.</p>`)}
        ${AK.section("Left out by a layer", codesMore(out), { count: out.length })}`) };
    }
    const cur = derive(LAYERS, WI), r = cur.rows.find((x) => x.key === id) || cur.rows[0], s = SAVED.rows.find((x) => x.key === r.key);
    return { label: "Layer preview", body: wide(`${AK.recordHead({ title: r.title, chip: `${AK.chip(r.kind)}${r.off ? AK.chip("Not applied", { tone: "warn" }) : ""}`, actions: sw(r) })}
      ${AK.facts([["Owner", r.publisher ? `Reference · ${esc(r.publisher)}` : ownerEdit("layer:" + r.key)], ["Version", r.ver ? `${r.ver} · ${pill("ok", "Published")}` : mu("The program's own")], ["Changes", `<span class="num"><span class="v7p-ok">+${s.add.length}</span> <span class="${s.rem.length ? "v7p-bad" : "v7p-mu"}">−${s.rem.length}</span> · ${fmt(s.total)} after it</span>`], ["Last changed", `<span class="num">${md(r.changed)}</span>`]])}
      <p class="v7p-prose">${esc(r.desc)}</p>
      ${AK.section("Added", s.add.length ? codesMore(s.add) : mu("Nothing added"), { count: s.add.length })}
      ${AK.section("Removed", s.rem.length ? codesMore(s.rem) : mu("Nothing removed"), { count: s.rem.length })}
      ${s.re.length ? AK.section("Already selected", `${codesMore(s.re)}<p class="v7p-p v7p-mu">Recorded as reaffirmed: a layer beneath already selects them.</p>`, { count: s.re.length }) : ""}
      ${r.params ? AK.section("Parameters it sets", `${li(gl("check"), "SA-24's five, from the mission threat assessment", "", 'data-go="baseline-params" role="link" tabindex="0"')}`, { count: r.params }) : ""}`) };
  };
  M["v7p-overlays"] = () => {
    const next = derive([...LAYERS.slice(0, 4), CUSA, LAYERS[4]]), add = next.rows[4];
    const nowSel = SAVED.sel, afterSel = next.sel;
    const plus = [...afterSel].filter((c) => !nowSel.has(c)), minus = [...nowSel].filter((c) => !afterSel.has(c));
    const row = (r, i, isNew) => `<div class="v7p-ovl${isNew ? " new" : ""}"><span class="num v7p-mu">${i}</span><span class="x"><b>${esc(r.title)}</b>${isNew ? pill("info", "Added") : ""}</span><span class="num"><span class="v7p-ok">+${r.add.length}</span> <span class="v7p-mu">−${r.rem.length}</span> · ${fmt(r.total)}</span>${r.kind === "Overlay" ? `<span class="v7p-icons"><span class="btn sm" aria-label="Move ${esc(r.title)} earlier">↑</span><span class="btn sm" aria-label="Move ${esc(r.title)} later">↓</span><span class="btn sm" aria-label="Remove ${esc(r.title)}">${AK.i("x")}</span></span>` : mu("Stays last")}</div>`;
    return { title: "Edit overlays", body: `<p class="ak-desc">The program tailoring stays last. Systems that adopted the old top move to the new one; every SSP revision keeps the baseline it was pinned to.</p>
      <div class="v7p-ovls">${next.rows.map((r, i) => row(r, i + 1, r.key === "cusa")).join("")}</div>
      ${field("Add overlay", sel("Customer A rail integration · version 1"), "Published overlays of NIST SP 800-53 Rev 5 the stack does not hold.")}
      ${card("<b>What changes</b>", `<dl class="ak-kv v7p-kvw"><dt>Controls</dt><dd class="num">${fmt(nowSel.size)} now · ${fmt(afterSel.size)} after</dd><dt>Added</dt><dd>${plus.length ? AK.codes(plus) : mu("None")}</dd><dt>Removed</dt><dd>${minus.length ? AK.codes(minus) : mu("None")}</dd><dt>New layer</dt><dd class="num">+${add.add.length} −${add.rem.length}</dd></dl>`)}
      <p class="v7p-p v7p-mu">Two assessments are active: the change waits as a draft until they close.</p>`, footer: foot("Edit overlays", "Overlays saved as a draft: it applies once the active assessments close (prototype: nothing is saved)") };
  };

  // Parameters: 1,048 in WS-X90's 560 controls; the tailoring sets SA-24's five, nothing else sets any.
  const PARAMS = [
    ["sa24-1", "SA-24_ODP[01]", "SA-24", "cyber resiliency goals", "Anticipate; Withstand; Recover; Adapt", "tailor"],
    ["sa24-2", "SA-24_ODP[02]", "SA-24", "cyber resiliency objectives", "Prevent or Avoid; Prepare; Continue; Constrain; Reconstitute; Understand", "tailor"],
    ["sa24-3", "SA-24_ODP[03]", "SA-24", "cyber resiliency techniques", "Adaptive Response; Analytic Monitoring; Coordinated Protection; Diversity; Non-Persistence; Privilege Restriction; Redundancy; Segmentation; Substantiated Integrity", "tailor"],
    ["sa24-4", "SA-24_ODP[04]", "SA-24", "implementation approaches", "Dynamic Reconfiguration; Monitoring and Damage Assessment; Sensor Fusion and Analysis; Calibrated Defense-in-Depth; Architectural Diversity; Design Diversity; Non-Persistent Services; and 8 more", "tailor"],
    ["sa24-5", "SA-24_ODP[05]", "SA-24", "design principles", "Focus on Common Critical Assets; Reduce Attack Surfaces; Assume Compromised Resources; Limit the Need for Trust; and 5 more", "tailor"],
    ["ac23-1", "AC-02(03)_ODP[01]", "AC-2(3)", "time period (disable accounts within)", null, null, null, "72 hours"],
    ["ac23-2", "AC-02(03)_ODP[02]", "AC-2(3)", "time period (inactive accounts)", null, null, null, "90 days"],
    ["ra5-1", "RA-05_ODP[01]", "RA-5", "frequency (scan the system)", null, null, "Scan cadence"],
    ["ra5-2", "RA-05_ODP[02]", "RA-5", "frequency (when new vulnerabilities are reported)", null, null, "Scan cadence"],
    ["ra5-3", "RA-05_ODP[03]", "RA-5", "response times (remediate)", null, null, "IAVA and IAVB patches"],
    ["ra5-4", "RA-05_ODP[04]", "RA-5", "personnel or roles", null, null],
    ["si2", "SI-02_ODP", "SI-2", "time period (install security-relevant updates)", null, null, "IAVA and IAVB patches"],
    ["ac7", "AC-07_ODP[01]", "AC-7", "number (consecutive invalid logon attempts)", null, null],
    ["ac11", "AC-11_ODP[02]", "AC-11", "time period (inactivity before lock)", null, null],
    ["au11", "AU-11_ODP", "AU-11", "time period (retain audit records)", null, null],
    ["ca7", "CA-07_ODP[02]", "CA-7", "frequencies (monitor control effectiveness)", null, null],
    ["cm8", "CM-08_ODP[02]", "CM-8", "frequency (review the component inventory)", null, null],
  ];
  const TAILOR_WHY = "The program's cyber resiliency commitments, from the WS-X90 mission threat assessment and the Block 1 architecture review.";
  const readBy = (p) => (p[7] ? link("SSP check", 'data-go="ssp"') : p[6] ? link(p[6], 'data-go="checks"') : mu("No check"));
  S["baseline-params"] = () => {
    const F = { all: () => true, set: (p) => !!p[4], unset: (p) => !p[4], check: (p) => !!p[6], ssp: (p) => !!p[7] };
    const TOT = { all: 1048, set: 5, unset: 1043, check: 4, ssp: 2 };
    const v = QV.params || "all", list = PARAMS.filter(F[v] || F.all);
    return h.page(
      baseHead("params"),
      banner({ tone: "warn", text: "<b>AC-2(3) names values the baseline doesn't set.</b> Its SSP narrative says 72 hours and 90 days; AC-02(03)_ODP[01] and [02] read Not set, so the assessor can't test against them." , action: "Open the SSP check" }, 'data-go="ssp"'),
      views("params", [["all", "All", TOT.all], ["set", "Set", TOT.set], ["unset", "Not set", TOT.unset], ["check", "Read by a check", TOT.check], ["ssp", "Named in the SSP", TOT.ssp]]),
      filters("Search parameters", ["Control family", "Set by", "Read by"]),
      tbl({
        cols: ["Parameter", "Control", "Value", "Set by", "Last changed", "Read by"],
        rows: list.map((p) => ({ id: p[0], cells: [`<b class="num">${esc(p[1])}</b> ${clip(p[3], 200)}`, `<span class="ak-code">${esc(p[2])}</span>`, p[4] ? clip(p[4], 230) : ring("Not set"), p[5] ? AK.chip("Program tailoring") : mu("Nothing"), p[5] ? `<span class="num">${md("2026-11-13")}</span>` : mu("Never"), readBy(p)] })),
        total: TOT[v] || 1048, panel: "v7p-param", label: "Parameters",
      }),
      `<p class="v7p-p v7p-mu">A parameter nothing sets prints the catalog's placeholder on the control's record. Read by a check: Checks compare what the system does against these values.</p>`,
      AK.note("Last changed for the five SA-24 values is the tailoring record's date; nothing else in the stack has ever set one."),
    );
  };
  P["v7p-param"] = (id) => {
    mark("v7p-param", id);
    const p = PARAMS.find((x) => x[0] === id) || PARAMS[0];
    const [, lab, ctl, what, val, by, check, said] = p;
    return { label: "Parameter preview", body: wide(`${AK.recordHead({ title: `${lab} · ${what}`, actions: btn(val ? "Edit value" : "Set value", `data-modal="v7p-param-set" data-id="${id}"`, true) })}
      ${AK.facts([["Control", AK.codes([ctl])], ["Value", val ? `<span class="v7p-clip" style="max-width:260px" title="${esc(val)}">${esc(val)}</span>` : ring("Not set")], ["Set by", by ? "Program tailoring" : "Nothing in the stack"], ["Read by", readBy(p)]])}
      ${by ? AK.section("Rationale", `<p class="v7p-prose">${esc(TAILOR_WHY)}</p>`) : ""}
      ${said ? `<div class="next">${gl("diamond")}<span>The SSP narrative says <b>${esc(said)}</b>, a value the baseline doesn't set. Set it here, or change the narrative.</span><span class="sp">${btn("Open the SSP", 'data-go="ssp"')}</span></div>` : ""}
      ${!val && check ? `<div class="next">${gl("diamond")}<span>The ${esc(check)} check cannot pass until this is set: it has nothing to compare against.</span></div>` : ""}
      ${AK.section("Where it prints", `<p class="v7p-p">${esc(ctl)}'s statement and its assessment objectives show the value in place of the placeholder on the program's control record.</p>`)}`) };
  };
  M["v7p-param-set"] = (id) => {
    const p = PARAMS.find((x) => x[0] === id) || PARAMS[5];
    return { title: `${p[4] ? "Edit" : "Set"} ${p[1]}`, body: `<p class="ak-desc">${esc(p[2])} · ${esc(p[3])}. The value is set on WS-X90 program tailoring, the stack's last layer, so it wins over any value beneath it.</p>
      ${field("Value", input(esc(p[4] || p[7] || "every 30 days and after each software load")), "", true)}${field("Rationale", input(p[4] ? esc(TAILOR_WHY) : "Why this value? The rationale is recorded beside it.", true), "", true)}`, footer: foot(p[4] ? "Edit value" : "Set value", `${p[1]} set on WS-X90 program tailoring (prototype: nothing is saved)`) };
  };

  // ════════════════ Requirements ════════════════
  const ctlOf = (c) => D.ctl(c) || { c, t: "", ob: 0 };
  const REQ_PAGE = REQS.filter((r) => r[0] !== "REQ-013"); // 25 a page, as the pager says
  const cover = (r) => { let tot = 0, cov = 0; for (const c of r[4]) { const ob = ctlOf(c).ob || 0; tot += ob; cov += c === "SI-4(13)" ? 3 : ob; } return [cov, tot]; };
  const reqTabs = (cur) => AK.tabs([["Requirements", 640, "requirements", cur === "reqs"], ["Objectives", 1791, "requirements-objectives", cur === "obj"], ["Compliance", CREQ.length, "requirements-compliance", cur === "cmp"]], "Requirements");
  const reqHead = (cur) => `${AK.indexHead({ title: "Requirements", desc: "640 requirements · allocated to 20 elements · 1,376 control mappings on 547 controls", actions: `${btn("Import requirements", 'data-modal="v7p-import"', false, false)}${btn("Create requirement", 'data-modal="v7p-req-new"', true, false)}` })}${reqTabs(cur)}`;
  S.requirements = () => {
    const F = { all: () => true, noev: (r) => !r[5].length, noown: (r) => !ownerOf("req:" + r[0]), review: (r) => !!r[6] };
    const owned = REQS.filter((r) => ownerOf("req:" + r[0])).length;
    const TOT = { all: 640, noev: 286, noown: 640 - owned, review: 1 };
    const v = QV.req || "all", list = REQ_PAGE.filter(F[v] || F.all), ids = list.map((r) => r[0]);
    return h.page(
      reqHead("reqs"),
      views("req", [["all", "All", TOT.all], ["noev", "Cite no evidence", TOT.noev], ["noown", "No owner", TOT.noown], ["review", "Mapping needs review", TOT.review]]),
      toolbar("Search requirements", "req", [["Assign owner", 'data-modal="v7p-owner" data-id="req:*"'], ["Link evidence", 'data-modal="v7p-link-ev" data-id="selected"'], ["Export", 'data-v7p-toast="Chosen requirements exported (.csv)"']], ["Element", "Control", "Evidence", "Owner"]),
      tbl({
        cols: [cbAll("req", ids, "Select all requirements on this page"), "Requirement", "Owner", "State", "Controls", "Objectives", "Evidence", "Allocated to"],
        rows: list.map((r) => { const [cov, tot] = cover(r); return { id: r[0], sel: SEL.req.has(r[0]), cells: [cb("req", r[0], `Select ${r[0]}`), `<span class="v7p-rq"><b>${esc(r[0])}</b>${clip(r[1], 230)}</span>`, ownerEdit("req:" + r[0]), pill("none", "Draft"), `${AK.codes(r[4])}${r[6] ? ` ${pill("warn", "Review")}` : ""}`, cov < tot ? `<span class="num v7p-warn">${fmt(cov)} of ${fmt(tot)}</span>` : of(cov, tot), r[5].length ? `${gl("check")} <span class="num">${r[5].length}</span>` : ring("None"), `${AK.codes([r[3][0]])}${r[3].length > 1 ? ` ${mu("+" + (r[3].length - 1))}` : ""}`] }; }),
        total: TOT[v], panel: "v7p-req", nm: 1, label: "Requirements",
      }),
      AK.note("Owner is new on this screen: all 640 of WS-X90's requirements are drafts with no owner. Their statements, allocations, mappings and evidence are WS-X90's."),
    );
  };
  P["v7p-req"] = (id) => {
    mark("v7p-req", id);
    const [code, tab0] = String(id || "").split("|"), tab = tab0 || "overview";
    const r = REQS.find((x) => x[0] === code) || REQS[0];
    const c1 = r[0] === "REQ-439" ? D.comments.find((c) => c.at === "AC-2(3)") : null;
    const thread = c1 ? c1.thread : [];
    const acts = [
      { who: null, what: `imported ${esc(r[0])} from the supplied platform requirements`, when: "Sep 12" },
      { who: null, what: `allocated it to ${esc(r[3].join(", "))}`, when: "Sep 12" },
      { who: null, what: `mapped ${esc(r[4].join(", "))}${r[6] ? "; the mapping by objective needs review" : ""}`, when: "Sep 12" },
      ...OWN["req:" + r[0]] ? [{ who: ME, what: `made ${esc(OWN["req:" + r[0]])} the owner`, when: "Just now" }] : [],
    ];
    const head = AK.recordHead({ title: `${r[0]} ${r[1]}`, actions: `${btn("Link evidence", `data-modal="v7p-link-ev" data-id="${esc(r[0])}"`)}${btn("Map control", `data-modal="v7p-map" data-id="${esc(r[0])}"`, true)}` });
    const facts = AK.facts([["Owner", ownerEdit("req:" + r[0])], ["State", pill("none", "Draft")], ["Version", "1"], ["Mapping", r[6] ? pill("warn", "Needs review") : pill("ok", "Control linked")]]);
    const strip2 = panelTabs("v7p-req", r[0], [["overview", "Overview"], ["comments", "Comments", thread.length], ["activity", "Activity", acts.length]], tab);
    let body;
    if (tab === "comments") body = `${AK.comments({ items: thread.map(([who, role, iso, text]) => ({ who, role, when: when(iso), text: esc(text) })), external: !!c1 })}${c1 ? `<p class="note-p">${EX} The thread is the SSP editor's example, on AC-2(3)'s narrative.</p>` : ""}`;
    else if (tab === "activity") body = AK.activity(acts);
    else body = `${AK.section("Statement", `<p class="v7p-prose">${esc(r[2])}</p>`)}
      ${AK.section("Control mappings", r[4].map((c) => { const k = ctlOf(c); return li(`<span class="ak-code">${esc(c)}</span>`, esc(k.t), c === "SI-4(13)" ? `${pill("warn", "3 of 6 objectives")}` : mu(`Whole control · ${plural(k.ob, "objective")}`), `data-panel="v7p-obj" data-id="${esc(c)}" role="button" tabindex="0"`); }).join(""), { count: r[4].length })}
      ${AK.section("Allocated to", r[3].map((e) => li(`<span class="ak-code">${esc(COMP[e] ? COMP[e][0] : e)}</span>`, esc(EBY[e] ? EBY[e].name : e), mu(e), `data-panel="v7p-el" data-id="${esc(e)}" role="button" tabindex="0"`)).join(""), { count: r[3].length })}
      ${AK.section("Evidence", r[5].length ? r[5].map((t) => li(gl("check"), clip(t, 360), mu("Version 1"))).join("") : `<div class="next">${gl("ring")}<span>Cites no evidence, so the controls it maps stay at No evidence.</span><span class="sp">${btn("Link evidence", `data-modal="v7p-link-ev" data-id="${esc(r[0])}"`)}</span></div>`, { count: r[5].length })}`;
    return { label: "Requirement preview", body: wide(`${head}${facts}${strip2}${body}`) };
  };
  M["v7p-link-ev"] = (id) => ({ title: "Link evidence", body: `<p class="ak-desc">${id === "selected" ? `Links one evidence version to ${plural(SEL.req.size, "chosen requirement")}.` : `Links an evidence version to ${esc(id)}. A requirement that cites evidence moves its controls past No evidence.`}</p>
    <div class="ak-pop v7p-pop"><div class="ak-pop-s">${AK.i("eye")}<span>Search evidence</span></div>${data.EVIDENCE.slice(0, 4).map(([t, k, o]) => `<div class="ak-pop-r">${AK.i("link")}<span class="v7p-clip" title="${esc(t)}">${esc(t)}</span><span class="r">${esc(k)}</span></div>`).join("")}</div>`, footer: foot("Link evidence", "Evidence linked (prototype: nothing is saved)") });
  M["v7p-map"] = (id) => { const si = !id || id.startsWith("REQ") || id === "SI-4(13)"; return { title: "Map control", body: `${field("Requirement", `<div class="ak-select">${esc(id || "REQ-262")}</div>`)}${field("System", sel("SYS-WSX90 · WS-X90 Sentinel Mission System"))}${field("Control", sel(id && id.startsWith("REQ") ? "SI-4(13) Analyze Traffic and Event Patterns" : `${esc(id)} ${esc(ctlOf(id).t)}`), "From SYS-WSX90's control baseline: 560 controls.")}
    ${field("Objectives", `<div class="v7p-radios"><label><span class="v7p-radio${si ? "" : " on"}"></span>Whole control</label><label><span class="v7p-radio${si ? " on" : ""}"></span>${si ? "Chosen objectives: SI-04(13)(a)[02], (b)[02], (c)[02]" : "Chosen objectives"}</label></div>`, "A heading covers the objectives under it.")}${field("Rationale", input("Why does this requirement meet the control?", true))}`, footer: foot("Map control", si ? "3 objectives of SI-4(13) mapped (prototype: nothing is saved)" : `${id} mapped (prototype: nothing is saved)`) }; };
  M["v7p-import"] = () => ({ title: "Import requirements", body: `<p class="ak-desc">A CSV, the first sheet of an Excel workbook, a ReqIF file, or rows pasted from a spreadsheet.</p><div class="ak-drop">${AK.i("upload")}Drop a file, or choose one</div>
    <div class="next" role="status">${gl("check")}<span>Read <b>CUSB-SRS Issue 2.csv</b> ${EX}: 14 requirements, 4 columns (Reference, Title, Statement, Elements); passed over 2 empty rows.</span></div>
    ${field("Add to", sel("A new requirements document"))}${field("Document code and title", input("CUSB-SRS · Customer B Security Requirements Specification"))}`, footer: foot("Import requirements", "14 requirements imported, 21 allocations made (prototype: nothing is saved)") });
  M["v7p-req-new"] = () => ({ title: "Create requirement", body: `${field("Code", input("REQ-641"))}${field("Title", input("What the system shall do"), "", true)}${field("Statement", input("The … shall …", true), "", true)}${field("Owner", sel(`${AK.avatar(null, 20)} Unassigned`))}${field("Allocate to", sel("Choose elements"), "A requirement maps controls on each element it is allocated to.")}`, footer: foot("Create requirement", "REQ-641 created as a draft (prototype: nothing is saved)") });

  // Objectives: coverage by control objective, from PA.SSP's 560 controls.
  const SI413 = [["SI-04(13)(a)[01]", "communications traffic for the system is analyzed", true], ["SI-04(13)(a)[02]", "event patterns for the system are analyzed", false], ["SI-04(13)(b)[01]", "profiles representing common traffic are developed", true], ["SI-04(13)(b)[02]", "profiles representing event patterns are developed", false], ["SI-04(13)(c)[01]", "traffic profiles are used in tuning system-monitoring devices", true], ["SI-04(13)(c)[02]", "event profiles are used in tuning system-monitoring devices", false]];
  const nextStep = (c) => {
    const [g, t] = c.om < c.ob ? ["ring", c.om ? `Map ${c.ob - c.om} more objectives` : "Map a requirement"] : c.oe < c.om ? ["ring", "Link evidence"] : c.oa < c.ob ? ["clock", "Add to assessment campaign"] : c.cs === "other_than_satisfied" || c.cs === "partially_satisfied" ? ["diamond", "Open assessment findings"] : [null, "None"];
    return g ? `<span class="who">${gl(g)}<span class="v7p-ink">${esc(t)}</span></span>` : mu(t);
  };
  S["requirements-objectives"] = () => {
    const C = D.controls, sum = (k) => C.reduce((a, c) => a + (c[k] || 0), 0);
    const OB = sum("ob"), OM = sum("om"), OE = sum("oe"), OA = sum("oa");
    const F = { all: () => true, part: (c) => c.om > 0 && c.om < c.ob, none: (c) => c.om === 0 && c.ob > 0, ev: (c) => c.oe < c.om, asm: (c) => c.oe >= c.ob && c.oa < c.ob };
    const rank = (c) => (c.om < c.ob ? 0 : c.oe < c.om ? 1 : c.oa < c.ob ? 2 : 3);
    const v = QV.obj || "all", all = C.filter(F[v] || F.all).slice().sort((a, b) => rank(a) - rank(b) || (b.ob - b.om) - (a.ob - a.om));
    const meter = (l, n) => `<div class="v7p-meter"><span class="v7p-mu">${esc(l)}</span><b class="num">${fmt(n)} <span class="v7p-mu">of ${fmt(OB)} · ${pct(n, OB)}%</span></b>${h.bar(pct(n, OB), "var(--ok)")}</div>`;
    return h.page(
      reqHead("obj"),
      `<div class="ak-card v7p-meters">${meter("Objectives mapped", OM)}${meter("With evidence", OE)}${meter("Assessed", OA)}</div>`,
      views("obj", [["all", "All controls", C.length], ["part", "Mapped in part", C.filter(F.part).length], ["none", "No requirement", C.filter(F.none).length], ["ev", "Evidence short", C.filter(F.ev).length], ["asm", "Not assessed in full", C.filter(F.asm).length]]),
      filters("Search controls", ["Control family", "Control status", "Mapped by"]),
      tbl({
        cols: ["Control", "Status", "Objectives", "Mapped", "With evidence", "Assessed", "Requirements", "Next step"],
        rows: all.slice(0, 25).map((c) => ({ id: c.c, cells: [`<b>${esc(c.c)}</b> ${clip(c.t, 180)}`, stPill(c.cs), num(c.ob), c.om < c.ob ? `<span class="num v7p-warn">${fmt(c.om)} of ${fmt(c.ob)}</span>` : of(c.om, c.ob), of(c.oe, c.ob), of(c.oa, c.ob), num(c.r), nextStep(c)] })),
        total: all.length, panel: "v7p-obj", label: "Objective coverage by control",
      }),
      `<p class="v7p-p v7p-mu">A whole-control mapping covers all its objectives. Every mapping of WS-X90 maps a whole control but REQ-262's, which maps three of SI-4(13)'s six. Of the 14 controls the tailoring added, 13 are mapped by nothing and SI-4(13) by REQ-262 alone.</p>`,
    );
  };
  P["v7p-obj"] = (code) => {
    mark("v7p-obj", code);
    const c = D.ctl(code) || D.controls[0];
    const reqs = REQS.filter((r) => r[4].includes(c.c));
    const gap = c.om < c.ob;
    const body = c.c === "SI-4(13)"
      ? AK.section("Objectives", tbl({ cols: ["Objective", "Text", "Mapped by"], rows: SI413.map(([l, t, m]) => ({ cells: [`<span class="num">${esc(l)}</span>`, clip(t, 230), m ? `<span class="ak-code">REQ-262</span>` : ring("Nothing")] })), pager: false, label: "SI-4(13) objectives" }), { count: `3 of 6 mapped` })
      : AK.section("Requirements that map it", reqs.length ? reqs.map((r) => li(`<span class="ak-code">${esc(r[0])}</span>`, clip(r[1], 320), r[5].length ? pill("ok", "Evidence") : pill("none", "No evidence"), `data-panel="v7p-req" data-id="${esc(r[0])}" role="button" tabindex="0"`)).join("") : `<p class="v7p-p">${c.r ? `${plural(c.r, "requirement")} map it; open the control to see them.` : "No requirement maps it yet."}</p>`, { count: c.r });
    return { label: "Control objectives preview", body: wide(`${AK.recordHead({ title: `${c.c} ${c.t}`, chip: stPill(c.cs), actions: gap ? btn("Map a requirement", `data-modal="v7p-map" data-id="${esc(c.c)}"`, true) : btn("Open control", `data-go="${c.c === "SI-2" ? "control-si2" : "controls"}"`) })}
      ${AK.facts([["Objectives", num(c.ob)], ["Mapped", of(c.om, c.ob)], ["With evidence", of(c.oe, c.ob)], ["Assessed", of(c.oa, c.ob)], ["Next step", nextStep(c)]])}
      ${body}`) };
  };

  // Compliance: a customer's requirements document and the program's answer to each (requirement_source_compliance, PRG-2101).
  const CMP = { compliant: ["ok", "Compliant"], partially_compliant: ["part", "Partially compliant"], non_compliant: ["bad", "Non-compliant"], not_applicable: ["none", "Not applicable"] };
  const cmpPill = (s) => (s ? pill(CMP[s][0], CMP[s][1]) : pill("none", "Unanswered"));
  const MET = { product: "Product", variant_change: "Variant change", program: "Program", unallocated: "Not allocated" };
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
  S["requirements-compliance"] = () => {
    const F = { all: () => true, compliant: (r) => r[2] === "compliant", partially_compliant: (r) => r[2] === "partially_compliant", non_compliant: (r) => r[2] === "non_compliant", none: (r) => !r[2], not_applicable: (r) => r[2] === "not_applicable" };
    const v = QV.cmp || "all", list = CREQ.filter(F[v] || F.all);
    return h.page(
      reqHead("cmp"),
      `<div class="v7p-doc"><div class="v7p-doc-t"><b>CUSA-SSRD · Customer A System Security Requirements Document</b><span class="v7p-mu">CUSA-SSRD-0042 Rev C · received Jul 15 · held by PRG-2101 Customer A · X800 Rail Integration</span></div><span class="flt">Requirements document ⌄</span></div>`,
      views("cmp", [["all", "All", CREQ.length], ["compliant", "Compliant", CREQ.filter(F.compliant).length], ["partially_compliant", "Partially compliant", CREQ.filter(F.partially_compliant).length], ["non_compliant", "Non-compliant", CREQ.filter(F.non_compliant).length], ["none", "Unanswered", CREQ.filter(F.none).length], ["not_applicable", "Not applicable", CREQ.filter(F.not_applicable).length]]),
      filters("Search requirements", ["Met by", "Elements", "Verification"]),
      tbl({
        cols: ["Reference", "Requirement", "Compliance", "Met by", "Elements", "Verification", "Controls"],
        rows: list.map(([ref, t, s, m, ctl, ver, el]) => ({ id: ref, cells: [`<span class="num">${ref}</span>`, `<b>${esc(t)}</b>`, cmpPill(s), esc(MET[m]), el.length ? `${AK.codes([el[0]])}${el.length > 1 ? ` ${mu("+" + (el.length - 1))}` : ""}` : ring("None"), ver ? esc(cap(ver)) : ring("Not chosen"), num(ctl)] })),
        total: CREQ.length, panel: "v7p-creq", nm: 1, label: "Customer requirements",
      }),
      `<p class="v7p-p v7p-mu">WS-X90 has received no customer requirements document. This is the one Customer A sent for its X800 rail variant, read from the database; Import requirements adds one to WS-X90.</p>`,
    );
  };
  P["v7p-creq"] = (id) => {
    mark("v7p-creq", id);
    const r = CREQ.find((x) => x[0] === id) || CREQ[0];
    const [ref, t, s, m, ctl, ver, el, stmt, ans] = r;
    const stand = (e) => (e.includes("CWM") ? ["ring", "Program's own"] : /OFP|CRY|FW/.test(e) ? ["part", "Modified"] : ["check", "Inherited"]);
    return { label: "Customer requirement preview", body: wide(`${AK.recordHead({ title: `${ref} ${t}`, chip: cmpPill(s), actions: btn(ans ? "Edit compliance statement" : "Create compliance statement", `data-modal="v7p-compliance" data-id="${ref}"`, true) })}
      ${AK.facts([["Met by", esc(MET[m])], ["Verification", ver ? esc(cap(ver)) : ring("Not chosen")], ["Controls", num(ctl)]])}
      ${AK.section("Customer's statement", `<p class="v7p-prose">${esc(stmt)}</p>`)}
      ${AK.section("Compliance statement", ans ? `<p class="v7p-prose">${esc(ans)}</p>` : ring("Not written"))}
      ${AK.section("Allocated to", el.length ? el.map((e) => { const [g, l] = stand(e); return li(gl(g), `<span class="num">${esc(e)}</span>`, mu(l)); }).join("") : ring("Not allocated"), { count: el.length })}`) };
  };
  M["v7p-compliance"] = (id) => {
    const r = CREQ.find((x) => x[0] === id) || CREQ[0];
    return { title: r[8] ? "Edit compliance statement" : "Create compliance statement", body: `<p class="ak-desc">${r[0]} ${esc(r[1])}</p>
      ${field("Compliance", `<div class="v7p-radios">${Object.entries(CMP).map(([k, [, l]]) => `<label><span class="v7p-radio${k === r[2] ? " on" : ""}"></span>${l}</label>`).join("")}</div>`)}
      ${field("Verification method", sel(r[5] ? esc(cap(r[5])) : "Choose one"), "Inspection, analysis, demonstration, test or similarity.")}${field("Statement", input(esc(r[8] || "How the program meets it, and what is left."), true), "Required where the answer is short of compliant.", true)}`, footer: foot(r[8] ? "Edit compliance statement" : "Create compliance statement", `Compliance statement saved for ${r[0]} (prototype: nothing is saved)`) };
  };

  // ════════════════ Authorization: the package and its decision ════════════════
  const CONDITIONS = [
    ["Close the high-severity remediation items within 90 days", "2026-12-17", "12 high issues open"],
    ["Complete the expanded control set assessment before Milestone C", "2026-11-20", "The campaign ends Nov 20"],
    ["Report the SA-24 design review at the annual authorization review", "2027-09-18", "Annual review"],
  ];
  const elapsed = pct(TODAY - new Date("2026-09-18T12:00:00"), new Date("2029-09-17T12:00:00") - new Date("2026-09-18T12:00:00"));
  S.authorization = () => {
    const tab = TAB.auth || "pkg";
    const head = AK.recordHead({
      crumbs: [["WS-X90", "overview"], ["Authorization"]],
      title: "Authorization",
      chip: AK.chip("ATO with conditions", { tone: "ok", icon: "check" }),
      desc: "WS-X90 Sentinel Mission System's authorization package. Version 1 holds the decision in force; version 2, the FY2027 annual update, is a draft.",
      facts: [["Decision", pill("ok", "ATO with conditions")], ["Signed", `<span class="num">${md("2026-09-18")}, 2026</span>`], ["ATD", `<span class="num">${md("2029-09-17")}</span>`], ["Authorizing official", AK.owner(ROLE.authorizing_official)], ["ISSM", AK.owner(ROLE.security_manager)], ["Package version 2", pill("none", "Draft")]],
      actions: `${btn("Open package room", 'data-go="package-room"', false, false)}${btn("Submit for approval", 'data-modal="v7p-submit"', true, false)}`,
    });
    const tabs = ptabs("auth", [["pkg", "Package"], ["cond", "Conditions", CONDITIONS.length], ["comments", "Comments", 2], ["activity", "Activity", 5]], "Authorization");
    let body;
    if (tab === "cond") body = AK.withRail(`${AK.section("Conditions of the Sep 18 decision", `<div class="v7p-tasks">${CONDITIONS.map(([t, due, s], i) => AK.task({ title: t, source: s, owner: ownerOf("cond:" + i), due, kind: "Condition" }).replace(AK.owner(ownerOf("cond:" + i)), ownerEdit("cond:" + i))).join("")}</div>`, { count: CONDITIONS.length })}
      ${card("<b>Remind the owners</b>", `<p class="v7p-p">Condition 2 is due in ${AK.days("2026-11-20")} days and has no owner yet. ${EX}</p>${remindBtn("the condition owners")}`)}`, railAuth());
    else if (tab === "comments") body = AK.withRail(`${AK.comments({ items: [
      { who: "Joel Barrantes", role: "ISSM", when: "Nov 16, 4:40 PM", text: `I'll start the ISSM review once SSP 3 is published. ${AK.mention("Priya Raghavan")}, can the increment 2 results land before Nov 20?` },
      { who: "Priya Raghavan", role: "ISSO", when: "Nov 17, 9:30 AM", text: "D. Okafor plans to publish them with the campaign's end on Nov 20. I'll submit version 2 the same day." },
    ] })}${AK.note("The two comments are invented.")}`, railAuth());
    else if (tab === "activity") body = AK.withRail(AK.activity([
      { who: "Priya Raghavan", what: "submitted package version 1 to the authorizing official", when: "Aug 29" },
      { who: "Priya Raghavan", what: "published package version 1: SSP 2, the assessment plan and report, and 3 evidence documents", when: "Sep 2" },
      { who: ROLE.authorizing_official, what: "signed <b>ATO with conditions</b>, ATD Sep 17, 2029, with 3 conditions", when: "Sep 18" },
      { who: null, what: "opened package version 2 in draft, the FY2027 annual update", when: "Nov 13" },
      { who: "Priya Raghavan", what: `started SSP revision 3, which version 2 will hold`, when: "Nov 13" },
    ]), railAuth());
    else { const pk = authPackage(); body = `${AK.withRail(pk.top, railAuth())}${pk.below}`; }
    return h.page(head.replace(/<\/div>$/, `${tabs}</div>`), body);
  };
  function railAuth() {
    return `${AK.railCard("Decision in force", [["Decision", pill("ok", "ATO with conditions")], ["Signed by", AK.owner(ROLE.authorizing_official)], ["Effective", `<span class="num">Sep 18, 2026</span>`], ["ATD", `<span class="num">Sep 17, 2029</span>`], ["Term", `<span class="num">${elapsed}% elapsed</span>`]])}
      ${AK.railCard("Residual risk", [["Open risks", `<b class="num">40</b>`], ["Critical", num(2)], ["High", num(10)], ["Moderate", num(18)], ["Low", num(10)], ["Accepted", `${num(0)} <span class="v7p-mu">all Mitigate</span>`]])}
      <div class="ak-rail-s"><div class="ak-rail-t">Package room</div><p class="v7p-p">Version 1 published Sep 2 and shared with the program's role holders. Every open is watermarked and logged.</p>${link("Open package room", 'data-go="package-room"')}</div>`;
  }
  function authPackage() {
    const approval = AK.approval({ title: "Approval", sub: "Package version 2 · FY2027 annual update · not submitted yet", steps: [
      { label: "Step 1 · ISSM review", approvers: [{ who: ROLE.security_manager, role: "ISSM", state: "waiting" }] },
      { label: "Step 2 · Authorization decision", approvers: [{ who: ROLE.authorizing_official, role: "Authorizing official · signs", state: "waiting" }] },
    ], note: "Only the AO signs. Version 2 can be submitted once SSP 3 and the expanded control set's increment 2 results are published." });
    const PKG = [
      ["System security plan", "Revision 3", "Version 2", pill("warn", "Draft"), `Started ${md(D.revisions[2].started)}`, `${D.counts.placeholders} placeholder narratives`, "ssp-review"],
      ["System security plan", "Revision 2", "Version 1", pill("ok", "Published · frozen"), md(D.revisions[1].published), `${fmt(D.revisions[1].controls)} controls`, "ssp-history"],
      ["Security assessment report", "Expanded control set, increment 2", "Version 2", pill("warn", "Draft results"), "Ends Nov 20", "20 findings in draft", "campaign"],
      ["Security assessment report", "Initial authorization", "Version 1", pill("ok", "Published"), "Aug 28", "68 determinations", "assessments"],
      ["POA&M", "41 items", "Version 2", pill("info", "Current"), "Live", "7 completed · 33 in progress · 1 open", "poam"],
      ["Risk acceptances", "None recorded", "Version 2", pill("none", "None yet"), "", "40 open risks, all Mitigate", "risks"],
    ];
    const contents = AK.section("In the package", tbl({
      cols: ["Document", "Revision", "Package", "State", "Date", "Holds"],
      rows: PKG.map(([d, rv, v, st, dt, hold, r]) => ({ go: r, cells: [`<b>${esc(d)}</b>`, esc(rv), mu(v), st, dt ? `<span class="num">${esc(dt)}</span>` : mu("—"), clip(hold, 260)] })),
      pager: false, label: "Package contents",
    }), { count: PKG.length });
    const decisions = AK.section("Decision history", tbl({
      cols: ["Decision", "Package", "Decided", "Effective", "ATD", "Decided by"],
      rows: [
        { id: "v2", cells: [ring("Pending"), "Version 2 · draft", mu("Not decided"), mu("—"), mu("—"), ring("Not signed")] },
        { id: "v1", cells: [pill("ok", "ATO with conditions"), "Version 1 · published Sep 2", `<span class="num">Sep 18, 2026</span>`, `<span class="num">Sep 18, 2026</span>`, `<span class="num">Sep 17, 2029</span>`, AK.owner(ROLE.authorizing_official)] },
        { id: "ex", cells: [`${pill("info", "IATT")} ${EX}`, "Developmental test article", `<span class="num">Jun 2, 2026</span>`, `<span class="num">Jun 2, 2026</span>`, `<span class="num">Aug 31, 2026</span>`, AK.owner(ROLE.authorizing_official)] },
      ], panel: "v7p-decision", pager: false, label: "Decisions",
    }), { count: 3 });
    const accept = AK.section("Risk acceptances proposed for version 2", `<p class="v7p-p">WS-X90 records no risk acceptance: all 40 open risks are Mitigate. Two the ISSO could ask the AO to accept, with their reasons: ${EX}</p>
      <div class="grid2 v7p-pair">${wire(AK.reasonCard({ question: "Payload telemetry maintenance happens outside the work-order gate", reason: "Maintenance is supervised on the flightline until the Block 1.1 work-order gate ships. Accept the moderate residual risk for 12 months.", who: "Proposed by Priya Raghavan", when: "Not requested", action: "Request acceptance" }), "Request acceptance", 'data-modal="ak-approvers" data-id="the acceptance of this risk"')}
      ${wire(AK.reasonCard({ question: "Platform telemetry crosses to a party nobody has signed a responsibility split with", reason: "The split with the platform integrator is signed at the December review. Accept the moderate residual risk until then.", who: "Proposed by Priya Raghavan", when: "Not requested", action: "Request acceptance" }), "Request acceptance", 'data-modal="ak-approvers" data-id="the acceptance of this risk"')}</div>`, { count: 2 });
    const conditions = AK.section("Conditions of the decision", `<div class="ak-card v7p-lines">${CONDITIONS.map(([t, due, s2]) => `<div class="v7p-line v7p-dueline" data-v7p-tab="auth|cond" role="button" tabindex="0">${gl("clock")}<span class="x"><b>${esc(t)}</b><span class="v7p-mu">${esc(s2)}</span></span>${AK.due(due, { prefix: false })}${AK.i("back", "v7p-chev")}</div>`).join("")}</div>`, { count: CONDITIONS.length });
    return { top: `${approval}${conditions}`, below: `${contents}${decisions}${accept}${AK.note("The IATT row and the two proposed risk acceptances are invented. The decision, its conditions, the documents and the approvers are WS-X90's.")}` };
  }
  P["v7p-decision"] = (id) => {
    mark("v7p-decision", id);
    if (id === "ex") return { label: "Decision preview", body: wide(`${AK.recordHead({ title: "IATT · developmental test article", chip: EX })}${AK.facts([["Decision", pill("info", "IATT")], ["For", "Interim authorization to test on the range"], ["ATD", "Aug 31, 2026"]])}`) };
    if (id === "v2") return { label: "Decision preview", body: wide(`${AK.recordHead({ title: "Package version 2 · pending decision", actions: btn("Open package room", 'data-go="package-room"') })}${AK.facts([["State", pill("none", "Draft")], ["Holds", "SSP 3 with the Block 1.1 configuration"], ["Waits on", "Increment 2 results"]])}${li(gl("ring"), "Not submitted: the ISSM review and the AO decision start once SSP 3 and the increment 2 results are published.", "")}`) };
    return { label: "Decision preview", body: wide(`${AK.recordHead({ title: "ATO with conditions · version 1", actions: btn("Export decision letter", 'data-v7p-toast="Decision letter exported (PDF, CUI marked)"') })}
      ${AK.facts([["Decision", pill("ok", "ATO with conditions")], ["Decided by", AK.owner(ROLE.authorizing_official)], ["Decided", "Sep 18, 2026"], ["ATD", "Sep 17, 2029"]])}
      ${AK.section("Rationale", `<p class="v7p-prose">Residual risk is acceptable for operational use given the tailored cyber resiliency commitments and the conditions below.</p>`)}
      ${AK.section("Conditions", CONDITIONS.map(([t, due]) => li(gl("clock"), esc(t), AK.due(due, { prefix: false }))).join(""), { count: 3 })}
      ${AK.section("Package", li(gl("check"), "SSP 2, the security assessment plan and report, and 3 evidence documents", mu("Published Sep 2"), 'data-go="ssp-history" role="link" tabindex="0"'))}
      ${AK.section("Risk snapshot", li(gl("check"), "40 risks locked at signing · 2 critical, 10 high", ""))}`) };
  };
  M["v7p-submit"] = () => ({ title: "Submit package version 2 for approval", body: `<p class="ak-desc">Joel Barrantes reviews first; then R. Calloway decides and signs. Version 2 can be submitted once each item below is done.</p>
    <div class="v7p-checklist">${li(gl("ring"), "<b>SSP 3 published</b>", mu(`Draft · ${D.counts.placeholders} placeholder narratives`), 'data-go="ssp-review" role="link" tabindex="0"')}${li(gl("ring"), "<b>Increment 2 results published</b>", mu("20 findings in draft"), 'data-go="campaign" role="link" tabindex="0"')}${li(gl("check"), "<b>POA&amp;M current</b>", mu("41 items"))}</div>
    ${AK.steps(["ISSM review · Joel Barrantes", "Authorization decision · R. Calloway"], 0)}`,
    footer: `<span class="v7p-mu v7p-held-why">Waits on SSP 3 and the increment 2 results</span><button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink v7p-held" aria-disabled="true" title="Submit waits on SSP 3 and the increment 2 results">Submit</button>` });

  // ════════════════ Continuous monitoring: recurring checks ════════════════
  const TASKS = [
    ["t1", "Monthly vulnerability scan — mission network (October)", "completed", "2026-10-04", "2026-10-11", "Joel Barrantes"],
    ["t2", "Monthly STIG compliance scan (October)", "completed", "2026-10-06", "2026-10-13", "Joel Barrantes"],
    ["t3", "Monthly POA&M review (October)", "completed", "2026-10-09", "2026-10-14", "Priya Raghavan"],
    ["t5", "Monthly STIG compliance scan", "blocked", "2026-11-01", "2026-11-11", "Joel Barrantes"],
    ["t6", "Monthly vulnerability scan — mission network", "in_progress", "2026-11-04", "2026-11-15", "Joel Barrantes"],
    ["t7", "Monthly POA&M review", "ready", "2026-11-12", "2026-11-21", "Priya Raghavan"],
    ["t8", "Quarterly privileged account review (AC-2, AC-6)", "in_progress", "2026-11-07", "2026-12-01", "Victor Amsel"],
    ["t9", "Quarterly audit log review sampling (AU-6)", "planned", "2026-12-03", "2026-12-23", "Nadia Fournier"],
    ["t10", "Quarterly configuration baseline audit (CM-2, CM-3)", "planned", "2026-12-08", "2026-12-28", ME],
    ["t11", "Annual control subset assessment — AC and IA families", "planned", "2027-01-12", "2027-02-11", "Nadia Fournier"],
    ["t12", "Incident response tabletop (IR-3)", "planned", "2027-02-16", "2027-03-13", "Priya Raghavan"],
    ["t13", "Contingency plan test on a whole article (CP-4)", "planned", "2027-03-23", "2027-04-12", "Amara Bell"],
    ["t14", "Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)", "planned", "2027-05-02", "2027-06-01", "Wes Duarte"],
  ].map(([id, t, s, a, b, o]) => ({ id, t, s, a, b, o }));
  const TSTAT = { completed: ["ok", "Completed"], cancelled: ["none", "Cancelled"], blocked: ["bad", "Blocked"], in_progress: ["warn", "In progress"], ready: ["info", "Ready"], planned: ["none", "Planned"] };
  const CHECKS = [
    ["vuln", "ACAS vulnerability scan, mission network", "Monthly", "RA-5, SI-2", "Joel Barrantes", ["warn", "In progress"], "2026-11-15", "2026-10-11", ["t1", "t6"]],
    ["stig", "STIG compliance scan", "Monthly", "CM-6", "Joel Barrantes", ["bad", "Blocked"], "2026-11-11", "2026-10-13", ["t2", "t5"]],
    ["poamr", "POA&M review", "Monthly", "CA-5", "Priya Raghavan", ["info", "Ready"], "2026-11-21", "2026-10-14", ["t3", "t7"]],
    ["par", "Privileged account review", "Quarterly", "AC-2, AC-6", "Victor Amsel", ["warn", "In progress"], "2026-12-01", null, ["t8"]],
    ["au6", "Audit log review sampling", "Quarterly", "AU-6", "Nadia Fournier", ["none", "Planned"], "2026-12-23", null, ["t9"]],
    ["cm", "Configuration baseline audit", "Quarterly", "CM-2, CM-3", ME, ["none", "Planned"], "2026-12-28", null, ["t10"]],
    ["subset", "Reassessment sample: AC and IA controls", "Yearly", "CA-2, CA-7", "Nadia Fournier", ["none", "Planned"], "2027-02-11", null, ["t11"]],
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
  const TRS = { bad: ["bad", "Tripped"], warn: ["warn", "Review"], info: ["info", "Watch"], ok: ["ok", "Clear"] };
  const SNAP = [["2026-11-13", 14, 235, 90, 13, 34, 174], ["2026-11-14", 14, 235, 90, 13, 34, 174], ["2026-11-15", 14, 234, 89, 13, 34, 176], ["2026-11-16", 14, 234, 89, 13, 34, 176], ["2026-11-17", 14, 233, 90, 13, 34, 176]];
  const late = (c) => AK.days(c[6]) < 0 && c[5][1] !== "Completed";
  S.conmon = () => {
    const tab = TAB.conmon || "checks";
    const F = { all: () => true, late, soon: (c) => AK.days(c[6]) >= 0 && AK.days(c[6]) <= 14, planned: (c) => c[5][1] === "Planned" };
    const lateN = CHECKS.filter(late).length;
    let body;
    if (tab === "triggers") body = tbl({ cols: ["Reauthorization trigger", "Reads", "State"], rows: TRIGGERS.map(([id, g, t, s, k]) => ({ id, cells: [`<span class="who">${gl(g)}<b class="v7p-ink">${esc(t)}</b></span>`, clip(s, 360), pill(TRS[k][0], TRS[k][1])] })), panel: "v7p-trigger", pager: false, label: "Reauthorization triggers" })
      + `<p class="v7p-p v7p-mu">The rules are proposed; each is read against WS-X90's records today. A tripped trigger asks the AO whether to reauthorize; it never changes the decision by itself.</p>`;
    else if (tab === "status") {
      const last = SNAP[SNAP.length - 1];
      const ix = { satisfied: 6, partially_satisfied: 5, other_than_satisfied: 4, not_assessed: 3, no_evidence: 2, no_requirement: 1 };
      body = `${card(`<b>Control status, by day</b><span class="v7p-mu num">${fmt(TOTAL)} controls</span>`, `<div class="v7p-cols" role="img" aria-label="Controls satisfied each day from Nov 13 to Nov 17: ${SNAP.map((s) => s[6]).join(", ")}">${SNAP.map((s) => `<div class="v7p-col"><b class="num">${pct(s[6], TOTAL)}%</b><div class="v7p-colbar">${STATUS.map(([k, l, col]) => `<i style="flex:${s[ix[k]]};background:${col}" title="${esc(l)}: ${s[ix[k]]}"></i>`).join("")}</div><span class="num v7p-mu">${md(s[0])}</span></div>`).join("")}</div>${legend(Object.fromEntries(STATUS.map(([k]) => [k, last[ix[k]]])))}<p class="v7p-p v7p-mu">One snapshot a day since Nov 13. Satisfied went from 174 to 176 on Nov 15; nothing is backfilled.</p>`)}
        ${AK.section("Since the last authorization", `<div class="ak-card v7p-lines">${[["diamond", "Operational issues opened", "2 critical, 9 high", 36, "findings"], ["info", "Determinations published", "Nov 12", 225, "campaign"], ["clock", "Determinations in draft results", "Increment 2", 20, "campaign"], ["diamond", "CVE-2024-6387 found on LRU-001", "Oct 10", 1, "findings"], ["clock", "Mission Computer version 2 published", "Nov 12", 1, "composition"], ["clock", "SSP 3 in draft", "Block 1.1 configuration", 1, "ssp"], ["ring", "Risks reassessed", "None since Sep 12", 0, "risks"]].map(([g, l, s, n, r]) => `<div class="v7p-line" ${go(r)}>${gl(g)}<span class="x"><b>${esc(l)}</b><span class="v7p-mu">${esc(s)}</span></span><b class="num${n ? "" : " v7p-mu"}">${fmt(n)}</b>${AK.i("back", "v7p-chev")}</div>`).join("")}</div>`, { count: "Sep 18" })}`;
    } else {
      const list = CHECKS.filter(F[QV.checks || "all"] || F.all);
      body = `${views("checks", [["all", "All", CHECKS.length], ["late", "Overdue", lateN], ["soon", "Due in 14 days", CHECKS.filter(F.soon).length], ["planned", "Planned", CHECKS.filter(F.planned).length]])}
        ${filters("Search checks", ["Cadence", "Owner", "Status", "Control"])}
        ${tbl({ cols: ["Check", "Cadence", "Owner", "Last run", "Next due", "Status", "Runs"], rows: list.map(([id, t, cad, c, o, st, due, lastDone, runs]) => ({ id, cells: [`<b>${esc(t)}</b> ${mu(c)}`, tag(cad), ownerEdit("check:" + id, o), lastDone ? `<span class="num">${md(lastDone)}</span>` : ring("Not yet"), AK.due(due, { prefix: false }), pill(st[0], st[1]), num(runs.length)] })), total: CHECKS.length, panel: "v7p-check", nm: 0, label: "Recurring checks" })}
        <div class="v7p-links">${link("Shown in SSP section 13", 'data-go="ssp"')}<span class="v7p-mu">·</span>${link("Checks compare the system against its baseline", 'data-go="checks"')}<span class="v7p-mu">·</span>${link("Each run is a task in Schedule", 'data-go="schedule"')}</div>`;
    }
    return h.page(
      AK.indexHead({ title: "Continuous monitoring", desc: "WS-X90 continuous monitoring — FY2027 · Oct 1, 2026 – Sep 30, 2027 · authorized to Sep 17, 2029", actions: `${btn("Export ConMon report", 'data-v7p-toast="ConMon report exported (PDF, CUI marked)"', false, false)}${btn("Plan a check", 'data-modal="v7p-plan-check"', true, false)}` }),
      banner({ tone: "bad", text: `<b>${lateN} checks are overdue.</b> The STIG compliance scan is blocked, due Nov 11, and the ACAS vulnerability scan is still running, due Nov 15.`, action: "Open checks" }, 'data-go="checks"'),
      ptabs("conmon", [["checks", "Recurring checks", CHECKS.length], ["triggers", "Reauthorization triggers", TRIGGERS.length], ["status", "Control status", `${SNAP.length} days`]], "Continuous monitoring"),
      body,
      AK.note("The reminders and the trigger rules are proposed. The checks, their owners, cadences, runs and dates are the FY2027 plan's scheduled tasks."),
    );
  };
  P["v7p-check"] = (id) => {
    mark("v7p-check", id);
    const c = CHECKS.find((x) => x[0] === id) || CHECKS[0];
    const [, t, cad, ctl, o, st, due, lastDone, runIds] = c;
    const runs = runIds.map((r) => TASKS.find((x) => x.id === r)).filter(Boolean);
    const scan = id === "vuln" || id === "stig";
    return { label: "Check preview", body: wide(`${AK.recordHead({ title: t, chip: pill(st[0], st[1]), actions: `${btn("Move due date", 'data-modal="ak-reason" data-id="Move the due date|The new date and the reason show on the check, with your name and the date."')}${btn("Record a result", `data-v7p-toast="Result recorded for ${esc(t)} (prototype: nothing is saved)"`, true)}` })}
      ${AK.facts([["Owner", ownerEdit("check:" + id, o)], ["Cadence", tag(cad)], ["Next due", AK.due(due, { prefix: false })], ["Last run", lastDone ? `<span class="num">${md(lastDone)}</span>` : ring("Not yet")], ["Controls", AK.codes(ctl.split(", "))]])}
      ${AK.section("Runs", `<div class="v7p-tasks">${runs.map((r) => AK.task({ title: r.t, source: `${md(r.a)} – ${md(r.b)} · ${TSTAT[r.s][1]}`, owner: r.o, due: r.b, done: r.s === "completed" })).join("")}</div>`, { count: runs.length })}
      ${late(c) ? AK.section("Reminder", `<p class="v7p-p">Past due by ${-AK.days(due)} days. A reminder emails ${esc(ownerOf("check:" + id, o) || "the owner")} with the check and its last run. ${EX}</p>${remindBtn(ownerOf("check:" + id, o) || "the owner")}`) : ""}
      ${scan ? AK.section("Remediation SLA", `<div class="v7p-pills">${["critical", "high", "moderate", "low"].map((s) => AK.sla(`${s} ${data.SLA[s]} days`)).join("")}</div><p class="v7p-p">A finding the scan opens is due by its severity, counted from the day the scan reports it.</p>`) : ""}`) };
  };
  P["v7p-trigger"] = (id) => {
    mark("v7p-trigger", id);
    const t = TRIGGERS.find((x) => x[0] === id) || TRIGGERS[0];
    const detail = { crit: li(gl("diamond"), "Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)", "", 'data-go="findings" role="link" tabindex="0"'), sig: li(gl("clock"), "Package version 2 drafts SSP 3; the AO decides whether the change is significant", "", 'data-go="authorization" role="link" tabindex="0"'), c1: li(gl("clock"), "ATO with conditions · Sep 18, 2026", AK.due("2026-12-17", { prefix: false }), 'data-go="authorization" role="link" tabindex="0"'), comp: li(gl("info"), "WS-X90 runs version 1; version 2 fixes CVE-2024-6387", "", 'data-go="composition" role="link" tabindex="0"'), kev: li(gl("check"), "CVE-2024-6387 is not in the KEV catalog", ""), atd: li(gl("check"), "Sep 17, 2029 · 34 months away", "") }[t[0]];
    return { label: "Trigger preview", body: wide(`${AK.recordHead({ title: t[2], chip: pill(TRS[t[4]][0], TRS[t[4]][1]), actions: t[4] === "bad" ? btn("Notify the AO", 'data-v7p-toast="R. Calloway notified"', true) : "" })}${AK.facts([["Reads", esc(t[3])]])}${AK.section("Why", detail)}<p class="v7p-p v7p-mu">A tripped trigger asks the AO whether to reauthorize; it never changes the decision by itself. ${EX}</p>`) };
  };
  M["v7p-plan-check"] = () => ({ title: "Plan a check", body: `<p class="ak-desc">A recurring check becomes a task in the continuous monitoring plan each time it falls due.</p>${field("Check", input("What is checked"), "", true)}${field("Cadence", sel("Monthly"))}${field("Controls", sel("Choose controls"))}${field("Owner", sel(`${AK.avatar(null, 20)} Unassigned`))}${field("First due", input("Dec 15, 2026"))}`, footer: foot("Plan check", "Check planned in WS-X90 continuous monitoring — FY2027 (prototype: nothing is saved)") });

  // ——— Sub-routes and ownership ———
  Object.assign(ROUTE_NAV, { "composition-list": "composition", "composition-config": "composition", "inventory-scans": "inventory", "baseline-params": "baseline", "requirements-objectives": "requirements", "requirements-compliance": "requirements" });
  PA.own(["overview", "composition", "composition-list", "composition-config", "inventory-scans", "baseline", "baseline-params", "requirements", "requirements-objectives", "requirements-compliance", "authorization", "conmon"]);
})();
