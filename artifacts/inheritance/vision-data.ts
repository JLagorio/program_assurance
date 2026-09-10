/** Fictional design-study data. Reuse is implementation support, never an assessment result. */
export type SourceCategory = 'Organization' | 'Product' | 'Host platform';
export type Source = {
  id: string; name: string; category: SourceCategory; kind: string; version: string; owner: string;
  summary: string; families: string[]; controlIds: string[]; consumers: string[];
  status: 'Published' | 'Update available' | 'Review due'; conditions: string[]; narrative: string;
  evidence: { id: string; title: string; kind: string; date: string }[];
  requirements: { id: string; text: string; controlIds: string[] }[];
};
export type Control = { id: string; title: string; family: string; objective: string };
export type Target = { id: string; name: string; short: string; kind: string; parent: string | null; sourceId?: string };
export type Contribution = { id: string; sourceId: string; controlId: string; narrative: string; remaining: string; evidenceIds: string[]; eligibleTargets: string[] };
export type Update = { id: string; sourceId: string; fromVersion: string; toVersion: string; title: string; summary: string; changes: { label: string; before: string; after: string }[]; affectedPrograms: string[] };

// Controls and product targets are a fictional design-study baseline.
const controlRows: [string,string,string][] = [
  ["AU-1","Policy and procedures","Maintain audit responsibilities and procedures."],
  ["AU-2","Event logging","Select relevant events for the deployed mission."],
  ["AU-3","Content of audit records","Record event, time, source, outcome, and identity."],
  ["AU-6","Audit review and analysis","Review audit records and escalate findings."],
  ["AU-9","Protection of audit information","Protect audit records and tools."],
  ["AU-12","Audit record generation","Generate selected security records."],
  ["AC-2","Account management","Approve, review, and remove accounts."],
  ["AC-3","Access enforcement","Enforce approved access authorizations."],
  ["AC-6","Least privilege","Restrict access to authorized duties."],
  ["IA-2","User identification and authentication","Uniquely identify and authenticate users."],
  ["IA-5","Authenticator management","Control authenticator issuance, protection, and revocation."],
  ["CM-2","Baseline configuration","Maintain the approved deployed baseline."],
  ["CM-3","Configuration change control","Review and document configuration changes."],
  ["CM-6","Configuration settings","Implement and verify security settings."],
  ["SI-2","Flaw remediation","Identify, test, and remediate applicable flaws."],
  ["SI-3","Malicious code protection","Maintain suitable malicious-code protection."],
  ["SI-7","Software and firmware integrity","Detect unauthorized software and firmware changes."],
  ["SC-8","Transmission confidentiality and integrity","Protect information in transit."],
  ["SC-12","Cryptographic key management","Control keys throughout their lifecycle."],
  ["SC-13","Cryptographic protection","Apply appropriate cryptographic mechanisms."],
  ["CA-2","Control assessments","Assess controls and document results."],
  ["CA-7","Continuous monitoring","Monitor effectiveness and outstanding weaknesses."],
  ["IR-4","Incident handling","Coordinate incident detection, containment, and recovery."],
  ["IR-6","Incident reporting","Report incidents through approved channels."],
  ["CP-9","System backup","Protect and verify required backups."],
  ["CP-10","System recovery and reconstitution","Restore approved operation within recovery objectives."]
];
export const controls: Control[] = controlRows.map(([id,title,objective]) => ({id,title,objective,family:id.slice(0,2)}));

export const targets: Target[] = [
  {"id":"system","name":"Aster Mission System","short":"Aster","kind":"System","parent":null},
  {"id":"mission","name":"Mission Processing","short":"Mission","kind":"Subsystem","parent":"system"},
  {"id":"mc1","name":"Mission Computer · Primary","short":"MC-01","kind":"Component","parent":"mission","sourceId":"mission-computer"},
  {"id":"mc2","name":"Mission Computer · Standby","short":"MC-02","kind":"Component","parent":"mission","sourceId":"mission-computer"},
  {"id":"sensor","name":"Sensor Interface Unit","short":"Sensor","kind":"Component","parent":"mission"},
  {"id":"comms","name":"Communications","short":"Comms","kind":"Subsystem","parent":"system"},
  {"id":"gateway","name":"Tactical Communications Gateway","short":"GW-01","kind":"Component","parent":"comms","sourceId":"comms-gateway"},
  {"id":"ground","name":"Ground Operations","short":"Ground","kind":"Subsystem","parent":"system"},
  {"id":"console","name":"Operator Console","short":"OC-01","kind":"Component","parent":"ground","sourceId":"operator-console"}
];

