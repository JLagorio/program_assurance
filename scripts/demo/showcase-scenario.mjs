/**
 * The showcase scenario: authored, illustrative records that carry the demo past what the archived
 * prototype recorded, so every screen has something to show. Nothing here comes from the archived
 * fixture or claims to: it is written for this repository, and `npm run seed:demo-showcase` writes
 * it under its own provenance dataset (`showcase-v1`), apart from the legacy import. The one thing
 * the seed reads from the archive is what WS-X90's assessors recorded (`assessments` below), which
 * the import kept only as findings, so the determinations it publishes are the archive's own.
 *
 * It names records the demo import created by their codes and titles (programs, systems, people,
 * campaigns, risks) and reference data by its codes (controls, framework items). The seed refuses a
 * name it cannot find rather than guessing.
 *
 * History is fixed in time, as the import's is: WS-X90's initial authorization assessment ran
 * 2026-08-03 to 2026-08-21, so its SSP, plan, results and decision sit around those days, and the
 * expanded assessment's results keep the days the archive gives them. What is still moving (the
 * continuous-monitoring schedule, scanner imports, the fiscal year, the expanded assessment's draft
 * increment) is laid out from the run's as-of date, so overdue, due soon and in progress read true
 * on the day it is seeded.
 */

export const datasetId = "showcase-v1";
export const programCode = "PRG-1090";
export const boundaryCode = "SYS-WSX90";

/** The workspace's people the scenario gives roles to, by name, and two it adds. */
export const people = {
  isso: "Priya Raghavan",
  assessor: "Nadia Fournier",
  redTeam: "Wes Duarte",
  platform: "Joel Barrantes",
  keyManagement: "Victor Amsel",
  antiTamper: "Ingrid Solberg",
  programOffice: "Ray Colston",
  systemsEngineering: "Amara Bell",
  // The archived authorization page names its authorizing official and assessor only by initial
  // ("Ms. R. Calloway, SES — PEO Digital", "Mr. D. Okafor — Navy SCA, NAVWAR"); neither is in its
  // people directory, so the scenario adds them as people under those names.
  authorizingOfficial: "R. Calloway",
  controlAssessor: "D. Okafor",
};
export const addedPeople = ["R. Calloway", "D. Okafor"];

/** A reference baseline for each program the import left without one. */
export const programBaselines = [
  { program: "PRG-0994", baseline: "NIST SP 800-53 Rev 5 Low baseline" },
  { program: "PRG-1007", baseline: "NIST SP 800-53 Rev 5 Moderate baseline" },
  { program: "PRG-1013", baseline: "NIST SP 800-53 Rev 5 Moderate baseline" },
  { program: "PRG-1028", baseline: "NIST SP 800-53 Rev 5 Moderate baseline" },
  { program: "PRG-1041", baseline: "NIST SP 800-53 Rev 5 Moderate baseline" },
];

/**
 * WS-X90's own tailoring, the last layer on the four overlays seed:demo-baseline applies. It
 * tailors in SA-24 with its five parameters, and the controls behind the techniques it names.
 */
export const tailoring = {
  base: "PRG-1090/profiles/1/overlays/4",
  code: "PRG-1090/profiles/1/tailoring",
  title: "WS-X90 program tailoring",
  remarks:
    "WS-X90's own tailoring on top of its overlays: SA-24 Design for Cyber Resiliency and the controls behind the cyber resiliency techniques the program commits to.",
  include: [
    [
      "SA-24",
      "The mission must keep flying through a compromised element; the program designs for cyber resiliency against the goals, objectives, techniques, approaches and principles set below.",
    ],
    ["AC-4(21)", "Mission, payload and maintenance flows are separated on the internal segment."],
    [
      "CP-11",
      "The tactical data radio carries a fallback protocol when the primary bearer is denied.",
    ],
    ["CP-12", "A failed integrity check drops the mission computer into a restricted safe mode."],
    [
      "CP-13",
      "An alternate authentication path exists for flightline maintenance when the primary is unavailable.",
    ],
    [
      "SC-7(22)",
      "Each security domain the platform touches reaches it through its own subnet at the gateway.",
    ],
    ["SC-29", "Navigation and timing run on dissimilar processors to resist a common-mode attack."],
    ["SC-29(1)", "Mission partitions run under a separation kernel on the mission computer."],
    ["SC-34", "Flight software executes from write-protected media verified at boot."],
    [
      "SC-36",
      "Mission data is replicated across the mission computer and the secure storage module.",
    ],
    ["SC-36(1)", "Replicated mission state is polled and compared before it is acted on."],
    [
      "SI-4(13)",
      "The security log collector baselines traffic and event patterns per flight phase.",
    ],
    ["SI-14", "Maintenance sessions run in non-persistent environments discarded at logout."],
    ["SI-14(1)", "Non-persistent images are refreshed from the signed configuration repository."],
  ],
  sa24: {
    rationale:
      "The program's cyber resiliency commitments, from the WS-X90 mission threat assessment and the Block 1 architecture review.",
    goals: ["Anticipate", "Withstand", "Recover", "Adapt"],
    objectives: [
      "Prevent or Avoid",
      "Prepare",
      "Continue",
      "Constrain",
      "Reconstitute",
      "Understand",
    ],
    techniques: [
      "Adaptive Response",
      "Analytic Monitoring",
      "Coordinated Protection",
      "Diversity",
      "Non-Persistence",
      "Privilege Restriction",
      "Redundancy",
      "Segmentation",
      "Substantiated Integrity",
    ],
    approaches: [
      "Dynamic Reconfiguration",
      "Monitoring and Damage Assessment",
      "Sensor Fusion and Analysis",
      "Calibrated Defense-in-Depth",
      "Architectural Diversity",
      "Design Diversity",
      "Non-Persistent Services",
      "Non-Persistent Information",
      "Trust-Based Privilege Management",
      "Protected Backup and Restore",
      "Replication",
      "Predefined Segmentation",
      "Dynamic Segmentation and Isolation",
      "Integrity Checks",
      "Provenance Tracking",
    ],
    designPrinciples: [
      "Focus on Common Critical Assets",
      "Reduce Attack Surfaces",
      "Assume Compromised Resources",
      "Limit the Need for Trust",
      "Layer Defenses and Partition Resources",
      "Plan and Manage Diversity",
      "Maintain Redundancy",
      "Leverage Health and Status Data",
      "Determine Ongoing Trustworthiness",
    ],
  },
};

