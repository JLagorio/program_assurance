// Version 7 · builder O (v7o-): the organization and settings screens, redrawn in the after style on the after kit (window.PA.AK).
// Routes kept and claimed with PA.own: portfolio; products, products-delta; components; component-mc with its tabs (-assessment,
// -where, -findings, -sbom, -sbom-v1, -versions, -tasks, -activity, -comments); deadlines (-vuln, -stig, -findings, -other);
// event-log (-reviews, -imports, -decisions, -system); enclaves; common-controls; people-8140.
// Real values come from the old screens (mod-system.js: portfolio, products, the Customer A delta; mod-platform.js: components, the
// Mission Computer, deadlines, the event log, enclaves, providers; mod-risk.js and mod-after-people.js: role holders and the Mission
// Computer record) and from the local database on Nov 17 (SELECT only; product status read as the dev account in a read-only
// transaction): each program's latest control status snapshot, system owner and next gate, the five variants' deltas, the four
// products' versions and assessments, and WS-X90's open issues and POA&M milestones by due date. Invented things carry Example.
// Pieces built here beyond the kit: menus, quick-view chips that filter, tables with group rows, a share donut cell, SLA policy
// cards, a marking chip, a segmented toggle and a toast hook (data-v7o-toast) over PA.SSP.ui.toast.
(function () {
  const PA = window.PA;
  const { S, P, M, ROUTE_NAV, h } = PA;
  const AK = PA.AK;
  const { esc, fmt, pill, tag, gl } = h;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const md = AK.md, days = AK.days;

  // ——— Real data copied from the old modules (see the header) ———
  const COMP = [["Mission Computer","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,3,4,0,61,52,42,6,4,1,1,2,"Air Defense"],["Audit Log Collector","G25 launch control component set",1,"published","Marcus Ryde","software",1,2,0,0,14,14,13,1,0,0,0,0,"Mission Systems"],["Console Workstation","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,1,0,0,33,0,0,0,0,0,0,0,"Mission Systems"],["Launch Control Software","G25 launch control component set",1,"published","Marcus Ryde","software",1,1,0,1,34,0,0,0,0,0,0,0,"Mission Systems"],["Link Encryptor","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,1,0,0,23,0,0,0,0,0,0,0,"Mission Systems"],["Shelter Power Distribution Unit","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,0,0,0,11,0,0,0,0,0,0,0,"Mission Systems"],["Tactical Router","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,1,0,0,23,0,0,0,0,0,0,0,"Mission Systems"],["Time Server","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,1,0,0,8,0,0,0,0,0,0,0,"Mission Systems"],["Vehicle Power Interface","G25 launch control component set",1,"published","Marcus Ryde","hardware",1,1,0,0,14,0,0,0,0,0,0,0,"Mission Systems"],["Cryptographic Module","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,1,27,0,0,0,0,0,0,0,"Air Defense"],["Datalink Radio","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,26,0,0,0,0,0,0,0,"Air Defense"],["Ejector Interface Unit","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,0,1,0,15,0,0,0,0,0,0,0,"Air Defense"],["Field Test Set","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,28,0,0,0,0,0,0,0,"Air Defense"],["Key Load Interface","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,17,0,0,0,0,0,0,0,"Air Defense"],["Maintenance Port","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,24,0,0,0,0,0,0,0,"Air Defense"],["Mission Data Loader","X800 Missile component set",2,"published","Priya Raghavan","software",1,1,2,0,24,0,0,0,0,0,0,0,"Air Defense"],["Navigation Unit","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,13,0,0,0,0,0,0,0,"Air Defense"],["Operational Flight Program","X800 Missile component set",2,"published","Priya Raghavan","software",1,2,3,1,51,0,0,0,0,0,0,0,"Air Defense"],["Pallet Controller","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,1,2,0,31,0,0,0,0,0,0,0,"Air Defense"],["Pallet Controller Firmware","X800 Missile component set",2,"published","Priya Raghavan","software",1,1,2,1,39,0,0,0,0,0,0,0,"Air Defense"],["Pallet Datalink Node","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,1,2,0,27,0,0,0,0,0,0,0,"Air Defense"],["Rail Umbilical Interface Unit","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,1,2,0,30,0,0,0,0,0,0,0,"Air Defense"],["Secure Boot Firmware","X800 Missile component set",2,"published","Priya Raghavan","software",1,2,3,0,30,0,0,0,0,0,0,0,"Air Defense"],["Seeker Interface Unit","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,0,7,0,0,0,0,0,0,0,"Air Defense"],["Separation Sensor","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,0,1,0,9,0,0,0,0,0,0,0,"Air Defense"],["Telemetry Unit","X800 Missile component set",2,"published","Priya Raghavan","hardware",1,2,3,1,14,0,0,0,0,0,0,0,"Air Defense"],["Company A Profile","Company A Profile",1,"published",null,"policy",0,1,0,0,12,0,0,0,0,0,0,0,null],["Datalink Relay","G40 ground terminal component set",1,"published",null,"hardware",1,1,0,0,21,0,0,0,0,0,0,0,null],["Planning Software","G40 ground terminal component set",1,"published",null,"software",1,1,0,1,27,0,0,0,0,0,0,0,null],["Planning Workstation","G40 ground terminal component set",1,"published",null,"hardware",1,1,0,0,37,0,0,0,0,0,0,0,null],["Shelter Power Unit","G40 ground terminal component set",1,"published",null,"hardware",1,1,0,0,5,0,0,0,0,0,0,0,null],["Production code signing enclave","Production code signing enclave",1,"published",null,"service",0,0,0,0,0,0,0,0,0,0,0,0,null],["Launch Controller","R210 launcher electronics component set",1,"published",null,"hardware",1,1,0,0,51,0,0,0,0,0,0,0,null],["Launch Controller Firmware","R210 launcher electronics component set",1,"published",null,"software",1,1,0,1,37,0,0,0,0,0,0,0,null],["Launcher Power Supply","R210 launcher electronics component set",1,"published",null,"hardware",1,1,0,0,16,0,0,0,0,0,0,0,null],["Subsystem A.2","Subsystem A.2",1,"published",null,"service",0,0,0,0,12,0,0,0,0,0,0,0,null],["Company B Profile","Company B Profile",1,"draft",null,"policy",0,0,0,0,9,0,0,0,0,0,0,0,null],["Component A.11 · Mission Computer X","Component A.11 · Mission Computer X",1,"draft",null,"hardware",0,0,0,0,10,0,0,0,0,0,0,0,null],["Component A.12 · Sensor Interface","Component A.12 · Sensor Interface",1,"draft",null,"hardware",0,0,0,0,8,0,0,0,0,0,0,0,null],["Component A.21 · Gateway G4","Component A.21 · Gateway G4",1,"draft",null,"hardware",0,0,0,0,9,0,0,0,0,0,0,0,null],["Component A.22 · CipherCore C2","Component A.22 · CipherCore C2",1,"draft",null,"hardware",0,0,0,0,8,0,0,0,0,0,0,0,null],["Component B.21 · Operator Console","Component B.21 · Operator Console",1,"draft",null,"hardware",0,0,0,0,9,0,0,0,0,0,0,0,null],["Corporate identity provider","Corporate identity provider",1,"draft",null,"service",0,0,0,0,5,0,0,0,0,0,0,0,null],["Enterprise security policy set","Enterprise security policy set",1,"draft",null,"policy",0,0,0,0,4,0,0,0,0,0,0,0,null],["Europe Operations Supplement","Europe Operations Supplement",1,"draft",null,"policy",0,0,0,0,5,0,0,0,0,0,0,0,null],["GovCloud landing zone","GovCloud landing zone",1,"draft",null,"service",0,0,0,0,4,0,0,0,0,0,0,0,null],["Host Platform H","Host Platform H",1,"draft",null,"hardware",0,0,0,0,9,0,0,0,0,0,0,0,null],["Module provisioning and fusing line","Module provisioning and fusing line",1,"draft",null,"process",0,0,0,0,0,0,0,0,0,0,0,0,null],["Sierra Vista data center","Sierra Vista data center",1,"draft",null,"service",0,0,0,0,3,0,0,0,0,0,0,0,null],["Subsystem A.1","Subsystem A.1",1,"draft",null,"service",0,0,0,0,14,0,0,0,0,0,0,0,null],["System A","System A",1,"draft",null,"service",0,0,0,0,26,0,0,0,0,0,0,0,null],["System B","System B",1,"draft",null,"service",0,0,0,0,18,0,0,0,0,0,0,0,null]];
  const MCCTL = [["AC-2","Account Management","AC","satisfied",true,false],["AC-2(1)","Automated System Account Management","AC","satisfied",true,false],["AC-2(3)","Disable Accounts","AC","satisfied",true,false],["AC-2(5)","Inactivity Logout","AC","satisfied",true,false],["AC-2(11)","Usage Conditions","AC","satisfied",true,false],["AC-2(12)","Account Monitoring for Atypical Usage","AC","satisfied",true,false],["AC-3","Access Enforcement","AC","satisfied",true,false],["AC-4","Information Flow Enforcement","AC","satisfied",true,false],["AC-4(4)","Flow Control of Encrypted Information","AC","partially_satisfied",true,false],["AC-6(5)","Privileged Accounts","AC","satisfied",true,false],["AC-6(9)","Log Use of Privileged Functions","AC","partially_satisfied",true,false],["AC-6(10)","Prohibit Non-privileged Users from Executing Privileged Functions","AC","satisfied",true,false],["AC-7","Unsuccessful Logon Attempts","AC","partially_satisfied",true,false],["AC-10","Concurrent Session Control","AC","satisfied",true,false],["AC-12","Session Termination","AC","not_assessed",false,false],["AC-17(1)","Monitoring and Control","AC","satisfied",true,false],["AC-17(2)","Protection of Confidentiality and Integrity Using Encryption","AC","not_assessed",false,true],["AC-17(3)","Managed Access Control Points","AC","not_assessed",false,false],["AC-17(4)","Privileged Commands and Access","AC","satisfied",true,false],["AC-18","Wireless Access","AC","satisfied",true,false],["AC-18(3)","Disable Wireless Networking","AC","satisfied",true,false],["AC-18(5)","Antennas and Transmission Power Levels","AC","satisfied",true,false],["AC-20","Use of External Systems","AC","other_than_satisfied",true,false],["AU-1","Policy and Procedures","AU","satisfied",true,false],["AU-2","Event Logging","AU","satisfied",true,false],["AU-4","Audit Log Storage Capacity","AU","satisfied",true,false],["AU-5(1)","Storage Capacity Warning","AU","satisfied",true,false],["AU-6","Audit Record Review, Analysis, and Reporting","AU","satisfied",true,false],["AU-8","Time Stamps","AU","satisfied",true,false],["AU-9(2)","Store on Separate Physical Systems or Components","AU","other_than_satisfied",true,false],["AU-10","Non-repudiation","AU","satisfied",true,false],["AU-11","Audit Record Retention","AU","satisfied",true,false],["AU-12","Audit Record Generation","AU","other_than_satisfied",true,false],["AU-12(1)","System-wide and Time-correlated Audit Trail","AU","other_than_satisfied",true,false],["IA-2","Identification and Authentication (Organizational Users)","IA","satisfied",true,false],["IA-2(2)","Multi-factor Authentication to Non-privileged Accounts","IA","satisfied",true,false],["IA-2(8)","Access to Accounts — Replay Resistant","IA","not_assessed",false,false],["IA-5","Authenticator Management","IA","satisfied",true,false],["IA-5(1)","Password-based Authentication","IA","satisfied",true,false],["IA-8","Identification and Authentication (Non-organizational Users)","IA","satisfied",true,false],["IA-12","Identity Proofing","IA","satisfied",true,false],["SC-1","Policy and Procedures","SC","satisfied",true,false],["SC-3","Security Function Isolation","SC","satisfied",true,false],["SC-7(3)","Access Points","SC","partially_satisfied",true,false],["SC-7(7)","Split Tunneling for Remote Devices","SC","satisfied",true,false],["SC-7(8)","Route Traffic to Authenticated Proxy Servers","SC","satisfied",true,false],["SC-7(18)","Fail Secure","SC","satisfied",true,false],["SC-7(21)","Isolation of System Components","SC","not_assessed",false,false],["SC-12","Cryptographic Key Establishment and Management","SC","satisfied",true,false],["SC-15","Collaborative Computing Devices and Applications","SC","satisfied",true,false],["SC-18","Mobile Code","SC","partially_satisfied",true,false],["SC-22","Architecture and Provisioning for Name/Address Resolution Service","SC","satisfied",true,false],["SC-23","Session Authenticity","SC","not_assessed",false,true],["SC-28(1)","Cryptographic Protection","SC","not_assessed",false,false],["SC-39","Process Isolation","SC","satisfied",true,false],["SI-4(2)","Automated Tools and Mechanisms for Real-time Analysis","SI","not_assessed",false,false],["SI-4(20)","Privileged Users","SI","not_assessed",false,false],["SI-4(22)","Unauthorized Network Services","SI","satisfied",true,false],["SI-7","Software, Firmware, and Information Integrity","SI","satisfied",true,false],["SI-7(2)","Automated Notifications of Integrity Violations","SI","satisfied",true,false],["SI-8","Spam Protection","SI","partially_satisfied",true,false]];
  const EVENTS = [["2026-11-17T23:55","Snapshot taken","Daily job","Control status · WS-X90","176 of 560 controls satisfied","program_posture_snapshots"],["2026-11-16T23:55","Snapshot taken","Daily job","Control status · WS-X90","176 of 560 controls satisfied","program_posture_snapshots"],["2026-11-15T23:55","Snapshot taken","Daily job","Control status · WS-X90","176 of 560 controls satisfied","program_posture_snapshots"],["2026-11-14T23:55","Snapshot taken","Daily job","Control status · WS-X90","174 of 560 controls satisfied","program_posture_snapshots"],["2026-11-14T16:30","Finding offered","Ingrid Solberg","Mission Computer · X800 Missile component set","CVE-2024-6387 in the Mission Computer's OpenSSH server: found on version 1 of X800 Missile component set.","activity_events"],["2026-11-13T23:55","Snapshot taken","Daily job","Control status · WS-X90","174 of 560 controls satisfied","program_posture_snapshots"],["2026-11-13T20:22","Import queued","Joel Barrantes","DISA STIG checklist — internal Ethernet switch","","ingestion_jobs"],["2026-11-13T17:00","Evidence accepted","Nadia Fournier","Key store containment test report, LRU-003 export attempts and handle-only interface trace","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-13T14:00","Evidence accepted","Nadia Fournier","Separate-device factor test report, LRU-014 and LRU-019 local, network and remote paths","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-13T14:00","Evidence accepted","Nadia Fournier","Replay resistance test report, LRU-007 gateway and LRU-008 link authentication","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-13T14:00","Evidence sent back","Nadia Fournier","PIV path build and revocation check test report, LRU-017 and LRU-019","Does not settle the determination; the assessor asked for more before closing it.","evidence_reviews"],["2026-11-13T09:00","Evidence sent back","Nadia Fournier","Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-11-13T09:00","Evidence accepted","Nadia Fournier","Receiving inspection attestations, 24 units of LRU-004 / LRU-006 / LRU-008","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-13T09:00","Evidence sent back","Nadia Fournier","External exchange agreement register with interim-approval exceptions","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-11-13T09:00","Evidence sent back","Nadia Fournier","Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-11-13T02:15","Import validating","Joel Barrantes","Software bill of materials — Payload Interface Controller firmware","","ingestion_jobs"],["2026-11-12T17:00","Evidence accepted","Nadia Fournier","IA policy and IA procedure set, revision 2.4, signed export with review-flag report","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-12T16:00","Evidence accepted","Nadia Fournier","Privileged two-factor enforcement test report, LRU-013 and LRU-014, build 4.2.1","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-12T15:00","Results published","D. Okafor","WS-X90 Expanded Control Set Assessment","Security assessment report — expanded control set, increment 1: 225 findings.","activity_events"],["2026-11-12T14:00","Evidence accepted","Nadia Fournier","Boot chain signature verification test, out-of-set certificate injection on LRU-002","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-12T13:00","Evidence accepted","Nadia Fournier","Spill isolation test report, LRU-007 enclave session block and LRU-009 port isolation, 10-minute threshold","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-12T11:00","Evidence accepted","Nadia Fournier","Update package staging rejection test, single unsigned component in package UPD-5.4.1","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-12T02:15","Import importing","Joel Barrantes","ACAS vulnerability scan — mission network","","ingestion_jobs"],["2026-11-11T14:00","Evidence accepted","Nadia Fournier","Approved WS-X90 external network baseline showing the single managed access control point","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-11T11:00","Evidence sent back","Nadia Fournier","Privileged maintenance tool invocation log extract, LRU-014 to LRU-018","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-11-11T09:00","Evidence sent back","Nadia Fournier","Remote privileged command admission test report, approved list, attestation and window checks","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-11-11T09:00","Evidence accepted","Nadia Fournier","Installation privilege elevation test, LRU-019 maintenance session to LRU-001","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-11T09:00","Evidence accepted","Nadia Fournier","Inventory currency figure and unconfirmed record list, 30 operating days to 2026-11-10","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-10T16:00","Evidence accepted","Nadia Fournier","Configuration setting verification pass, security-relevant component set including LRU-004 and LRU-005","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-10T14:00","Evidence accepted","Nadia Fournier","Execution prevention test, unapproved image load refusal on LRU-001 in mission and maintenance mode","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-10T11:00","Evidence accepted","Nadia Fournier","Authorised software list and deny-all enforcement policy export, LRU-001 and LRU-013","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-10T11:00","Evidence accepted","Nadia Fournier","LRU replacement inventory delta test, maintenance action MA-2026-0177","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-10T09:00","Evidence accepted","Nadia Fournier","Maintenance tool authorization test report, LRU-014 session token enforcement","Matches the requirement's acceptance criteria and the Block 1 configuration.","evidence_reviews"],["2026-11-09T17:00","Evidence sent back","Nadia Fournier","Hardware identity comparison test report, LRU-013 power-on inventory check","Shows the requirement not met on at least one of its components; resubmit once the finding is closed.","evidence_reviews"],["2026-10-30T03:40","Import failed","Joel Barrantes","Container image scan — telemetry services","Rejected: SARIF 2.1.0 validation failed at runs[0].results[17].locations, which has no physicalLocation.","ingestion_jobs"],["2026-10-14T03:40","Import completed","Joel Barrantes","SCAP compliance scan — maintenance laptop (Windows 11)","286 rules: 259 pass, 21 fail, 6 not applicable; score 90.6%.","ingestion_jobs"],["2026-10-13T03:40","Import completed","Joel Barrantes","DISA STIG checklist — mission computing (RHEL 9)","412 rules: 371 not a finding, 29 open, 12 not applicable.","ingestion_jobs"],["2026-10-10T03:40","Import completed","Joel Barrantes","ACAS vulnerability scan — mission network, October","1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational.","ingestion_jobs"],["2026-09-28T02:15","Import cancelled","Joel Barrantes","Nessus scan — maintenance access gateway","Cancelled: superseded by the expanded control set assessment's adversarial testing.","ingestion_jobs"],["2026-09-18T19:00","Authorization decided","R. Calloway","WS-X90 Sentinel Mission System authorization package · version 1","authorized with conditions, effective 2026-09-18, expires 2029-09-17","authorization_decisions"],["2026-09-02T15:00","Package published","Priya Raghavan","WS-X90 Sentinel Mission System authorization package · version 1","6 documents","package_revisions"],["2026-08-28T15:00","Results published","D. Okafor","WS-X90 Initial Authorization Security Assessment","Security assessment report — initial authorization: 68 findings.","activity_events"],["2026-06-30T14:00","Inheritance accepted","Priya Raghavan","Corporate identity provider · 15 controls","SSP 2 and SSP 3","inheritance_acceptances"]];
  const CCP = [{"id":"idp","name":"Corporate identity provider","kind":"Enterprise service","real":true,"caps":[["IDP-CAP-SSO","Enterprise single sign-on",["IA-2","IA-8","AC-7","AC-12","IA-5(1)"],"Federate the boundary's applications to the enterprise identity provider and keep no local password store."],["IDP-CAP-MFA","Phishing-resistant multifactor authentication",["IA-2(1)","IA-2(2)","IA-2(8)","IA-5"],"Require the enterprise authenticator for every interactive logon to the boundary."],["IDP-CAP-ACCOUNTS","Account lifecycle management",["AC-2","AC-2(1)","AC-2(3)","IA-4"],"Map the boundary's roles to directory groups and complete the quarterly access review for them."],["IDP-CAP-PKI","Certificate issuance",["SC-17","IA-5(2)"],"Enroll the boundary's devices and validate certificate paths to the enterprise trust anchor."]],"accepted":"Jun 30 · Priya Raghavan","ssp":"SSP 2 and SSP 3"},{"id":"lab","name":"Integration laboratory hosting enclave","kind":"Hosting enclave","real":false,"caps":[["LAB-PHYS","Physical and environmental protection",["PE-2","PE-3","PE-6"],"Badge the program's staff through the enclave's access list."],["LAB-CONT","Backup and alternate processing",["CP-7","CP-9"],"Name the system's backup sets and test a restore each year."],["LAB-NET","Boundary and remote maintenance",["SC-7","MA-4"],"Route maintenance sessions through the enclave's jump hosts."]]},{"id":"cssp","name":"Cybersecurity service provider (CSSP)","kind":"CSSP","real":false,"caps":[["CSSP-IR","Incident handling and reporting",["IR-4","IR-4(1)","IR-5","IR-6"],"Report incidents to the CSSP within one hour and keep the contact roster current."],["CSSP-MON","Monitoring and log review",["SI-4","AU-6","AU-6(1)"],"Forward audit logs to the CSSP's collector."]]},{"id":"peo","name":"PEO enterprise services","kind":"PEO shared services","real":false,"caps":[["PEO-VM","Vulnerability management and advisories",["RA-5","SI-5","CA-7"],"Accept ACAS policies from the PEO and import scans on its cadence."],["PEO-KEY","Key management and provenance",["SC-12","SC-13","SR-4"],"Order keys through the PEO's key management office."]]}];
  const EN = [{"id":"u","name":"Unclassified","banner":"u","text":"UNCLASSIFIED","deploy":"Cloud · DoD IL2","programs":"5 corporate programs","ai":"Hosted model inside the IL2 tenancy","chat":"On","connect":"Online connectors allowed"},{"id":"cui","name":"CUI","banner":"","text":"CUI","deploy":"On-premises · program data center","programs":"WS-X90, Customer A, B and C","ai":"Model hosted inside the enclave; no prompt leaves it","chat":"Off","connect":"Files, and online only to hosts inside the enclave"},{"id":"s","name":"Classified enclave","banner":"s","text":"SECRET","deploy":"Air-gapped · SIPRNet","programs":"None drawn","ai":"Off unless the AO approves an on-enclave model","chat":"Off","connect":"Files by approved cross-domain transfer only"}];
  const DL = [["iava","IAVA","Vulnerabilities","ACAS results that carry an IAVA number, from release",21,"21–30","ACAS · 3 WS-X90 imports"],["iavb","IAVB","Vulnerabilities","ACAS results that carry an IAVB number, from release",30,"30–60","ACAS · 3 WS-X90 imports"],["cat1","STIG CAT I","STIG","Open CAT I rules in STIG checklists, from import",30,"14–30","29 open rules · RHEL 9 checklist"],["cat2","STIG CAT II","STIG","Open CAT II rules, from import",90,"60–90","29 open rules · RHEL 9 checklist"],["cat3","STIG CAT III","STIG","Open CAT III rules, from import",180,"90–365","29 open rules · RHEL 9 checklist"],["crit","Critical finding","Findings","Operational issues, from when opened",15,"7–15","2 open"],["high","High finding","Findings","Operational issues, from when opened",30,"15–30","12 open"],["mod","Moderate finding","Findings","Operational issues, from when opened",90,"60–90","Open moderate issues"],["low","Low finding","Findings","Operational issues, from when opened",180,"90–365","Open low issues"],["mile","POA&M milestone reminder","POA&M","Days before a milestone's planned date",14,"7–30","41 POA&M items"],["renew","Evidence renewal","Evidence","Accepted evidence, from its review",365,"180–365","368 artifacts · none with a date"],["access","Access review cycle","Accounts","AC-2 and AC-2(3), as the identity provider asks",90,"30–90","IDP-CAP-ACCOUNTS"]];
  const SB = [["busybox","1.36.1","1.36.1","application","GPL-2.0-only"],["chrony","4.5","4.5","application","GPL-2.0-only"],["dbus","1.14.10","1.14.10","application","AFL-2.1 OR GPL-2.0-or-later"],["glibc","2.39","2.39","library","LGPL-2.1-or-later"],["libpcap","1.10.4","1.10.4","library","BSD-3-Clause"],["linux","6.6.21","6.6.21","operating-system","GPL-2.0-only"],["mission-computer-image","1.0.0","1.0.0","firmware",null],["openssh-server","9.6p1","9.8p1","application","BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT"],["openssl","3.2.1","3.2.1","library","Apache-2.0"],["sqlite","3.45.1","3.45.1","library","blessing"],["systemd","255.4","255.4","application","LGPL-2.1-or-later"],["u-boot","2024.01","2024.01","firmware","GPL-2.0-or-later"],["zlib","1.3.1","1.3.1","library","Zlib"]];
  const X800 = {"els":[["GS","Guidance Section","subsystem",null,null,null,["A","B","C"],0,0],["GS-MC","Mission Computer","hardware","GS","Mission Computer",1,["A","B","C"],54,44],["GS-OFP","Operational Flight Program","software","GS","Operational Flight Program",1,["A","B","C"],47,41],["GS-NAV","Navigation Unit","hardware","GS","Navigation Unit",1,["A","B","C"],13,7],["GS-SKR","Seeker Interface Unit","hardware","GS","Seeker Interface Unit",1,["A","B","C"],7,6],["CS","Communications Section","subsystem",null,null,null,["A","B","C"],0,0],["CS-DL","Datalink Radio","hardware","CS","Datalink Radio",1,["A","B","C"],22,20],["CS-CRY","Cryptographic Module","hardware","CS","Cryptographic Module",1,["A","B","C"],26,20],["CS-KL","Key Load Interface","hardware","CS","Key Load Interface",1,["A","B","C"],16,14],["PS","Platform Services","subsystem",null,null,null,["A","B","C"],0,0],["PS-BOOT","Secure Boot Firmware","software","PS","Secure Boot Firmware",1,["A","B","C"],30,24],["PS-TLM","Telemetry Unit","hardware","PS","Telemetry Unit",1,["A","B","C"],14,13],["PS-PWR","Power Conditioning Unit","hardware","PS",null,null,["A","B","C"],0,0],["PS-MX","Maintenance Port","hardware","PS","Maintenance Port",1,["A","B","C"],23,21],["SE","Support Equipment","subsystem",null,null,null,["A","B","C"],0,0],["SE-TS","Field Test Set","hardware","SE","Field Test Set",1,["A","B","C"],25,21],["SE-MDL","Mission Data Loader","software","SE","Mission Data Loader",1,["A","B","C"],22,20],["LA","Rail Launch Interface","subsystem",null,null,null,["A"],0,0],["LA-UMB","Rail Umbilical Interface Unit","hardware","LA","Rail Umbilical Interface Unit",1,["A"],28,26],["LB","Eject Launch Interface","subsystem",null,null,null,["B"],0,0],["LB-EJ","Ejector Interface Unit","hardware","LB","Ejector Interface Unit",1,["B"],14,13],["LB-SEP","Separation Sensor","hardware","LB","Separation Sensor",1,["B"],9,8],["LC","Palletized Launch Interface","subsystem",null,null,null,["C"],0,0],["LC-PC","Pallet Controller","hardware","LC","Pallet Controller",1,["C"],29,27],["LC-PDL","Pallet Datalink Node","hardware","LC","Pallet Datalink Node",1,["C"],27,16],["LC-PFW","Pallet Controller Firmware","software","LC","Pallet Controller Firmware",1,["C"],39,22],["PS-HMU","Health Monitoring Unit","hardware","PS",null,null,["A","B","C"],30,22]],"cfgs":[["ea161a8c-e991-8658-b805-127cbca13cbb","A","Lug & Rail Launch",20],["b0eec933-668b-b7af-616d-fba13af4fa06","B","Eject Launch",21],["30d44ee5-7b97-41bd-cc52-6c57d5493818","C","Palletized Launch",22]],"tot":{"scopes":{"core":{"satisfied":161,"not_covered":147,"not_assessed":4,"partially_satisfied":34,"other_than_satisfied":24},"30d44ee5-7b97-41bd-cc52-6c57d5493818":{"satisfied":168,"not_covered":125,"not_assessed":2,"partially_satisfied":40,"other_than_satisfied":35},"b0eec933-668b-b7af-616d-fba13af4fa06":{"satisfied":170,"not_covered":135,"not_assessed":5,"partially_satisfied":35,"other_than_satisfied":25},"ea161a8c-e991-8658-b805-127cbca13cbb":{"satisfied":169,"not_covered":136,"not_assessed":5,"partially_satisfied":36,"other_than_satisfied":24}},"differs":54,"controls":370,"satisfied_everywhere":149},"core":18};
  const DELTA_A = {"changed":[{"code":"CS-CRY","n":"Cryptographic Module","change":"modified","kinds":["firmware"],"controls":26},{"code":"SE-MDL","n":"Mission Data Loader","change":"removed","kinds":[],"controls":24},{"code":"GS-OFP","n":"Operational Flight Program","change":"modified","kinds":["data","software"],"controls":50}],"fams":[{"f":"AC","t":"Access Control","n":47,"inh":24,"sh":7,"ch":8,"po":8},{"f":"AT","t":"Awareness and Training","n":6,"inh":0,"sh":0,"ch":0,"po":6},{"f":"AU","t":"Audit and Accountability","n":25,"inh":13,"sh":6,"ch":0,"po":6},{"f":"CA","t":"Assessment, Authorization, and Monitoring","n":14,"inh":8,"sh":0,"ch":0,"po":6},{"f":"CM","t":"Configuration Management","n":33,"inh":7,"sh":1,"ch":19,"po":6},{"f":"CP","t":"Contingency Planning","n":35,"inh":0,"sh":0,"ch":0,"po":35},{"f":"IA","t":"Identification and Authentication","n":26,"inh":7,"sh":4,"ch":10,"po":5},{"f":"IR","t":"Incident Response","n":18,"inh":0,"sh":0,"ch":0,"po":18},{"f":"MA","t":"Maintenance","n":12,"inh":7,"sh":3,"ch":0,"po":2},{"f":"MP","t":"Media Protection","n":10,"inh":1,"sh":0,"ch":3,"po":6},{"f":"PE","t":"Physical and Environmental Protection","n":24,"inh":9,"sh":2,"ch":0,"po":13},{"f":"PL","t":"Planning","n":7,"inh":2,"sh":0,"ch":0,"po":5},{"f":"PS","t":"Personnel Security","n":10,"inh":0,"sh":0,"ch":0,"po":10},{"f":"RA","t":"Risk Assessment","n":11,"inh":7,"sh":0,"ch":0,"po":4},{"f":"SA","t":"System and Services Acquisition","n":21,"inh":12,"sh":0,"ch":5,"po":4},{"f":"SC","t":"System and Communications Protection","n":31,"inh":6,"sh":4,"ch":18,"po":3},{"f":"SI","t":"System and Information Integrity","n":29,"inh":5,"sh":0,"ch":19,"po":5},{"f":"SR","t":"Supply Chain Risk Management","n":15,"inh":5,"sh":0,"ch":0,"po":10}]};

  // ——— Small pieces ———
  const route = () => (location.hash || "").slice(1);
  const btn = (label, attrs = "", ink = false, sm = true) => `<span class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const lnk = (label, attrs) => `<span class="ak-link" role="link" tabindex="0" ${attrs}>${esc(label)}</span>`;
  const mu = (t) => `<span class="v7o-mu">${t}</span>`;
  const num = (t) => `<span class="num">${t}</span>`;
  const ring = (t) => `<span class="v7o-ring">${gl("ring")}${esc(t)}</span>`;
  const tr = (s, w) => `<span class="v7o-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const two = (top, sub, w) => `<span class="v7o-2l"${w ? ` style="width:${w}px;max-width:100%"` : ""}><span class="v7o-2t">${top}</span>${sub ? `<span class="v7o-2s">${sub}</span>` : ""}</span>`;
  const toast = (t) => `data-v7o-toast="${esc(t)}"`;
  const plural = (n, w, ws) => `${fmt(n)} ${n === 1 ? w : ws || w + "s"}`;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const share = (a, b) => `<span class="v7o-share"><span class="ak-donut" style="--p:${pct(a, b)}" aria-hidden="true"></span><b class="num">${pct(a, b)}%</b>${mu(`<span class="num">${fmt(a)} of ${fmt(b)}</span>`)}</span>`;
  const frac = (a, b, col = "var(--ok)") => `<span class="v7o-frac"><span class="num">${fmt(a)} of ${fmt(b)}</span><span class="v7o-mbar" aria-hidden="true"><i style="width:${pct(a, b)}%;background:${col}"></i></span></span>`;
  const stack = (parts, total) => `<div class="stack v7o-stack" aria-hidden="true">${parts.filter(([n]) => n).map(([n, c]) => `<i style="width:${(n / total) * 100}%;background:${c}"></i>`).join("")}</div>`;
  const legend = (parts) => `<div class="legend v7o-legend">${parts.map(([n, c, l]) => `<span style="--c:${c}">${esc(l)} <b class="num">${fmt(n)}</b></span>`).join("")}</div>`;
  const ch = (title, count, action = "") => `<div class="v7o-ch"><b>${esc(title)}</b>${count != null ? `<span class="ct num">${esc(count)}</span>` : ""}${action ? `<span class="v7o-push">${action}</span>` : ""}</div>`;
  const li = (lead, main, end = "") => `<div class="v7o-li">${lead}<span class="x">${main}</span>${end ? `<span class="v7o-le">${end}</span>` : ""}</div>`;
  const banner = (tone, text, action = "") => AK.banner({ tone, text, co: action ? `<span class="v7o-bact">${action}</span>` : "" });
  const pan = (o, ...parts) => `<div class="v7o-pan">${AK.recordHead(o)}${parts.join("")}</div>`;
  const ownerEdit = (n, modal = "v7o-owner") => `<span class="v7o-own" role="button" tabindex="0" data-modal="${modal}" title="Change owner">${AK.owner(n)}${AK.i("pen")}</span>`;
  const lc = (t) => (/^[A-Z]{2}/.test(t) ? t : t[0].toLowerCase() + t.slice(1));
  const sysChip = (t) => `<span class="v7o-sys">${AK.i("gear")}${esc(t)}</span>`;

  const ST = {
    satisfied: ["ok", "Satisfied", "var(--ok)"], partially_satisfied: ["part", "Partially satisfied", "var(--warn)"],
    other_than_satisfied: ["bad", "Other than satisfied", "var(--bad)"], to_review: ["warn", "To review", "var(--warn)"],
    not_assessed: ["info", "Not assessed", "var(--info)"], no_evidence: ["none", "No evidence", "var(--ink-4)"], no_requirement: ["none", "No requirement", "var(--track)"],
  };
  const stPill = (s) => (ST[s] ? pill(ST[s][0], ST[s][1]) : pill("none", s));

  function tbl({ cols, rows, total, panel = "", label = "", cls = "", pager = true, empty = "Nothing matches this view." }) {
    const body = rows.length ? rows.map((r) => {
      const pk = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` data-go="${esc(r.go)}"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id == null ? "" : r.id)}"` : "";
      return `<tr${r.go || pk ? ' tabindex="0"' : ""}${r.cls ? ` class="${r.cls}"` : ""}${attrs}>${r.raw || r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="v7o-empty"><td colspan="${cols.length}">${ring(empty)}</td></tr>`;
    const shown = rows.filter((r) => !r.grp).length;
    return `<div class="frame v7o-frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${shown ? `1–${shown} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }
  const QV = {};
  const qv = (key, def) => QV[key] || def;
  const chips = (key, list) => { const on = QV[key] || list[0][0]; return `<div class="views v7o-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv v7o-qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-v7o-q="${esc(key)}" data-v7o-v="${esc(v)}">${esc(l)} <span class="num">${fmt(n)}</span></button>`).join("")}</div>`; };
  const filters = (search, list, end = "") => `<div class="tools v7o-tools"><span class="in">${esc(search)}</span>${list.map((f) => (f.startsWith("<") ? f : `<span class="flt">${esc(f)} ⌄</span>`)).join("")}<span class="flt sub">+ Add filter</span>${end ? `<span class="v7o-push">${end}</span>` : ""}</div>`;
  const items = (list) => list.map(([l, a = "", s = ""]) => `<span role="menuitem" tabindex="0" class="v7o-mi" ${a}>${l}${s ? `<span class="s">${s}</span>` : ""}</span>`).join("");
  const dd = (label, list, { ink = false, sm = false, start = false } = {}) => `<details class="v7o-dd"><summary class="btn${ink ? " ink" : ""}${sm ? " sm" : ""}">${label}${AK.i("down")}</summary><div class="v7o-menu${start ? " start" : ""}" role="menu">${items(list)}</div></details>`;
  const more = (label, list) => `<details class="v7o-dd"><summary class="btn" aria-label="${esc(label)}" title="${esc(label)}">${AK.i("dots")}</summary><div class="v7o-menu" role="menu">${items(list)}</div></details>`;
  const REQ = ' <span class="req">Required</span>', OPT = ' <span class="opt">Optional</span>';
  const field = (label, control, flag = "", hint = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const select = (v) => `<div class="ak-select">${esc(v)} ${AK.i("down")}</div>`;
  const input = (v, tall = false, filled = false) => `<div class="ak-input${tall ? " tall" : ""}${filled ? " v7o-val" : ""}">${esc(v)}</div>`;
  const radio = (label, on, hint = "") => `<div class="v7o-radio${on ? " on" : ""}"><span class="v7o-dot" aria-hidden="true"></span><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span></div>`;
  const checkRow = (label, on, hint = "") => `<div class="v7o-radio">${AK.check(on)}<span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span></div>`;
  const foot = (primary, t) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal${t ? " " + toast(t) : ""}>${esc(primary)}</button>`;
  const kv = (rows) => `<dl class="ak-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const noteReal = (t) => `<p class="note-p v7o-note">${esc(t)}</p>`;
  const remind = (last, t) => AK.remind({ last }).replace('<span class="btn sm">', `<span class="btn sm" role="button" tabindex="0" ${toast(t)}>`);

  // ═════════════ 1. Portfolio ═════════════
  // c: [controls, satisfied, partially, other than, not assessed, no evidence, no requirement], the Nov 17 snapshot; d: satisfied since Nov 13.
  const BL = { AD: { n: "Air Defense", own: "Priya Raghavan" }, MS: { n: "Mission Systems", own: "Marcus Ryde" } };
  const PROGS = [
    { code: "PRG-2101", n: "Customer A · X800 Rail Integration", bl: "AD", own: "Dan Whitfield", sp: "Priya Raghavan", st: "Active", c: [374, 116, 29, 33, 3, 0, 193], d: 0, gate: ["Customer cryptographic suite integration review", "2026-11-23", "At risk"], vars: [["X800-A-CUSA", "X800 Missile", 1, 2], ["R210-STD-CUSA", "R210 Launcher Electronics Unit", 2, 2]], camp: 3, go: "products-delta", goL: "Open product delta" },
    { code: "PRG-2102", n: "Customer B · X800 Palletized Integration", bl: "AD", own: "Hana Lindqvist", sp: "Victor Amsel", st: "Active", c: [370, 143, 35, 28, 4, 0, 160], d: 0, gate: ["Variant security plan approval", "2026-11-16", "In review"], vars: [["X800-C-CUSB", "X800 Missile", 2, 2]], camp: 2 },
    { code: "PRG-2201", n: "Customer C · G25 Battery Control Fielding", bl: "MS", own: null, sp: "Marcus Ryde", st: "Active", c: [287, 56, 22, 15, 3, 0, 191], d: 0, gate: ["Customer configuration review", "2026-11-19", "In review"], vars: [["G25-VEH-CUSC", "G25 Launch Control Station", 1, 1], ["G40-TRN-CUSC", "G40 Ground Terminal", 1, 1]], camp: 3 },
    { code: "PRG-1090", n: "WS-X90 Sentinel Mission System", bl: null, own: "Ray Colston", st: "Active", c: [560, 176, 34, 13, 90, 233, 14], d: 2, gate: ["CDR", "2026-10-01", "Not started"], ato: ["Authorized with conditions", "Sep 18, 2026", "2029-09-17"], libs: [["Mission Computer", "X800 Missile component set", 1, 2], ["Audit Log Collector", "G25 launch control component set", 1, 1]], camp: 3, go: "overview", goL: "Open program" },
    { code: "PRG-0994", n: "Legacy billing gateway", bl: null, own: null, st: "Active", c: [149, 0, 0, 0, 0, 0, 149], d: 0, gate: ["System Requirements Review", "2025-04-22", "In review"], ato: ["Denied", "Jun 12, 2026", null, "The authorization of Jun 1, 2023 expired May 31, 2026"] },
    { code: "PRG-1007", n: "Field operations mobile", bl: null, own: "Priya Raghavan", st: "Planned", c: [287, 0, 0, 0, 0, 0, 287], d: 0, gate: ["Initial Operational Capability", "2026-11-19", "In review"] },
    { code: "PRG-1013", n: "Corporate identity provider", bl: null, own: null, st: "Active", c: [287, 0, 0, 0, 0, 0, 287], d: 0, gate: ["AO approval of RMF strategy", "2025-08-21", "Blocked"], go: "common-controls", goL: "Open provider" },
    { code: "PRG-1028", n: "Northwind data warehouse", bl: null, own: "Marcus Ryde", st: "Active", c: [287, 0, 0, 0, 0, 0, 287], d: 0, gate: ["Critical Design Review", "2025-12-12", "In review"] },
    { code: "PRG-1041", n: "Atlas payments platform", bl: null, own: null, st: "Active", c: [287, 0, 0, 0, 0, 5, 282], d: 0, gate: ["Milestone C decision", "2026-08-20", "Not started"], ato: ["Authorized with conditions", "Oct 2, 2026", "2029-10-01"], camp: 3 },
  ];
  const GATE_TONE = { "Not started": "none", "In review": "info", "At risk": "warn", Blocked: "bad" };
  const statusParts = (c) => [[c[1], ST.satisfied[2], "Satisfied"], [c[2], ST.partially_satisfied[2], "Partially satisfied"], [c[3], ST.other_than_satisfied[2], "Other than satisfied"], [c[4], ST.not_assessed[2], "Not assessed"], [c[5], ST.no_evidence[2], "No evidence"], [c[6], ST.no_requirement[2], "No requirement"]];
  const builtCell = (p) => p.vars ? two(num(plural(p.vars.length, "product")), p.vars.some((v) => v[2] < v[3]) ? pill("warn", "1 behind") : "")
    : p.libs ? two(num(plural(p.libs.length, "component")), pill("warn", "1 behind")) : mu("Nothing shared");
  const progCell = (p) => `<span class="v7o-inl" title="${esc(p.code)}"><b class="v7o-name v7o-tr" style="max-width:245px">${esc(p.n)}</b>${p.st === "Planned" ? tag("Planned") : ""}</span>`;
  const PF_F = { all: () => true, product: (p) => !!p.vars, late: (p) => days(p.gate[1]) < 0, noown: (p) => !p.own };
  S.portfolio = () => {
    const f = PF_F[qv("pf", "all")] || PF_F.all;
    const rows = [];
    for (const bl of ["AD", "MS", null]) {
      const list = PROGS.filter((p) => p.bl === bl && f(p));
      if (!list.length) continue;
      const head = bl ? `<span class="v7o-grp-n">${esc(BL[bl].n)}</span>${mu(`${plural(PRODUCTS.filter((x) => x.bl === bl).length, "product")} · ${plural(PROGS.filter((p) => p.bl === bl).length, "program")}`)}${AK.owner(BL[bl].own)}`
        : `<span class="v7o-grp-n">No business line</span>${mu(plural(PROGS.filter((p) => !p.bl).length, "program"))}`;
      rows.push({ grp: true, cls: "v7o-grp", panel: bl ? "v7o-bl" : "", id: bl || "", raw: `<td colspan="6"><span class="v7o-grp-in">${head}</span></td>` });
      for (const p of list) rows.push({ id: p.code, go: p.code === "PRG-1090" ? "overview" : "", cells: [progCell(p), share(p.c[1], p.c[0]), p.d ? `<span class="v7o-delta up">+${p.d} controls</span>` : mu("No change"), AK.owner(p.own), two(AK.due(p.gate[1], { prefix: false }), esc(p.gate[0]), 212), builtCell(p)] });
    }
    return h.page(
      AK.indexHead({ title: "Portfolio", desc: `The workspace's ${PROGS.length} programs by business line, with where each stands today`,
        actions: `${more("More portfolio actions", [["Create business line", 'data-modal="v7o-new-bl"'], ["Create product", 'data-modal="v7o-new-product"'], ["Export", toast("Portfolio exported (.csv)")]])}${btn("Create program", 'data-go="program-new"', true, false)}` }),
      chips("pf", [["all", "All", PROGS.length], ["product", "Built from a product", 3], ["late", "Next gate past due", PROGS.filter(PF_F.late).length], ["noown", "No owner", PROGS.filter(PF_F.noown).length]]),
      filters("Search programs", ["Business line", "Owner", "Status"]),
      tbl({ cols: ["Program", "Controls satisfied", "Since Nov 13", "Owner", "Next gate", "Built from"], rows, total: PROGS.filter(f).length, panel: "v7o-prog", cls: "v7o-tight", label: "Programs" }),
      AK.note("The reminders in a program's panel are proposed. Controls satisfied is each program's Nov 17 snapshot, the change counts from Nov 13 (the first snapshot), Owner is the recorded system owner and Next gate the earliest gate not yet passed."),
    );
  };
  P["v7o-prog"] = (code) => {
    const p = PROGS.find((x) => x.code === code) || PROGS[3];
    const late = days(p.gate[1]) < 0;
    const parts = statusParts(p.c);
    const built = p.vars ? AK.card(`${ch("Built from", p.vars.length)}${p.vars.map(([sys, prod, v, latest]) => li(gl(v < latest ? "clock" : "check"), `<b>${esc(sys)}</b> · ${esc(prod)} version ${v}`, v < latest ? pill("warn", "1 behind") : pill("ok", "Current"))).join("")}
        ${p.vars.some((v) => v[2] < v[3]) ? `<div class="v7o-nudge">${gl("info")}<span>X800 Missile version 2 is published. Taking it keeps what the program changed.</span>${btn("Take version 2", 'data-modal="v7o-take-product"', true)}</div>` : ""}`)
      : p.libs ? AK.card(`${ch("Shared components", p.libs.length)}${p.libs.map(([n, set, v, latest]) => li(gl(v < latest ? "clock" : "check"), `<b>${esc(n)}</b> · ${esc(set)} version ${v}`, v < latest ? pill("warn", "1 behind") : pill("ok", "Current"))).join("")}
        <div class="v7o-nudge">${gl("info")}<span>Mission Computer version 2, published Nov 12, fixes CVE-2024-6387.</span>${btn("Open component", 'data-go="component-mc"')}</div>`) : "";
    return { label: "Program preview", body: pan({ title: p.n, chip: pill(p.st === "Planned" ? "none" : "ok", p.st), actions: p.go ? btn(p.goL, `data-go="${p.go}"`, true) : "",
      facts: [["Code", esc(p.code)], ["Owner", AK.owner(p.own)], ["Business line", p.bl ? esc(BL[p.bl].n) : mu("None")]].concat(p.sp ? [["Sponsor", AK.owner(p.sp)]] : []) },
      AK.card(`${ch("Control status", null, mu(`<span class="num">${fmt(p.c[0])} controls</span>`))}<div class="v7o-big num">${pct(p.c[1], p.c[0])}%<span class="v7o-mu"> satisfied</span></div>${stack(parts, p.c[0])}${legend(parts.filter(([v]) => v))}`),
      AK.card(`${ch("Next gate", null, pill(GATE_TONE[p.gate[2]] || "none", p.gate[2]))}${li(gl(late ? "diamond" : "clock"), esc(p.gate[0]), AK.due(p.gate[1]))}${late ? `<div class="v7o-rem">${remind(null, `Reminder sent to ${p.own || "the program's ISSO"}`)}${EX}</div>` : ""}`),
      AK.card(`${ch("Authorization")}${p.ato ? li(gl(p.ato[0] === "Denied" ? "diamond" : "check"), `${esc(p.ato[0])} · ${esc(p.ato[1])}`, p.ato[2] ? `Expires ${md(p.ato[2])}` : "") + (p.ato[3] ? `<p class="v7o-p v7o-mu">${esc(p.ato[3])}.</p>` : "") : li(gl("ring"), mu("No authorization decision recorded"))}${p.camp ? li(gl("info"), `${plural(p.camp, "assessment campaign")} planned or active`) : ""}`),
      built) };
  };
  P["v7o-bl"] = (code) => {
    const b = BL[code] || BL.AD;
    const prods = PRODUCTS.filter((x) => x.bl === code), progs = PROGS.filter((p) => p.bl === code);
    return { label: "Business line preview", body: pan({ title: b.n, chip: pill("ok", "Active"), actions: btn("Edit business line", 'data-modal="v7o-new-bl"'), facts: [["Code", code], ["Owner", AK.owner(b.own)]] },
      AK.card(`${ch("Products", prods.length)}${prods.map((x) => li(tag(x.code), `<b>${esc(x.n)}</b>`, `Version ${x.v} · ${plural(x.cfgs.filter((c) => c[0] !== "CORE").length, "configuration")}`)).join("")}`),
      AK.card(`${ch("Programs", progs.length)}${progs.map((p) => li(gl("check"), esc(p.n), `${pct(p.c[1], p.c[0])}% satisfied`)).join("")}`)) };
  };

  // ═════════════ 2. Products and the variant delta ═════════════
  // cfgs: [code, name, elements, controls satisfied in that scope, variant system, program, variant's version]
  const PRODUCTS = [
    { code: "X800", n: "X800 Missile", bl: "AD", v: 2, vs: 2, els: 27, ctl: 370, every: 149, differs: 54, a: ["X800 Missile version 2 product assessment", "Elena Vasquez", "2026-11-10"],
      cfgs: [["CORE", "Core · in every configuration", 18, 161], ["A", "Lug & Rail Launch", 20, 169, "X800-A-CUSA", "Customer A", 1], ["B", "Eject Launch", 21, 170], ["C", "Palletized Launch", 22, 168, "X800-C-CUSB", "Customer B", 2]] },
    { code: "R210", n: "R210 Launcher Electronics Unit", bl: "AD", v: 2, vs: 2, els: 3, ctl: 370, every: 73, differs: 0, a: ["R210 Launcher Electronics Unit version 2 product assessment", "Ray Colston", "2026-10-30"],
      cfgs: [["STD", "Standard", 3, 73, "R210-STD-CUSA", "Customer A", 2]] },
    { code: "G25", n: "G25 Launch Control Station", bl: "MS", v: 1, vs: 1, els: 13, ctl: 287, every: 94, differs: 16, a: ["G25 Launch Control Station version 1 product assessment", "Ray Colston", "2026-07-17"],
      cfgs: [["SHL", "Shelter", 11, 98], ["VEH", "Vehicle-Mounted", 11, 103, "G25-VEH-CUSC", "Customer C", 1]] },
    { code: "G40", n: "G40 Ground Terminal", bl: "MS", v: 1, vs: 1, els: 4, ctl: 287, every: 60, differs: 0, a: ["G40 Ground Terminal version 1 product assessment", "Elena Vasquez", "2026-11-06"], draft: "G40 Ground Terminal version 1 against the High baseline",
      cfgs: [["FIX", "Fixed Site", 4, 60], ["TRN", "Transportable", 4, 60, "G40-TRN-CUSC", "Customer C", 1]] },
  ];
  // t: [controls, inherited, shared, changed here, program only]; el: [inherited, modified, removed, added], from variant_control_delta.
  const VARS = [
    { sys: "X800-A-CUSA", pn: "Customer A · X800 Rail Integration", prog: "PRG-2101", product: "X800", pv: 1, latest: 2, cfg: "Lug & Rail Launch", t: [374, 113, 27, 82, 152], el: [16, 2, 1, 1], a: "X800 Missile version 1 product assessment" },
    { sys: "R210-STD-CUSA", pn: "Customer A · X800 Rail Integration", prog: "PRG-2101", product: "R210", pv: 2, latest: 2, cfg: "Standard", t: [374, 60, 11, 37, 266], el: [2, 1, 0, 0], a: "R210 Launcher Electronics Unit version 2 product assessment" },
    { sys: "X800-C-CUSB", pn: "Customer B · X800 Palletized Integration", prog: "PRG-2102", product: "X800", pv: 2, latest: 2, cfg: "Palletized Launch", t: [370, 152, 40, 53, 125], el: [20, 2, 0, 2], a: "X800 Missile version 2 product assessment" },
    { sys: "G25-VEH-CUSC", pn: "Customer C · G25 Battery Control Fielding", prog: "PRG-2201", product: "G25", pv: 1, latest: 1, cfg: "Vehicle-Mounted", t: [287, 84, 17, 34, 152], el: [10, 1, 0, 1], a: "G25 Launch Control Station version 1 product assessment" },
    { sys: "G40-TRN-CUSC", pn: "Customer C · G25 Battery Control Fielding", prog: "PRG-2201", product: "G40", pv: 1, latest: 1, cfg: "Transportable", t: [287, 65, 12, 27, 183], el: [3, 1, 0, 0], a: "G40 Ground Terminal version 1 product assessment" },
  ];
  const DCOL = ["var(--ok)", "var(--info)", "var(--warn)", "var(--ink-4)"];
  const DNAME = ["Inherited", "Shared", "Changed here", "Program only"];
  const deltaParts = (t) => t.slice(1).map((n, i) => [n, DCOL[i], DNAME[i]]);
  const prodName = (code) => (PRODUCTS.find((x) => x.code === code) || PRODUCTS[0]).n;
  const KINDN = { subsystem: "Subsystem", hardware: "Hardware", software: "Software", firmware: "Firmware" };
  const prodHead = () => AK.indexHead({ title: "Products", desc: "Each version is assessed once, by configuration; a variant owes only what it changes",
    actions: `${more("More product actions", [["Create business line", 'data-modal="v7o-new-bl"'], ["Compare versions", 'data-panel="v7o-product" data-id="X800"'], ["Export", toast("Products exported (.csv)")]])}${btn("Create product", 'data-modal="v7o-new-product"', true, false)}` });
  const prodTabs = (cur) => AK.tabs([["Products", 4, "products", cur === "products"], ["Variant delta", VARS.length, "products-delta", cur === "delta"]], "Products");
  const takeBanner = () => banner("warn", "<b>X800 Missile version 2</b> is published, and Customer A's X800-A-CUSA is still on version 1.", btn("Review update", 'data-modal="v7o-take-product"'));
  S.products = () => {
    const rows = [];
    for (const bl of ["AD", "MS"]) {
      const list = PRODUCTS.filter((x) => x.bl === bl);
      rows.push({ grp: true, cls: "v7o-grp", panel: "v7o-bl", id: bl, raw: `<td colspan="6"><span class="v7o-grp-in"><span class="v7o-grp-n">${esc(BL[bl].n)}</span>${mu(plural(list.length, "product"))}${AK.owner(BL[bl].own)}</span></td>` });
      for (const x of list) {
        const vars = x.cfgs.filter((c) => c[4]);
        const behind = vars.filter((c) => c[6] < x.v).length;
        rows.push({ id: x.code, panel: "v7o-product", cells: [`<span class="v7o-inl"><b class="v7o-name">${esc(x.n)}</b><span class="v7o-code">${esc(x.code)}</span></span>`, num(x.els), frac(x.every, x.ctl), `Version ${x.v}`, `<span class="v7o-inl">${pill("ok", "Published")}${mu(md(x.a[2]))}</span>`,
          `<span class="v7o-inl">${num(plural(vars.length, "program"))}${behind ? pill("warn", `${behind} behind`) : ""}</span>`] });
        for (const c of x.cfgs) rows.push({ id: c[4] || x.code, panel: c[4] ? "v7o-variant" : "v7o-product", cls: "v7o-sub", cells: [`<span class="v7o-inl">${c[0] === "CORE" ? "" : `<span class="v7o-code v7o-c0">${esc(c[0])}</span>`}${esc(c[1])}</span>`, num(c[2]), frac(c[3], x.ctl, "var(--ok)"), "", "",
          c[4] ? `<span class="v7o-inl">${esc(c[5])} · ${esc(c[4])}${c[6] < x.v ? pill("warn", `On version ${c[6]}`) : ""}</span>` : c[0] === "CORE" ? "" : ring("No program yet")] });
      }
    }
    return h.page(prodHead(), prodTabs("products"), takeBanner(),
      tbl({ cols: ["Product or configuration", "Elements", "Controls satisfied", "Version", "Product assessment", "Programs built from it"], rows, total: 4, panel: "v7o-product", cls: "v7o-tight", label: "Products", pager: false }),
      noteReal("Nothing on this tab is invented. A product's Controls satisfied counts those satisfied in every configuration; a configuration's counts its own. Core is the elements every configuration includes."));
  };
  S["products-delta"] = () => {
    const owed = VARS.reduce((s, v) => s + v.t[3] + v.t[4], 0);
    return h.page(prodHead(), prodTabs("delta"),
      banner("info", `Across 5 variants, <b>${fmt(owed)} controls</b> are owed an assessment: those changed here and those the product gives nothing for.`, btn("Plan delta assessment", 'data-modal="v7o-plan-delta" data-id="X800-A-CUSA"')),
      `<div class="v7o-legendrow">${legend(DNAME.map((l, i) => [VARS.reduce((s, v) => s + v.t[i + 1], 0), DCOL[i], l]))}</div>`,
      tbl({ cols: ["Variant", "Program", "Product", "Delta", "Inherited", "Shared", "Changed here", "Program only", "Owed"], rows: VARS.map((v) => ({ id: v.sys, cells: [
        `<span class="v7o-inl"><b class="v7o-name">${esc(v.sys)}</b>${v.pv < v.latest ? pill("warn", "1 behind") : ""}</span>`, tr(v.pn.split(" · ")[0], 120), tr(`${prodName(v.product)} v${v.pv}`, 165),
        `<span class="v7o-dbar">${stack(deltaParts(v.t), v.t[0])}</span>`, num(v.t[1]), num(v.t[2]), num(v.t[3]), num(v.t[4]), `<b class="num">${v.t[3] + v.t[4]}</b> ${mu(`<span class="num">of ${v.t[0]}</span>`)}`] })), total: 5, panel: "v7o-variant", cls: "v7o-tight", label: "Variant delta", pager: false }),
      noteReal("Nothing on this tab is invented: each variant's delta is variant_control_delta, read on Nov 17. Owed is changed here plus program only."));
  };
  P["v7o-product"] = (code) => {
    const x = PRODUCTS.find((p) => p.code === code) || PRODUCTS[0];
    const vars = x.cfgs.filter((c) => c[4]);
    const behind = vars.filter((c) => c[6] < x.v);
    const structure = x.code === "X800" ? AK.card(`${ch("Structure", X800.els.length)}<div class="v7o-els">${X800.els.map(([cd, n, type, parent, lib, libver, cfgs, ctl, sat]) => li(`<span class="ak-code">${esc(cd)}</span>`, `${parent ? "" : "<b>"}${esc(n)}${parent ? "" : "</b>"} ${mu(esc(KINDN[type] || type))}`, cd === "GS-MC" ? pill("warn", "Library v1 · 1 behind") : ctl ? `${sat} of ${ctl} satisfied` : cfgs.length < 3 ? `Configuration ${cfgs.join(", ")}` : "")).join("")}</div>`) : "";
    return { label: "Product preview", body: pan({ title: x.n, chip: pill("ok", `Version ${x.v} · Published`), actions: btn("Create configuration", toast("Configuration drafted")),
      facts: [["Business line", esc(BL[x.bl].n)], ["Owner", AK.owner(BL[x.bl].own)], ["Elements", num(x.els)], ["Versions", num(x.vs)]] },
      behind.length ? `<div class="v7o-nudge">${gl("clock")}<span>${behind.map((c) => `${esc(c[5])}'s ${esc(c[4])}`).join(", ")} is on version ${behind[0][6]}. Version ${x.v} keeps what the program changed.</span>${btn("Remind Customer A", toast("Reminder sent to Customer A's ISSO, Nadia Fournier"))}${btn(`Take version ${x.v}`, 'data-modal="v7o-take-product"', true)}</div>` : "",
      AK.card(`${ch("Product assessment", null, pill("ok", "Published"))}${kv([["Assessment", esc(x.a[0])], ["Assessor", AK.owner(x.a[1])], ["Completed", md(x.a[2])], ["In every configuration", `${frac(x.every, x.ctl)}`], ["Differ by configuration", num(x.differs)]])}${x.draft ? li(gl("ring"), `${esc(x.draft)} ${mu("Draft")}`) : ""}`),
      AK.card(`${ch("Configurations", x.cfgs.filter((c) => c[0] !== "CORE").length)}${x.cfgs.map((c) => li(c[0] === "CORE" ? gl("check") : `<span class="ak-code">${esc(c[0])}</span>`, `${esc(c[1])} ${mu(`<span class="num">${c[2]} elements</span>`)}`, `${c[3]} of ${x.ctl} satisfied`)).join("")}`),
      AK.card(`${ch("Programs built from it", vars.length)}${vars.length ? vars.map((c) => li(gl(c[6] < x.v ? "clock" : "check"), `<b>${esc(c[4])}</b> · ${esc(c[5])}`, c[6] < x.v ? pill("warn", `Version ${c[6]} · 1 behind`) : pill("ok", `Version ${c[6]} · current`))).join("") : `<p class="v7o-p v7o-mu">No program is built from it yet.</p>`}`),
      structure) };
  };
  P["v7o-variant"] = (sys) => {
    const v = VARS.find((x) => x.sys === sys) || VARS[0];
    const parts = deltaParts(v.t);
    const a = v.sys === "X800-A-CUSA";
    const famRows = a ? DELTA_A.fams.map((f) => li(`<span class="ak-code">${esc(f.f)}</span>`, `${esc(f.t)} <span class="v7o-dbar sm">${stack([[f.inh, DCOL[0]], [f.sh, DCOL[1]], [f.ch, DCOL[2]], [f.po, DCOL[3]]], f.n)}</span>`, `${f.ch + f.po} of ${f.n} owed`)).join("") : "";
    return { label: "Variant preview", body: pan({ title: v.sys, chip: v.pv < v.latest ? pill("warn", "1 version behind") : pill("ok", "Current version"), actions: btn("Plan delta assessment", `data-modal="v7o-plan-delta" data-id="${esc(v.sys)}"`, true),
      facts: [["Program", esc(v.pn)], ["Product", `${esc(prodName(v.product))} version ${v.pv}`], ["Configuration", esc(v.cfg)]] },
      v.pv < v.latest ? `<div class="v7o-nudge">${gl("clock")}<span>${esc(prodName(v.product))} version ${v.latest} is published; ${esc(v.sys)} is at version ${v.pv}.</span>${btn(`Take version ${v.latest}`, 'data-modal="v7o-take-product"', true)}</div>` : "",
      AK.card(`${ch("Delta", null, mu(`<span class="num">${v.t[0]} controls</span>`))}${stack(parts, v.t[0])}${legend(parts)}<p class="v7o-p"><b class="num">${v.t[3] + v.t[4]}</b> controls are owed an assessment; <span class="num">${v.t[1] + v.t[2]}</span> come from ${esc(v.a)}.</p>`),
      AK.card(`${ch("Elements")}${li(gl("check"), "Inherited as the product delivers them", num(v.el[0]))}${li(gl("clock"), "Modified here", num(v.el[1]))}${li(gl("diamond"), "Removed", num(v.el[2]))}${li(gl("info"), "Added by the program", num(v.el[3]))}`),
      a ? AK.card(`${ch("Changed elements", DELTA_A.changed.length)}${DELTA_A.changed.map((e) => li(`<span class="ak-code">${esc(e.code)}</span>`, `${esc(e.n)} ${e.kinds.map((k) => tag(k[0].toUpperCase() + k.slice(1))).join(" ")}`, `${e.change === "removed" ? pill("bad", "Removed") : pill("warn", "Modified")} <span class="num">${e.controls}</span>`)).join("")}`) : "",
      a ? AK.card(`${ch("By control family", DELTA_A.fams.length)}<div class="v7o-fams">${famRows}</div>`) : "") };
  };

  // ═════════════ 3. Components ═════════════
  // COMP: [name, set, version, state, owner, type, products, programs, consumers behind, modified, claimed, determined, satisfied,
  // partially, other than, offers open, open CVEs, to review, business line], from component_rows.
  const COMP_F = { all: () => true, published: (c) => c[3] === "published", draft: (c) => c[3] !== "published", assessed: (c) => c[11] > 0, behind: (c) => c[8] > 0, noown: (c) => !c[4], cve: (c) => c[16] > 0 };
  const compSat = (c) => (c[11] ? frac(c[12], c[10]) : c[10] ? ring("Not assessed") : mu("No claims"));
  const compUsed = (c) => (c[6] || c[7] ? num(`${c[6] ? plural(c[6], "product") + " · " : ""}${plural(c[7], "program")}`) : mu("Not used"));
  S.components = () => {
    const key = qv("comp", "all");
    const list = COMP.map((c, i) => [c, i]).filter(([c]) => (COMP_F[key] || COMP_F.all)(c));
    const n = (k) => COMP.filter(COMP_F[k]).length;
    return h.page(
      AK.indexHead({ title: "Components", desc: "Shared library components, assessed once and used everywhere: 52 components in 23 component sets",
        actions: `${more("More component actions", [["Component sets", toast("23 component sets")], ["Import SBOM", toast("SBOM import started")], ["Export", toast("Components exported (.csv)")]])}${btn("Create component", 'data-modal="v7o-new-component"', true, false)}` }),
      banner("bad", "<b>CVE-2024-6387</b> is open in the Mission Computer's OpenSSH on version 1, which 3 programs run. Version 2, published Nov 12, fixes it; AC-17(2) and SC-23 are left to review.", btn("Review offer", 'data-panel="v7o-offer" data-id="cve"')),
      chips("comp", [["all", "All", 52], ["published", "Published", n("published")], ["draft", "Draft", n("draft")], ["assessed", "Assessed", n("assessed")], ["behind", "Consumers behind", n("behind")], ["cve", "Open CVEs", n("cve")], ["noown", "No owner", n("noown")]]),
      filters("Search components", ["Component set", "Owner", "Type", "Business line"]),
      tbl({ cols: ["Component", "Component set", "Version", "Owner", "Controls satisfied", "Consumers", "Behind", "Open CVEs"], rows: list.slice(0, 25).map(([c, i]) => ({ id: String(i), go: c[0] === "Mission Computer" ? "component-mc" : "", cells: [
        `<span class="v7o-inl"><b class="v7o-name">${esc(c[0])}</b>${c[15] ? pill("info", "Offer waiting") : ""}</span>`, tr(c[1], 120), `<span class="v7o-inl">${num(c[2])}${c[3] !== "published" ? pill("none", "Draft") : ""}</span>`, AK.owner(c[4]),
        compSat(c), compUsed(c), c[8] ? `<span class="v7o-warn num">${c[8]} behind</span>` : mu("None"), c[16] ? pill("bad", `${c[16]} high`) : mu("None")] })), total: list.length, panel: "v7o-comp", cls: "v7o-tight", label: "Components" }),
      noteReal("Nothing on this register is invented: every row is the workspace's, from component_rows. Mission Computer opens its record; the others open a preview."),
    );
  };
  P["v7o-comp"] = (id) => {
    const c = COMP[+id] || COMP[1];
    const parts = [[c[12], "var(--ok)", "Satisfied"], [c[13], "var(--warn)", "Partially satisfied"], [c[14], "var(--bad)", "Other than satisfied"], [c[17], "var(--info)", "To review"]];
    const action = c[0] === "Mission Computer" ? btn("Open component", 'data-go="component-mc"', true) : c[3] !== "published" ? btn("Publish version 1", toast(`${c[0]} version 1 published`), true) : c[11] ? "" : btn("Plan an assessment", toast(`Assessment planned for ${c[0]}`), true);
    return { label: "Component preview", body: pan({ title: c[0], chip: `${tag(`Version ${c[2]}`)}${c[3] === "published" ? pill("ok", "Published") : pill("none", "Draft")}`, actions: action,
      facts: [["Owner", AK.owner(c[4])], ["Component set", esc(c[1])], ["Business line", c[18] ? esc(c[18]) : mu("None")], ["Type", esc(c[5][0].toUpperCase() + c[5].slice(1))]] },
      AK.card(`${ch("Controls", `${c[10]} claimed`)}${c[11] ? `${stack(parts, c[10])}${legend(parts.filter(([v]) => v))}` : `<p class="v7o-p v7o-mu">${c[10] ? `${c[10]} claimed and no published component assessment yet, so every consumer judges them itself.` : "Claims no controls."}</p>`}`),
      AK.card(`${ch("Where used")}${li(gl("info"), compUsed(c))}${c[8] ? `<div class="v7o-nudge">${gl("clock")}<span>${plural(c[8], "consumer is", "consumers are")} behind version ${c[2]}.</span>${btn("Remind consumers", toast(`Reminder sent to ${plural(c[8], "consumer")}`))}</div>` : ""}${c[9] ? li(gl("clock"), `${plural(c[9], "consumer")} modified it`) : ""}`)) };
  };

  // ═════════════ 4. The Mission Computer record (the after design, every old tab kept) ═════════════
  const MC_CHANGED = [["AC-17(2)", "Protection of Confidentiality and Integrity Using Encryption", "To review"], ["SC-23", "Session Authenticity", "To review"], ["RA-5", "Vulnerability Monitoring and Scanning", "Not claimed"], ["SI-2", "Flaw Remediation", "Not claimed"]];
  const CONS = [
    { id: "x800", name: "X800 Missile", kind: "Product", sys: "Versions 1 and 2", el: "GS-MC", change: null, inh: null, issue: null, pin: "Configurations A, B and C" },
    { id: "wsx90", name: "WS-X90 Sentinel Mission System", kind: "PRG-1090", sys: "SYS-WSX90", el: "LRU-001", change: null, inh: [50, 54], issue: "Open · 1 POA&M item", pin: "WS-X90 Block 1 production configuration · MC-FW 4.2.1" },
    { id: "cusa", name: "Customer A · X800 Rail Integration", kind: "PRG-2101", sys: "X800-A-CUSA", el: "CA-GS-MC", change: "Inherited", inh: [53, 54], issue: null, pin: "First article as built · 1.0" },
    { id: "cusb", name: "Customer B · X800 Palletized Integration", kind: "PRG-2102", sys: "X800-C-CUSB", el: "CB-GS-MC", change: "Inherited", inh: [54, 54], issue: null, pin: "Pallet set 101 as built · 1.0" },
  ];
  const MC_COMMENTS = [
    { who: "Ingrid Solberg", when: "Nov 14, 2:10 PM", text: `Offered CVE-2024-6387 from LRU-001. Version 2 carries OpenSSH 9.8p1. ${AK.mention("Priya Raghavan")}, accepting opens an issue in Customer A and Customer B.` },
    { who: "Priya Raghavan", role: "Owner", when: "Nov 15, 9:02 AM", text: "Reviewing. AC-17(2) and SC-23 need a look before anyone takes version 2." },
  ];
  const MC_ACT = [
    { who: "Elena Vasquez", what: "completed the version 1 component assessment · 52 determinations", when: "Sep 30" },
    { who: null, what: "recorded SBOM version 1 · CycloneDX 1.5, 13 components", when: "Oct 8" },
    { who: null, what: "recorded version 2 as published, with its SBOM", when: "Nov 12" },
    { who: "Ingrid Solberg", what: "offered CVE-2024-6387 from WS-X90", when: "Nov 14" },
  ];
  const ctlState = (r) => (r[5] ? "to_review" : r[3]);
  const MC_PARTS = [[42, "var(--ok)", "Satisfied"], [6, "var(--warn)", "Partially satisfied"], [4, "var(--bad)", "Other than satisfied"], [2, "var(--warn)", "To review"], [7, "var(--info)", "Not assessed"]];
  const mcHead = (cur) => AK.recordHead({
    crumbs: [["Components", "components"], ["Mission Computer"]],
    title: "Mission Computer",
    actions: `${dd("Version 2", [["Version 2 · published Nov 12", 'data-go="component-mc-versions"', "Current"], ["Version 1 · assessed Sep 30", 'data-panel="v7o-version" data-id="1"']])}${dd("Create task", [["Create task", 'data-modal="v7o-task"'], ["Remind consumers to take version 2", 'data-modal="v7o-remind"']])}${btn("Review offer", 'data-panel="v7o-offer" data-id="cve"', true, false)}`,
    facts: [["Status", pill("ok", "Published")], ["Owner", ownerEdit("Priya Raghavan")], ["Version", "2 · Nov 12"], ["Business line", "Air Defense"], ["Component set", "X800 Missile component set"], ["Reassess", `<span class="v7o-ic">${AK.i("clock")}Yearly ${EX}</span>`]],
    tabs: [["Overview", null, "component-mc", cur === "overview"], ["Assessment", 61, "component-mc-assessment", cur === "assessment"], ["Where used", 4, "component-mc-where", cur === "where"], ["Findings", 1, "component-mc-findings", cur === "findings"], ["SBOM", 13, "component-mc-sbom", cur === "sbom"], ["Versions", 2, "component-mc-versions", cur === "versions"], ["Tasks", 0, "component-mc-tasks", cur === "tasks"], ["Activity", 4, "component-mc-activity", cur === "activity"], ["Comments", 2, "component-mc-comments", cur === "comments"]],
  });
  const mcRail = () => `${AK.railCard("Details", [["Version", "2 · published Nov 12"], ["Previous", "1 · assessed Sep 30"], ["Assessor", AK.owner("Elena Vasquez")], ["Determinations", "52 carried · 2 to review"], ["SBOM", "CycloneDX 1.5 · 13 components"], ["Open CVEs", `<span class="v7o-2l"><span>0 on version 2</span><span class="v7o-bad">1 on version 1</span></span>`]])}
    <div class="ak-rail-s"><div class="ak-rail-t">Controls <span class="v7o-ct num">61</span></div><div class="v7o-pills">${[["ok", "Satisfied", 42, "satisfied"], ["part", "Partially satisfied", 6, "partially_satisfied"], ["bad", "Other than satisfied", 4, "other_than_satisfied"], ["info", "Not assessed", 7, "not_assessed"], ["warn", "To review", 2, "to_review"]].map(([k, l, n, v]) => `<div class="v7o-pr" role="link" tabindex="0" data-go="component-mc-assessment" data-v7o-set="mcctl:${v}" title="Show the ${n} controls">${pill(k, l)}<b class="num">${n}</b></div>`).join("")}</div></div>
    <div class="ak-rail-s"><div class="ak-rail-t">Offer waiting</div>${kv([["Finding", "CVE-2024-6387"], ["Review by", AK.owner("Priya Raghavan")], ["Since", "Nov 14 · 3 days"]])}${lnk("Review offer", 'data-panel="v7o-offer" data-id="cve"')}</div>`;
  const mcComments = () => AK.card(`${ch("Comments", 2, EX)}${AK.comments({ items: MC_COMMENTS, you: ME })}`, { cls: "v7o-cmc" });
  const mcPage = (cur, body, note) => h.page(mcHead(cur), AK.withRail(body, mcRail()), note.startsWith("@REAL@") ? noteReal(note.slice(6)) : AK.note(note));
  const consVersion = () => `<span class="v7o-warn">Version 1 · behind</span>`;
  S["component-mc"] = () => {
    const changed = AK.card(`${ch("What changed in version 2", null, tag("Software"))}<p class="v7o-p">The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.</p>
      <div class="v7o-ctls">${MC_CHANGED.map(([cd, t, st]) => `<div class="v7o-ctl"><span class="ak-code">${esc(cd)}</span><span class="x">${esc(t)}</span>${st === "To review" ? pill("warn", st) : pill("none", st)}</div>`).join("")}</div>`);
    const used = AK.card(`${ch("Where used", 4, btn(`${AK.i("mail")}Send reminder`, 'data-modal="v7o-remind"'))}
      <div class="v7o-used"><div class="v7o-ur hd"><span>Consumer</span><span>Controls inherited</span><span>Version</span><span>Reminder</span></div>
      ${CONS.map((x) => `<div class="v7o-ur" role="button" tabindex="0" data-panel="v7o-consumer" data-id="${x.id}">${two(`<b>${esc(x.name)}</b> ${x.kind === "Product" ? tag("Product") : ""}`, `${esc(x.el)}${x.kind !== "Product" ? ` · ${esc(x.kind)}` : ""}`)}${x.inh ? num(`${x.inh[0]} of ${x.inh[1]}`) : mu("Product")}${consVersion()}${x.kind === "Product" ? "<span></span>" : mu("Not reminded yet")}</div>`).join("")}</div>`);
    return mcPage("overview", `${changed}${used}${banner("bad", "<b>CVE-2024-6387</b> (high, 8.1) is open on version 1: 3 programs use it, 2 hold no issue for it yet.", btn("Open findings", 'data-go="component-mc-findings"'))}${mcComments()}`,
      "The comments, Create task, the Tasks tab, the reminders and the yearly reassessment are invented; Not reminded yet holds because nothing has asked a consumer to take version 2.");
  };
  const MCV = [["all", "All", 61], ["satisfied", "Satisfied", 42], ["partially_satisfied", "Partially satisfied", 6], ["other_than_satisfied", "Other than satisfied", 4], ["to_review", "To review", 2], ["not_assessed", "Not assessed", 7]];
  S["component-mc-assessment"] = () => {
    const f = qv("mcctl", "all");
    const list = MCCTL.map((r, i) => [r, i]).filter(([r]) => f === "all" || ctlState(r) === f);
    return mcPage("assessment", `${AK.card(`${ch("X800 Missile component set version 1 component assessment", null, mu("Elena Vasquez · Sep 30"))}${stack(MC_PARTS, 61)}${legend(MC_PARTS)}<p class="v7o-p v7o-mu">52 determinations carried from version 1 to version 2; 2 wait on review because version 2 changes them.</p>`)}
      ${chips("mcctl", MCV)}${filters("Search controls", ["Family", "Determination", "Basis"])}
      ${tbl({ cols: ["Control", "Family", "Determination", "Basis"], rows: list.slice(0, 25).map(([r, i]) => ({ id: String(i), cells: [`<span class="v7o-inl"><span class="ak-code">${esc(r[0])}</span>${tr(r[1], 280)}</span>`, tag(r[2]), stPill(ctlState(r)), r[5] ? `<span class="v7o-warn">Version 2 changes it</span>` : r[4] ? mu("Carried from version 1") : ring("Not judged")] })), total: list.length, panel: "v7o-mcctl", cls: "v7o-tight", label: "Controls" })}`,
      "@REAL@Nothing on this tab is invented: the 61 claimed controls and their determinations are the version 1 component assessment's.");
  };
  S["component-mc-where"] = () => mcPage("where", `${banner("warn", "No consumer has taken version 2 yet. All 4 run version 1, which carries CVE-2024-6387.", btn("Remind consumers", 'data-modal="v7o-remind"'))}
    ${tbl({ cols: ["Consumer", "Element", "Version", "Inherited", "CVE-2024-6387", "Reminder"], rows: CONS.map((c) => ({ id: c.id, cells: [`<span class="v7o-inl">${tr(c.name, 190)}${c.kind === "Product" ? tag("Product") : ""}</span>`, esc(c.el), `<span class="v7o-warn">1 · behind</span>`, c.inh ? num(`${c.inh[0]} of ${c.inh[1]}`) : mu("Product"), c.issue ? pill("warn", "Issue open") : c.kind === "Product" ? mu("Not a program") : pill("bad", "No issue yet"), c.kind === "Product" ? mu("Not needed") : mu("Not reminded yet")] })), total: 4, panel: "v7o-consumer", cls: "v7o-tight", label: "Where used", pager: false })}`,
    "The Reminder column is proposed; the consumers, their versions and what they inherit are component_consumers'.");
  S["component-mc-findings"] = () => mcPage("findings", `${AK.section("Offers", tbl({ cols: ["Finding", "State", "Offered by", "Offered", "Waiting on"], rows: [{ id: "cve", cells: [tr("CVE-2024-6387 in the Mission Computer's OpenSSH server", 230), pill("info", "Offered"), AK.owner("Ingrid Solberg"), "Nov 14", AK.owner("Priya Raghavan")] }], total: 1, panel: "v7o-offer", cls: "v7o-tight", pager: false }), { count: 1 })}
    ${AK.section("Vulnerabilities", tbl({ cols: ["CVE", "Severity", "Package", "Fixed in", "Answered", "Controls"], rows: [{ id: "cve", cells: [`<span class="v7o-inl"><b class="v7o-name">CVE-2024-6387</b>${mu("regreSSHion")}</span>`, h.sevPill("high"), "openssh-server 9.6p1", "9.8p1 · version 2", `<span class="v7o-bad num">1 of 3</span>`, AK.codes(["RA-5", "SI-2"])] }], total: 1, panel: "v7o-cve", cls: "v7o-tight", pager: false }), { count: 1 })}`,
    "@REAL@Nothing on this tab is invented: the offer and the CVE are the Mission Computer's, with the one issue WS-X90 holds for it.");
  const purl = (n, v) => (n === "mission-computer-image" ? null : `pkg:generic/${n === "openssh-server" ? "openssh" : n}@${v}`);
  function sbomTab(v) {
    const v2 = v === 2;
    return mcPage("sbom", `${AK.card(`${ch(v2 ? "Mission Computer maintenance image SBOM, version 2" : "Mission Computer maintenance image SBOM, version 1", null, tag("CycloneDX 1.5"))}${AK.facts([["Generated", v2 ? "Nov 12" : "Oct 8"], ["Components", "13"], ["Affected", v2 ? pill("ok", "None") : pill("bad", "1 · openssh-server 9.6p1")], ["Serial", `<span class="v7o-mono">${v2 ? "urn:uuid:8f2b1c7e-5a4d-4e39-9c61-2d7f0b3a6e15" : "urn:uuid:63d63818-ca79-406b-939d-74a552feae25"}</span>`]])}`)}
      <div class="v7o-seg" role="group" aria-label="SBOM version">${[["component-mc-sbom", "Version 2 · Nov 12", v2], ["component-mc-sbom-v1", "Version 1 · Oct 8", !v2]].map(([r, l, on]) => `<span class="v7o-segb${on ? " on" : ""}" role="button" tabindex="0" aria-pressed="${on}" data-go="${r}">${l}</span>`).join("")}</div>
      ${filters("Search packages", ["Kind", "License", "Vulnerable"])}
      ${tbl({ cols: ["Package", "Version", "Kind", "License", "Vulnerabilities"], rows: SB.map((s, i) => { const ver = v2 ? s[2] : s[1], vuln = !v2 && s[0] === "openssh-server"; return { id: `${v}-${i}`, cells: [esc(s[0]), `<span class="v7o-inl">${num(esc(ver))}${v2 && s[1] !== s[2] ? mu(`was ${esc(s[1])}`) : ""}</span>`, tag(s[3]), s[4] ? tr(s[4], 190) : mu("None"), vuln ? h.sevPill("high") : v2 && s[0] === "openssh-server" ? pill("ok", "Fixed") : mu("None")] }; }), total: 13, panel: "v7o-pkg", cls: "v7o-tight", label: "Packages", pager: false })}`,
      "@REAL@Nothing on this tab is invented: both SBOMs are the Mission Computer's, recorded with its versions.");
  }
  S["component-mc-sbom"] = () => sbomTab(2);
  S["component-mc-sbom-v1"] = () => sbomTab(1);
  S["component-mc-versions"] = () => mcPage("versions", `${tbl({ cols: ["Version", "State", "Published", "Controls affected", "Determinations", "Open CVEs"], rows: [
      { id: "2", cells: [`<span class="v7o-inl">Version 2${tag("Software")}</span>`, pill("ok", "Published"), "Nov 12", `<span class="v7o-inl">${num(4)}<span class="v7o-warn">2 to review</span></span>`, num("52 carried"), mu("None")] },
      { id: "1", cells: ["Version 1", pill("ok", "Published"), mu("Assessed Sep 30"), mu("First version"), num("52 by Elena Vasquez"), `<span class="v7o-bad num">1</span>`] },
    ], total: 2, panel: "v7o-version", cls: "v7o-tight", pager: false })}${banner("info", "Consumers take a version explicitly: X800 Missile, WS-X90, Customer A and Customer B are still on version 1.", btn("Remind consumers", 'data-modal="v7o-remind"'))}`,
    "@REAL@Nothing on this tab is invented: both versions, their determinations and SBOMs are the component's.");
  S["component-mc-tasks"] = () => mcPage("tasks", AK.empty({ title: "No tasks yet", line: "Create a task to ask a consumer to take version 2, or to review AC-17(2) and SC-23.", action: "Create task" }).replace('<span class="btn sm ink">Create task</span>', btn("Create task", 'data-modal="v7o-task"', true)), "The Tasks tab is proposed.");
  S["component-mc-activity"] = () => mcPage("activity", AK.card(`${ch("Activity", 4)}${AK.activity(MC_ACT)}`), "The Activity tab is proposed; its four events are the Mission Computer's, from its versions, SBOMs and offer.");
  S["component-mc-comments"] = () => mcPage("comments", mcComments(), "The comments are invented.");
  P["v7o-mcctl"] = (id) => {
    const r = MCCTL[+id] || MCCTL[0], s = ctlState(r);
    return { label: "Control preview", body: pan({ title: `${r[0]} ${r[1]}`, chip: stPill(s), actions: r[5] ? btn("Record determination", `data-modal="v7o-determine" data-id="${esc(r[0])}"`, true) : "",
      facts: [["Family", tag(r[2])], ["Claimed", pill("ok", "Claimed")], ["Assessment", r[4] || r[5] ? "Version 1 · Elena Vasquez · Sep 30" : mu("Not judged in version 1")]] },
      AK.card(`${ch("Basis")}<p class="v7o-p">${r[5] ? "Version 2 changes it: the maintenance image now carries OpenSSH 9.8p1, so the version 1 determination is not carried." : r[4] ? "Carried from version 1: version 2 changes nothing it depends on." : "Claimed, and not judged in version 1."}</p>`),
      AK.card(`${ch("Consumers of version 1", 3)}${CONS.slice(1).map((c) => li(gl("check"), esc(c.name), esc(c.el))).join("")}`)) };
  };
  P["v7o-consumer"] = (id) => {
    const c = CONS.find((x) => x.id === id) || CONS[1];
    const prog = c.kind !== "Product";
    return { label: "Consumer preview", body: pan({ title: c.name, chip: pill("warn", "Version 1 · behind"), actions: prog ? btn("Take version 2", `data-modal="v7o-take" data-id="${c.id}"`, true) : "",
      facts: [["Kind", tag(c.kind)], ["System", esc(c.sys)], ["Element", esc(c.el)]] },
      AK.card(kv([["Pinned in", esc(c.pin)], ["Inherited", c.inh ? num(`${c.inh[0]} of ${c.inh[1]} judged controls`) : mu("Product")], ["Change", c.change ? pill("ok", c.change) : mu("Not modified")]])),
      prog ? AK.card(`${ch("CVE-2024-6387")}${c.issue ? li(gl("clock"), "CVE-2024-6387 in the OpenSSH server (regreSSHion)", pill("warn", "Open")) + li(gl("info"), "Opened Oct 10 · owner Ingrid Solberg", esc(c.issue)) : li(gl("diamond"), "No operational issue for it yet", pill("bad", "Unanswered")) + `<p class="v7o-p v7o-mu">Accepting the offer opens one here.</p>`}`) : "",
      prog ? `<div class="v7o-rem">${remind(null, `Reminder sent to ${c.name}`)}${EX}</div>` : "") };
  };
  P["v7o-offer"] = () => ({ label: "Offer preview", body: pan({ title: "CVE-2024-6387 in the Mission Computer's OpenSSH server", chip: pill("info", "Offered"),
      facts: [["Severity", h.sevPill("high")], ["Component", "Mission Computer · version 1"], ["From", "WS-X90 · LRU-001"]] },
    AK.awaiting("Priya Raghavan", ["Accept", "Return"]).replace('<span class="btn sm ink">Accept</span>', btn("Accept", 'data-modal="v7o-accept"', true)).replace('<span class="btn sm">Return</span>', btn("Return", 'data-modal="v7o-return"')),
    AK.approval({ title: "Offer to the component owner", sub: "Found Oct 10 on WS-X90's LRU-001; offered Nov 14 by Ingrid Solberg", steps: [{ label: "Component owner", approvers: [{ who: "Priya Raghavan", role: "Owner", state: "sent", when: "Nov 14" }] }] }),
    `<p class="v7o-p">Found on WS-X90's LRU-001, which runs the Mission Computer's image as version 1 of the component set delivers it. Every system built from that version carries the same server.</p>`,
    AK.card(`${ch("Accepting opens")}${li(gl("info"), "Customer A · X800 Rail Integration", "1 operational issue")}${li(gl("info"), "Customer B · X800 Palletized Integration", "1 operational issue")}${li(gl("check"), "WS-X90 Sentinel Mission System", "Keeps its own")}`)) });
  P["v7o-cve"] = () => ({ label: "Vulnerability preview", body: pan({ title: "CVE-2024-6387 · regreSSHion", chip: h.sevPill("high"), actions: btn("Open issues where missing", toast("2 operational issues opened: Customer A and Customer B"), true),
      facts: [["CVSS", "8.1"], ["Published", "Jul 1, 2024"], ["Counters", AK.codes(["RA-5", "SI-2"])]] },
    `<p class="v7o-p">Signal handler race in OpenSSH's sshd. 9.6p1 is inside the affected range, 8.5p1 through 9.7p1; 9.8p1 holds the fix.</p>`,
    AK.card(`${ch("Programs that run version 1", 3)}${li(gl("clock"), "WS-X90 Sentinel Mission System", pill("warn", "Issue open"))}${li(gl("diamond"), "Customer A · X800 Rail Integration", pill("bad", "No issue yet"))}${li(gl("diamond"), "Customer B · X800 Palletized Integration", pill("bad", "No issue yet"))}`)) });
  P["v7o-pkg"] = (id) => {
    const [v, i] = String(id).split("-").map(Number);
    const s = SB[i] || SB[7], ver = v === 2 ? s[2] : s[1], ssh = s[0] === "openssh-server";
    return { label: "Package preview", body: pan({ title: `${s[0]} ${ver}`, chip: ssh ? (v === 2 ? pill("ok", "Fixed") : h.sevPill("high")) : pill("ok", "No known CVE"),
        facts: [["SBOM", v === 2 ? "Version 2 · Nov 12" : "Version 1 · Oct 8"], ["Kind", tag(s[3])], ["Parent", s[0] === "mission-computer-image" ? mu("The image itself") : "mission-computer-image"]] },
      AK.card(kv([["License", s[4] ? esc(s[4]) : mu("None")], ["Package URL", purl(s[0], ver) ? `<span class="v7o-mono">${esc(purl(s[0], ver))}</span>` : mu("None")]])),
      ssh ? AK.card(`${ch("CVE-2024-6387", null, v === 2 ? pill("ok", "Fixed") : pill("bad", "Affected"))}<p class="v7o-p">${v === 2 ? "9.8p1 holds the fix." : "9.6p1 is inside the affected range, OpenSSH 8.5p1 through 9.7p1."}</p><p class="v7o-p v7o-mu">CVSS 8.1 · published Jul 1, 2024 · counters RA-5 and SI-2</p>`) : "") };
  };
  P["v7o-version"] = (id) => id === "1"
    ? { label: "Version preview", body: pan({ title: "Mission Computer version 1", chip: pill("ok", "Published"), facts: [["Assessor", AK.owner("Elena Vasquez")], ["Completed", "Sep 30"], ["Determinations", "52 of 61 claimed"]] },
        AK.card(`${ch("Open CVE", 1)}${li(gl("diamond"), "CVE-2024-6387 · openssh-server 9.6p1", h.sevPill("high"))}`),
        AK.card(`${ch("Taken by", 4)}<p class="v7o-p">X800 Missile, WS-X90, Customer A and Customer B.</p>`)) }
    : { label: "Version preview", body: pan({ title: "Mission Computer version 2", chip: pill("ok", "Published"), actions: btn("Compare with version 1", 'data-go="component-mc-sbom-v1"'), facts: [["Published", "Nov 12 · 17:00 UTC"], ["Change", tag("Software")], ["Determinations", "52 carried · 2 to review"]] },
        AK.card(`${ch("What changed")}<p class="v7o-p">The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.</p>`),
        AK.card(`${ch("Controls it affects", 4)}${MC_CHANGED.map(([cd, t, st]) => li(`<span class="ak-code">${esc(cd)}</span>`, esc(t), st === "To review" ? pill("warn", st) : pill("none", st))).join("")}`),
        AK.card(`${ch("Taken by")}${li(gl("ring"), mu("No consumer yet"))}`)) };

  // ═════════════ 5. Deadlines ═════════════
  // [id, name, group, applies to, days, recommended, owner, at risk {o overdue, s due within two weeks, l due later, n no date}, state, in use by, at-risk invented]
  const DLX = [
    ["vcrit", "Critical vulnerability", "Vulnerabilities", "ACAS results rated critical, from import", 15, "7–15", "Joel Barrantes", { o: 2 }, "Proposed", "ACAS · Oct 10 import", true],
    ["vhigh", "High vulnerability", "Vulnerabilities", "ACAS results rated high, and SBOM CVEs, from import", 30, "15–30", "Joel Barrantes", { o: 9 }, "Proposed", "ACAS · Oct 10 import", true],
    ["vmed", "Medium vulnerability", "Vulnerabilities", "ACAS results rated medium, from import", 90, "60–90", "Joel Barrantes", { l: 31 }, "Proposed", "ACAS · Oct 10 import", true],
    ["vlow", "Low vulnerability", "Vulnerabilities", "ACAS results rated low, from import", 180, "90–365", "Joel Barrantes", { l: 112 }, "Proposed", "ACAS · Oct 10 import", true],
    ["iava", "IAVA", "Vulnerabilities", "ACAS results that carry an IAVA number, from release; the notice's own date wins when sooner", 21, "21–30", "Joel Barrantes", null, "Proposed", "ACAS · 3 WS-X90 imports"],
    ["iavb", "IAVB", "Vulnerabilities", "ACAS results that carry an IAVB number, from release", 30, "30–60", "Joel Barrantes", null, "Proposed", "ACAS · 3 WS-X90 imports"],
    ["cat1", "STIG CAT I", "STIG", "Open CAT I rules in STIG checklists, from import", 30, "14–30", "Joel Barrantes", { o: 2 }, "Proposed", "29 open rules · RHEL 9 checklist", true],
    ["cat2", "STIG CAT II", "STIG", "Open CAT II rules, from import", 90, "60–90", "Joel Barrantes", { l: 21 }, "Proposed", "29 open rules · RHEL 9 checklist", true],
    ["cat3", "STIG CAT III", "STIG", "Open CAT III rules, from import", 180, "90–365", "Joel Barrantes", { l: 6 }, "Proposed", "29 open rules · RHEL 9 checklist", true],
    ["crit", "Critical finding", "Findings", "Operational issues, from when opened", 15, "7–15", "Priya Raghavan", { o: 1, s: 1 }, "In use", "2 open"],
    ["high", "High finding", "Findings", "Operational issues, from when opened", 30, "15–30", "Priya Raghavan", { o: 9, s: 2, l: 1 }, "In use", "12 open"],
    ["mod", "Moderate finding", "Findings", "Operational issues, from when opened", 90, "60–90", "Priya Raghavan", { o: 7, l: 16 }, "In use", "23 open"],
    ["low", "Low finding", "Findings", "Operational issues, from when opened", 180, "90–365", "Priya Raghavan", { l: 7 }, "In use", "7 open"],
    ["mile", "POA&M milestone reminder", "POA&M", "Days before a milestone's planned date", 14, "7–30", "Ray Colston", { o: 4, s: 7, l: 49, n: 39 }, "Proposed", "99 open milestones of 41 POA&M items"],
    ["renew", "Evidence renewal", "Evidence", "Accepted evidence, from its review", 365, "180–365", "Priya Raghavan", { n: 368 }, "Proposed", "368 artifacts · none with a date"],
    ["access", "Access review cycle", "Accounts", "AC-2 and AC-2(3), as the identity provider asks", 90, "30–90", "Victor Amsel", { s: 1 }, "Proposed", "IDP-CAP-ACCOUNTS"],
  ];
  const DL_TABS = [["deadlines", "All", null], ["deadlines-vuln", "Vulnerabilities", ["Vulnerabilities"]], ["deadlines-stig", "STIG", ["STIG"]], ["deadlines-findings", "Findings", ["Findings"]], ["deadlines-other", "POA&M, evidence, accounts", ["POA&M", "Evidence", "Accounts"]]];
  // WS-X90's open issues and POA&M milestones due by Dec 1 (operational_issue_rows, poam_milestones), and the access review task.
  const DL_ISSUES = [
    ["Unmet requirement REQ-100", "high", "2026-08-07", "2026-09-06"], ["Unmet requirement REQ-008", "high", "2026-08-10", "2026-09-09"], ["Unmet requirement REQ-068", "high", "2026-08-13", "2026-09-12"],
    ["Session-table occupancy missing from the gateway counter export (SC-5(3))", "high", "2026-09-24", "2026-10-24"], ["Mission data sessions over the tactical radio never presented to platform monitoring (SI-4(10))", "high", "2026-10-02", "2026-11-01"],
    ["Egress denial records attribute maintenance-origin traffic to a device instead of an operator (SC-7(9))", "high", "2026-10-04", "2026-11-03"], ["Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)", "critical", "2026-10-21", "2026-11-05"],
    ["Unmet requirement REQ-119", "moderate", "2026-08-07", "2026-11-05"], ["Unmet requirement REQ-024", "moderate", "2026-08-07", "2026-11-05"], ["Unmet requirement REQ-062", "moderate", "2026-08-07", "2026-11-05"], ["Unmet requirement REQ-083", "moderate", "2026-08-09", "2026-11-07"],
    ["Payload Safety Interlock carries an asserted trustworthiness basis with no supplier assurance case (SA-8(9))", "high", "2026-10-08", "2026-11-07"], ["Maintenance Access Gateway service connector locked but unsealed (SC-7(14))", "high", "2026-10-09", "2026-11-08"],
    ["CVE-2024-6387 in the OpenSSH server (regreSSHion)", "high", "2026-10-10", "2026-11-09", "Ingrid Solberg"], ["Unmet requirement REQ-032", "moderate", "2026-08-15", "2026-11-13"], ["Unmet requirement REQ-053", "moderate", "2026-08-17", "2026-11-15"], ["Unmet requirement REQ-092", "moderate", "2026-08-18", "2026-11-16"],
    ["Protected bay access list transcribed by hand, so a facility removal leaves bay access standing (PE-3(1))", "high", "2026-10-19", "2026-11-18"], ["Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))", "critical", "2026-11-13", "2026-11-28"],
    ["Navigation, timing and payload firmware violations raise an alert without driving the restricted state (SI-7(5))", "high", "2026-10-31", "2026-11-30"],
  ];
  const DL_MILES = [
    ["Fit tamper-evident seals to the LRU-014 service connector and record each against its key", "Seal the maintenance service connector", "2026-11-06"], ["Re-report the two late cases and record the corrected timeline against each", "Automate the second reporting route for weakness reports", "2026-11-06"],
    ["Re-verify the stranded arm and release records against the republished key history", "Publish the retired key history and reissue the audit direction", "2026-11-08"], ["Re-screen the credentials already held in the LRU-015 region against the refreshed list", "Put compromised-credential screening on a scheduled refresh", "2026-11-14"],
    ["Set LoginGraceTime 0 on the maintenance interface", "Remediate CVE-2024-6387 on the Mission Computer", "2026-11-17", "Ingrid Solberg"], ["Bring payload telemetry maintenance inside the LRU-016 work-order gate", "Gate payload telemetry maintenance", "2026-11-18"],
    ["Restore the platform management and payload interface partitions from the sealed LRU-015 set", "Exercise a whole-article recovery against the four-hour objective", "2026-11-20"], ["Re-home the LRU-008 radio path off the shared LRU-009 port group", "Re-home the alternate bearer off the shared port group", "2026-11-21"],
    ["Obtain the other party's signature and record the impact level on the agreement", "Sign the ground-support telemetry agreement before the exchange", "2026-11-23"], ["Compare the mirrored signature set timestamp against the freshness window before a scan starts", "Abort a baseline scan on a stale signature set", "2026-11-24"],
    ["Take Mission Computer version 2", "Remediate CVE-2024-6387 on the Mission Computer", "2026-12-01", "Ingrid Solberg"],
  ];
  const riskCell = (d) => {
    const r = d[7]; if (!r) return ring("Not split by type");
    const out = [];
    if (r.o) out.push(pill("bad", `${fmt(r.o)} overdue`));
    if (r.s) out.push(pill("warn", `${fmt(r.s)} due soon`));
    if (!out.length && r.l) out.push(pill("ok", `${fmt(r.l)} on track`));
    if (!out.length && r.n) out.push(ring(`${fmt(r.n)} with no date`));
    return `<span class="v7o-inl">${out.join("")}${d[10] ? EX : ""}</span>`;
  };
  const dlCards = () => `<div class="v7o-cards">
    <div class="ak-card v7o-card">${ch("Deadline status", null, mu('<span class="num">512 open items</span>'))}
      ${[["diamond", "Overdue", 21, "deadlines-findings"], ["clock", "Due within two weeks", 11, "deadlines-other"], ["check", "Due later", 73, ""], ["ring", "No due date", 407, "deadlines-other"]].map(([g, l, n, r]) => `<div class="v7o-stat"${r ? ` role="link" tabindex="0" data-go="${r}"` : ""}>${gl(g)}<span>${l}</span><b class="num">${n}</b></div>`).join("")}
      <p class="v7o-foot">${AK.i("clock")}WS-X90's open findings, POA&amp;M milestones, evidence renewals and the access review. Scan results count in their own tabs.</p></div>
    <div class="ak-card v7o-card">${ch("Imports that set deadlines", 3)}
      <div class="v7o-warnbox">${gl("diamond")}<span class="x">1 import failed: Container image scan — telemetry services, Oct 30</span>${btn("View", 'data-go="sources"')}</div>
      ${[["ACAS vulnerability scan — mission network, October", "Oct 10", "2 critical · 9 high"], ["DISA STIG checklist — mission computing (RHEL 9)", "Oct 13", "29 open rules"], ["SCAP compliance scan — maintenance laptop (Windows 11)", "Oct 14", "21 failed rules"]].map(([t, d, n]) => li(gl("check"), `${tr(t, 300)} ${mu(d)}`, n)).join("")}
      ${li(gl("clock"), `${tr("ACAS vulnerability scan — mission network", 300)} ${mu("Nov 12")}`, "Importing")}</div></div>`;
  const dlHead = () => AK.indexHead({ title: "Deadlines", desc: "How long each kind of finding has before it is overdue, set once for the workspace by Joel Barrantes, ISSM",
    actions: `${more("More deadline actions", [["Reset to recommended", 'data-modal="v7o-dl-reset"'], ["View history", 'data-panel="v7o-dl" data-id="high"']])}${btn("Edit deadlines", 'data-modal="v7o-dl-edit" data-id="high"', true, false)}` });
  const dlTabs = (cur) => AK.tabs(DL_TABS.map(([r, l, g]) => [l, g ? DLX.filter((d) => g.includes(d[2])).length : DLX.length, r, r === cur]), "Deadline groups");
  const dlRow = (d) => ({ id: d[0], cells: [`<b class="v7o-name">${esc(d[1])}</b>`, tr(d[3], 190), `<b class="num">${d[4]} days</b>`, mu(`${esc(d[5])} days`), AK.owner(d[6]), riskCell(d), d[8] === "In use" ? pill("ok", "In use") : pill("none", "Proposed")] });
  const slaCard = (d) => `<div class="ak-card v7o-sla"><div class="v7o-sla-h"><b>${esc(d[1])}</b>${d[8] === "In use" ? pill("ok", "In use") : pill("none", "Proposed")}<span class="v7o-push">${btn("View history", `data-panel="v7o-dl" data-id="${d[0]}"`)}${btn("Disable", `data-modal="ak-reason" data-id="${esc(`Disable the ${lc(d[1])} deadline|Open items keep their due dates. The reason, your name and the date go in the event log.`)}"`)}</span></div>
    <div class="v7o-sla-in"><span class="v7o-days num" role="button" tabindex="0" data-modal="v7o-dl-edit" data-id="${d[0]}" title="Edit">${d[4]}</span>${select(d[0] === "mile" ? "days before" : "days")}<span class="v7o-mu">Recommended: ${esc(d[5])} days</span></div>
    <div class="v7o-sla-f"><span class="v7o-mu">${esc(d[3])}</span><span class="v7o-push">${AK.owner(d[6])}${riskCell(d)}</span></div></div>`;
  const sevP = (s) => h.sevPill(s);
  const atRisk = (grp) => {
    if (grp === "Findings") return AK.section("Items at risk", tbl({ cols: ["Operational issue", "Severity", "Opened", "Remediate by", "Owner"], rows: DL_ISSUES.map((x, i) => ({ id: `f:${i}`, cells: [tr(x[0], 420), sevP(x[1]), md(x[2]), AK.due(x[3], { prefix: false }), AK.owner(x[4] || null)] })), total: 20, panel: "v7o-dl-item", cls: "v7o-tight", label: "Issues at risk", pager: false }), { count: 20, action: btn("Open findings", 'data-go="findings"') });
    if (grp === "POA&M") return AK.section("Items at risk", tbl({ cols: ["Milestone", "POA&M item", "Planned", "Owner"], rows: DL_MILES.map((x, i) => ({ id: `m:${i}`, cells: [tr(x[0], 360), tr(x[1], 280), AK.due(x[2], { prefix: false }), AK.owner(x[3] || null)] })).concat([{ id: "a:0", cells: [tr("Quarterly privileged account review (AC-2, AC-6)", 360), mu("Access review · task"), AK.due("2026-12-01", { prefix: false }), AK.owner("Victor Amsel")] }]), total: 12, panel: "v7o-dl-item", cls: "v7o-tight", label: "Milestones at risk", pager: false }), { count: 12, action: btn("Open POA&amp;M", 'data-go="poam"') });
    if (grp === "Vulnerabilities") return AK.section("Items at risk", tbl({ cols: ["Item", "Severity", "Found", "Due", "Owner"], rows: [
      { id: "f:13", cells: [tr("CVE-2024-6387 in the Mission Computer's OpenSSH server", 380), sevP("high"), "Oct 10", AK.due("2026-11-09", { prefix: false }), AK.owner("Ingrid Solberg")] },
      { id: "v:crit", cells: [`<span class="v7o-inl">${tr("2 critical ACAS results · mission network", 340)}${EX}</span>`, sevP("critical"), "Oct 10", AK.due("2026-10-25", { prefix: false }), AK.owner(null)] },
      { id: "v:high", cells: [`<span class="v7o-inl">${tr("9 high ACAS results · mission network", 340)}${EX}</span>`, sevP("high"), "Oct 10", AK.due("2026-11-09", { prefix: false }), AK.owner(null)] },
    ], total: 3, panel: "v7o-dl-item", cls: "v7o-tight", label: "Vulnerabilities at risk", pager: false }), { count: 3, action: btn("Open findings", 'data-go="findings"') });
    return AK.section("Items at risk", tbl({ cols: ["Item", "Category", "Found", "Due", "Owner"], rows: [
      { id: "s:1", cells: [`<span class="v7o-inl">${tr("2 open CAT I rules · RHEL 9 mission computing", 340)}${EX}</span>`, tag("CAT I"), "Oct 13", AK.due("2026-11-12", { prefix: false }), AK.owner(null)] },
      { id: "s:2", cells: [`<span class="v7o-inl">${tr("21 open CAT II rules · RHEL 9 mission computing", 340)}${EX}</span>`, tag("CAT II"), "Oct 13", AK.due("2027-01-11", { prefix: false }), AK.owner(null)] },
      { id: "s:3", cells: [`<span class="v7o-inl">${tr("6 open CAT III rules · RHEL 9 mission computing", 340)}${EX}</span>`, tag("CAT III"), "Oct 13", AK.due("2027-04-11", { prefix: false }), AK.owner(null)] },
    ], total: 3, panel: "v7o-dl-item", cls: "v7o-tight", label: "STIG rules at risk", pager: false }), { count: 3 });
  };
  function deadlines(cur) {
    const t = DL_TABS.find((x) => x[0] === cur);
    const list = DLX.filter((d) => !t[2] || t[2].includes(d[2]));
    const body = !t[2]
      ? tbl({ cols: ["Deadline", "Applies to", "Target", "Recommended", "Owner", "At risk", "Status"], rows: list.map(dlRow), total: list.length, panel: "v7o-dl", cls: "v7o-tight", label: "Deadlines", pager: false })
      : `<div class="v7o-slas">${list.map(slaCard).join("")}</div>${atRisk(t[2][0])}`;
    const note = { deadlines: "Policy owners are proposed, from each role's duties, and so are the deadlines marked Proposed; the vulnerability and STIG counts at risk are invented, since the imports record totals and not each result's state. Findings already use their four windows.",
      "deadlines-vuln": "The ACAS counts are the Oct 10 import's; whether each result is still open is not recorded, so their deadline status is invented. CVE-2024-6387 is WS-X90's.",
      "deadlines-stig": "The split of the 29 open RHEL 9 rules by category, and so its deadline status, is invented; the checklist import is WS-X90's.",
      "deadlines-findings": "Policy owners are proposed. The 44 open issues and their remediate-by dates are WS-X90's, counted from the day each opened.",
      "deadlines-other": "The reminder window, the renewal period and the policy owners are proposed; the milestones, the access review task and the 368 artifacts are WS-X90's." }[cur];
    return h.page(dlHead(), dlCards(), dlTabs(cur), body, AK.note(note));
  }
  for (const [r] of DL_TABS) S[r] = () => deadlines(r);
  P["v7o-dl"] = (id) => {
    const d = DLX.find((x) => x[0] === id) || DLX[10];
    return { label: "Deadline preview", body: pan({ title: `${d[1]} deadline`, chip: d[8] === "In use" ? pill("ok", "In use") : pill("none", "Proposed"), actions: btn("Edit", `data-modal="v7o-dl-edit" data-id="${d[0]}"`, true),
        facts: [["Target", `<b class="num">${d[4]} days</b>`], ["Recommended", `${esc(d[5])} days`], ["Owner", AK.owner(d[6])]] },
      AK.card(kv([["Group", tag(d[2])], ["Applies to", esc(d[3])], ["In use by", esc(d[9])], ["At risk", riskCell(d)]])),
      d[2] === "Findings" ? `<div class="v7o-nudge">${gl("check")}<span>Findings' Remediate by already counts ${d[4]} days from the day an issue opens.</span>${btn("Open findings", 'data-go="findings"')}</div>` : "",
      d[0] === "access" ? AK.card(`${ch("Why 90 days")}<p class="v7o-p">The Corporate identity provider's account lifecycle offer asks each consumer to complete the quarterly access review.</p>`) : "",
      AK.card(`${ch("History")}${AK.activity([{ who: "Joel Barrantes", what: `set ${lc(d[1])} to <b>${d[4]} days</b>${d[8] === "In use" ? "" : ` ${EX}`}`, when: d[8] === "In use" ? "Aug 7" : "Nov 3" }])}`)) };
  };
  P["v7o-dl-item"] = (id) => {
    const [k, i] = String(id).split(":");
    if (k === "f") { const x = DL_ISSUES[+i] || DL_ISSUES[0]; return { label: "Operational issue preview", body: pan({ title: x[0], chip: sevP(x[1]), actions: btn("Open in findings", 'data-go="findings"', true), facts: [["Opened", md(x[2])], ["Remediate by", AK.due(x[3])], ["Owner", AK.owner(x[4] || null)]] }, AK.card(kv([["Deadline", `${{ critical: 15, high: 30, moderate: 90, low: 180 }[x[1]]} days, from when it opened`], ["Program", "WS-X90 Sentinel Mission System"]]))) }; }
    if (k === "m") { const x = DL_MILES[+i] || DL_MILES[0]; return { label: "Milestone preview", body: pan({ title: x[0], chip: pill(days(x[2]) < 0 ? "bad" : "warn", days(x[2]) < 0 ? "Overdue" : "Due soon"), actions: btn("Open POA&amp;M", 'data-go="poam"', true), facts: [["Planned", AK.due(x[2])], ["Owner", AK.owner(x[3] || null)]] }, AK.card(kv([["POA&M item", esc(x[1])], ["Reminder", "14 days before the planned date"]]))) }; }
    if (k === "a") return { label: "Task preview", body: pan({ title: "Quarterly privileged account review (AC-2, AC-6)", chip: pill("warn", "In progress"), actions: btn("Open review", 'data-go="people-access"', true), facts: [["Due", AK.due("2026-12-01")], ["Owner", AK.owner("Victor Amsel")]] }, AK.card(kv([["Asked by", "IDP-CAP-ACCOUNTS · Corporate identity provider"], ["Cycle", "90 days"]]))) };
    return { label: "Item preview", body: pan({ title: k === "s" ? "Open STIG rules · RHEL 9 mission computing" : "ACAS results · mission network", chip: EX, facts: [["Imported", k === "s" ? "Oct 13" : "Oct 10"], ["Owner", AK.owner(null)]] }, `<p class="v7o-p">${k === "s" ? "The DISA STIG checklist import records 412 rules: 371 not a finding, 29 open, 12 not applicable. Its split by category is invented here." : "The October ACAS import records 1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational. Whether each is still open is not recorded."}</p>`) };
  };

  // ═════════════ 6. Event log ═════════════
  const EVK = { evidence_reviews: "reviews", ingestion_jobs: "imports", program_posture_snapshots: "system" };
  const evKind = (e) => EVK[e[5]] || "decisions";
  const EVCOUNT = { all: 299, reviews: 280, imports: 8, decisions: 6, system: 5 };
  const evType = (t) => ({ "Import importing": "Import started" })[t] || t;
  const evGlyph = (t) => (/failed|sent back/i.test(t) ? "diamond" : /accepted|completed|published|decided|Snapshot/i.test(t) ? "check" : /cancelled/i.test(t) ? "ring" : "clock");
  const evReason = (e) => e[5] === "evidence_reviews" || /failed|cancelled/i.test(e[1]);
  const SRCNAME = { activity_events: "Activity event", evidence_reviews: "Evidence review", ingestion_jobs: "Scanner ingestion job", program_posture_snapshots: "Control status snapshot", package_revisions: "Package version", authorization_decisions: "Authorization decision", inheritance_acceptances: "Inheritance acceptance" };
  const utc = (iso) => { const [d, t] = iso.split("T"); return `${md(d)}, ${t}`; };
  const EV_TABS = [["event-log", "All", null], ["event-log-reviews", "Evidence reviews", "reviews"], ["event-log-imports", "Imports", "imports"], ["event-log-decisions", "Decisions and publications", "decisions"], ["event-log-system", "Daily job", "system"]];
  function eventLog(cur) {
    const kind = EV_TABS.find((x) => x[0] === cur)[2];
    const list = EVENTS.map((e, i) => [e, i]).filter(([e]) => !kind || evKind(e) === kind).slice(0, 30);
    return h.page(
      AK.indexHead({ title: "Event log", desc: "Who did what to which record, and when, in WS-X90 since Jun 30. Times are UTC; entries never change.", actions: btn("Export CSV", 'data-modal="v7o-export-log"', false, false) }),
      AK.tabs(EV_TABS.map(([r, l, k]) => [l, EVCOUNT[k || "all"], r, r === cur]), "Event types"),
      filters("Search events", ["Who", "Action", "Record", `<span class="flt v7o-date">${AK.i("calendar")}Select date range</span>`]),
      tbl({ cols: ["When", "Who", "Action", "Record", "Details"], rows: list.map(([e, i]) => ({ id: String(i), cells: [num(utc(e[0])), e[2] === "Daily job" ? sysChip("Daily job") : AK.owner(e[2]), `<span class="v7o-act">${gl(evGlyph(e[1]))}${esc(evType(e[1]))}</span>`, tr(e[3], 280), e[4] ? tr(e[4], 300) : mu("None given")] })), total: EVCOUNT[kind || "all"], panel: "v7o-event", cls: "v7o-tight", label: "Events" }),
      AK.note("The date range filter and the export format are proposed; every row is WS-X90's, read from activity events, evidence reviews, scanner ingestion jobs, package versions, the authorization decision, inheritance acceptances and the daily snapshot."),
    );
  }
  for (const [r] of EV_TABS) S[r] = () => eventLog(r);
  P["v7o-event"] = (id) => {
    const e = EVENTS[+id] || EVENTS[0];
    return { label: "Event preview", body: pan({ title: evType(e[1]), chip: `<span class="v7o-act">${gl(evGlyph(e[1]))}${esc(SRCNAME[e[5]] || e[5])}</span>`, facts: [["When", num(`${utc(e[0])} UTC`)], ["Who", e[2] === "Daily job" ? sysChip("Daily job · pg_cron") : AK.owner(e[2])], ["Program", tag("PRG-1090")]] },
      AK.card(kv([["Record", esc(e[3])], ["Recorded as", esc(SRCNAME[e[5]] || e[5])]])),
      e[4] ? AK.card(`${ch(evReason(e) ? "Reason" : "Result")}<p class="v7o-p">${esc(e[4])}</p>`) : AK.card(`${ch("Reason")}${li(gl("ring"), mu("None given"))}`),
      `<p class="v7o-p v7o-mu">Entries cannot be edited or deleted. An export of the log is itself an entry.</p>`) };
  };

  // ═════════════ 7. Enclaves and markings (all Example) ═════════════
  const mark = (e) => `<span class="v7o-mark ${e.banner}">${esc(e.text)}</span>`;
  S.enclaves = () => h.page(
    AK.indexHead({ title: "Enclaves & markings", desc: "Workspaces separated by classification, and what each one allows", actions: btn("Add enclave", 'data-modal="v7o-enclave-new"', true, false) }),
    tbl({ cols: ["Enclave", "Runs", "Holds", "AI drafting", "Chat", "Connectors"], rows: EN.map((e) => ({ id: e.id, cells: [`<span class="v7o-inl">${mark(e)}<b class="v7o-name">${esc(e.name)}</b>${e.id === "cui" ? pill("info", "You are here") : ""}</span>`, tr(e.deploy, 160), tr(e.programs, 150), tr(e.ai, 190), e.chat === "On" ? pill("ok", "On") : pill("none", "Off"), tr(e.connect, 170)] })), total: 3, panel: "v7o-enclave", cls: "v7o-tight", label: "Enclaves", pager: false }),
    AK.section("Markings", `<div class="v7o-grid2">${AK.card(`${ch("CUI marking on every page and export")}<div class="v7o-doc"><div class="v7o-mark wide">CUI</div><div class="pg"><div class="v7o-ind">Controlled by: Program office<br>CUI category: CTI<br>Distribution statement: D<br>POC: Joel Barrantes, ISSM</div><span>(CUI) WS-X90 Sentinel Mission System · System security plan, SSP 3</span><span>(U) Section headings carry their own portion marks.</span></div><div class="v7o-mark wide">CUI</div></div>`)}
      ${AK.card(`${ch("Marking rules", 6)}${[["check", "Banner at top and bottom of every page"], ["check", "Designation indicator on the first page of an export"], ["check", "Portion marks on exported paragraphs"], ["check", "Distribution statement D on exports"], ["clock", "Export-controlled (ITAR) warning, when set"], ["diamond", "A classified upload is blocked and reported as spillage"]].map(([g, t]) => li(gl(g), esc(t))).join("")}`)}</div>`),
    AK.section("Where AI drafting may run", tbl({ cols: ["Drafting", "Unclassified", "CUI", "Classified"], rows: [["Data call answers", "ok"], ["Control implementation narratives", "ok"], ["Finding summaries", "ok"], ["Evidence reading", "warn"]].map(([t, b]) => ({ id: t, panel: "", cells: [esc(t), pill("ok", "Hosted model"), b === "ok" ? pill("ok", "In-enclave model") : pill("warn", "In-enclave, ISSM approves"), pill("none", "Off")] })), total: 4, cls: "v7o-tight v7o-static", label: "Where AI drafting may run", pager: false })),
    AK.note("Everything on this screen is a proposal: the three enclaves, their rules and the marking preview. Banner colours follow the DoD marking convention."),
  );
  P["v7o-enclave"] = (id) => {
    const e = EN.find((x) => x.id === id) || EN[1];
    return { label: "Enclave preview", body: pan({ title: `${e.name} workspace`, chip: `${mark(e)}${EX}`, actions: btn("Edit", 'data-modal="v7o-enclave-new"', true), facts: [["Runs", esc(e.deploy)], ["Chat", e.chat === "On" ? pill("ok", "On") : pill("none", "Off")]] },
      AK.card(kv([["Holds", esc(e.programs)], ["AI drafting", esc(e.ai)], ["Connectors", esc(e.connect)]])),
      AK.card(`${ch("Moving data out")}<p class="v7o-p">${e.id === "s" ? "Only through an approved cross-domain solution, reviewed by the ISSM." : "Exports carry the banner; a higher-classification file never enters."}</p>`)) };
  };

  // ═════════════ 8. Common control providers ═════════════
  const ccpCodes = (c) => c.caps.flatMap((x) => x[2]);
  const ctlOf = (code) => (PA.SSP && PA.SSP.ctl(code)) || { t: code, cs: "not_assessed" };
  const satIn = (codes) => codes.filter((c) => ctlOf(c).cs === "satisfied").length;
  const CCP_AUTH = { idp: () => pill("none", "Not authorized"), lab: () => pill("ok", "Authorized"), cssp: () => pill("ok", "Accredited CSSP"), peo: () => pill("part", "With conditions") };
  S["common-controls"] = () => h.page(
    AK.indexHead({ title: "Common control providers", desc: "What WS-X90 inherits, and from whom, with each provider's own authorization", actions: btn("Add provider", 'data-modal="v7o-ccp-new"', true, false) }),
    banner("warn", "<b>Corporate identity provider</b> has no authorization of its own: its AO approval of the RMF strategy has been blocked since Aug 21, 2025.", btn("Open program", 'data-panel="v7o-prog" data-id="PRG-1013"')),
    filters("Search providers", ["Kind", "Authorization"]),
    tbl({ cols: ["Provider", "Kind", "Satisfied in WS-X90", "Inherited by", "Authorization"], rows: CCP.map((c) => { const codes = ccpCodes(c); return { id: c.id, cells: [`<span class="v7o-inl"><b class="v7o-name">${esc(c.name)}</b>${c.real ? "" : EX}</span>`, tag(c.kind), frac(satIn(codes), codes.length), c.real ? `<span class="v7o-inl">WS-X90 · 15 controls${mu("since Jun 30")}</span>` : ring("Not offered yet"), CCP_AUTH[c.id]()] }; }), total: 4, panel: "v7o-ccp", cls: "v7o-tight", label: "Providers", pager: false }),
    AK.note("The hosting enclave, CSSP and PEO rows are invented, with their authorizations; the statuses beside their controls are WS-X90's own today. The Corporate identity provider, its offers and WS-X90's acceptances are real."),
  );
  P["v7o-ccp"] = (id) => {
    const c = CCP.find((x) => x.id === id) || CCP[0];
    const codes = ccpCodes(c);
    return { label: "Provider preview", body: pan({ title: c.name, chip: `${tag(c.kind)}${c.real ? "" : EX}`, actions: c.real ? btn("Review acceptance", 'data-modal="v7o-ccp-new"') : btn("Ask for an offer", 'data-modal="v7o-ccp-new"', true),
        facts: [["Controls", num(`${codes.length} · ${satIn(codes)} satisfied`)], ["Authorization", CCP_AUTH[c.id]()]].concat(c.real ? [["Program", "PRG-1013 · idp-core"]] : []) },
      c.real ? AK.card(`${ch("Inherited by", 1)}${li(gl("check"), "<b>WS-X90 Sentinel Mission System</b> · 15 controls on SSP 2 and SSP 3", "Jun 30 · Priya Raghavan")}`) : `<div class="v7o-nudge">${gl("info")}<span>No program inherits from it yet. An offer names each capability, the controls it covers and the consumer's duty.</span></div>`,
      c.real ? AK.card(`${ch("Authorization")}${li(gl("diamond"), "AO approval of RMF strategy", AK.due("2025-08-21"))}<p class="v7o-p v7o-mu">The gate is blocked, and no authorization decision is recorded for PRG-1013.</p>`) : "",
      ...c.caps.map(([code, name, ctl, duty]) => AK.card(`${ch(name, null, `<span class="ak-code">${esc(code)}</span>`)}${ctl.map((x) => li(`<span class="ak-code">${esc(x)}</span>`, tr(ctlOf(x).t, 240), stPill(ctlOf(x).cs))).join("")}<p class="v7o-p v7o-mu">Consumer duty: ${esc(duty)}</p>`))) };
  };

  // ═════════════ 9. People › DoD 8140 qualifications ═════════════
  const ROLES = [["R. Calloway", "Authorizing official", "AO"], ["D. Okafor", "Lead assessor", "SCA"], ["Nadia Fournier", "Assessor", "SCA"], ["Local developer", "Assessor", "SCA"], ["Joel Barrantes", "Information system security manager", "ISSM"], ["Priya Raghavan", "Information system security officer", "ISSO"], ["Ray Colston", "System owner", "SO"]];
  // [DCWF code, work role, proficiency, foundational qualification, learning hours this year, status, due] — every line is Example.
  const Q8140 = {
    "R. Calloway": ["611", "Authorizing Official/Designating Representative", "Advanced", "CGRC", 14, ["ok", "Qualified"], null],
    "D. Okafor": ["612", "Security Control Assessor", "Advanced", "CISSP", 26, ["ok", "Qualified"], null],
    "Nadia Fournier": ["612", "Security Control Assessor", "Intermediate", "CASP+", 9, ["warn", "Learning hours due"], "2027-01-31"],
    "Local developer": ["612", "Security Control Assessor", "Basic", "Security+", 0, ["bad", "Not qualified"], null],
    "Joel Barrantes": ["722", "Information Systems Security Manager", "Advanced", "CISSP", 31, ["ok", "Qualified"], null],
    "Priya Raghavan": ["461", "Systems Security Analyst", "Intermediate", "Security+", 18, ["ok", "Qualified"], null],
    "Ray Colston": ["801", "Program Manager", "Intermediate", "DAU PM", 6, ["warn", "Qualifying"], "2027-03-01"],
  };
  const Q_F = { all: () => true, ok: (q) => q[5][1] === "Qualified", bad: (q) => q[5][0] === "bad", qual: (q) => q[5][1] === "Qualifying", hours: (q) => q[5][1] === "Learning hours due" };
  const peopleHead = () => AK.indexHead({ title: "People", desc: "Role holders and task owners of WS-X90",
    actions: `${more("More people actions", [["Send one-time reminder", 'data-modal="v7o-remind-8140"'], ["Export", toast("Qualifications exported (.csv)")]])}${btn("Assign a role", 'data-modal="risk-role"', true, false)}` });
  S["people-8140"] = () => {
    const f = Q_F[qv("q8140", "all")] || Q_F.all;
    const list = ROLES.filter(([n]) => f(Q8140[n]));
    const n = (k) => ROLES.filter(([x]) => Q_F[k](Q8140[x])).length;
    return h.page(peopleHead(),
      AK.tabs([["People", 11, "people", false], ["Roles", 6, "people-roles", false], ["DoD 8140 qualifications", 7, "people-8140", true], ["Privileged access reviews", 3, "people-access", false]], "People"),
      banner("warn", "<b>Local developer</b> is not qualified for work role 612, Security Control Assessor, and records determinations. 2 more holders have a date to meet.", btn("Send reminders", 'data-modal="v7o-remind-8140"')),
      chips("q8140", [["all", "All", 7], ["ok", "Qualified", n("ok")], ["bad", "Not qualified", n("bad")], ["qual", "Qualifying", n("qual")], ["hours", "Learning hours due", n("hours")]]),
      filters("Search people", ["Work role", "Proficiency", "Status"]),
      tbl({ cols: ["Person", "DCWF work role", "Proficiency", "Foundational", "Continuous learning", "Status"], rows: list.map(([nm, role, short]) => { const q = Q8140[nm]; return { id: nm, cells: [`<span class="v7o-pers" title="${esc(role)}">${AK.avatar(nm, 26)}<span>${esc(nm)}</span>${tag(short)}</span>`, `<span class="v7o-inl"><span class="ak-code">${q[0]}</span>${tr(q[1], 240)}</span>`, esc(q[2]), tag(q[3]), AK.progress(q[4], 20, "hours"), pill(q[5][0], q[6] ? `${q[5][1] === "Qualifying" ? "Qualifying by" : "Hours due"} ${md(q[6])}` : q[5][1])] }; }), total: list.length, panel: "v7o-q8140", cls: "v7o-tight", label: "DoD 8140 qualifications", pager: false }),
      AK.note("Every qualification on this tab is invented; the role holders are WS-X90's. DoD 8140.03 qualifies a person for a DCWF work role through a foundational qualification, residential qualification and 20 hours of continuous learning a year."),
    );
  };
  P["v7o-q8140"] = (nm) => {
    const r = ROLES.find((x) => x[0] === nm) || ROLES[0], q = Q8140[r[0]];
    const ok = q[5][1] === "Qualified";
    return { label: "Qualification preview", body: pan({ title: r[0], chip: `${pill(q[5][0], q[5][1])}${EX}`, actions: btn(ok ? "Record renewal" : "Record qualification", `data-modal="v7o-record-8140" data-id="${esc(r[0])}"`, true),
        facts: [["RMF role", `${esc(r[1])} ${tag(r[2])}`], ["Work role", `${q[0]} · ${esc(q[1])}`], ["Proficiency", esc(q[2])]] },
      (() => { const bad = q[5][0] === "bad", qual = q[5][1] === "Qualifying", found = !bad, res = !bad && !qual, learn = q[4] >= 20;
        return AK.card(`${ch("Qualification", null, AK.progress([found, res, learn].filter(Boolean).length, 3, "met"))}
        ${li(gl(found ? "check" : "diamond"), `Foundational · ${esc(q[3])}`, found ? "Met" : `Not enough for ${q[0]}`)}
        ${li(gl(res ? "check" : qual ? "clock" : "ring"), "Residential · on-the-job evaluation", res ? "Met" : qual ? AK.due(q[6], { prefix: false }) : "Not recorded")}
        ${li(gl(learn ? "check" : "clock"), `Continuous learning · ${q[4]} of 20 hours`, learn ? "Met" : q[5][1] === "Learning hours due" ? AK.due(q[6], { prefix: false }) : "Due Dec 31")}`); })(),
      `<div class="v7o-rem">${remind(null, `Reminder sent to ${r[0]}`)}</div>`) };
  };

  // ═════════════ Dialogs ═════════════
  M["v7o-owner"] = () => ({ title: "Change owner", body: `<p class="ak-desc">The owner reviews offers and publishes versions of the Mission Computer.</p>${AK.ownerPicker({ you: ME, people: [["Priya Raghavan", "Owner"], ["Marcus Ryde", ""], ["Elena Vasquez", "Assessor"]] })}`, footer: foot("Save owner", "Owner saved") });
  M["v7o-task"] = () => ({ title: "Create task", body: `${field("Task", input("What is done, in one line"), REQ)}${field("Assignee", select("Search people"))}${field("Due date", select("Choose a date"))}${field("About", select("Mission Computer · version 2"))}`, footer: foot("Create task", "Task created") });
  M["v7o-remind"] = () => ({ title: "Remind consumers to take version 2", body: `<p class="ak-desc">Each program that runs version 1 gets one email, and its Where used line records the reminder.</p>
    ${CONS.slice(1).map((c) => checkRow(c.name, true, `${c.sys} · ${c.el} · version 1`)).join("")}${field("Message", input("Version 2 carries OpenSSH 9.8p1, which fixes CVE-2024-6387. AC-17(2) and SC-23 are to review.", true, true), OPT)}`, footer: foot("Send reminders", "3 consumers reminded") });
  M["v7o-take"] = (id) => {
    const c = CONS.find((x) => x.id === id) || CONS[1];
    return { title: "Take version 2", body: `${kv([["System", `${esc(c.sys)} · ${esc(c.el)} Mission Computer`], ["From", "Version 1"], ["To", "Version 2 · published Nov 12"]])}
      <div class="v7o-sum"><div>Determinations taken<b class="num">54</b></div><div>Carried<b class="num">52</b></div><div>To review<b class="num">2</b></div><div>Judged anew<b class="num">0</b></div></div>
      ${tbl({ cols: ["Control", "Inherited", "Now", "After"], rows: [["AC-17(2)", true, "satisfied", "not_assessed"], ["SC-23", true, "satisfied", "not_assessed"], ["RA-5", false, "satisfied", "satisfied"], ["SI-2", false, "not_assessed", "not_assessed"]].map(([cd, inh, now, after]) => ({ id: cd, panel: "", cells: [`<span class="ak-code">${cd}</span>`, inh ? pill("ok", "Yes") : pill("none", "No"), stPill(now), stPill(after)] })), total: 4, cls: "v7o-static", pager: false })}
      <p class="ak-desc">From component_version_review for ${esc(c.el)}: the SSP keeps version 1 until this is taken.</p>`, footer: foot("Take version 2", `${c.sys} takes Mission Computer version 2`) };
  };
  M["v7o-accept"] = () => ({ title: "Accept offer", body: `<p class="ak-desc">Accepting records the finding against Mission Computer version 1 and opens one operational issue in each other program built from it.</p>
    <div class="v7o-sum"><div>Issues opened<b class="num">2</b></div><div>Programs<b class="num">3</b></div><div>WS-X90 keeps<b class="num">1</b></div></div>
    ${field("Note to the programs", input("Fixed in version 2 (OpenSSH 9.8p1). Take version 2 to close it.", true, true), OPT)}`, footer: foot("Accept offer", "Offer accepted: 2 issues opened") });
  M["v7o-return"] = () => ({ title: "Return offer", body: `<p class="ak-desc">Returning sends the finding back to Ingrid Solberg on WS-X90. Nothing opens in the other programs.</p>${field("Reason", input("Say what the program should change before offering it again", true), REQ, "WS-X90 sees it on the offer.")}`, footer: foot("Return offer", "Offer returned to WS-X90") });
  M["v7o-determine"] = (id) => ({ title: `Record determination · ${id || "AC-17(2)"}`, body: `<p class="ak-desc">Version 2 changes what this control depends on, so the version 1 determination is not carried.</p>${field("Determination", select("Satisfied"), REQ)}${field("Rationale", input("Required short of satisfied: what the assessor examined in version 2", true), OPT)}${field("Evidence", `<div class="ak-drop">${AK.i("upload")}Upload a file or link a document</div>`, OPT)}`, footer: foot("Record determination", "Determination recorded") });
  M["v7o-take-product"] = () => ({ title: "Take version 2 of X800 Missile", body: `<p class="ak-desc">X800-A-CUSA takes X800 Missile version 2, Lug &amp; Rail Launch. What the program changed stays.</p>
    ${kv([["Kept", num("18 elements, still as the program changed them")], ["Added", "PS-HMU Health Monitoring Unit, as CA-PS-HMU"], ["Stays removed", "SE-MDL Mission Data Loader"], ["Library pins", num("0 changed")], ["Assessment", "X800 Missile version 2 product assessment, published Nov 10"]])}
    <p class="ak-desc">Read from the variant's version review; the request is sent once, so taking it again changes nothing.</p>`, footer: foot("Take version 2", "X800-A-CUSA takes X800 Missile version 2") });
  M["v7o-plan-delta"] = (sys) => {
    const v = VARS.find((x) => x.sys === sys) || VARS[0];
    const owed = v.t[3] + v.t[4];
    return { title: "Plan delta assessment", body: `<p class="ak-desc">${v.sys === "X800-A-CUSA" ? `Plans the 912 assessment objectives of the ${owed} controls X800-A-CUSA owes` : `Plans each assessment objective of the ${owed} controls ${esc(v.sys)} owes`}: ${v.t[3]} changed here and ${v.t[4]} program only. ${v.t[1] + v.t[2]} controls are not assessed again.</p>
      ${field("Title", input(`${v.sys} delta assessment`, false, true), REQ)}${field("SSP", select("Choose the variant's published SSP"), REQ, "A variant whose SSP is still a draft cannot be planned.")}`, footer: foot("Plan delta assessment", `${v.sys} delta assessment planned`) };
  };
  M["v7o-dl-edit"] = (id) => {
    const d = DLX.find((x) => x[0] === id) || DLX[10];
    return { title: `Edit ${lc(d[1])} deadline`, body: `${field("Days", `<div class="v7o-inline"><span class="ak-input v7o-numin num">${d[4]}</span><span class="v7o-mu">Recommended ${esc(d[5])} days</span></div>`, REQ)}
      ${field("Count from", `${radio(d[2] === "Vulnerabilities" ? "The day the notice or result was released" : "The day it was found or opened", true)}${radio("The day it was imported", false)}`)}
      ${field("Open items", `${radio("Apply to new items only", true)}${radio("Recompute every open item's due date", false, "Logged in the event log")}`)}
      ${field("Owner", select(d[6]))}<p class="ak-desc">Applies to: ${esc(d[3])}.</p>`, footer: foot("Save deadline", `${d[1]} deadline saved`) };
  };
  M["v7o-dl-reset"] = () => ({ title: "Reset to recommended", body: `<p class="ak-desc">Each deadline goes back to the top of its recommended range. Open items keep their due dates.</p>${field("Reason", input("Why the deadlines change", true), REQ)}`, footer: foot("Reset deadlines", "Deadlines reset to recommended") });
  M["v7o-export-log"] = () => ({ title: "Export event log", body: `${field("Events", `${radio("All 299 events", true, "Jun 30 to Nov 17")}${radio("Last 30 days", false)}${radio("The view shown", false)}`)}${field("Format", `${radio("CSV", true)}${radio("JSON", false)}`)}
    <div class="v7o-nudge">${gl("info")}<span>The file carries the CUI banner, and the export is recorded as an event.</span></div>`, footer: foot("Export", "Event log exported (.csv)") });
  M["v7o-enclave-new"] = () => ({ title: "Add enclave", body: `${field("Classification", `${radio("Unclassified", false)}${radio("CUI", true)}${radio("Secret", false)}`)}${field("Runs", `${radio("Cloud · DoD IL4 or IL5", false)}${radio("On-premises", true)}${radio("Air-gapped", false)}`)}${field("AI drafting", `${radio("Model inside the enclave", true)}${radio("Off", false)}`)}<p class="ak-desc">${EX} Enclaves are a proposal.</p>`, footer: foot("Add enclave", "Enclave added") });
  M["v7o-ccp-new"] = () => ({ title: "Add provider", body: `${field("Provider", `${radio("A hosting enclave", true, "Physical, contingency, boundary")}${radio("A CSSP", false, "Incident response and monitoring")}${radio("PEO enterprise services", false, "Shared tools and keys")}`)}
    <div class="v7o-nudge">${gl("info")}<span>An offer names each capability, the controls it covers and the consumer's duty. WS-X90 accepts it control by control on its SSP.</span></div>`, footer: foot("Ask for an offer", "Offer requested") });
  M["v7o-record-8140"] = (nm) => ({ title: `Record qualification · ${nm || "Local developer"}`, body: `${field("Work role", select("612 · Security Control Assessor"), REQ)}${field("Proficiency", select("Intermediate"), REQ)}${field("Foundational qualification", select("Choose a certification or course"), REQ)}${field("Evidence", `<div class="ak-drop">${AK.i("upload")}Upload the certificate or training record</div>`, OPT)}<p class="ak-desc">${EX} DoD 8140 records are a proposal.</p>`, footer: foot("Record qualification", "Qualification recorded") });
  M["v7o-remind-8140"] = () => ({ title: "Send reminders", body: `<p class="ak-desc">Each person gets one email with what is left to qualify for their work role.</p>${checkRow("Local developer", true, "Not qualified · 612 Security Control Assessor")}${checkRow("Nadia Fournier", true, "9 of 20 learning hours · due Jan 31")}${checkRow("Ray Colston", true, "Qualifying by Mar 1 · 801 Program Manager")}`, footer: foot("Send reminders", "3 people reminded") });
  M["v7o-new-component"] = () => ({ title: "Create component", body: `${field("Name", input("Name the component"), REQ)}${field("Component set", select("X800 Missile component set"), REQ)}${field("Type", select("Hardware"))}${field("Owner", select("Search people"))}<p class="ak-desc">A new component starts as a draft of the set's next version.</p>`, footer: foot("Create component", "Component created as a draft") });
  M["v7o-new-product"] = () => ({ title: "Create product", body: `${field("Name", input("Name the product"), REQ)}${field("Code", input("A short code, such as X900"), REQ)}${field("Business line", select("Air Defense"))}<p class="ak-desc">The product starts at version 1, a draft, with no configuration.</p>`, footer: foot("Create product", "Product created") });
  M["v7o-new-bl"] = () => ({ title: "Create business line", body: `${field("Name", input("Name the business line"), REQ)}${field("Code", input("A short code, such as AD"), REQ)}${field("Owner", select("Search people"))}`, footer: foot("Create business line", "Business line created") });

  // ═════════════ Wiring ═════════════
  const redraw = () => { const r = route(), m = document.getElementById("main"); if (S[r] && m) m.innerHTML = S[r](); };
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-v7o-toast]");
    if (t) { const text = t.getAttribute("data-v7o-toast"); setTimeout(() => { if (PA.SSP && PA.SSP.ui) PA.SSP.ui.toast(text); }, 30); }
    const s = e.target.closest && e.target.closest("[data-v7o-set]");
    if (s) { const [k, v] = s.getAttribute("data-v7o-set").split(":"); QV[k] = v; if (s.getAttribute("data-go") === route()) setTimeout(redraw, 0); }
  }, true);
  document.addEventListener("click", (e) => {
    const q = e.target.closest && e.target.closest("[data-v7o-q]");
    if (q) { QV[q.getAttribute("data-v7o-q")] = q.getAttribute("data-v7o-v"); redraw(); const again = document.querySelector(`[data-v7o-q="${q.getAttribute("data-v7o-q")}"][data-v7o-v="${q.getAttribute("data-v7o-v")}"]`); if (again) again.focus(); return; }
    document.querySelectorAll(".v7o-dd[open]").forEach((d) => { if (!d.contains(e.target) || (e.target.closest && e.target.closest(".v7o-mi"))) d.open = false; });
  });
  // Keyboard: Enter or Space on a span that acts. The core already handles [data-modal] and [data-go] in Main, so only set the
  // filter a rail pill carries before it navigates, and click what nothing else handles.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (!t.matches || t.matches("button, a, summary, input, textarea") || !t.matches('[role="button"], [role="link"], [role="menuitem"]')) return;
    if (t.matches("[data-v7o-set]")) { const [k, v] = t.getAttribute("data-v7o-set").split(":"); QV[k] = v; if (t.getAttribute("data-go") === route()) setTimeout(redraw, 0); }
    if (t.closest("#main") && t.matches("[data-modal], [data-go]")) return;
    if (t.matches("[data-modal], [data-go], [data-panel], [data-v7o-toast]")) { e.preventDefault(); e.stopPropagation(); t.click(); }
  }, true);

  const SUB = {
    "products-delta": "products",
    "component-mc": "components", "component-mc-assessment": "components", "component-mc-where": "components", "component-mc-findings": "components", "component-mc-sbom": "components", "component-mc-sbom-v1": "components", "component-mc-versions": "components", "component-mc-tasks": "components", "component-mc-activity": "components", "component-mc-comments": "components",
    "deadlines-vuln": "deadlines", "deadlines-stig": "deadlines", "deadlines-findings": "deadlines", "deadlines-other": "deadlines",
    "event-log-reviews": "event-log", "event-log-imports": "event-log", "event-log-decisions": "event-log", "event-log-system": "event-log",
    "people-8140": "people",
  };
  Object.assign(ROUTE_NAV, SUB);
  if (PA.own) PA.own(["portfolio", "products", "components", "deadlines", "event-log", "enclaves", "common-controls", ...Object.keys(SUB)]);
})();