type SourceRow = [string,string,SourceCategory,string,string,string,string,string[],Source["status"],string[],string,[string,string,string,string][],[string,string,string[]][]];
const sourceRows: SourceRow[] = [
  ["corp-audit","Enterprise Audit & Accountability","Organization","Policy baseline","3.4","Corporate Security","Audit policy, event taxonomy, review, and custody.",["Aster","Boreal","Meridian"],"Published",["Corporate audit charter adopted.","Program approves event selections and retention periods."],"Corporate Security owns the audit charter, event taxonomy, and review procedure. Programs approve local event selections and name reviewers.",[["E-AUD-01","Audit charter and procedure pack","Approved policy","2026-07-15"],["E-AUD-02","Q2 audit governance review","Review record","2026-07-02"]],[["ORG-AUD-01","Audit owners document program event selections.",["AU-1","AU-2"]],["ORG-AUD-03","Audit review findings have recorded dispositions.",["AU-6"]]]],
  ["corp-access","Workforce Access Standard","Organization","Policy baseline","2.6","Identity Governance","Workforce lifecycle and role approval rules.",["Aster","Boreal","Meridian"],"Published",["Corporate access approval workflow used.","Local register covers disconnected and service accounts."],"Identity Governance defines sponsorship, role review, and offboarding. Programs inventory local accounts and approve actual privileges.",[["E-ACC-01","Workforce access lifecycle standard","Approved policy","2026-06-20"],["E-ACC-02","Quarterly access review template","Procedure","2026-06-20"]],[["ORG-ACC-02","Accounts have sponsors and documented access needs.",["AC-2","AC-6"]],["ORG-ACC-05","Authenticator exceptions are approved and reviewed.",["IA-5"]]]],
  ["corp-config","Engineering Configuration Baseline","Organization","Engineering standard","4.1","Engineering Assurance","Configuration boards, baselines, and release gates.",["Aster","Boreal","Meridian"],"Update available",["Program maintains its approved configuration index.","Release and emergency-change authorities are named."],"Engineering Assurance supplies baseline schemas and change-board procedures. Programs own their deployed configuration and release decisions.",[["E-CFG-01","Configuration management handbook","Approved standard","2026-05-12"],["E-CFG-02","Release gate checklist","Procedure","2026-05-12"]],[["ENG-CFG-01","The configuration index identifies approved release items.",["CM-2","CM-6"]],["ENG-CFG-02","Controlled changes receive security impact review.",["CM-3"]]]],
  ["corp-incident","Corporate Incident Response","Organization","Shared operating procedure","5.0","Security Operations","Corporate incident triage and escalation.",["Aster","Boreal","Meridian"],"Published",["Program supplies a reachable incident contact.","Mission authority retains containment decisions."],"Security Operations supplies incident triage and reporting coordination. Mission authority retains containment decisions.",[["E-IR-01","Incident coordination playbook","Procedure","2026-08-03"],["E-IR-02","Summer tabletop after-action report","Exercise record","2026-08-21"]],[["ORG-IR-04","Corporate triage has a named program incident contact.",["IR-4","IR-6"]]]],
  ["corp-personnel","Privileged Operator Qualification","Organization","Role qualification","1.8","People & Security","Qualification prerequisites for privileged roles.",["Aster","Boreal"],"Review due",["Role appears in the privileged-role register.","Program verifies current qualification before access."],"People & Security retains privileged-role qualification records. Qualification supports access approval; it does not enforce permissions.",[["E-PER-01","Privileged role qualification matrix","Standard","2025-09-01"]],[["ORG-PER-06","Privileged access approval requires current qualification.",["AC-2","AC-6"]]]],
  ["regional-eu","European Operations Supplement","Organization","Regional overlay","1.3","EU Security Office","Regional audit handling and escalation overlay.",["Boreal","Meridian"],"Published",["Only declared European operations are in scope.","Local review approves supplemental retention rules."],"The EU supplement adds regional audit custody and escalation responsibilities to the corporate baseline.",[["E-EU-01","European operations security supplement","Approved supplement","2026-04-10"]],[["EU-AUD-01","Local procedures identify regional audit responsibilities.",["AU-1","AU-9"]],["EU-IR-02","Regional incident escalation contacts are documented.",["IR-6"]]]],
  ["mission-computer","Mission Computer X","Product","Hardware assembly","1.2","Mission Computing","Qualified compute assembly and assurance package.",["Aster","Boreal","Meridian"],"Update available",["MC-X revision D; firmware 2.8; hardened OS 6.2.","Deployment debug interface disabled.","Primary and standby configurations confirmed separately."],"MC-X provides partition isolation, a privileged audit service, and signed platform images. Bench evidence covers the qualified module configuration.",[["E-MCX-01","MC-X 1.2 qualified configuration index","Baseline record","2026-05-28"],["E-MCX-02","Audit service bench verification","Test report","2026-06-04"],["E-MCX-03","Partition and boot integrity results","Test report","2026-06-06"]],[["MCX-SEC-014","Privileged actions record actor and result.",["AU-2","AU-3","AU-12"]],["MCX-SEC-021","Qualified modules execute only signed platform images.",["SI-7","CM-2"]],["MCX-SEC-032","Partitions enforce approved resource boundaries.",["AC-3","AC-6"]],["MCX-INT-040","Primary and standby modules retain distinct configuration identities.",[]]]],
  ["comms-gateway","Tactical Gateway G4","Product","Network appliance","4.2","Secure Communications","Interface isolation and approved protected transport.",["Aster","Meridian"],"Published",["Signed, program-approved G4 policy bundle.","Program configures allowed peers and transport profiles."],"G4 enforces signed interface policies, logs connection decisions, and protects approved peer links. Evidence covers its declared transport profile.",[["E-GW-01","G4 interface enforcement verification","Test report","2026-06-18"],["E-GW-02","G4 protected transport profile","Configuration guide","2026-06-12"]],[["G4-SEC-08","Only approved peer and interface combinations are permitted.",["AC-3","CM-6"]],["G4-SEC-12","Connection decisions are logged; approved links are protected.",["AU-2","AU-3","SC-8","SC-13"]]]],
  ["hardened-os","Sentinel RTOS","Product","Operating system","6.2","Platform Software","Hardened OS, process restrictions, and audit hooks.",["Aster","Boreal","Meridian"],"Published",["Sentinel 6.2 LTS profile; all exceptions documented.","Integrator supplies application privileges and local accounts."],"Sentinel supplies a locked OS profile, service privilege boundaries, audit hooks, and flaw advisories. Integrators own application configuration.",[["E-OS-01","Sentinel 6.2 hardening profile","Baseline record","2026-05-19"],["E-OS-02","Privilege and audit hook verification","Test report","2026-05-22"]],[["SRT-SEC-07","Privileged services use only approved permissions.",["AC-6","CM-6"]],["SRT-SEC-15","Configured audit records are generated and protected.",["AU-9","AU-12"]],["SRT-SEC-19","Flaw advisories identify supported corrective releases.",["SI-2"]]]],
  ["boot-firmware","Anchor Secure Boot","Product","Firmware","2.8","Trusted Platforms","Verified boot chain and signed firmware updates.",["Aster","Boreal"],"Published",["Production trust anchors; no debug keys.","Approved signing chain protects recovery images."],"Anchor verifies signed boot stages and records startup measurements. Production trust-anchor provisioning remains with the integrator.",[["E-BOOT-01","Anchor negative-path boot tests","Test report","2026-05-08"],["E-BOOT-02","Production provisioning procedure","Procedure","2026-05-07"]],[["ANC-SEC-03","Executable boot stages are verified before execution.",["SI-7"]],["ANC-SEC-09","Baseline records identify trust anchors and recovery settings.",["CM-2","SC-12"]]]],
  ["crypto-module","CipherCore C2","Product","Cryptographic module","2.1","Cryptographic Engineering","Cryptographic services and key lifecycle interfaces.",["Aster","Meridian"],"Published",["Approved mode and supported algorithm profile selected.","Program supplies keys and rotation procedures."],"CipherCore provides protected key slots and cryptographic operations within its documented module boundary. Programs select protocol and key policy.",[["E-CRY-01","C2 security boundary and operating guide","Product assurance report","2026-04-17"],["E-CRY-02","Key lifecycle interface tests","Test report","2026-04-21"]],[["C2-SEC-04","Keys use supported lifecycle interfaces.",["SC-12"]],["C2-SEC-08","Protected links use an approved cryptographic profile.",["SC-8","SC-13"]]]],
  ["operator-console","Operator Console O7","Product","Workstation assembly","7.0","Ground Products","Operator roles, sign-in, and application allowlisting.",["Aster","Boreal"],"Published",["Console joins the declared identity tenant.","Emergency local accounts are managed and tested."],"O7 enforces operator roles, federated sessions, and application allowlisting. Programs configure mission roles and emergency local access.",[["E-OC-01","O7 role and session verification","Test report","2026-07-07"],["E-OC-02","O7 application allowlist baseline","Baseline record","2026-07-02"]],[["O7-SEC-04","Operator and maintenance roles are distinct.",["AC-3","AC-6","IA-2"]],["O7-SEC-12","Session events are recorded; only approved applications execute.",["AU-12","SI-3"]]]],
  ["mission-runtime","Mission Runtime Framework","Product","Software framework","3.6","Mission Applications","Application events, authorization, and package integrity.",["Aster","Boreal","Meridian"],"Published",["Applications use supported security interfaces.","Program owns application events and roles."],"The framework supplies event APIs, permission checks, and signed package loading. Applications must prove correct interface use.",[["E-RUN-01","Runtime security interface contract","Interface specification","2026-06-09"],["E-RUN-02","Framework security regression report","Test report","2026-06-11"]],[["MRF-SEC-02","Applications emit selected events through the common API.",["AU-3","AU-12"]],["MRF-SEC-11","Service permissions and package authenticity are checked.",["AC-3","SI-7"]]]],
  ["host-orion","Orion Aircraft Platform","Host platform","Host assurance package","3.2","Orion Platform Authority","Aircraft time, maintenance access, and audit offload.",["Aster","Boreal"],"Update available",["Approved Orion integration interface is used.","Declared aircraft configuration is confirmed.","Offload requires attachment; detached operation needs local procedures."],"Orion supplies time, controlled maintenance entry, and protected audit offload to attached equipment. Coverage ends at its declared interface.",[["E-HOST-01","Orion 3.2 common-control statement","Provider statement","2026-05-30"],["E-HOST-02","Mission interface assurance report","Integration report","2026-06-02"]],[["ORI-CC-04","Attached equipment receives the platform time reference.",["AU-3"]],["ORI-CC-09","Maintainers authenticate at the host boundary.",["AC-3","IA-2"]],["ORI-CC-16","Audit offload uses the protected platform channel.",["AU-9","SC-8"]]]],
  ["ground-host","Ground Operations Enclave","Host platform","Hosting service","2.4","Ground Infrastructure","Ground network admission and audit collection.",["Aster","Meridian"],"Published",["Ground assets enroll in the approved enclave.","Field deployments need a separate provider relationship."],"The enclave provides enrolled ground assets with network admission, audit collection, and scheduled review. Application duties remain local.",[["E-GND-01","Ground enclave service assurance statement","Provider statement","2026-07-18"],["E-GND-02","Collector availability and review record","Operational record","2026-08-31"]],[["GND-CC-06","Enrolled assets forward supported events to the collector.",["AU-6","AU-9"]],["GND-CC-10","Approved asset and network admission rules are enforced.",["AC-3","SC-8"]]]],
  ["enterprise-identity","Enterprise Identity Service","Host platform","Shared service","8.1","Identity Platform","Workforce identities and federated sign-in.",["Aster","Boreal","Meridian"],"Published",["Target uses the declared identity tenant.","Disconnected mission equipment is outside scope.","Program governs local roles and emergency accounts."],"The service provisions managed workforce identities and authenticators and enforces tenant sign-in policy. Applications retain authorization.",[["E-ID-01","Identity 8.1 service control statement","Provider statement","2026-07-22"],["E-ID-02","Federation and revocation verification","Test report","2026-07-25"]],[["ID-CC-01","Workforce accounts follow approved lifecycle workflows.",["AC-2"]],["ID-CC-05","Federated sign-in applies tenant authentication policy.",["IA-2","IA-5"]]]],
  ["test-assurance","Assurance Verification Practice","Organization","Assessment method","2.2","Independent Assurance","Assessment methods and monitoring procedures.",["Aster","Boreal","Meridian"],"Published",["Approved assessment plan defines scope and independence.","Program reviews applicability of product test evidence."],"Independent Assurance supplies assessment procedures and monitoring criteria. Programs execute assessments and record findings separately.",[["E-ASS-01","Control assessment procedure library","Methodology","2026-06-15"],["E-ASS-02","Continuous monitoring operating model","Procedure","2026-06-15"]],[["ASS-REQ-01","Assessments record scope, results, and findings.",["CA-2"]],["ASS-REQ-07","Monitoring tracks changes and unresolved findings.",["CA-7"]]]],
  ["recovery-service","Engineering Recovery Vault","Host platform","Recovery service","3.0","Resilience Operations","Protected release backups and verified retrieval.",["Aster","Meridian"],"Published",["Program enrolls required release artifacts.","Mission data and device state need local backup decisions."],"The vault protects enrolled releases and verifies retrieval. Programs demonstrate equipment restoration and address mission-data backup.",[["E-REC-01","Vault 3.0 service assurance record","Provider statement","2026-07-09"],["E-REC-02","Quarterly package retrieval exercise","Exercise record","2026-08-14"]],[["REC-CC-03","Enrolled releases have protected, retrievable backups.",["CP-9"]],["REC-CC-08","Approved packages are retrievable for reconstitution.",["CP-10"]]]]
];