/** How far the tailored-in controls had come by SSP 3, the working draft. */
export const tailoredProgress = {
  "SA-24": [
    "partial",
    "Resiliency goals, objectives and techniques are recorded in the SSP; the design review of the remaining approaches is planned for Block 1.1.",
  ],
  "SC-34": [
    "implemented",
    "Flight software partitions are loaded from write-protected media and verified by the secure boot controller (LRU-002).",
  ],
  "SI-14": [
    "implemented",
    "Maintenance laptop sessions boot a non-persistent image discarded at logout.",
  ],
  "SI-14(1)": [
    "partial",
    "Images are rebuilt from the configuration repository; the signing step is automated for two of three image types.",
  ],
  "SC-36": [
    "partial",
    "Mission state replicates to the secure storage module; the payload state is not yet replicated.",
  ],
  "CP-12": [
    "implemented",
    "The mission computer enters restricted safe mode on any failed partition integrity check.",
  ],
};

/** Configuration baselines for the boundary: Block 1 as authorized, then Block 1.1 proposed. */
export const configurationBaselines = {
  published: {
    name: "WS-X90 Block 1 production configuration",
    description:
      "The configuration the initial authorization assessed: firmware and software versions of every line-replaceable unit, hardened per the WS-X90 STIG profile.",
    publishedAt: "2026-07-20T16:00:00Z",
  },
  proposed: {
    name: "WS-X90 Block 1.1 configuration (proposed)",
    description:
      "Proposed for FY2027: secure boot and gateway firmware updates, the non-persistent maintenance image and the separation kernel on the mission computer.",
  },
  versions: {
    "LRU-001": ["MC-FW 4.2.1", "MC-FW 4.3.0", "Separation kernel added for SC-29(1)."],
    "LRU-002": ["SBC-FW 2.0.7", "SBC-FW 2.1.0", "Measured boot of every partition for SC-34."],
    "LRU-003": ["CSM-FW 3.4.2", "CSM-FW 3.4.2"],
    "LRU-004": ["NAV-FW 1.9.0", "NAV-FW 1.9.0"],
    "LRU-005": ["TR-FW 5.1.3", "TR-FW 5.1.3"],
    "LRU-006": ["NSI-FW 1.2.0", "NSI-FW 1.2.0"],
    "LRU-007": [
      "PNG-FW 6.0.4",
      "PNG-FW 6.1.1",
      "Separate subnets per security domain for SC-7(22).",
    ],
    "LRU-008": ["TDR-FW 8.2.0", "TDR-FW 8.3.0", "Fallback protocol for CP-11."],
    "LRU-009": ["IES-OS 15.2(7)", "IES-OS 15.2(7)"],
    "LRU-010": ["PIC-FW 2.6.1", "PIC-FW 2.6.1"],
    "LRU-011": ["PSI-FW 1.0.9", "PSI-FW 1.0.9"],
    "LRU-012": ["PTU-FW 3.3.0", "PTU-FW 3.3.0"],
    "LRU-013": ["PMC-SW 4.2.1", "PMC-SW 4.2.1"],
    "LRU-014": ["MAG-FW 2.2.5", "MAG-FW 2.3.0", "Session non-persistence for SI-14."],
    "LRU-015": ["SSM-FW 1.4.0", "SSM-FW 1.5.0", "Mission state replication for SC-36."],
    "LRU-016": ["URC-FW 3.0.2", "URC-FW 3.0.2"],
    "LRU-017": ["PWS image 2026.06", "PWS image 2026.10"],
    "LRU-018": [
      "SLC 4.2.1 (rule set 3.4)",
      "SLC 4.3.0 (rule set 3.6)",
      "Pattern baselining for SI-4(13).",
    ],
    "LRU-019": [
      "MLT image 2026.06",
      "MLT non-persistent image 2026.10",
      "Non-persistent image for SI-14.",
    ],
    "LRU-020": ["CFG-REPO 2.8.0", "CFG-REPO 2.9.0", "Signed image builds for SI-14(1)."],
  },
};

/**
 * The corporate identity provider offers its identity services for other boundaries to inherit.
 * Its SSP implements the controls it offers, from its Moderate baseline.
 */
