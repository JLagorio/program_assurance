/**
 * The showcase scenario: authored, illustrative records that carry the demo past what the archived
 * prototype recorded, so every screen has something to show. Nothing here comes from the archived
 * fixture or claims to: it is written for this repository, and `npm run seed:demo-showcase` writes
 * it under its own provenance dataset (`showcase-v1`), apart from the legacy import.
 *
 * It names records the demo import created by their codes and titles (programs, systems, people,
 * campaigns, risks) and reference data by its codes (controls, framework items). The seed refuses a
 * name it cannot find rather than guessing.
 *
 * History is fixed in time, as the import's is: WS-X90's initial authorization assessment ran
 * 2026-08-03 to 2026-08-21, so its SSP, plan, results and decision sit around those days. What is
 * still moving (the continuous-monitoring schedule, scanner imports, the fiscal year) is laid out
 * in days from the run's as-of date, so overdue, due soon and in progress read true on the day it
 * is seeded.
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

/** The initial authorization assessment's plan and results, and the expanded assessment's. */
export const assessments = {
  initial: {
    campaign: "WS-X90 Initial Authorization Security Assessment",
    plan: "Security assessment plan — initial authorization",
    planDescription:
      "Assess every control of the tailored baseline against SSP 2 and the Block 1 configuration.",
    planPublishedAt: "2026-07-28T15:00:00Z",
    results: "Security assessment report — initial authorization",
    resultsDescription:
      "Determinations on the tailored baseline from the 2026-08-03 to 2026-08-21 assessment.",
    resultSet: "Initial authorization assessment, 2026-08-03 to 2026-08-21",
    startsAt: "2026-08-03T13:00:00Z",
    endsAt: "2026-08-21T21:00:00Z",
    resultsPublishedAt: "2026-08-28T15:00:00Z",
  },
  expanded: {
    campaign: "WS-X90 Expanded Control Set Assessment",
    plan: "Security assessment plan — expanded control set",
    planDescription:
      "Assess the tailored-in cyber resiliency controls and re-test the controls the initial assessment found short.",
    planPublishedAt: "2026-09-08T15:00:00Z",
    results: "Interim results — expanded control set",
    resultsDescription:
      "Determinations recorded so far; the results are a draft until the assessment closes.",
    resultSet: "Expanded control set assessment, in progress",
    startsAt: "2026-09-14T13:00:00Z",
  },
  /** What an assessor wrote for each determination. */
  narrative: {
    satisfied:
      "Examined the implementation narrative and its cited evidence, interviewed the responsible engineer and tested a sample; the statement is met as written.",
    partially_satisfied:
      "Part of the statement is met. The assessor recorded a gap against at least one of its items, carried forward for remediation.",
    other_than_satisfied:
      "The assessor could not confirm the implementation: the statement is not met, or the evidence offered does not show it.",
  },
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

/** What a reviewer wrote for each evidence decision. */
export const evidenceReview = {
  reviewedFrom: "2026-08-04T14:00:00Z",
  accepted: "Matches the requirement's acceptance criteria and the Block 1 configuration.",
  needs_revision:
    "The report does not name the configuration it was run against; resubmit against Block 1.",
  rejected: "The artifact describes a different build than the one under assessment.",
};