// One row per offered control: local responsibilities remain after reusing the master package.
const coverage: Record<string,[string,string][]> = {
  "corp-audit": [["AU-1","Name the target audit owner and approve its local procedure."],["AU-2","Confirm mission-specific events, exclusions, and logging rationale."],["AU-6","Assign a reviewer and demonstrate review of this target’s records."]],
  "corp-access": [["AC-2","Inventory target accounts, including local and emergency identities."],["AC-6","Map approved roles to actual target permissions."],["IA-5","Document target-specific issuance, storage, rotation, and recovery."]],
  "corp-config": [["CM-2","Record the deployed target configuration and approved deviations."],["CM-3","Name the change authority and retain target change decisions."],["CM-6","Verify effective target settings against the approved profile."]],
  "corp-incident": [["IR-4","Define mission-safe containment and exercise the local handoff."],["IR-6","Record reachable contacts and validate the program reporting path."]],
  "corp-personnel": [["AC-2","Verify each proposed privileged operator’s current qualification."],["AC-6","Match target privileges to qualified duties and review exceptions."]],
  "regional-eu": [["AU-1","Confirm regional applicability and reconcile local procedures."],["AU-9","Approve storage location, reader permissions, and handling rules."],["IR-6","Map local contacts and validate the applicable reporting timeline."]],
  "mission-computer": [["AU-2","Map mission events and verify the enabled event selection."],["AU-3","Verify integrated time quality and application identity mapping."],["AU-12","Test event generation under mission load and storage exhaustion."],["AC-3","Approve the deployed partition map and test application interfaces."],["AC-6","Review application privileges and disable unneeded maintenance paths."],["CM-2","Match this serialised installation to the index and record deviations."],["SI-7","Confirm production keys and demonstrate verification on installed hardware."]],
  "comms-gateway": [["AU-2","Confirm which interface and mission events must be enabled."],["AU-3","Verify peer identity mapping and time correlation across the system."],["AC-3","Approve actual peers, flows, and management routes."],["CM-6","Verify the deployed policy bundle and document any exception."],["SC-8","Verify every required link uses the profile and test fallback behavior."],["SC-13","Confirm the selected mode and program cryptographic requirements."]],
  "hardened-os": [["AU-9","Verify collector permissions, export paths, and storage handling."],["AU-12","Configure hook selection and prove application event coverage."],["AC-6","Review application capabilities and approved local exceptions."],["CM-6","Capture effective settings for each independently configured installation."],["SI-2","Assess exposure and approve, test, and schedule target remediation."]],
  "boot-firmware": [["SI-7","Verify production provisioning and test recovery-image acceptance."],["CM-2","Record installed firmware, trust anchors, and recovery settings."],["SC-12","Assign key custodians and retain actual provisioning records."]],
  "crypto-module": [["SC-8","Verify protocol use, peer authentication, and end-to-end link coverage."],["SC-12","Define key origin, rotation, recovery, and authorized custodians."],["SC-13","Select the applicable mode and verify its use in the deployed system."]],
  "operator-console": [["AC-3","Map mission roles and verify denied operations in the deployed console."],["AC-6","Review local administrators and emergency access exceptions."],["IA-2","Validate tenant integration and separately test emergency local access."],["AU-12","Verify collection of mission-application actions and offline sessions."],["SI-3","Approve mission applications and demonstrate blocked execution."]],
  "mission-runtime": [["AU-3","Verify each mission application populates required fields correctly."],["AU-12","Demonstrate required application events reach the collector."],["AC-3","Approve application permissions and test cross-service denial paths."],["SI-7","Control signing authority and verify installed application signatures."]],
  "host-orion": [["AU-3","Verify synchronization and define detached-operation time behavior."],["AU-9","Protect local buffers and verify custody across the handoff."],["AC-3","Enforce authorization inside the target and close alternate access paths."],["IA-2","Bind host identity to target sessions and test disconnected access."],["SC-8","Verify attachment and protect any links beyond that boundary."]],
  "ground-host": [["AU-6","Agree mission-specific escalation and review uncollected local events."],["AU-9","Verify record delivery and protect logs before successful receipt."],["AC-3","Approve application-level access and confirm network policy assignment."],["SC-8","Confirm target enrollment and identify traffic outside managed channels."]],
  "enterprise-identity": [["AC-2","Reconcile application entitlements and maintain local-account records."],["IA-2","Verify application assertion validation and emergency access paths."],["IA-5","Verify tenant settings and manage all non-service authenticators locally."]],
  "test-assurance": [["CA-2","Execute an approved assessment and record the assessor’s conclusion."],["CA-7","Name monitoring owners and collect current target-level results."]],
  "recovery-service": [["CP-9","Enroll required artifacts and address mission data and device-state backups."],["CP-10","Demonstrate restoration on actual equipment against recovery objectives."]]
};