export const provider = {
  program: "PRG-1013",
  system: "idp-core",
  sspDescription:
    "Common control SSP for the corporate identity provider: the identity, authentication and certificate services other boundaries inherit.",
  publishedAt: "2026-04-15T15:00:00Z",
  offeredAt: "2026-04-20T15:00:00Z",
  components: [
    [
      "IDP-SSO",
      "Enterprise single sign-on service",
      "service",
      "SAML and OIDC federation for workforce applications.",
    ],
    [
      "IDP-MFA",
      "Phishing-resistant authenticator service",
      "service",
      "FIDO2 and PIV authentication for privileged and non-privileged users.",
    ],
    [
      "IDP-DIR",
      "Enterprise directory",
      "software",
      "Authoritative identities, groups and account lifecycle.",
    ],
    [
      "IDP-PKI",
      "Enterprise certificate authority",
      "service",
      "Issues device and user certificates under the enterprise certificate policy.",
    ],
  ],
  controls: {
    "AC-2": [
      "IDP-DIR",
      "Accounts are provisioned from the HR system of record, reviewed quarterly and removed on separation.",
    ],
    "AC-2(1)": [
      "IDP-DIR",
      "Joiner, mover and leaver changes are applied automatically from the system of record.",
    ],
    "AC-2(3)": ["IDP-DIR", "Accounts inactive for 35 days are disabled automatically."],
    "AC-7": ["IDP-SSO", "Five failed attempts in 15 minutes lock the account for 30 minutes."],
    "AC-12": ["IDP-SSO", "Federated sessions end after 15 minutes idle or 12 hours absolute."],
    "IA-2": [
      "IDP-SSO",
      "Every organizational user authenticates through the enterprise identity provider.",
    ],
    "IA-2(1)": ["IDP-MFA", "Privileged accounts require a FIDO2 or PIV authenticator."],
    "IA-2(2)": ["IDP-MFA", "Non-privileged accounts require a phishing-resistant second factor."],
    "IA-2(8)": ["IDP-MFA", "Authenticators are challenge-response and resist replay."],
    "IA-4": [
      "IDP-DIR",
      "Identifiers are unique, never reused and disabled after 35 days of inactivity.",
    ],
    "IA-5": [
      "IDP-MFA",
      "Authenticators are issued in person or through a verified enrollment flow and revoked on loss.",
    ],
    "IA-5(1)": [
      "IDP-SSO",
      "Passwords are checked against a breached-password list and never stored in reversible form.",
    ],
    "IA-5(2)": [
      "IDP-PKI",
      "Certificate paths are validated to the enterprise trust anchor with revocation checking.",
    ],
    "IA-8": [
      "IDP-SSO",
      "Partner users authenticate through federation with assurance level 2 or higher.",
    ],
    "SC-17": [
      "IDP-PKI",
      "Certificates are issued under the enterprise certificate policy from an offline root.",
    ],
  },
  capabilities: [
    {
      code: "IDP-CAP-SSO",
      name: "Enterprise single sign-on",
      description:
        "Federated authentication and session management for workforce and partner users.",
      controls: ["IA-2", "IA-8", "AC-7", "AC-12", "IA-5(1)"],
      responsibility:
        "Federate the boundary's applications to the enterprise identity provider and keep no local password store.",
    },
    {
      code: "IDP-CAP-MFA",
      name: "Phishing-resistant multifactor authentication",
      description: "FIDO2 and PIV authentication, enrollment and authenticator lifecycle.",
      controls: ["IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-5"],
      responsibility:
        "Require the enterprise authenticator for every interactive logon to the boundary.",
    },
    {
      code: "IDP-CAP-ACCOUNTS",
      name: "Account lifecycle management",
      description: "Provisioning, review and removal of accounts from the authoritative directory.",
      controls: ["AC-2", "AC-2(1)", "AC-2(3)", "IA-4"],
      responsibility:
        "Map the boundary's roles to directory groups and complete the quarterly access review for them.",
    },
    {
      code: "IDP-CAP-PKI",
      name: "Certificate issuance",
      description: "Device and user certificates under the enterprise certificate policy.",
      controls: ["SC-17", "IA-5(2)"],
      responsibility:
        "Enroll the boundary's devices and validate certificate paths to the enterprise trust anchor.",
    },
  ],
  acceptedAt: "2026-06-30T14:00:00Z",
};

/** WS-X90's SSP versions the scenario adds over the imported SSP 1. */
export const ssp = {
  authorized: {
    description:
      "SSP for the initial authorization: the tailored control baseline, the Block 1 configuration and the identity services inherited from the corporate identity provider.",
    publishedAt: "2026-07-25T15:00:00Z",
  },
  working: {
    description:
      "Working draft for FY2027 continuous monitoring: the Block 1.1 configuration and the progress of the tailored-in cyber resiliency controls.",
  },
};

/**
 * WS-X90's two assessments as the archived prototype recorded them: `assessments` and the 420
 * `assessment_results` of its platform seed, each a requirement judged on its components by one
 * method, with the evidence examined and an outcome. The import kept their findings as operational
 * issues and could not pin the results to a plan or a results revision; the scenario writes those
 * documents and records each archived result as a determination on its control's statement.
 *
 * The initial authorization assessment judged the original 74-control scope in August and is
 * published. The expanded control set assessment judges the controls the widened scope added, in
 * increments: the first, through `through`, is published; what came after it, up to the as-of day,
 * is the second increment's draft, which decides nothing.
 */
export const assessments = {
  initial: {
    source: "ASM-2026-001",
    campaign: "WS-X90 Initial Authorization Security Assessment",
    plan: "Security assessment plan — initial authorization",
    planDescription:
      "Assess the 74 controls of the original authorization scope against SSP 2 and the Block 1 configuration.",
    planPublishedAt: "2026-07-28T15:00:00Z",
    results: "Security assessment report — initial authorization",
    resultsDescription:
      "Determinations on the 74 controls of the original authorization scope, from the 2026-08-03 to 2026-08-21 assessment.",
    resultSet: "Initial authorization assessment, 2026-08-03 to 2026-08-21",
    startsAt: "2026-08-03T13:00:00Z",
    endsAt: "2026-08-21T21:00:00Z",
    resultsPublishedAt: "2026-08-28T15:00:00Z",
  },
  expanded: {
    source: "ASM-2026-002",
    campaign: "WS-X90 Expanded Control Set Assessment",
    plan: "Security assessment plan — expanded control set",
    planDescription:
      "Assess the controls the widened authorization scope added, then the tailored-in cyber resiliency controls, in increments.",
    planPublishedAt: "2026-09-08T15:00:00Z",
    startsAt: "2026-09-14T13:00:00Z",
    increments: [
      {
        through: "2026-11-10",
        results: "Security assessment report — expanded control set, increment 1",
        resultsDescription:
          "Determinations from 2026-09-14 to 2026-11-10, roughly half the widened scope. The rest follow in later increments.",
        resultSet: "Expanded control set assessment, increment 1, 2026-09-14 to 2026-11-10",
        publishedAt: "2026-11-12T15:00:00Z",
      },
      {
        results: "Interim results — expanded control set, increment 2",
        resultsDescription:
          "Determinations recorded since increment 1; the results are a draft until the increment closes.",
        resultSet: "Expanded control set assessment, increment 2, in progress",
      },
    ],
  },
  /**
   * An archived outcome as a determination. A failed result raised a finding: where it is high or
   * critical the control is other than satisfied, otherwise partially satisfied. An inconclusive
   * result, and one the assessor did not carry out, is recorded as not assessed, which decides
   * nothing.
   */
  outcomes: {
    pass: "satisfied",
    fail: {
      critical: "other_than_satisfied",
      high: "other_than_satisfied",
      moderate: "partially_satisfied",
      low: "partially_satisfied",
    },
    inconclusive: "not_assessed",
    "not-assessed": "not_assessed",
  },
  /** How each method reads in a determination's words. */
  methods: { examine: "examination", interview: "interview", test: "test" },
  /**
   * What a determination says where the archived result has no narrative of its own (the initial
   * assessment's): `{requirement}`, `{method}` and `{components}` from the result, `{finding}` the
   * finding a failed result raised. The expanded assessment's results carry the assessor's own words.
   */
  narrative: {
    satisfied:
      "{requirement}, assessed by {method} on {components}: the statement is met as written.",
    short: "{finding} Assessed by {method} on {components}.",
    not_assessed: "{requirement} was planned for {method} on {components} and not assessed.",
  },
  /** What a finding's evidence citation says the assessor did with it. */
  claim: "Examined for this determination.",
};

/** Continuous monitoring: a campaign for the fiscal year and its schedule, in days from as-of. */
export const monitoring = {
  campaign: "WS-X90 continuous monitoring",
  plan: "Continuous monitoring plan",
  planDescription:
    "The recurring assessments that keep WS-X90's authorization current: monthly scans and POA&M review, quarterly access and audit reviews, and an annual subset of controls.",
  schedule: [
    [
      "Monthly vulnerability scan — mission network (previous month)",
      "completed",
      -40,
      -33,
      "platform",
    ],
    ["Monthly STIG compliance scan (previous month)", "completed", -38, -31, "platform"],
    ["Monthly POA&M review (previous month)", "completed", -35, -30, "isso"],
    [
      "Monthly vulnerability scan — mission network",
      "in_progress",
      -9,
      2,
      "platform",
      "Scanner import running; see Scanner ingestion.",
    ],
    [
      "Monthly STIG compliance scan",
      "blocked",
      -12,
      -2,
      "platform",
      "Blocked: the maintenance window for the Payload Interface Controller slipped.",
    ],
    ["Monthly POA&M review", "ready", -1, 8, "isso"],
    ["Quarterly privileged account review (AC-2, AC-6)", "in_progress", -6, 18, "keyManagement"],
    ["Quarterly audit log review sampling (AU-6)", "planned", 20, 40, "assessor"],
    ["Quarterly configuration baseline audit (CM-2, CM-3)", "planned", 25, 45, "antiTamper"],
    ["Annual control subset assessment — AC and IA families", "planned", 60, 90, "assessor"],
    ["Incident response tabletop (IR-3)", "planned", 95, 120, "isso"],
    ["Contingency plan test on a whole article (CP-4)", "planned", 130, 150, "systemsEngineering"],
    [
      "Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)",
      "planned",
      170,
      200,
      "redTeam",
    ],
    [
      "Penetration test — maintenance access gateway",
      "cancelled",
      -36,
      -26,
      "redTeam",
      "Superseded by the expanded control set assessment's adversarial testing.",
    ],
  ],
};

/** WS-X90's acquisition and RMF gates, and the security outcomes drawn into four of them. */
export const gates = [
  ["Alternative Systems Review", "completed", "2025-03-12"],
  ["Milestone A decision", "completed", "2025-04-24"],
  ["Categorize the system", "completed", "2025-05-08", ["outcome.SR.1"]],
  [
    "System Requirements Review",
    "completed",
    "2025-06-19",
    ["outcome.SR.2", "outcome.SR.4", "outcome.SR.6"],
  ],
  ["Select security controls", "completed", "2025-07-17"],
  ["Preliminary Design Review", "completed", "2025-09-11"],
  ["Milestone B decision", "completed", "2025-10-23"],
  ["Critical Design Review", "completed", "2026-01-29"],
  ["Test Readiness Review", "completed", "2026-04-09"],
  [
    "System Verification Review",
    "completed",
    "2026-06-25",
    ["outcome.VE.3", "outcome.VE.5", "outcome.VE.6"],
  ],
  ["Final assessment & SAR", "completed", "2026-08-28", ["outcome.RM.2", "outcome.RM.3"]],
  ["Authority to Operate (ATO)", "passed", "2026-09-18", ["outcome.TR.4", "outcome.TR.7"]],
  ["Milestone C decision", "in_review", "2026-12-10"],
  ["Initial Operational Capability", "not_started", "2027-03-18"],
  ["Annual authorization review", "not_started", "2027-09-16"],
];
/** A criterion written by hand beside the drawn ones: its Source reads Absent. */
export const writtenCriteria = [
  ["Milestone C decision", "Expanded control set assessment closed with no open high findings"],
  ["Milestone C decision", "Block 1.1 configuration baseline published"],
];