export const sources: Source[] = sourceRows.map(([id,name,category,kind,version,owner,summary,consumers,status,conditions,narrative,evidence,requirements]) => ({
  id,name,category,kind,version,owner,summary,consumers,status,conditions,narrative,
  controlIds:coverage[id]!.map(([controlId])=>controlId),
  families:[...new Set(coverage[id]!.map(([controlId])=>controlId.slice(0,2)))],
  evidence:evidence.map(([id,title,kind,date])=>({id,title,kind,date})),
  requirements:requirements.map(([id,text,controlIds])=>({id,text,controlIds})),
}));

const eligibleBySource: Record<string,string[]> = {"mission-computer":["mc1","mc2"],"comms-gateway":["gateway"],"hardened-os":["mc1","mc2"],"boot-firmware":["mc1","mc2"],"crypto-module":["mc1","mc2","gateway"],"operator-console":["console"],"mission-runtime":["mc1","mc2"],"host-orion":["mission","mc1","mc2"],"ground-host":["ground","console"],"enterprise-identity":["ground","console"],"recovery-service":["system","ground","console"]};
export const contributions: Contribution[] = sources.flatMap(source=>coverage[source.id]!.map(([controlId,remaining])=>({
  id:`${source.id}:${controlId}`,sourceId:source.id,controlId,remaining,
  narrative:source.narrative+" Reusable support for "+controls.find(control=>control.id===controlId)!.title.toLowerCase()+".",
  evidenceIds:source.evidence.map(evidence=>evidence.id),
  eligibleTargets:eligibleBySource[source.id] ?? targets.map(target=>target.id),
})));

export const initialSourceIds: string[] = ["corp-audit","corp-access","corp-config","mission-computer","hardened-os","host-orion","enterprise-identity","comms-gateway","operator-console"];
// Explicit selections: choosing a parent never silently assigns its descendants.
// MC-02 remains independently configured; every assignment retains local obligations.
export const initialAssignments: Record<string,string[]> = {
  "corp-audit:AU-1": ["system","mission","ground"],
  "corp-audit:AU-2": ["mission","comms","mc1","mc2","gateway","console"],
  "corp-audit:AU-6": ["system","mission","comms","ground"],
  "corp-access:AC-2": ["system","mission","comms","ground","console"],
  "corp-access:AC-6": ["mission","comms","mc1","mc2","gateway","console"],
  "corp-access:IA-5": ["mission","comms","ground","console"],
  "corp-config:CM-2": ["system","mission","comms","ground","mc1","gateway","console"],
  "corp-config:CM-3": ["system","mission","comms","ground"],
  "corp-config:CM-6": ["mission","comms","ground","mc1","mc2","gateway"],
  "mission-computer:AU-2": ["mc1","mc2"],
  "mission-computer:AU-3": ["mc1","mc2"],
  "mission-computer:AU-12": ["mc1","mc2"],
  "mission-computer:AC-3": ["mc1","mc2"],
  "mission-computer:AC-6": ["mc1"],
  "mission-computer:CM-2": ["mc1"],
  "mission-computer:SI-7": ["mc1","mc2"],
  "hardened-os:AU-9": ["mc1","mc2"],
  "hardened-os:AU-12": ["mc1","mc2"],
  "hardened-os:AC-6": ["mc1","mc2"],
  "hardened-os:CM-6": ["mc1"],
  "hardened-os:SI-2": ["mc1","mc2"],
  "host-orion:AU-3": ["mission","mc1","mc2"],
  "host-orion:AU-9": ["mission","mc1","mc2"],
  "host-orion:AC-3": ["mission"],
  "host-orion:IA-2": ["mission"],
  "host-orion:SC-8": ["mission"],
  "enterprise-identity:AC-2": ["ground","console"],
  "enterprise-identity:IA-2": ["console"],
  "enterprise-identity:IA-5": ["console"],
  "comms-gateway:AU-2": ["gateway"],
  "comms-gateway:AU-3": ["gateway"],
  "comms-gateway:AC-3": ["gateway"],
  "comms-gateway:CM-6": ["gateway"],
  "comms-gateway:SC-8": ["gateway"],
  "comms-gateway:SC-13": ["gateway"],
  "operator-console:AC-3": ["console"],
  "operator-console:AC-6": ["console"],
  "operator-console:IA-2": ["console"],
  "operator-console:AU-12": ["console"],
  "operator-console:SI-3": ["console"]
};