/** Authorization packages, their versions and the decisions on them. */
export const packages = [
  {
    key: "wsx90",
    program: "PRG-1090",
    system: "SYS-WSX90",
    title: "WS-X90 Sentinel Mission System authorization package",
    owner: "isso",
    versions: [
      {
        description:
          "Initial authorization: SSP 2, the initial assessment plan and report, and key test evidence.",
        submittedAt: "2026-08-29T15:00:00Z",
        publishedAt: "2026-09-02T15:00:00Z",
        documents: ["ssp", "plan", "results", "evidence"],
        review: [
          "controlAssessor",
          "accepted",
          "The SAR and SSP agree; residual risk is documented for the AO.",
          "2026-09-05T15:00:00Z",
        ],
        decision: {
          by: "authorizingOfficial",
          decision: "authorized_with_conditions",
          rationale:
            "Residual risk is acceptable for operational use given the tailored cyber resiliency commitments and the conditions below.",
          conditions:
            "Close the high-severity remediation items within 90 days. Complete the expanded control set assessment before Milestone C. Report the SA-24 design review at the annual authorization review.",
          decidedAt: "2026-09-18T19:00:00Z",
          effectiveOn: "2026-09-18",
          expiresOn: "2029-09-17",
        },
      },
      {
        description:
          "FY2027 annual update in preparation: SSP 3 with the Block 1.1 configuration and the expanded control set results once published.",
      },
    ],
  },
  {
    key: "atlas",
    program: "PRG-1041",
    system: "atlas-prod",
    title: "Atlas payments platform authorization package",
    owner: "programOffice",
    versions: [
      {
        // The archived authorization page: package submitted Aug 21, 2026, AO briefing Sep 24,
        // target signature Oct 02, an ATO with conditions for 36 months.
        description:
          "ATO with conditions (36 months), as briefed to the authorizing official on 2026-09-24.",
        submittedAt: "2026-08-21T15:00:00Z",
        publishedAt: "2026-08-21T16:00:00Z",
        documents: [],
        review: [
          "controlAssessor",
          "accepted",
          "Package complete for the AO briefing.",
          "2026-09-10T15:00:00Z",
        ],
        decision: {
          by: "authorizingOfficial",
          decision: "authorized_with_conditions",
          rationale: "Risk accepted for production operation at IL5 under the conditions below.",
          conditions:
            "Remediate the adversarial assessment's mission API findings within 120 days.",
          decidedAt: "2026-10-02T17:00:00Z",
          effectiveOn: "2026-10-02",
          expiresOn: "2029-10-01",
        },
      },
    ],
  },
  {
    key: "billing",
    program: "PRG-0994",
    system: "lbg-edge",
    title: "Legacy billing gateway authorization package",
    owner: "programOffice",
    versions: [
      {
        description: "Three-year authorization of the billing gateway.",
        submittedAt: "2023-04-28T15:00:00Z",
        publishedAt: "2023-05-10T15:00:00Z",
        documents: [],
        decision: {
          by: "authorizingOfficial",
          decision: "authorized",
          rationale: "Risk accepted for continued operation of the billing gateway.",
          decidedAt: "2023-06-01T17:00:00Z",
          effectiveOn: "2023-06-01",
          expiresOn: "2026-05-31",
        },
      },
      {
        description: "Reauthorization request on the existing platform.",
        submittedAt: "2026-04-30T15:00:00Z",
        publishedAt: "2026-05-01T15:00:00Z",
        documents: [],
        review: [
          "controlAssessor",
          "changes_requested",
          "The operating system is out of vendor support; no compensating controls are documented.",
          "2026-05-20T15:00:00Z",
        ],
        decision: {
          by: "authorizingOfficial",
          decision: "denied",
          rationale:
            "The platform runs an unsupported operating system with no compensating controls. Migrate billing to the Atlas payments platform.",
          decidedAt: "2026-06-12T17:00:00Z",
        },
      },
    ],
  },
  {
    key: "mobile",
    program: "PRG-1007",
    system: "fom-mobile",
    title: "Field operations mobile authorization package",
    owner: "programOffice",
    versions: [{ description: "Initial package in preparation." }],
  },
];

/** Scanner imports, in days from as-of: [title, status, started, completed, kind, summary]. */
export const scans = [
  {
    program: "PRG-1090",
    jobs: [
      [
        "ACAS vulnerability scan — mission network, previous month",
        "completed",
        -34,
        -34,
        "nessus",
        "1,284 results across 26 hosts: 2 critical, 9 high, 31 medium, 112 low, 1,130 informational.",
      ],
      [
        "DISA STIG checklist — mission computing (RHEL 9)",
        "completed",
        -31,
        -31,
        "ckl",
        "412 rules: 371 not a finding, 29 open, 12 not applicable.",
      ],
      [
        "SCAP compliance scan — maintenance laptop (Windows 11)",
        "completed",
        -30,
        -30,
        "xccdf",
        "286 rules: 259 pass, 21 fail, 6 not applicable; score 90.6%.",
      ],
      [
        "Container image scan — telemetry services",
        "failed",
        -14,
        -14,
        "sarif",
        "Rejected: SARIF 2.1.0 validation failed at runs[0].results[17].locations, which has no physicalLocation.",
      ],
      [
        "Nessus scan — maintenance access gateway",
        "cancelled",
        -46,
        null,
        "nessus",
        "Cancelled: superseded by the expanded control set assessment's adversarial testing.",
      ],
      ["ACAS vulnerability scan — mission network", "importing", -1, null, "nessus", null],
      [
        "Software bill of materials — Payload Interface Controller firmware",
        "validating",
        0,
        null,
        "cyclonedx",
        null,
      ],
      ["DISA STIG checklist — internal Ethernet switch", "queued", null, null, "ckl", null],
    ],
  },
  {
    program: "PRG-1041",
    jobs: [
      [
        "Nessus scan — Atlas production",
        "completed",
        -20,
        -20,
        "nessus",
        "3,912 results across 64 hosts: 0 critical, 4 high, 57 medium, 210 low.",
      ],
      [
        "Container image scan — payments API",
        "completed",
        -6,
        -6,
        "sarif",
        "38 results: 1 high, 9 medium, 28 low.",
      ],
    ],
  },
];
export const scanKinds = {
  nessus: ["application/xml", "nessus"],
  ckl: ["application/xml", "ckl"],
  xccdf: ["application/xml", "xccdf.xml"],
  sarif: ["application/sarif+json", "sarif"],
  cyclonedx: ["application/vnd.cyclonedx+json", "cdx.json"],
};