export const updates: Update[] = [
  {"id":"update-mcx-13","sourceId":"mission-computer","fromVersion":"1.2","toVersion":"1.3","title":"Expanded audit coverage and standby verification","summary":"A new product package adds maintenance-session events and standby failover evidence. Accepted 1.2 assignments remain usable while each program reviews applicability.","changes":[{"label":"AU-2 · Event catalog","before":"Privileged actions, boot failures, partition faults.","after":"Adds maintenance-session start/stop and failover transition events."},{"label":"AU-12 · Evidence","before":"Audit generation verified on the primary module.","after":"Adds standby failover and collector-reconnection test results."},{"label":"Configuration condition","before":"Firmware 2.8 with Sentinel RTOS 6.2.","after":"Firmware 2.9 with Sentinel RTOS 6.2; local regression review required."}],"affectedPrograms":["Aster","Boreal","Meridian"]},
  {"id":"update-config-42","sourceId":"corp-config","fromVersion":"4.1","toVersion":"4.2","title":"Emergency changes get a defined retrospective","summary":"The proposed handbook revision adds a time-bound retrospective and clearer delegate records. Program change procedures need an owner review before adoption.","changes":[{"label":"CM-3 · Procedure","before":"Emergency changes record justification and delegated approval.","after":"Adds a five-working-day security-impact retrospective."},{"label":"CM-2 · Baseline record","before":"Approved configuration index and release decision.","after":"Adds a link from emergency configuration changes to the retrospective."}],"affectedPrograms":["Aster","Boreal","Meridian"]},
  {"id":"update-orion-33","sourceId":"host-orion","fromVersion":"3.2","toVersion":"3.3","title":"Host offload retention boundary clarified","summary":"The platform provider clarifies its receipt boundary and interrupted-transfer behavior. Consumers should review local buffer handling; 3.2 is not automatically replaced.","changes":[{"label":"AU-9 · Provider boundary","before":"Protection applies to received platform audit records.","after":"Protection begins at acknowledged receipt; unacknowledged records remain target-owned."},{"label":"SC-8 · Interface evidence","before":"Nominal attached-mode transfer test.","after":"Adds interrupted-link retry and acknowledgment verification."}],"affectedPrograms":["Aster","Boreal"]}
];