/** The ATT&CK techniques each named WS-X90 risk concerns, by Appendix F identifier. */
export const riskTechniques = {
  "A disallowed session survives at the boundary while field procedures go unsigned": [
    "T1133",
    "T1563",
  ],
  "A hand-kept bay list leaves standing physical access to key and recovery material": [
    "T1200",
    "T1552",
  ],
  "A partition that has failed its own integrity check keeps flying the mission": [
    "T1601",
    "T1542",
  ],
  "A password on its own reaches WS-X90 at the flightline": ["T1078", "T1110"],
  "A publicly known password is still a valid WS-X90 credential": ["T1078", "T1110"],
  "A scan on a stale signature set reports clean and the program acts on it": ["T1562"],
  "An unsealed service connector leaves a physical route into the maintenance path": [
    "T1200",
    "T1091",
  ],
  "Insider threat and spillage have an escalation path and no named owner": ["T1052", "T1005"],
  "Low-rate exhaustion and unattributable egress at the WS-X90 external boundary": [
    "T1499",
    "T1048",
  ],
  "Out-of-window privileged maintenance was recorded rather than refused": ["T1078", "T1021"],
  "Out-of-work-order privileged tool use was recorded and never surfaced": ["T1072", "T1070"],
  "Payload arm and release records become unverifiable as signing keys rotate": ["T1565", "T1553"],
  "Payload telemetry maintenance happens outside the work-order gate": ["T1021"],
  "Platform telemetry crosses to a party nobody has signed a responsibility split with": [
    "T1199",
    "T1020",
  ],
  "Primary and alternate bearers converge on one switch port group": ["T1498"],
  "Privilege that survived its own review still reaches platform management": ["T1078", "T1098"],
  "Relayed audit records carried a second ordering inside the platform trail": ["T1070", "T1565"],
  "The four-hour recovery objective has never been measured on a whole article": ["T1490", "T1485"],
  "The mission link is unmonitored and three firmware domains cannot force the restricted state": [
    "T1495",
    "T1040",
  ],
  "The payload interlock's trust basis is asserted and six units identify themselves from paperwork":
    ["T1195", "T1036"],
  "The personnel procedure and the provisioning gate no longer agree": ["T1136", "T1078"],
  "The widest configuration divergence WS-X90 produces has no review behind it": ["T1601"],
  "Unlisted hardware was announced onto the internal segment and then carried": ["T1200", "T1557"],
};

/* ——— Issue requirements: begin (issue_requirements, migration operational_issue_requirements) ——— */
/**
 * The requirement each named WS-X90 operational issue is about, by the issue's title and the
 * requirement's code. The import restored sixteen "Unmet requirement" findings as operational
 * issues; ten cite the evidence of their requirement and stand on it already, and these six cite
 * no evidence, so until they name their requirement they stand nowhere on the program's Posture.
 */
export const issueRequirements = {
  "Unmet requirement REQ-008": "REQ-008",
  "Unmet requirement REQ-024": "REQ-024",
  "Unmet requirement REQ-032": "REQ-032",
  "Unmet requirement REQ-068": "REQ-068",
  "Unmet requirement REQ-092": "REQ-092",
  "Unmet requirement REQ-100": "REQ-100",
};
/* ——— Issue requirements: end ——— */

/**
 * What the assessor wrote reviewing each evidence version, as the archived results examined it: a
 * version a passed result examined is accepted, one a failed or inconclusive result examined needs
 * revision, each on the day of that result. A version no result has examined by the as-of day is
 * pending.
 */
export const evidenceReview = {
  accepted: "Matches the requirement's acceptance criteria and the Block 1 configuration.",
  short:
    "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.",
  inconclusive: "Does not settle the determination; the assessor asked for more before closing it.",
};

/**
 * What each WS-X90 risk says of the threat and the weakness behind it, and why it carries its
 * likelihood and impact (Josef, 2026-11-13). The import restored the 40 risks with a likelihood, an
 * impact and a severity and nothing else. A risk the archive tells a story for is
 * [threat, vulnerability, rationale] by its title, in words that fit the ATT&CK techniques
 * `riskTechniques` links to it; a risk the import made from a failed requirement ("Risk arising
 * from REQ-008") takes `fromRequirement`, written from the requirement's kind (the second word of
 * its title), its code, the controls it maps and the elements it is allocated to. Only an empty field
 * is written, on a draft revision.
 *
 * `due` is how many days after the risk's trouble was first found (the earliest issue it rests on
 * was opened) its response is due, by the response and the risk's severity: sooner the more severe.
 * A response's due is a moment, at `dueAt`.
 */
export const riskAssessments = {
  risks: {
    "A disallowed session survives at the boundary while field procedures go unsigned": [
      "An outside party who holds a tunnel open through the Protected Network Gateway after inspection has refused it, to come back in or ride a remote session.",
      "The gateway drops a disallowed flow's packets one at a time instead of tearing the session down, and field technicians work from procedures nobody has signed.",
      "Moderate likelihood: the tunnel needs a sender patient enough to hold it, and nothing crosses the boundary through either gap alone. Moderate impact: together they leave an intrusion attempt resisted but never closed or reported.",
    ],
    "A hand-kept bay list leaves standing physical access to key and recovery material": [
      "A person removed from the program who still badges into the protected bay and attaches hardware to, or lifts credentials from, the Mission Computer, the Cryptographic Services Module or the Secure Storage Module.",
      "The bay reader list is copied by hand from the facility roster and its log is never exported, so a removal does not reach the bay.",
      "Moderate likelihood: it needs someone both removed and willing, inside a guarded facility. High impact: physical access to those three units defeats every boundary the platform mediates.",
    ],
    "A partition that has failed its own integrity check keeps flying the mission": [
      "A modified image in a mission partition, or tampering below its operating system, that fails the partition's own integrity check in flight and keeps producing mission output.",
      "Only failures the Secure Boot Controller observes drive the platform to its known secure state; a partition's own failed check leaves the other partitions running.",
      "Moderate likelihood: it needs an integrity failure in flight, which the boot chain makes rare. High impact: suspect mission data reaches the tactical link with full provenance and nobody at the article to stop it.",
    ],
    "A password on its own reaches WS-X90 at the flightline": [
      "Anyone holding the Maintenance Laptop on a dispersed flightline who guesses or replays its local password and opens a privileged maintenance session.",
      "Away from the ground support network the Maintenance Laptop still accepts a password alone, and the Internal Ethernet Switch admits a port on a one-sided exchange.",
      "Moderate likelihood: it needs the laptop in hand, but the flightline is where it is used most and watched least. High impact: one secret stands between an outsider and privileged maintenance on a platform categorized high for confidentiality.",
    ],
    "A publicly known password is still a valid WS-X90 credential": [
      "An attacker replaying passwords from public breach collections against the provisioning path.",
      "The compromised-credential list passwords are screened against was last refreshed well outside its interval, so a breached password of the right shape is accepted.",
      "Moderate likelihood: harvested credentials are plentiful, though each must also pass the composition rules. Moderate impact: a looked-up password opens one account, not the cryptographic module behind it.",
    ],
    "A scan on a stale signature set reports clean and the program acts on it": [
      "Exploitation of a newly published vulnerability in the WS-X90 build during the window in which the program's own scanning cannot see it.",
      "The Provisioning Workstation runs baseline scans on a signature set thirty hours old without checking its freshness, and the report omits the signature identifier.",
      "Moderate likelihood: the window opens each time the signatures lag, though an exploit must land inside it. Moderate impact: the program acts on a clean report that covered less than it claims.",
    ],
    "An unsealed service connector leaves a physical route into the maintenance path": [
      "A visitor on the flightline who seats a cable or a device at the Maintenance Access Gateway's service connector between inspections to reach the mission computing chain.",
      "The service connector is locked but not sealed, so a connection made and removed leaves nothing for an inspector to find.",
      "Moderate likelihood: it needs time at a dispersed aircraft's connector. High impact: the path reaches the mission computing chain directly, on a platform categorized high for integrity.",
    ],
    "Insider threat and spillage have an escalation path and no named owner": [
      "An insider who copies data from a WS-X90 system and carries it off on removable media, or a classified spillage that spreads while the response is organized.",
      "The two incident classes have an escalation path in the control set and no named owner in the direction people follow.",
      "Moderate likelihood: either case is rare, and the gap is there for every one that happens. Moderate impact: the first hours, when containment is decided, go to finding an owner.",
    ],
    "Low-rate exhaustion and unattributable egress at the WS-X90 external boundary": [
      "A patient adversary who drains the Protected Network Gateway's session state below the profiled rate and pushes data out through a maintenance session.",
      "No counter the Security Log Collector evaluates moves under low-rate exhaustion, and denials of maintenance-session egress name an appliance instead of the technician.",
      "Moderate likelihood: it needs patience and a foothold in a maintenance session. High impact: it costs the tactical path its capacity and leaves no name against an exfiltration attempt on a confidentiality-high system.",
    ],
    "Out-of-window privileged maintenance was recorded rather than refused": [
      "A privileged account used for maintenance outside its window through a remote service on the Maintenance Access Gateway.",
      "The window check was advisory, so out-of-window commands were logged and then run; it now blocks, and the risk stays open until monitoring confirms it holds.",
      "Low likelihood: the window test now refuses such commands, as the retest saw. Low impact: what remains is the interval until the next monitoring cycle confirms the fix.",
    ],
    "Out-of-work-order privileged tool use was recorded and never surfaced": [
      "An insider who uses privileged maintenance tools with no work order behind them and clears what traces they can.",
      "Privileged tool use was logged in the Security Log Collector and never alerted on; the alert rule now runs and raised the seeded use on retest.",
      "Low likelihood: the alert now raises such use, as the retest showed. Low impact: the exposure closed inside the assessment window.",
    ],
    "Payload arm and release records become unverifiable as signing keys rotate": [
      "Someone who alters or disowns an arm or release command once its signing key has rotated, knowing the record can no longer be checked.",
      "The retired-key list is not published to the collector, so commands signed under a rotated key verify as unknown-key.",
      "Moderate likelihood: it needs a disputed payload event, but every key rotation widens what can no longer be verified. High impact: the highest-consequence commands the platform carries can no longer be tied to an operator.",
    ],
    "Payload telemetry maintenance happens outside the work-order gate": [
      "Someone with access to the payload telemetry equipment who does unsanctioned work on it remotely and files the paperwork afterwards.",
      "Maintenance on that subsystem is recorded after the fact rather than authorized through the work-order gate on the Update & Recovery Controller.",
      "Moderate likelihood: the seam is narrow, but it is the one an insider would find first. Moderate impact: the program cannot say whether a given change to payload telemetry was sanctioned.",
    ],
    "Platform telemetry crosses to a party nobody has signed a responsibility split with": [
      "A ground-support partner whose own compromise or mishandling turns the telemetry exchange into a channel out of WS-X90.",
      "The exchange is enabled in the gateway's policy under an interim approval, with no signed agreement dividing the control responsibilities.",
      "Moderate likelihood: the exchange is listed openly and time-limited, but carries live traffic. Moderate impact: a partner's incident becomes the program's, with no agreed duties to point to.",
    ],
    "Primary and alternate bearers converge on one switch port group": [
      "A fault in, or a denial of service against, the one Internal Ethernet Switch port group both bearers cross.",
      "The primary and alternate paths share a port group on the platform, so one failure takes both down.",
      "Low likelihood: it needs a failure in one port group, already accepted as a single point of failure. Low impact: availability is categorized moderate, so what is lost is redundancy rather than the mission.",
    ],
    "Privilege that survived its own review still reaches platform management": [
      "An attacker who compromises one of the two holders whose privilege the review revoked on paper, or who adjusts the account to keep it.",
      "The privileged assignment review on the Platform Management Controller flags excess privilege and stops before removing it.",
      "Moderate likelihood: it needs one of two credentials, but their activity reads as ordinary. Moderate impact: a compromise starts from platform management, a position the program has decided nobody should hold.",
    ],
    "Relayed audit records carried a second ordering inside the platform trail": [
      "Someone who reorders or blurs the platform trail during congestion to hide cause and effect.",
      "Records relayed through the Internal Ethernet Switch were ordered on arrival; a source time stamp now travels with them.",
      "Low likelihood: the source time stamp is in place and the retest reproduced the seeded sequence. Low impact: what remains is a window already shut.",
    ],
    "The four-hour recovery objective has never been measured on a whole article": [
      "An attack or failure that destroys data or disables recovery and forces a real restore of partitions nobody has exercised.",
      "WS-X90 has never been restored end to end, and platform management and payload interface were left out of the exercise.",
      "Moderate likelihood: a full recovery is rare, and it will be needed. Moderate impact: availability is categorized moderate, and the four-hour objective is unproven for the partitions an operator needs back first.",
    ],
    "The mission link is unmonitored and three firmware domains cannot force the restricted state":
      [
        "A compromised navigation, timing or payload component that keeps producing mission output over the Tactical Data Radio, whose traffic nobody inspects.",
        "Nothing inspects the Tactical Data Radio path, and firmware integrity violations in three domains raise an alert without driving the restricted state.",
        "Moderate likelihood: it needs a firmware compromise, which the boot chain makes harder. High impact: the busiest link and three mission domains are where monitoring and the hold do not reach.",
      ],
    "The payload interlock's trust basis is asserted and six units identify themselves from paperwork":
      [
        "A substituted or counterfeit part in the Payload Safety Interlock, or in one of six units that identify themselves from paperwork.",
        "The interlock's trustworthiness is asserted rather than evidenced, and six units fall back to a maintenance record for hardware identity.",
        "Moderate likelihood: substitution needs a way into the supply chain, and the acquisition procedures have expired. High impact: the interlock stands between a payload command and the payload.",
      ],
    "The personnel procedure and the provisioning gate no longer agree": [
      "An account created to the looser written procedure once the gate is relaxed to match it.",
      "The Provisioning Workstation enforces stricter eligibility than the published personnel procedure, and the change was never recorded.",
      "Low likelihood: the divergence runs the safe way today. Low impact: nothing is under-protected until someone loosens the gate to match the document.",
    ],
    "The widest configuration divergence WS-X90 produces has no review behind it": [
      "An unapproved change, or a modified image, slipped in during a change campaign while the configuration is furthest from the approved one.",
      "Nothing in the Configuration Repository opens a reconciliation when a campaign closes, and the procedures for automated change prohibition and response are unsigned.",
      "Moderate likelihood: campaigns run on a schedule, and each one is a window. Moderate impact: such a change is found, if at all, in the monthly cycle among ordinary drift.",
    ],
    "Unlisted hardware was announced onto the internal segment and then carried": [
      "An unlisted device attached to the internal segment to listen to or relay its traffic.",
      "Four switch ports logged an unlisted device and carried its traffic anyway; all twelve now refuse one.",
      "Low likelihood: the enforcement build refused an unlisted device on every port at retest. Low impact: it stands as the record of what a lagging firmware baseline costs.",
    ],
    "Weakness reports reach their second recipient after the reporting bound": [
      "Another program on the same baseline, exploited through a weakness WS-X90 reported to it late.",
      "One of the two reporting routes is walked by hand, so half the weakness reports reached their second recipient after the bound.",
      "Moderate likelihood: half the reports so far have been late. Moderate impact: the cost falls on a recipient who does not know it is waiting.",
    ],
  },
  /** A risk the import made from a failed requirement, by the requirement's kind. */
  fromRequirement: {
    Monitoring: [
      "Activity under {controls} on the {elements} that goes unwatched until its consequences show.",
      "{requirement} is not met: the telemetry needed to monitor the behavior under {controls} is not produced on the {elements}.",
    ],
    Configuration: [
      "An unauthorized change to the {elements}, by a technician or an attacker with access, that nothing rejects.",
      "{requirement} is not met: the approved configuration under {controls} is not held on the {elements}, and unauthorized changes to it are not rejected.",
    ],
    Enforcement: [
      "Use of the {elements} that the policy under {controls} forbids, going ahead unchecked.",
      "{requirement} is not met: the policy under {controls} is not enforced on the {elements}, and no verifiable status is recorded.",
    ],
    Verification: [
      "A weakness in {controls} on the {elements} that stays hidden because nobody can verify the implementation.",
      "{requirement} is not met: the evidence an assessor needs to verify {controls} is not exposed on the {elements}.",
    ],
    rationale:
      "{likelihood} likelihood: the initial assessment found {requirement} not met, and no assessment has judged it since. {impact} impact: without it, the protection selected under {controls} is missing on the {elements}.",
  },
  /** The words a likelihood or an impact takes at the start of a rationale. */
  levels: {
    very_low: "Very low",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    very_high: "Very high",
  },
  due: {
    mitigate: { critical: 30, high: 60, moderate: 120, low: 180 },
    avoid: { critical: 30, high: 60, moderate: 90, low: 120 },
    transfer: { critical: 60, high: 90, moderate: 120, low: 180 },
    accept: { critical: 90, high: 180, moderate: 270, low: 365 },
  },
  dueAt: "17:00:00Z",
};
