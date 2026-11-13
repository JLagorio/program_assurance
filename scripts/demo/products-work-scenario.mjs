/**
 * The work inside the products scenario: what each customer program has done, found, risked and
 * promised since it took the product, the assessments the newer product versions were owed, and a
 * product and a program for the business line that had neither.
 *
 * Authored for this repository and illustrative, as the products scenario is: every customer,
 * finding, risk and determination here is fictional. scripts/seed-demo-products.mjs writes it as
 * its fourth step, under the provenance dataset `products-work-v1`, after the three that
 * scripts/demo/products-scenario.mjs holds.
 *
 * A number where a date belongs is a day counted from the day the step is seeded for (`--as-of`,
 * today by default): -6 is six days before it and 2 two days after, so what is overdue and what is
 * due soon read true on that day. A date written out is a fact of the product's history.
 */
import * as base from "./products-scenario.mjs";

export const workDatasetId = "products-work-v1";

/**
 * Everyone the step names. They are the people of the demo import's directory; one a workspace
 * does not hold is added as a person with no account, so the step needs no other seed.
 */
export const cast = [
  "Amara Bell",
  "Dan Whitfield",
  "Elena Vasquez",
  "Hana Lindqvist",
  "Ingrid Solberg",
  "Joel Barrantes",
  "Marcus Ryde",
  "Nadia Fournier",
  "Priya Raghavan",
  "Ray Colston",
  "Sarah Chen",
  "Tom Okafor",
  "Victor Amsel",
  "Wes Duarte",
];
/** The account the step is seeded for, where a record is its own: a task in My work. */
export const account = "@account";

/** Who owns a business line that has no owner yet. */
export const businessLineOwners = { AD: "Priya Raghavan", MS: "Marcus Ryde" };

/** What an evidence version says of itself: the scenario names a file and holds no bytes of it. */
export const evidenceProvenance =
  "Authored demo metadata. The reference names a file the scenario has no bytes for, and its hash stands in for the file's.";

/** What a program does for a control of each family that the product gives nothing for. */
export const familyProcedures = {
  AC: "Access to the variant's engineering data, test stations and loaded articles is granted by role under the program's access control procedure and reviewed each quarter.",
  AT: "Staff assigned to the variant complete the contractor's security awareness training and the role-based training for their station before they are given access.",
  AU: "Audit records from the test stations and support equipment are collected to the program's log server and reviewed weekly by the security officer.",
  CA: "The variant is assessed under the program's assessment plan, and its open findings are tracked in the program's POA&M.",
  CM: "Changes to the variant's hardware, software, firmware and data go through the program's configuration control board against its configuration baseline.",
  CP: "The program keeps recovery procedures and spares for the variant's test and support equipment and exercises them before each test campaign.",
  IA: "Operators and maintainers of the variant's support equipment authenticate with the contractor's tokens, and keys are issued under the program's key management plan.",
  IR: "Security incidents that touch the variant are handled under the contractor's incident response plan and reported to the customer under the contract's terms.",
  MA: "Maintenance of delivered articles and support equipment is done by cleared maintainers with approved tools and recorded in the maintenance log.",
  MP: "Media that carries the variant's software, keys or mission data is marked, held in approved containers, and sanitized or destroyed under the program's media procedure.",
  PE: "The variant is built, stored and tested in the contractor's controlled areas, with access lists and visitor records kept by facility security.",
  PL: "The variant's security plan and rules of behavior are kept by the security officer and reviewed at each program gate.",
  PS: "People assigned to the variant are screened to the contract's requirements, and their access is removed on transfer or departure.",
  RA: "The program assesses risk to the variant at each gate and keeps the results in its risk register.",
  SA: "The variant is developed under the contractor's engineering process, with security requirements, design reviews and developer testing kept in the program's engineering records.",
  SC: "Interfaces the program adds to the variant are separated and protected under its interface control documents, and customer cryptography is integrated under the key management plan.",
  SI: "Flaws found in the variant's software and firmware are tracked to closure, and each load is checked for integrity before it is installed.",
  SR: "Parts and software for the variant are bought from approved sources and tracked by serial number from receipt to delivery.",
};

/** The program document a statement of a control of each family is answered under. */
export const familyDocuments = {
  AC: "access control procedure",
  AT: "training plan",
  AU: "audit and accountability procedure",
  CA: "assessment plan",
  CM: "configuration management plan",
  CP: "contingency plan",
  IA: "key management plan",
  IR: "incident response plan",
  MA: "maintenance procedure",
  MP: "media protection procedure",
  PE: "facility security procedure",
  PL: "security plan",
  PS: "personnel security procedure",
  RA: "risk management plan",
  SA: "engineering process",
  SC: "interface control documents",
  SI: "flaw remediation procedure",
  SR: "supply chain risk management plan",
};

/**
 * How a variant's SSP is filled. A control the product answers takes its narrative from the
 * components that contribute to it; one the program alone answers takes its family's sentence, for
 * `programOnlyShare` percent of them, so some controls still wait for an author. Each spread is
 * [implemented below, partial below] of 100, and the rest stay planned.
 */
export const sspNarratives = {
  programOnlyShare: 64,
  shared: [70, 100],
  changedHere: [35, 80],
  programOnly: [52, 78],
  changedContribution: "Changed in this variant",
};

/**
 * What an assessor wrote for a control a delta assessment found met, by how the control stands in
 * the variant. A result short of satisfied says why in its own words: a named result
 * (`results.named`) or the area of the program's trouble it falls in (`results.areas`).
 */
export const findingNarratives = {
  satisfied: {
    changed_here:
      "Examined the changed element and repeated the product's test on it. The control is met as the variant implements it.",
    program_only:
      "Examined the program's procedure and a sample of its records. The control is met as the program implements it.",
  },
};

const element = (code, name, type, parent, configuration, component) => [
  code,
  name,
  type,
  parent,
  configuration,
  component,
];

/**
 * The products the step adds to: an assessment of the X800's second version, the launcher unit
 * pinned and assessed, the ground terminal's draft pinned, and the Mission Systems line given a
 * published product and a program that takes it.
 */
export const productWork = {
  /** The X800's version 2: version 1's determinations on the elements it kept, and the new one's. */
  carried: {
    product: "X800",
    version: 2,
    from: 1,
    title: "X800 Missile version 2 product assessment",
    description:
      "Version 1's determinations carried forward onto the elements version 2 keeps unchanged, and the health monitoring unit judged for the first time.",
    assessor: "Elena Vasquez",
    startedOn: "2026-11-03",
    completedOn: "2026-11-10",
    publishedAt: "2026-11-10T16:00:00Z",
    carriedRationale: "Carried forward from version 1: the element is unchanged in version 2.",
    /** The element version 2 adds claims no library component, so the assessor judged it directly. */
    newElement: {
      code: "PS-HMU",
      families: { AU: 30, CM: 15, PE: 20, SC: 15, SI: 35 },
      spread: [68, 86, 100],
      rationale: "Judged on the health monitoring unit itself, which version 2 adds.",
    },
  },
  /** Component sets behind the smaller products. `baseline` is where a component's claims come from. */
  libraries: [
    {
      code: "r210-components",
      name: "R210 launcher electronics component set",
      description: "The components of the R210 Launcher Electronics Unit and what each claims.",
      remarks: "Released with R210 Launcher Electronics Unit version 2.",
      effectiveFrom: "2026-10-05",
      baseline: "NIST SP 800-53 Rev 5 High baseline",
      conditions: "Applies to the launcher electronics unit as delivered.",
      consumerResponsibilities:
        "A program that changes the launch controller's firmware assesses the controls the firmware stands behind.",
      components: [
        {
          key: "launcher-power-supply",
          name: "Launcher Power Supply",
          type: "hardware",
          description: "Conditions launcher power for the controller and the umbilical.",
          families: { CP: 20, PE: 25, SI: 10 },
          anchors: ["PE-9"],
        },
        {
          key: "launch-controller",
          name: "Launch Controller",
          type: "hardware",
          description: "Sequences a rail launch and authenticates the round it carries.",
          families: { AC: 30, AU: 25, IA: 30, SC: 25, SI: 15 },
          anchors: ["AC-3", "IA-3", "SC-7"],
        },
        {
          key: "launch-controller-firmware",
          name: "Launch Controller Firmware",
          type: "software",
          description: "Firmware of the launch controller.",
          families: { AC: 15, CM: 35, SC: 15, SI: 45 },
          anchors: ["CM-14", "SI-7"],
        },
      ],
    },
    {
      code: "g40-components",
      name: "G40 ground terminal component set",
      description: "The components the G40 Ground Terminal's draft is built from.",
      remarks: "Released ahead of the terminal's first version.",
      effectiveFrom: "2026-10-19",
      baseline: "NIST SP 800-53 Rev 5 Moderate baseline",
      conditions: "Applies to the ground terminal at a fixed site or in a shelter.",
      consumerResponsibilities:
        "A program that fields the terminal provides the site and the accounts of its planners.",
      components: [
        {
          key: "planning-workstation",
          name: "Planning Workstation",
          type: "hardware",
          description: "Workstation a planner builds a mission on.",
          families: { AC: 35, AU: 30, IA: 30, MP: 25, SC: 20 },
          anchors: ["AC-2", "IA-2"],
        },
        {
          key: "datalink-relay",
          name: "Datalink Relay",
          type: "hardware",
          description: "Relays the datalink between the terminal and the launcher.",
          families: { AC: 20, IA: 25, SC: 40 },
          anchors: ["SC-8"],
        },
        {
          key: "planning-software",
          name: "Planning Software",
          type: "software",
          description: "Mission planning application.",
          families: { AC: 25, AU: 20, CM: 30, SI: 40 },
          anchors: ["SI-10"],
        },
        {
          key: "shelter-power-unit",
          name: "Shelter Power Unit",
          type: "hardware",
          description: "Powers the terminal in a shelter.",
          families: { CP: 20, PE: 25 },
          anchors: [],
        },
      ],
    },
    {
      code: "g25-components",
      name: "G25 launch control component set",
      description:
        "The components of the G25 Launch Control Station and what each does for its controls.",
      remarks: "Released with G25 Launch Control Station version 1.",
      effectiveFrom: "2026-05-04",
      baseline: "NIST SP 800-53 Rev 5 Moderate baseline",
      conditions: "Applies to the launch control station in a shelter or a vehicle.",
      consumerResponsibilities:
        "A program that changes the launch control software or its configuration assesses the controls the software stands behind.",
      components: [
        {
          key: "console-workstation",
          name: "Console Workstation",
          type: "hardware",
          description: "The operator's console.",
          families: { AC: 40, AU: 30, IA: 30, MP: 20, SC: 20 },
          anchors: ["AC-2", "AC-3", "IA-2"],
        },
        {
          key: "launch-control-software",
          name: "Launch Control Software",
          type: "software",
          description: "Commands the battery's launchers and reports their status.",
          families: { AC: 30, AU: 25, CM: 35, SA: 20, SI: 45 },
          anchors: ["CM-7", "SI-7", "SI-10"],
        },
        {
          key: "tactical-router",
          name: "Tactical Router",
          type: "hardware",
          description: "Routes traffic between the station and its launchers.",
          families: { AC: 20, IA: 20, SC: 40 },
          anchors: ["AC-4", "SC-7"],
        },
        {
          key: "link-encryptor",
          name: "Link Encryptor",
          type: "hardware",
          description: "Encrypts the links to the launchers.",
          families: { IA: 30, MP: 20, SC: 45 },
          anchors: ["SC-8", "SC-12", "SC-13"],
        },
        {
          key: "time-server",
          name: "Time Server",
          type: "hardware",
          description: "Gives the battery one authenticated time.",
          families: { AU: 25, SC: 15 },
          anchors: ["AU-8"],
        },
        {
          key: "audit-log-collector",
          name: "Audit Log Collector",
          type: "software",
          description: "Collects and protects the station's audit records.",
          families: { AU: 55, SI: 20 },
          anchors: ["AU-6", "AU-9", "AU-12"],
        },
        {
          key: "shelter-pdu",
          name: "Shelter Power Distribution Unit",
          type: "hardware",
          description: "Distributes shelter power to the station.",
          families: { CP: 20, PE: 30 },
          anchors: [],
        },
        {
          key: "vehicle-power-interface",
          name: "Vehicle Power Interface",
          type: "hardware",
          description: "Takes the station's power from the command vehicle.",
          families: { CP: 25, PE: 25 },
          anchors: ["PE-11"],
        },
      ],
    },
  ],
  /** A draft version's elements pinned to library components, by element code. */
  pins: [
    {
      product: "G40",
      library: "g40-components",
      elements: {
        WS: "planning-workstation",
        RLY: "datalink-relay",
        SW: "planning-software",
        PWR: "shelter-power-unit",
      },
    },
  ],
  /** A published product given a next version whose elements are pinned, so it can claim controls. */
  revisions: [
    {
      product: "R210",
      library: "r210-components",
      remarks: "Pins the unit's elements to the launcher electronics component set.",
      effectiveFrom: "2026-10-05",
      elements: {
        PSU: "launcher-power-supply",
        CTL: "launch-controller",
        FW: "launch-controller-firmware",
      },
    },
  ],
  /** The Mission Systems line's published product. */
  products: [
    {
      code: "G25",
      name: "G25 Launch Control Station",
      businessLine: "MS",
      library: "g25-components",
      description:
        "Operator station that commands a launcher battery and reports its status. Delivered in a shelter or mounted in a command vehicle.",
      baseline: "NIST SP 800-53 Rev 5 Moderate baseline",
      remarks: "First released version.",
      effectiveFrom: "2026-05-04",
      configurations: [
        { code: "SHL", name: "Shelter", description: "Installed in a transportable shelter." },
        { code: "VEH", name: "Vehicle-Mounted", description: "Mounted in a command vehicle." },
      ],
      elements: [
        element("OC", "Operator Console", "subsystem", null, "*", null),
        element("OC-WS", "Console Workstation", "hardware", "OC", "*", "console-workstation"),
        element(
          "OC-SW",
          "Launch Control Software",
          "software",
          "OC",
          "*",
          "launch-control-software",
        ),
        element("CN", "Communications", "subsystem", null, "*", null),
        element("CN-RTR", "Tactical Router", "hardware", "CN", "*", "tactical-router"),
        element("CN-ENC", "Link Encryptor", "hardware", "CN", "*", "link-encryptor"),
        element("SV", "Site Services", "subsystem", null, "*", null),
        element("SV-TS", "Time Server", "hardware", "SV", "*", "time-server"),
        element("SV-LOG", "Audit Log Collector", "software", "SV", "*", "audit-log-collector"),
        element("SH", "Shelter Installation", "subsystem", null, "SHL", null),
        element(
          "SH-PDU",
          "Shelter Power Distribution Unit",
          "hardware",
          "SH",
          "SHL",
          "shelter-pdu",
        ),
        element("VM", "Vehicle Installation", "subsystem", null, "VEH", null),
        element(
          "VM-PWR",
          "Vehicle Power Interface",
          "hardware",
          "VM",
          "VEH",
          "vehicle-power-interface",
        ),
      ],
    },
  ],
  /** Published assessments of a product's latest version, judged as the X800's first was. */
  assessments: [
    {
      product: "R210",
      baseline: "NIST SP 800-53 Rev 5 High baseline",
      title: "R210 Launcher Electronics Unit version 2 product assessment",
      description:
        "One assessment of the launcher electronics unit against the High baseline the X800 is held to.",
      assessor: "Ray Colston",
      startedOn: "2026-10-12",
      completedOn: "2026-10-30",
      publishedAt: "2026-10-30T15:00:00Z",
      spread: [74, 90, 97],
      weakElements: ["FW"],
      weakSpread: [58, 80, 95],
      wholeFamilies: ["CM", "SA", "SR"],
      wholeShare: 30,
      wholeSpread: [84, 95, 100],
      wholeRationale:
        "Judged for the unit as a whole: its build, configuration and supply chain records.",
    },
    {
      product: "G25",
      baseline: "NIST SP 800-53 Rev 5 Moderate baseline",
      title: "G25 Launch Control Station version 1 product assessment",
      description:
        "One assessment of the station against its control baseline, judged element by element so it answers for the shelter and for the vehicle.",
      assessor: "Ray Colston",
      startedOn: "2026-06-08",
      completedOn: "2026-07-17",
      publishedAt: "2026-07-17T15:00:00Z",
      spread: [78, 90, 96],
      weakElements: ["OC-SW"],
      weakSpread: [56, 80, 94],
      wholeFamilies: ["CM", "PL", "RA", "SA", "SR"],
      wholeShare: 40,
      wholeSpread: [82, 94, 100],
      wholeRationale:
        "Judged for the product as a whole: its engineering, configuration and supply chain process.",
    },
  ],
  /** The Mission Systems line's program, created through the program wizard as the others were. */
  programs: [
    {
      code: "PRG-2201",
      name: "Customer C · G25 Battery Control Fielding",
      description: "Fields the G25 Launch Control Station in Customer C's command vehicles.",
      businessLine: "MS",
      product: "G25",
      startsOn: "2026-08-17",
      variant: {
        code: "G25-VEH-CUSC",
        name: "G25 Launch Control Station · Vehicle-Mounted · Customer C",
        description: "Customer C's variant of the Vehicle-Mounted configuration.",
        configuration: "VEH",
        prefix: "CC",
        impact: ["moderate", "moderate", "moderate"],
        rationale: "Categorized as the product is, for the customer's battery.",
        removed: [],
        added: [
          [
            "CN-SAT",
            "Satellite Backhaul Terminal",
            "hardware",
            "CN",
            "The customer's own beyond-line-of-sight link to its headquarters.",
          ],
        ],
        changes: [
          [
            "OC-SW",
            ["data", "software"],
            "Launch control software is configured with the customer's battery layout and engagement rules.",
          ],
        ],
      },
      requirements: {
        source: {
          code: "CUSC-SSS",
          title: "Customer C System Security Specification",
          documentReference: "CUSC-SSS-0009",
          versionLabel: "Draft 3",
          receivedOn: "2026-08-24",
          description:
            "Customer C's security requirements for the launch control station in its command vehicles.",
        },
        items: [
          [
            "5.1.1",
            "Operator authentication",
            "The console shall authenticate each operator before it accepts a command.",
            ["OC-WS"],
            ["IA-2", "AC-3"],
            "compliant",
            "similarity",
            "Met by the product's console workstation as assessed in version 1.",
          ],
          [
            "5.1.2",
            "Engagement rule integrity",
            "The launch control software shall accept engagement rules only from a signed configuration.",
            ["OC-SW"],
            ["SI-7", "CM-5"],
            "partially_compliant",
            "test",
            "The product checks the signature. The customer's configuration is to be tested against it.",
          ],
          [
            "5.2.1",
            "Launcher link encryption",
            "Links between the station and its launchers shall be encrypted.",
            ["CN-ENC", "CN-RTR"],
            ["SC-8", "SC-13"],
            "compliant",
            "similarity",
            "Met by the product's link encryptor and tactical router as assessed in version 1.",
          ],
          [
            "5.2.2",
            "Satellite backhaul protection",
            "The satellite backhaul shall carry only encrypted traffic.",
            ["CN-SAT"],
            ["SC-8"],
            "non_compliant",
            "test",
            "The backhaul terminal is the program's own and has not been tested.",
          ],
          [
            "5.3.1",
            "Audit of operator actions",
            "The station shall record each operator action with the time it was taken.",
            ["SV-LOG", "SV-TS"],
            ["AU-2", "AU-8", "AU-12"],
            "compliant",
            "similarity",
            "Met by the product's audit log collector and time server as assessed in version 1.",
          ],
          [
            "5.3.2",
            "Audit record retention",
            "Audit records shall be kept for one year.",
            ["SV-LOG"],
            ["AU-11"],
            null,
            null,
            null,
          ],
          [
            "5.4.1",
            "Loss of vehicle power",
            "The station shall shut down in a known state when vehicle power is lost.",
            ["VM-PWR"],
            ["PE-11"],
            "partially_compliant",
            "demonstration",
            "The power interface holds the station up for an orderly shutdown. The shutdown is to be demonstrated in the customer's vehicle.",
          ],
          [
            "5.5.1",
            "Configuration records",
            "The contractor shall keep configuration records for each delivered station.",
            [],
            ["CM-8"],
            "compliant",
            "inspection",
            "Met by the product's configuration records.",
          ],
        ],
      },
    },
  ],
};

/**
 * The work of each program. Tasks are [title, status, workstream, assignee, due, priority, note,
 * done]; a workstream is its place in the list, from one. Observations are [key, title,
 * description, method, observed, observer, evidence]. Everything else names its fields.
 */
export const work = {
  "PRG-2101": {
    sponsor: "Priya Raghavan",
    endsOn: "2027-09-30",
    systemOwner: "Dan Whitfield",
    lifecycle: "development",
    roles: [
      ["program_manager", "Sarah Chen"],
      ["system_owner", "Dan Whitfield"],
      ["security_officer", "Nadia Fournier"],
      ["control_owner", "Ingrid Solberg"],
      ["control_owner", "Amara Bell"],
      ["assessor", "Elena Vasquez"],
      ["reviewer", "Victor Amsel"],
    ],
    scopes: [
      ["FLT", "Flight article", "The missile as Customer A flies it from the rail launcher."],
      ["GSE", "Support equipment", "The field test set and what connects it to the missile."],
    ],
    workstreams: [
      [
        "Rail launcher integration",
        "Fit, power and data integration of the missile with Customer A's rail launcher.",
        "Dan Whitfield",
        "active",
        -128,
        75,
      ],
      [
        "Customer cryptographic suite",
        "Loading and proving the customer's algorithm suite and key management in the cryptographic module.",
        "Ingrid Solberg",
        "blocked",
        -70,
        40,
      ],
      [
        "Delta assessment and acceptance",
        "Assessing the controls this variant changes and carrying the results to the customer's acceptance.",
        "Nadia Fournier",
        "active",
        -45,
        110,
      ],
      [
        "Waveform module qualification",
        "Qualifying the customer waveform module beside the product's datalink radio.",
        "Dan Whitfield",
        "planned",
        5,
        95,
      ],
      [
        "Requirements baseline",
        "Agreeing CUSA-SSRD Rev C with the customer and allocating it to the variant.",
        "Sarah Chen",
        "completed",
        -121,
        -98,
      ],
    ],
    tasks: [
      [
        "Load the customer algorithm suite on the bench cryptographic module",
        "in_progress",
        2,
        "Ingrid Solberg",
        1,
        "high",
        "Load on bench unit 2 and record the firmware identifier the module reports.",
      ],
      [
        "Obtain Customer A test keys for the datalink test",
        "blocked",
        2,
        "Ingrid Solberg",
        -6,
        "urgent",
        "Blocked: the customer's key management office has not released test keys.",
      ],
      [
        "Run the datalink encryption test with the customer suite",
        "waiting",
        2,
        "Dan Whitfield",
        9,
        "high",
        "Waiting on the test keys. Verifies CUSA-SSRD 3.2.1.",
      ],
      [
        "Demonstrate zeroization under the customer key management plan",
        "open",
        2,
        "Ingrid Solberg",
        16,
        "normal",
        "Demonstration for CUSA-SSRD 3.2.2, witnessed by the customer.",
      ],
      [
        "Show protection of mission data built into the flight program",
        "in_progress",
        1,
        "Nadia Fournier",
        -3,
        "high",
        "CUSA-SSRD 3.2.3 is not met until the image is protected at rest.",
      ],
      [
        "Verify secure boot accepts the customer flight program load",
        "done",
        1,
        "Dan Whitfield",
        -20,
        "high",
        "Retest after the load was re-signed.",
        -22,
      ],
      [
        "Review the flight program's functions against least functionality",
        "open",
        1,
        "Nadia Fournier",
        2,
        "normal",
        "CUSA-SSRD 3.3.3 is unanswered until this review is recorded.",
      ],
      [
        "Inspect rail umbilical tamper seals on the first article",
        "done",
        1,
        "Amara Bell",
        -30,
        "normal",
        "Photographs with serial numbers filed as evidence.",
        -31,
      ],
      [
        "Write the waveform module separation test procedure",
        "in_progress",
        4,
        "Dan Whitfield",
        6,
        "normal",
        "For CUSA-SSRD 3.5.1.",
      ],
      [
        "Book the waveform confidentiality test at the customer laboratory",
        "waiting",
        4,
        "Sarah Chen",
        12,
        "normal",
        "Waiting on the customer's laboratory calendar.",
      ],
      [
        "Answer the two open requirements in CUSA-SSRD Rev C",
        "open",
        3,
        "Sarah Chen",
        0,
        "high",
        "3.3.3 and 3.5.1 have no compliance statement.",
      ],
      [
        "Collect evidence for the controls this variant changes",
        "in_progress",
        3,
        "Nadia Fournier",
        20,
        "normal",
        "The delta assessment judges 83 controls changed here.",
      ],
      [
        "Prepare the assessor's read-in for the delta assessment",
        "done",
        3,
        "Sarah Chen",
        -41,
        "normal",
        null,
        -42,
      ],
      [
        "Answer the delta assessment's first results",
        "open",
        3,
        "Nadia Fournier",
        25,
        "high",
        "Each control found other than satisfied needs a remediation item or an accepted risk.",
      ],
      [
        "Update the variant configuration baseline after the firmware load",
        "blocked",
        1,
        "Amara Bell",
        -1,
        "normal",
        "Blocked: the cryptographic module firmware load is not released.",
      ],
      [
        "Draft the customer mission data loader interface note",
        "cancelled",
        1,
        "Sarah Chen",
        -15,
        "low",
        "Cancelled: the customer's loader is outside the system, and CUSA-SSRD 3.6.1 is not applicable.",
      ],
      [
        "Decide whether this variant takes X800 version 2",
        "open",
        3,
        account,
        4,
        "normal",
        "Version 2 adds a health monitoring unit to Platform Services.",
      ],
      [
        "Sign off the review of the secure boot test report",
        "in_progress",
        3,
        account,
        1,
        "normal",
        "Version 2 of the report answers the first review.",
      ],
    ],
    taskLinks: [
      [1, "poam", "suite-modes"],
      [2, "issue", "suite-kat"],
      [3, "requirement", "3.2.1"],
      [4, "requirement", "3.2.2"],
      [5, "issue", "mission-data"],
      [5, "risk", "mission-data"],
      [6, "evidence", "secure-boot-test"],
      [7, "requirement", "3.3.3"],
      [8, "evidence", "tamper-seals"],
      [14, "poam", "encrypt-mission-data"],
      [18, "evidence", "secure-boot-test"],
    ],
    evidence: [
      {
        key: "maintenance-access-test",
        title: "Maintenance port access control test report",
        kind: "test_record",
        owner: "Dan Whitfield",
        collected: -95,
        description:
          "Bench test of the maintenance port: sessions with and without a maintainer credential.",
        claim: "Shows the maintenance port refuses a session without a maintainer credential.",
        requirements: ["3.1.1"],
        review: ["accepted", "Elena Vasquez", "The test covers each maintenance function.", -90],
        expires: 270,
      },
      {
        key: "maintenance-audit-extract",
        title: "Maintenance session audit extract, first article",
        kind: "log",
        owner: "Nadia Fournier",
        collected: -88,
        description: "Audit records of twelve maintenance sessions on the first article.",
        claim: "Shows each maintenance session recorded with its maintainer and time.",
        requirements: ["3.1.2"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Records are complete for the sessions sampled.",
          -84,
        ],
      },
      {
        key: "datalink-bench-test",
        title: "Datalink encryption bench test record, product suite",
        kind: "test_record",
        owner: "Ingrid Solberg",
        collected: -70,
        description: "Datalink encryption test with the product's own algorithm suite.",
        claim: "Shows the datalink encrypted end to end with the product's suite.",
        requirements: ["3.2.1"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Stands for the radio. The customer's suite is not covered.",
          -66,
        ],
      },
      {
        key: "suite-load-record",
        title: "Customer algorithm suite load record",
        kind: "document",
        owner: "Ingrid Solberg",
        collected: -12,
        description:
          "Record of loading the customer's suite on bench unit 2, with its known-answer test results.",
        claim: "Shows the customer's suite loaded and two modes failing their known-answer tests.",
        requirements: ["3.2.1"],
        review: ["pending", "Elena Vasquez"],
      },
      {
        key: "zeroize-plan",
        title: "Key load and zeroize demonstration plan",
        kind: "document",
        owner: "Ingrid Solberg",
        collected: -25,
        description: "Plan for demonstrating key loading and zeroization to the customer.",
        claim: "Sets out how zeroization will be demonstrated with the customer's suite.",
        requirements: ["3.2.2"],
        review: [
          "needs_revision",
          "Elena Vasquez",
          "The plan does not say how the key load interface's buffer is checked after zeroize.",
          -19,
        ],
      },
      {
        key: "secure-boot-test",
        title: "Secure boot verification test report, customer flight program load",
        kind: "test_record",
        owner: "Dan Whitfield",
        collected: -22,
        description: "Secure boot test with the customer's flight program load, after re-signing.",
        claim: "Shows secure boot accept the re-signed load and refuse an altered one.",
        requirements: ["3.3.1"],
        review: ["accepted", "Elena Vasquez", "The retest answers the first review.", -17],
        first: {
          collected: -30,
          description: "First run: secure boot refused the customer's load.",
          review: [
            "needs_revision",
            "Elena Vasquez",
            "The load was refused. Retest once it is signed by the approved authority.",
            -28,
          ],
        },
      },
      {
        key: "signing-chain",
        title: "Software signing authority certificate chain",
        kind: "document",
        owner: "Amara Bell",
        collected: -90,
        description: "The certificate chain of the authority that signs the missile's software.",
        claim: "Shows which authority's signature the secure boot firmware accepts.",
        requirements: ["3.3.2"],
        review: [
          "accepted",
          "Elena Vasquez",
          "The chain matches the firmware's trust anchor.",
          -85,
        ],
        expires: 14,
      },
      {
        key: "tamper-seals",
        title: "Guidance section tamper seal inspection record",
        kind: "image",
        owner: "Amara Bell",
        collected: -27,
        description: "Photographs of the first article's tamper seals with their serial numbers.",
        claim: "Shows the seals in place and their serial numbers recorded.",
        requirements: ["3.4.1"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Serial numbers are legible in the retaken set.",
          -24,
        ],
        first: {
          collected: -31,
          description: "First set: two photographs do not show the seal serial numbers.",
          review: [
            "needs_revision",
            "Elena Vasquez",
            "Two photographs do not show the serial numbers.",
            -29,
          ],
        },
      },
      {
        key: "umbilical-icd",
        title: "Rail umbilical interface control document, Rev B",
        kind: "document",
        owner: "Dan Whitfield",
        collected: -100,
        description: "Signals and data the rail umbilical passes between launcher and missile.",
        claim: "Lists the data the umbilical passes, which is the launch sequence's and no more.",
        requirements: ["3.4.2"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Accepted. One reference cites a superseded drawing.",
          -92,
        ],
      },
      {
        key: "supply-chain-sample",
        title: "Supply chain record sample, units 001 to 004",
        kind: "dataset",
        owner: "Amara Bell",
        collected: -60,
        description: "Source and receipt records for the parts of the first four units.",
        claim: "Shows each sampled part traced to an approved source.",
        requirements: ["3.7.1"],
        review: ["accepted", "Victor Amsel", "Unit 003's distributor was corrected.", -52],
      },
      {
        key: "build-manifest",
        title: "Flight program build manifest, customer mission data",
        kind: "dataset",
        owner: "Nadia Fournier",
        collected: -18,
        description: "What the customer's flight program image holds and where.",
        claim: "Lists the mission data built into the image and how it is stored.",
        requirements: ["3.2.3"],
        review: [
          "rejected",
          "Elena Vasquez",
          "The manifest shows the mission data stored in the clear. It does not support 3.2.3.",
          -16,
        ],
      },
      {
        key: "test-set-scan",
        title: "Vulnerability scan of the field test set",
        kind: "scan",
        owner: "Nadia Fournier",
        collected: -20,
        description: "Authenticated scan of the field test set's operating system.",
        claim: "Shows the field test set's operating system build and its open vulnerabilities.",
        requirements: [],
        review: ["pending", "Elena Vasquez"],
        expires: 10,
      },
      {
        key: "read-in-briefing",
        title: "Delta assessment read-in briefing",
        kind: "document",
        owner: "Sarah Chen",
        collected: -42,
        description: "What this variant changes and which controls the delta assessment judges.",
        claim: "Sets out the variant's changes for the assessor.",
        requirements: [],
        review: ["accepted", "Elena Vasquez", "Matches the variant as declared.", -40],
      },
      {
        key: "waveform-interface",
        title: "Customer waveform module interface description",
        kind: "document",
        owner: "Dan Whitfield",
        collected: -8,
        description: "Draft description of the waveform module's power and data interfaces.",
        draft: true,
      },
    ],
    observations: [
      [
        "mission-data-clear",
        "Mission data is stored in the clear in the flight program image",
        "The build manifest places the customer's mission data in an unencrypted segment of the image on the mission computer.",
        "analysis",
        -18,
        "Nadia Fournier",
        ["build-manifest"],
      ],
      [
        "suite-kat-failure",
        "Two modes of the customer suite fail their known-answer tests",
        "On bench unit 2 the customer's suite failed the known-answer tests for two of its five modes.",
        "test",
        -11,
        "Ingrid Solberg",
        ["suite-load-record"],
      ],
      [
        "zeroize-residue",
        "Key material remains in the key load interface after zeroize",
        "In a dry run of the demonstration, the key encryption key was still readable in the interface's buffer after the zeroize command.",
        "demonstration",
        -9,
        "Ingrid Solberg",
        ["zeroize-plan"],
      ],
      [
        "session-no-serial",
        "Maintenance session records do not name the test set",
        "The audit extract records the maintainer and the time of each session and not the serial number of the test set that connected.",
        "examine",
        -40,
        "Elena Vasquez",
        ["maintenance-audit-extract"],
      ],
      [
        "waveform-power-return",
        "The waveform module shares a power return with the datalink radio",
        "Inspection of the first article found the customer waveform module wired to the datalink radio's power return.",
        "inspection",
        -7,
        "Dan Whitfield",
        [],
      ],
      [
        "boot-refused-load",
        "Secure boot refused the first customer flight program load",
        "The first load was signed with a development key, and secure boot refused it as designed.",
        "test",
        -30,
        "Dan Whitfield",
        ["secure-boot-test"],
      ],
      [
        "test-set-os",
        "The field test set runs an operating system build with open critical vulnerabilities",
        "The scan reports an operating system build two years behind its vendor's support, with four critical vulnerabilities open.",
        "test",
        -20,
        "Nadia Fournier",
        ["test-set-scan"],
      ],
      [
        "distributor-unit-003",
        "Unit 003's record names a distributor that is not on the approved list",
        "One connector lot in unit 003 was bought through a distributor the supply chain plan does not list.",
        "examine",
        -58,
        "Victor Amsel",
        ["supply-chain-sample"],
      ],
    ],
    issues: [
      {
        key: "mission-data",
        title: "Mission data in the flight program image is readable at rest",
        description:
          "The customer's mission data is built into the Operational Flight Program and stored unencrypted on the mission computer. CUSA-SSRD 3.2.3 is not met.",
        severity: "critical",
        status: "open",
        owner: "Nadia Fournier",
        opened: -18,
        observations: ["mission-data-clear"],
        evidence: ["build-manifest"],
      },
      {
        key: "suite-kat",
        title: "The customer algorithm suite fails known-answer tests on two modes",
        description:
          "Two of the suite's five modes fail their known-answer tests in the cryptographic module, so datalink encryption with the customer's suite cannot be tested.",
        severity: "high",
        status: "in_progress",
        owner: "Ingrid Solberg",
        opened: -11,
        observations: ["suite-kat-failure"],
        evidence: ["suite-load-record"],
      },
      {
        key: "zeroize",
        title: "Zeroize leaves the key encryption key in the key load interface",
        description:
          "After the zeroize command the key encryption key is still held in the key load interface's buffer until power is removed.",
        severity: "high",
        status: "triaged",
        owner: "Ingrid Solberg",
        opened: -9,
        observations: ["zeroize-residue"],
        evidence: ["zeroize-plan"],
      },
      {
        key: "test-set",
        title: "The field test set's operating system is out of support",
        description:
          "The field test set that connects to the maintenance port runs a build with four open critical vulnerabilities.",
        severity: "high",
        status: "open",
        owner: "Nadia Fournier",
        opened: -20,
        observations: ["test-set-os"],
        evidence: ["test-set-scan"],
      },
      {
        key: "session-serial",
        title: "Maintenance session records omit the test set's serial number",
        description:
          "A maintenance session is recorded against its maintainer and not against the test set that connected.",
        severity: "moderate",
        status: "in_progress",
        owner: "Nadia Fournier",
        opened: -40,
        observations: ["session-no-serial"],
        evidence: ["maintenance-audit-extract"],
      },
      {
        key: "waveform-return",
        title: "The waveform module shares a power return with the datalink radio",
        description:
          "The shared return couples the customer's waveform module to the product's radio, which CUSA-SSRD 3.5.1 asks to keep separate.",
        severity: "moderate",
        status: "open",
        owner: "Dan Whitfield",
        opened: -7,
        observations: ["waveform-power-return"],
        evidence: [],
      },
      {
        key: "boot-refusal",
        title: "Secure boot refused the first customer flight program load",
        description: "The customer's first load was signed with a development key.",
        severity: "moderate",
        status: "resolved",
        owner: "Dan Whitfield",
        opened: -30,
        closed: -22,
        closure:
          "The load was re-signed by the approved authority and accepted on retest. An altered load was refused.",
        observations: ["boot-refused-load"],
        evidence: ["secure-boot-test"],
      },
      {
        key: "distributor",
        title: "Unit 003 holds a connector lot from an unapproved distributor",
        description: "The lot was bought outside the approved source list during a shortage.",
        severity: "moderate",
        status: "closed",
        owner: "Amara Bell",
        opened: -58,
        closed: -50,
        closure:
          "The lot was traced to the manufacturer, tested and accepted. The distributor was added to the approved list.",
        observations: ["distributor-unit-003"],
        evidence: ["supply-chain-sample"],
      },
      {
        key: "seal-photos",
        title: "Two tamper seal photographs do not show the serial numbers",
        description: "The first inspection set cannot be matched to the seal register.",
        severity: "low",
        status: "closed",
        owner: "Amara Bell",
        opened: -29,
        closed: -27,
        closure: "The photographs were retaken with the serial numbers legible.",
        observations: [],
        evidence: ["tamper-seals"],
      },
      {
        key: "icd-drawing",
        title: "The rail umbilical interface document cites a superseded connector drawing",
        description: "Rev B refers to the connector drawing the launcher's Rev D replaced.",
        severity: "low",
        status: "open",
        owner: "Amara Bell",
        opened: -14,
        observations: [],
        evidence: ["umbilical-icd"],
      },
    ],
    risks: [
      {
        key: "mission-data",
        title: "Mission data is recovered from a lost or captured missile",
        status: "responding",
        owner: "Nadia Fournier",
        description:
          "A missile that is lost in transit or recovered after a failed flight gives up the customer's mission data.",
        threat: "An adversary with physical possession of the guidance section.",
        vulnerability: "Mission data is stored unencrypted in the flight program image.",
        likelihood: "low",
        impact: "very_high",
        severity: "high",
        rationale:
          "Possession is unlikely, and the data would expose the customer's targets and tactics.",
        assessed: -16,
        assessor: "Nadia Fournier",
        response: [
          "mitigate",
          "Encrypt the mission data segment under a key the cryptographic module holds.",
          "Nadia Fournier",
          30,
        ],
        observations: ["mission-data-clear"],
        techniques: ["T1005", "T1552"],
      },
      {
        key: "weak-suite",
        title: "The customer algorithm suite weakens datalink confidentiality",
        status: "investigating",
        owner: "Ingrid Solberg",
        description:
          "A suite whose modes fail their known-answer tests may encrypt the datalink incorrectly or not at all.",
        threat: "An adversary who intercepts the datalink.",
        vulnerability: "Two modes of the customer's suite do not behave as specified.",
        likelihood: "moderate",
        impact: "high",
        severity: "high",
        rationale: "The failing modes are the two the customer's waveform uses most.",
        assessed: -10,
        assessor: "Ingrid Solberg",
        response: [
          "mitigate",
          "Hold the datalink test until the customer's cryptographic authority corrects the suite.",
          "Ingrid Solberg",
          12,
        ],
        observations: ["suite-kat-failure"],
        techniques: ["T1040", "T1600"],
      },
      {
        key: "key-residue",
        title: "Key material survives zeroization",
        status: "open",
        owner: "Ingrid Solberg",
        description:
          "A missile zeroized before capture or disposal still holds the key that protects its other keys.",
        threat: "An adversary with physical access to a zeroized missile.",
        vulnerability: "The key load interface keeps the key encryption key in its buffer.",
        likelihood: "moderate",
        impact: "very_high",
        severity: "critical",
        rationale: "Zeroization is the control the customer relies on when a missile is lost.",
        assessed: -8,
        assessor: "Ingrid Solberg",
        response: [
          "mitigate",
          "Change the interface firmware to clear its buffer on zeroize.",
          "Ingrid Solberg",
          21,
        ],
        observations: ["zeroize-residue"],
        techniques: ["T1552"],
      },
      {
        key: "test-set",
        title: "A compromised field test set reaches the maintenance port",
        status: "responding",
        owner: "Nadia Fournier",
        description:
          "Malicious code on the field test set uses a maintenance session to change the missile's software or read its data.",
        threat: "An adversary who has compromised the test set's operating system.",
        vulnerability: "The test set runs an unsupported build with open critical vulnerabilities.",
        likelihood: "moderate",
        impact: "high",
        severity: "high",
        rationale: "The test set connects to every missile before it is loaded.",
        assessed: -19,
        assessor: "Nadia Fournier",
        response: [
          "mitigate",
          "Rebuild the test set on a supported build and rescan it.",
          "Nadia Fournier",
          -4,
        ],
        observations: ["test-set-os"],
        techniques: ["T1200", "T1072", "T1195"],
      },
      {
        key: "waveform-path",
        title: "The customer waveform module becomes a path around the datalink's protections",
        status: "open",
        owner: "Dan Whitfield",
        description:
          "A fault or an implant in the waveform module reaches the product's radio through what they share.",
        threat: "An adversary with access to the customer's waveform module supply.",
        vulnerability: "The module shares a power return with the datalink radio.",
        likelihood: "low",
        impact: "high",
        severity: "moderate",
        rationale: "The module is the customer's own and has not been assessed.",
        assessed: -6,
        assessor: "Dan Whitfield",
        response: [
          "mitigate",
          "Give the module its own return and test the separation.",
          "Dan Whitfield",
          35,
        ],
        observations: ["waveform-power-return"],
        techniques: ["T1599"],
      },
      {
        key: "unsigned-load",
        title: "Unsigned software is accepted during a depot reload",
        status: "closed",
        owner: "Dan Whitfield",
        description: "A load not signed by the approved authority runs on the missile.",
        threat: "An insider or supplier who substitutes a software load.",
        vulnerability: "None found: secure boot refused the development-signed load.",
        likelihood: "very_low",
        impact: "high",
        severity: "low",
        rationale: "Secure boot refused the wrong load and an altered one on retest.",
        assessed: -21,
        assessor: "Dan Whitfield",
        response: [
          "avoid",
          "Only loads signed by the approved authority are released to the depot.",
          "Dan Whitfield",
          null,
        ],
        observations: ["boot-refused-load"],
        techniques: ["T1553", "T1542"],
      },
      {
        key: "attribution",
        title: "A maintenance action cannot be attributed to a test set",
        status: "accepted",
        owner: "Nadia Fournier",
        description:
          "After an incident the program can say who maintained a missile and not which test set was used.",
        threat: "A maintainer who uses an unapproved test set.",
        vulnerability: "Session records do not carry the test set's serial number.",
        likelihood: "low",
        impact: "moderate",
        severity: "low",
        rationale: "Test sets are issued by serial number, so the issue log can stand in for now.",
        assessed: -36,
        assessor: "Nadia Fournier",
        response: [
          "accept",
          "Accepted until the product's next version records the serial number.",
          "Sarah Chen",
          null,
          "Priya Raghavan",
          -33,
        ],
        observations: ["session-no-serial"],
        techniques: ["T1070"],
      },
      {
        key: "counterfeit",
        title: "A counterfeit part enters a delivered unit through an unapproved distributor",
        status: "open",
        owner: "Amara Bell",
        description: "A part bought outside the approved sources fails or carries an implant.",
        threat: "A supplier of counterfeit or altered parts.",
        vulnerability: "A shortage led one lot to be bought outside the approved list.",
        likelihood: "low",
        impact: "high",
        severity: "moderate",
        rationale: "One lot in one unit, since tested. The buying rule is unchanged.",
        assessed: -49,
        assessor: "Amara Bell",
        response: [
          "mitigate",
          "Require the configuration manager's approval for any buy outside the list.",
          "Amara Bell",
          18,
        ],
        observations: ["distributor-unit-003"],
        techniques: ["T1195"],
      },
    ],
    poam: {
      title: "Customer A · X800 Rail Integration POA&M",
      description:
        "What the program has committed to fix before Customer A's first-article security acceptance.",
      published: -5,
      items: [
        {
          key: "encrypt-mission-data",
          title: "Encrypt mission data in the flight program image",
          status: "in_progress",
          owner: "Nadia Fournier",
          description: "Mission data is stored in the clear in the flight program image.",
          plan: "Move the mission data to a segment encrypted under a key the cryptographic module holds, and retest CUSA-SSRD 3.2.3.",
          resources: "Flight software team, two weeks. One bench unit.",
          planned: 30,
          milestones: [
            ["Choose the at-rest protection design", -10, -8, "completed"],
            ["Build the flight program with the encrypted segment", 14, null, "in_progress"],
            ["Retest against CUSA-SSRD 3.2.3", 30, null, "planned"],
          ],
          issues: ["mission-data"],
          risks: ["mission-data"],
        },
        {
          key: "suite-modes",
          title: "Correct the customer algorithm suite's failing modes",
          status: "in_progress",
          owner: "Ingrid Solberg",
          description: "Two modes of the customer's suite fail their known-answer tests.",
          plan: "Report the failures to the customer's cryptographic authority, load the corrected suite and repeat the tests.",
          resources: "Cryptographic lead. The customer's cryptographic authority.",
          planned: 12,
          milestones: [
            ["Report the failures to the customer's cryptographic authority", -9, -9, "completed"],
            ["Receive the corrected suite", 7, null, "planned"],
            ["Repeat the known-answer tests", 12, null, "planned"],
          ],
          issues: ["suite-kat"],
          risks: ["weak-suite"],
        },
        {
          key: "zeroize-buffer",
          title: "Clear the key load interface buffer on zeroize",
          status: "open",
          owner: "Ingrid Solberg",
          description: "The key encryption key survives the zeroize command.",
          plan: "Change the interface firmware to clear its buffer, then demonstrate zeroization to the customer.",
          resources: "Firmware engineer, one week. Configuration control board approval.",
          planned: 21,
          published: false,
          milestones: [
            ["Firmware change request approved", 5, null, "planned"],
            ["Demonstrate zeroization with the customer's suite", 21, null, "planned"],
          ],
          issues: ["zeroize"],
          risks: [],
        },
        {
          key: "rebuild-test-set",
          title: "Rebuild the field test set on a supported operating system",
          status: "overdue",
          owner: "Nadia Fournier",
          description: "The field test set runs a build with open critical vulnerabilities.",
          plan: "Rebuild both test sets on the supported build, rescan them, and hold maintenance sessions to the rebuilt set.",
          resources: "Support equipment engineer, three days a set.",
          planned: -4,
          milestones: [
            ["Order the supported build and its licenses", -25, -24, "completed"],
            ["Rebuild and rescan test set 1", -4, null, "in_progress"],
            ["Rebuild and rescan test set 2", 6, null, "planned"],
          ],
          issues: ["test-set"],
          risks: ["test-set"],
        },
        {
          key: "session-serial",
          title: "Record the test set's serial number in maintenance sessions",
          status: "deferred",
          owner: "Nadia Fournier",
          description: "Session records name the maintainer and not the test set.",
          plan: "Raise the change against the product, and use the test set issue log until the product's next version carries it.",
          resources: "None in this program.",
          planned: 150,
          milestones: [["Change raised against the X800 product", -32, -32, "completed"]],
          issues: ["session-serial"],
          risks: ["attribution"],
        },
        {
          key: "resign-load",
          title: "Re-sign the customer flight program load",
          status: "completed",
          owner: "Dan Whitfield",
          description: "The first customer load was signed with a development key.",
          plan: "Have the approved authority sign the load and repeat the secure boot test.",
          resources: "Signing authority, one day.",
          planned: -22,
          completed: -22,
          rationale: "Secure boot accepted the re-signed load and refused an altered one.",
          milestones: [
            ["Load signed by the approved authority", -26, -25, "completed"],
            ["Secure boot retest", -22, -22, "completed"],
          ],
          issues: ["boot-refusal"],
          risks: ["unsigned-load"],
        },
        {
          key: "waveform-return",
          title: "Give the waveform module its own power return",
          status: "open",
          owner: "Dan Whitfield",
          description: "The waveform module shares a power return with the datalink radio.",
          plan: "Rewire the module to its own return and test the separation under the new procedure.",
          resources: "Harness change, first article only.",
          planned: 35,
          published: false,
          milestones: [
            ["Harness change drawn and approved", 10, null, "planned"],
            ["Separation test", 35, null, "planned"],
          ],
          issues: ["waveform-return"],
          risks: [],
        },
      ],
    },
    gates: [
      {
        title: "Security requirements baseline",
        status: "completed",
        due: -98,
        description: "CUSA-SSRD Rev C agreed with the customer and allocated to the variant.",
        outcomes: ["outcome.SN.7", "outcome.SN.9", "outcome.SR.2"],
        criteria: ["CUSA-SSRD Rev C is allocated to the variant's elements"],
        evidence: ["umbilical-icd"],
      },
      {
        title: "Variant definition review",
        status: "completed",
        due: -84,
        description: "What the variant keeps, changes, leaves out and adds is declared.",
        outcomes: ["outcome.AR.7", "outcome.DE.3"],
        criteria: ["Each changed element is declared with what changed and why"],
        evidence: [],
      },
      {
        title: "Delta assessment plan review",
        status: "passed",
        due: -40,
        description: "The assessor and the program agree which controls the variant owes.",
        outcomes: ["outcome.VE.1", "outcome.VE.2"],
        criteria: ["The variant's SSP is published and the delta assessment planned"],
        evidence: ["read-in-briefing"],
      },
      {
        title: "Customer cryptographic suite integration review",
        status: "at_risk",
        due: 10,
        description:
          "At risk: the customer's suite fails its tests and the test keys are not released.",
        outcomes: ["outcome.IN.4", "outcome.IN.6"],
        criteria: [
          "The customer suite passes its known-answer tests in the cryptographic module",
          "Zeroization is demonstrated with the customer's key material",
        ],
        evidence: ["suite-load-record"],
      },
      {
        title: "Delta assessment results review",
        status: "in_review",
        due: 18,
        description: "The first results are published and the program is answering them.",
        outcomes: ["outcome.VE.3", "outcome.VE.5", "outcome.VE.6"],
        criteria: [
          "Each control found other than satisfied has a remediation item or an accepted risk",
        ],
        evidence: [],
      },
      {
        title: "First-article security acceptance",
        status: "not_started",
        due: 62,
        description: "Customer A accepts the first article's security.",
        outcomes: ["outcome.VA.4", "outcome.VA.7"],
        criteria: ["Every requirement of CUSA-SSRD Rev C has a compliance statement"],
        evidence: [],
      },
      {
        title: "Delivery readiness review",
        status: "not_started",
        due: 110,
        description: "The variant is ready to deliver to the customer's launcher units.",
        outcomes: ["outcome.TR.4", "outcome.TR.7"],
        criteria: [],
        evidence: [],
      },
    ],
    ssp: {
      working:
        "Working draft. SSP 1 was published as the product seeded it so the delta assessment could be planned. This revision records how the variant implements each control.",
      owners: {
        default: "Nadia Fournier",
        CM: "Amara Bell",
        SA: "Amara Bell",
        SR: "Amara Bell",
        IA: "Ingrid Solberg",
        SC: "Ingrid Solberg",
        MA: "Dan Whitfield",
        PE: "Dan Whitfield",
      },
    },
    assessment: {
      title: "Customer A · X800 Rail Integration delta assessment",
      owner: "Elena Vasquez",
      status: "active",
      starts: -42,
      ends: 21,
      subject: "Customer A's variant of the X800 Missile, Lug & Rail Launch",
      planPublished: -40,
      activities: [
        [
          "Examine the declared changes and their records",
          "examine",
          "Read what the program changed in each element against the product as assessed.",
          [
            [
              "Read the change declared for each modified element.",
              "Each change names what changed and why.",
            ],
            [
              "Compare the variant's configuration baseline with the product's.",
              "Every difference is a declared change.",
            ],
          ],
        ],
        [
          "Interview the cryptographic lead",
          "interview",
          "How the customer's algorithm suite and key material are handled.",
          [
            [
              "Ask how the customer's suite is received and loaded.",
              "The suite is received from the customer's authority and loaded under two-person control.",
            ],
            [
              "Ask how zeroization is verified.",
              "Zeroization is verified by reading back every key store.",
            ],
          ],
        ],
        [
          "Test the changed elements on the bench",
          "test",
          "Repeat the product's tests on the flight program and the cryptographic module as changed.",
          [
            [
              "Run the product's secure boot test with the customer's load.",
              "The signed load runs and an altered load is refused.",
            ],
            [
              "Run the known-answer tests for each mode of the customer's suite.",
              "Every mode passes.",
            ],
            ["Zeroize and read back each key store.", "No key material remains."],
          ],
        ],
      ],
      events: [
        [
          "Assessor read-in",
          "completed",
          -41,
          -41,
          "Program office",
          "The program briefed the assessor on the variant's changes.",
        ],
        [
          "Bench testing of the changed elements",
          "active",
          -30,
          8,
          "Integration laboratory, bench unit 2",
          "Tests of the flight program and the cryptographic module as changed.",
        ],
        [
          "Results review with Customer A",
          "planned",
          18,
          18,
          "Customer A program office",
          "The published results and the program's answers.",
        ],
      ],
      results: {
        title: "Customer A delta assessment results",
        description:
          "First results: the controls judged so far of the 230 this variant owes. The rest follow the customer's cryptographic suite.",
        resultSet: "Bench and records review",
        starts: -38,
        ends: -6,
        published: -5,
        assessor: "Elena Vasquez",
        judged: 72,
        named: [
          {
            control: "SC-28",
            determination: "other_than_satisfied",
            narrative:
              "Mission data built into the flight program is stored unencrypted on the mission computer. Protection at rest is not met for this variant.",
            risk: "mission-data",
            observation: "mission-data-clear",
            evidence: "build-manifest",
          },
          {
            control: "SC-13",
            determination: "other_than_satisfied",
            narrative:
              "Two modes of the customer's algorithm suite fail their known-answer tests in the cryptographic module.",
            risk: "weak-suite",
            observation: "suite-kat-failure",
            evidence: "suite-load-record",
          },
          {
            control: "SC-12",
            determination: "partially_satisfied",
            narrative:
              "Keys are loaded under control. Zeroization leaves the key encryption key in the key load interface's buffer.",
            risk: "key-residue",
            observation: "zeroize-residue",
            evidence: "zeroize-plan",
          },
          {
            control: "SI-7",
            determination: "satisfied",
            narrative:
              "Secure boot accepted the customer's load once signed by the approved authority and refused an altered load.",
            evidence: "secure-boot-test",
          },
          {
            control: "RA-5",
            determination: "other_than_satisfied",
            narrative:
              "The scan of the field test set shows an operating system out of support, with no patch source and no replacement recorded, and the scan itself still waits for review.",
            risk: "test-set",
            observation: "test-set-os",
            evidence: "test-set-scan",
          },
          {
            control: "SC-3",
            determination: "partially_satisfied",
            narrative:
              "The customer waveform module shares a power return with the datalink radio, so the separation the cryptographic boundary relies on is not shown.",
            risk: "waveform-path",
            observation: "waveform-power-return",
          },
          {
            control: "CM-2",
            determination: "partially_satisfied",
            narrative:
              "The rail umbilical interface document in the baseline cites a superseded connector drawing, so the baseline it records is not the one built.",
            evidence: "umbilical-icd",
          },
          {
            control: "SR-11",
            determination: "partially_satisfied",
            narrative:
              "Unit 003 held a connector lot from an unapproved distributor. The lot was replaced, and the purchase controls that would have stopped it are not yet shown working.",
            risk: "counterfeit",
            observation: "distributor-unit-003",
            evidence: "supply-chain-sample",
          },
        ],
        areas: [
          {
            element: "CS-CRY",
            families: ["SC", "IA", "MP"],
            determination: "partially_satisfied",
            narrative:
              "Met for the algorithm suite the product delivers. The cryptographic module, changed for the customer's suite, still fails two known-answer tests and keeps the key encryption key after zeroization, so the control is not shown met in the module as changed.",
            risk: "weak-suite",
            observation: "suite-kat-failure",
            evidence: "suite-load-record",
          },
          {
            element: "GS-OFP",
            families: ["CM"],
            determination: "partially_satisfied",
            narrative:
              "The flight program as changed is built from a manifest the reviewer rejected, so its configuration for this variant is not shown.",
            observation: "mission-data-clear",
            evidence: "build-manifest",
          },
          {
            families: ["MA"],
            determination: "partially_satisfied",
            narrative:
              "Maintenance runs through a field test set whose operating system is out of support, so the program's maintenance procedure is not shown kept with the tools it uses.",
            risk: "test-set",
            observation: "test-set-os",
            evidence: "test-set-scan",
          },
          {
            families: ["AU"],
            determination: "partially_satisfied",
            narrative:
              "Maintenance session records omit the test set's serial number, so the program's audit procedure does not yet tie each session to the tool that made it.",
            risk: "attribution",
            observation: "session-no-serial",
            evidence: "maintenance-audit-extract",
          },
          {
            families: ["SR"],
            determination: "partially_satisfied",
            narrative:
              "A connector lot from an unapproved distributor reached unit 003, and the program's supply chain procedure does not yet show how the next one is stopped.",
            risk: "counterfeit",
            observation: "distributor-unit-003",
            evidence: "supply-chain-sample",
          },
        ],
      },
    },
    witness: {
      title: "Customer A acceptance test witnessing",
      description:
        "The tests and demonstrations the assessor witnesses on the way to first-article security acceptance.",
      owner: "Elena Vasquez",
      status: "planned",
      starts: -10,
      ends: 70,
      plan: "Acceptance witnessing plan",
      schedule: [
        [
          "Witness the secure boot retest",
          "completed",
          -23,
          -22,
          "Elena Vasquez",
          "The re-signed load ran and an altered load was refused.",
        ],
        [
          "Witness the test set rebuild and rescan",
          "blocked",
          -6,
          -3,
          "Elena Vasquez",
          "Blocked: test set 1 is not rebuilt.",
        ],
        [
          "Witness the datalink encryption test with the customer suite",
          "ready",
          7,
          9,
          "Elena Vasquez",
          "Waits on the customer's test keys.",
        ],
        ["Witness the zeroization demonstration", "planned", 19, 21, "Elena Vasquez", null],
        ["Witness the mission data protection retest", "planned", 28, 30, "Elena Vasquez", null],
        ["Witness the waveform separation test", "planned", 33, 35, "Victor Amsel", null],
        ["Witness the first-article acceptance test", "planned", 58, 62, "Elena Vasquez", null],
        [
          "Witness the mission data loader interface test",
          "cancelled",
          -16,
          -15,
          "Victor Amsel",
          "The customer's loader is outside the system.",
        ],
      ],
    },
    configurationBaselines: [
      {
        name: "First article as built",
        description:
          "The first article as it was built for Customer A, before the customer's cryptographic firmware.",
        published: -60,
        versions: { "GS-OFP": "1.0-CA2", "PS-BOOT": "1.0" },
        note: "As built for the first article.",
      },
      {
        name: "First article with the customer cryptographic suite",
        description:
          "Proposed once the cryptographic module firmware with the customer's suite is released.",
        published: null,
        versions: { "GS-OFP": "1.0-CA3", "CS-CRY": "1.0-CA1", "PS-BOOT": "1.0" },
        note: "Unchanged from the first article as built.",
      },
    ],
    scans: [
      [
        "Field test set vulnerability scan",
        "completed",
        -20,
        -20,
        "nessus",
        "4 critical, 9 high and 31 other findings on the test set's operating system.",
      ],
      [
        "Flight program static analysis",
        "completed",
        -34,
        -34,
        "sarif",
        "No finding above low in the customer's build of the flight program.",
      ],
      [
        "Field test set rescan after rebuild",
        "queued",
        null,
        null,
        "nessus",
        "Waits on the rebuild of test set 1.",
      ],
      [
        "Integration laboratory network scan",
        "failed",
        -12,
        -12,
        "nessus",
        "The scanner could not authenticate to bench unit 2.",
      ],
    ],
    package: {
      title: "Customer A security acceptance package",
      owner: "Sarah Chen",
      description:
        "Draft of what Customer A is given at first-article security acceptance: the variant's SSP, the delta assessment and the POA&M.",
      documents: ["ssp", "plan", "results", "poam"],
    },
    capabilities: [
      [
        "X800A-BIT",
        "Built-in test and fault reporting",
        "The missile reports the result of its integrity and built-in tests over the rail umbilical, and Customer A's launcher integration inherits fault reporting for the round it carries.",
      ],
    ],
    activity: [
      [
        -121,
        "Sarah Chen",
        "created",
        "opened the program for Customer A's rail launcher integration",
      ],
      [
        -98,
        "Sarah Chen",
        "completed",
        "closed the security requirements baseline gate with CUSA-SSRD Rev C allocated",
      ],
      [
        -84,
        "Dan Whitfield",
        "updated",
        "declared the flight program and the cryptographic module as changed in this variant",
      ],
      [-42, "Sarah Chen", "published", "published SSP 1 so the delta assessment could be planned"],
      [
        -40,
        "Elena Vasquez",
        "published",
        "published the delta assessment plan: 230 controls, 83 changed here and 147 the program's only",
      ],
      [
        -30,
        "Dan Whitfield",
        "updated",
        "recorded that secure boot refused the first customer flight program load",
      ],
      [-22, "Dan Whitfield", "completed", "closed the secure boot issue after the retest"],
      [
        -18,
        "Nadia Fournier",
        "created",
        "opened a critical issue: mission data is readable at rest in the flight program image",
      ],
      [
        -11,
        "Ingrid Solberg",
        "created",
        "opened an issue on the customer algorithm suite's failing modes",
      ],
      [
        -6,
        "Ingrid Solberg",
        "updated",
        "marked the test key task blocked\nThe customer's key management office has not released test keys.",
      ],
      [-5, "Elena Vasquez", "published", "published the delta assessment's first results"],
      [
        -5,
        "Sarah Chen",
        "published",
        "published POA&M version 1 with five remediation commitments",
      ],
      [-2, "Sarah Chen", "updated", "moved the cryptographic suite integration review to at risk"],
    ],
    comments: [
      [
        "issue",
        "mission-data",
        "Nadia Fournier",
        "The flight software team's design puts the mission data in its own segment, encrypted under a key the cryptographic module releases at power-up. Build is planned for the week after next.",
      ],
      [
        "issue",
        "suite-kat",
        "Ingrid Solberg",
        "Reported to the customer's cryptographic authority with the failing vectors. They expect a corrected suite inside two weeks.",
      ],
      [
        "risk",
        "attribution",
        "Sarah Chen",
        "Accepted with the sponsor. The test set issue log is checked at each maintenance session until the product records the serial number.",
      ],
      [
        "task",
        2,
        "Ingrid Solberg",
        "Raised again with the customer's key management office. They need the laboratory's accreditation letter before they release test keys.",
      ],
      [
        "poam",
        "rebuild-test-set",
        "Nadia Fournier",
        "Test set 1 is rebuilt and fails its first rescan on two findings. Working them before the witnessed rescan.",
      ],
    ],
  },

  "PRG-2102": {
    /** This variant takes the X800's second version once its SSP is published; Customer A's stays
     * on the first, so a reader meets a variant with an update to take and one that took it. */
    takesVersion: 2,
    sponsor: "Victor Amsel",
    endsOn: "2028-03-31",
    systemOwner: "Hana Lindqvist",
    lifecycle: "development",
    roles: [
      ["program_manager", "Tom Okafor"],
      ["system_owner", "Hana Lindqvist"],
      ["security_officer", "Joel Barrantes"],
      ["control_owner", "Amara Bell"],
      ["assessor", "Ray Colston"],
    ],
    scopes: [
      [
        "PAL",
        "Pallet and its missiles",
        "The pallet, its controller and the missiles it releases.",
      ],
      [
        "RNG",
        "Range instrumentation",
        "The telemetry and range safety equipment used on the customer's test range.",
      ],
    ],
    workstreams: [
      [
        "Pallet sequencing firmware",
        "Rewriting pallet sequencing for Customer B's aircraft and bringing it under configuration control.",
        "Hana Lindqvist",
        "active",
        -66,
        60,
      ],
      [
        "Telemetry encryptor replacement",
        "Replacing the product's telemetry encryptor with the customer's.",
        "Joel Barrantes",
        "blocked",
        -40,
        45,
      ],
      [
        "Flight test readiness",
        "Range safety, power and maintenance on the aircraft, up to the first flight test.",
        "Tom Okafor",
        "planned",
        10,
        130,
      ],
    ],
    tasks: [
      [
        "Fix the release interlock check after a brownout",
        "in_progress",
        1,
        "Hana Lindqvist",
        2,
        "urgent",
        "The rewritten firmware skips the interlock check when power dips during sequencing.",
      ],
      [
        "Bring the pallet firmware under Customer B's configuration control board",
        "open",
        1,
        "Amara Bell",
        -4,
        "high",
        "CUSB-SRS 4.1.3 is not met until the board has the firmware's baseline.",
      ],
      [
        "Test the sequencing software's integrity check before release",
        "waiting",
        1,
        "Wes Duarte",
        11,
        "high",
        "Waiting on the corrected firmware build. Verifies CUSB-SRS 4.1.2.",
      ],
      [
        "Receive the customer telemetry encryptor's interface control document",
        "blocked",
        2,
        "Joel Barrantes",
        -8,
        "high",
        "Blocked: the customer has not released the final document.",
      ],
      [
        "Test telemetry encryption with the customer's encryptor",
        "open",
        2,
        "Wes Duarte",
        24,
        "normal",
        "Verifies CUSB-SRS 4.2.2.",
      ],
      [
        "Answer the telemetry record protection requirement",
        "open",
        2,
        "Joel Barrantes",
        1,
        "normal",
        "CUSB-SRS 4.2.3 has no compliance statement.",
      ],
      [
        "Write the pallet power fault isolation analysis",
        "in_progress",
        3,
        "Hana Lindqvist",
        15,
        "normal",
        "For CUSB-SRS 4.3.1 and the pallet power distribution unit.",
      ],
      [
        "Get the range safety receiver's command authentication data from the vendor",
        "waiting",
        3,
        "Tom Okafor",
        7,
        "normal",
        "Waiting on the vendor's response to the data request.",
      ],
      [
        "Renew the field test set's calibration certificate",
        "open",
        3,
        "Amara Bell",
        0,
        "low",
        "The certificate expires before the first flight test.",
      ],
      [
        "Repeat the aircraft link test with a current test key",
        "done",
        1,
        "Wes Duarte",
        -34,
        "normal",
        "The first run used an expired key.",
        -36,
      ],
      ["Publish the variant's SSP", "done", 1, "Joel Barrantes", -3, "high", null, -3],
      [
        "Demonstrate approved tools for maintenance on the aircraft",
        "open",
        3,
        "Wes Duarte",
        40,
        "normal",
        "For CUSB-SRS 4.5.1.",
      ],
      [
        "Draft an incident reporting annex for the customer",
        "cancelled",
        3,
        "Tom Okafor",
        -12,
        "low",
        "Cancelled: the customer will issue its own reporting procedure with Issue 3.",
      ],
      [
        "Review the delta assessment plan for Customer B",
        "in_progress",
        1,
        account,
        3,
        "normal",
        "Planned after the variant took X800 version 2, so its objectives are read against that version.",
      ],
    ],
    taskLinks: [
      [1, "issue", "interlock"],
      [1, "poam", "interlock-fix"],
      [2, "issue", "firmware-ccb"],
      [2, "requirement", "4.1.3"],
      [3, "requirement", "4.1.2"],
      [4, "issue", "encryptor-rekey"],
      [6, "requirement", "4.2.3"],
      [9, "evidence", "test-set-certificate"],
      [10, "evidence", "aircraft-link-test"],
    ],
    evidence: [
      {
        key: "release-authorization-test",
        title: "Pallet release authorization test report",
        kind: "test_record",
        owner: "Wes Duarte",
        collected: -45,
        description: "Release commands with and without the aircraft's authentication.",
        claim: "Shows the pallet refuse a release command the aircraft did not authenticate.",
        requirements: ["4.1.1"],
        review: ["accepted", "Ray Colston", "Covers every release mode.", -41],
      },
      {
        key: "firmware-build-record",
        title: "Pallet sequencing firmware build record, customer aircraft",
        kind: "dataset",
        owner: "Hana Lindqvist",
        collected: -14,
        description: "Build record of the rewritten sequencing firmware, release candidate 3.",
        claim: "Shows what the rewritten firmware was built from and its integrity value.",
        requirements: ["4.1.2"],
        review: ["pending", "Ray Colston"],
      },
      {
        key: "ccb-minutes",
        title: "Firmware configuration control board minutes",
        kind: "document",
        owner: "Amara Bell",
        collected: -9,
        description: "Minutes of the contractor's board for the three firmware release candidates.",
        claim: "Shows the firmware's changes reviewed by the contractor's board.",
        requirements: ["4.1.3"],
        review: [
          "needs_revision",
          "Ray Colston",
          "The minutes are the contractor's board's. CUSB-SRS 4.1.3 asks for the customer's.",
          -7,
        ],
      },
      {
        key: "aircraft-link-test",
        title: "Aircraft link encryption test record",
        kind: "test_record",
        owner: "Wes Duarte",
        collected: -36,
        description:
          "Link encryption test between the pallet datalink node and the aircraft, repeated with a current key.",
        claim: "Shows the pallet's link to the aircraft encrypted with a current key.",
        requirements: ["4.2.1"],
        review: ["accepted", "Ray Colston", "The repeat run used a current test key.", -33],
        first: {
          collected: -44,
          description: "First run, made with a test key that had expired.",
          review: [
            "rejected",
            "Ray Colston",
            "The test key had expired. Repeat with a current key.",
            -42,
          ],
        },
      },
      {
        key: "encryptor-icd",
        title: "Customer telemetry encryptor interface control document, draft",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -30,
        description: "The customer's draft of the encryptor's interfaces to the telemetry unit.",
        claim: "Describes how the customer's encryptor connects to the telemetry unit.",
        requirements: ["4.2.2"],
        review: [
          "needs_revision",
          "Ray Colston",
          "A draft. The rekey interface is not described.",
          -26,
        ],
      },
      {
        key: "flight-software-integrity",
        title: "Flight software integrity verification log",
        kind: "log",
        owner: "Wes Duarte",
        collected: -38,
        description: "Secure boot logs from three power-ups of the flight article.",
        claim: "Shows the flight software verified at each power-up.",
        requirements: ["4.4.1"],
        review: ["accepted", "Ray Colston", "As the product was assessed.", -35],
      },
      {
        key: "privilege-matrix",
        title: "Mission computer role and privilege matrix",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -50,
        description: "Roles on the mission computer and what each may do.",
        claim: "Shows each role limited to the functions it needs.",
        requirements: ["4.4.2"],
        review: ["accepted", "Ray Colston", "Matches the product's access enforcement.", -46],
      },
      {
        key: "key-load-demonstration",
        title: "Key load interface demonstration record",
        kind: "test_record",
        owner: "Wes Duarte",
        collected: -35,
        description: "Demonstration of key loading through the key load interface.",
        claim: "Shows keys loaded only through the controlled interface.",
        requirements: ["4.4.3"],
        review: ["accepted", "Ray Colston", "Witnessed.", -34],
      },
      {
        key: "test-set-certificate",
        title: "Field test set approval and calibration certificate",
        kind: "document",
        owner: "Amara Bell",
        collected: -55,
        description: "Approval of the field test set and its calibration.",
        claim: "Shows the test set approved and in calibration.",
        requirements: ["4.5.1"],
        review: ["accepted", "Ray Colston", "Accepted. Note the expiry.", -51],
        expires: 2,
      },
      {
        key: "configuration-status",
        title: "Configuration status accounting report, units 101 to 103",
        kind: "dataset",
        owner: "Amara Bell",
        collected: -17,
        description: "Configuration status of the first three units, with firmware versions.",
        claim: "Shows the configuration of each delivered unit recorded.",
        requirements: ["4.6.1"],
        review: ["accepted", "Ray Colston", "Unit 103's firmware version is now recorded.", -15],
        first: {
          collected: -22,
          description: "First issue, without unit 103's firmware version.",
          review: ["needs_revision", "Ray Colston", "Unit 103 has no firmware version.", -20],
        },
      },
      {
        key: "brownout-test",
        title: "Pallet sequencing brownout test record",
        kind: "test_record",
        owner: "Wes Duarte",
        collected: -10,
        description: "Sequencing under supply dips, release candidate 3.",
        claim: "Shows the interlock check skipped after a supply dip during sequencing.",
        requirements: ["4.1.2"],
        review: ["accepted", "Ray Colston", "The failure is repeatable.", -9],
      },
      {
        key: "receiver-data-sheet",
        title: "Range safety receiver vendor data sheet",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -6,
        description: "The vendor's data sheet, which does not describe command authentication.",
        draft: true,
      },
    ],
    observations: [
      [
        "interlock-skipped",
        "The release interlock check is skipped after a brownout",
        "With the supply dipped during sequencing, release candidate 3 resumes at the release step without repeating the interlock check.",
        "test",
        -10,
        "Wes Duarte",
        ["brownout-test"],
      ],
      [
        "contractor-board-only",
        "Firmware changes are approved by the contractor's board alone",
        "The three release candidates were approved by the contractor's board. The customer's board has no baseline for the firmware.",
        "examine",
        -8,
        "Ray Colston",
        ["ccb-minutes"],
      ],
      [
        "rekey-unauthenticated",
        "The encryptor's draft interface shows a rekey port with no authentication",
        "The customer's draft describes a test port that accepts a rekey and names no authentication for it.",
        "examine",
        -26,
        "Ray Colston",
        ["encryptor-icd"],
      ],
      [
        "expired-test-key",
        "The first aircraft link test used an expired test key",
        "The key loaded for the first run had expired nine days before.",
        "examine",
        -42,
        "Ray Colston",
        ["aircraft-link-test"],
      ],
      [
        "pdu-no-analysis",
        "The pallet power distribution unit has no fault isolation analysis",
        "No analysis shows what a fault in the unit does to the aircraft's bus.",
        "interview",
        -15,
        "Joel Barrantes",
        [],
      ],
      [
        "receiver-undocumented",
        "The range safety receiver's command authentication is undocumented",
        "The vendor's data sheet does not say how the receiver authenticates a command.",
        "examine",
        -6,
        "Joel Barrantes",
        [],
      ],
    ],
    issues: [
      {
        key: "interlock",
        title: "Rewritten pallet firmware skips the release interlock after a brownout",
        description:
          "A supply dip during sequencing lets release candidate 3 reach the release step without the interlock check. CUSB-SRS 4.1.2 is not met.",
        severity: "critical",
        status: "in_progress",
        owner: "Hana Lindqvist",
        opened: -10,
        observations: ["interlock-skipped"],
        evidence: ["brownout-test", "firmware-build-record"],
      },
      {
        key: "firmware-ccb",
        title: "Pallet firmware is changed outside the customer's configuration control",
        description:
          "The rewritten firmware has no baseline with the customer's configuration control board.",
        severity: "high",
        status: "open",
        owner: "Amara Bell",
        opened: -8,
        observations: ["contractor-board-only"],
        evidence: ["ccb-minutes"],
      },
      {
        key: "encryptor-rekey",
        title: "The customer telemetry encryptor accepts a rekey over its test port",
        description:
          "The draft interface shows a rekey on the test port with no authentication named.",
        severity: "high",
        status: "triaged",
        owner: "Joel Barrantes",
        opened: -26,
        observations: ["rekey-unauthenticated"],
        evidence: ["encryptor-icd"],
      },
      {
        key: "receiver-authentication",
        title: "Range safety receiver command authentication is undocumented",
        description:
          "CUSB-SRS 4.3.2 cannot be tested until the vendor says how the receiver authenticates a command.",
        severity: "moderate",
        status: "open",
        owner: "Tom Okafor",
        opened: -6,
        observations: ["receiver-undocumented"],
        evidence: [],
      },
      {
        key: "pdu-analysis",
        title: "The pallet power distribution unit has no fault isolation analysis",
        description: "Nothing shows a pallet power fault kept from the aircraft's bus.",
        severity: "moderate",
        status: "in_progress",
        owner: "Hana Lindqvist",
        opened: -15,
        observations: ["pdu-no-analysis"],
        evidence: [],
      },
      {
        key: "expired-key",
        title: "The aircraft link test used an expired test key",
        description: "The first link encryption test proved nothing about a current key.",
        severity: "moderate",
        status: "resolved",
        owner: "Wes Duarte",
        opened: -42,
        closed: -36,
        closure: "The test was repeated with a current key and passed.",
        observations: ["expired-test-key"],
        evidence: ["aircraft-link-test"],
      },
      {
        key: "calibration",
        title: "The field test set's calibration certificate expires before first flight test",
        description: "The certificate lapses in days, and the flight test is months away.",
        severity: "low",
        status: "open",
        owner: "Amara Bell",
        opened: -12,
        observations: [],
        evidence: ["test-set-certificate"],
      },
      {
        key: "unit-103",
        title: "The configuration status report omitted unit 103's firmware version",
        description: "The first issue of the report left the field blank.",
        severity: "low",
        status: "closed",
        owner: "Amara Bell",
        opened: -20,
        closed: -17,
        closure: "The report was reissued with the version recorded.",
        observations: [],
        evidence: ["configuration-status"],
      },
    ],
    risks: [
      {
        key: "unauthorized-release",
        title: "A pallet releases a missile without a completed interlock check",
        status: "responding",
        owner: "Hana Lindqvist",
        description:
          "A release proceeds after a power disturbance without the checks that make it safe and authorized.",
        threat: "A power disturbance, induced or accidental, during sequencing.",
        vulnerability: "The rewritten firmware resumes at the release step after a brownout.",
        likelihood: "low",
        impact: "very_high",
        severity: "critical",
        rationale:
          "Aircraft power dips at release are known. The consequence is an unsafe release.",
        assessed: -9,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Restart sequencing from the interlock check after any supply dip.",
          "Hana Lindqvist",
          8,
        ],
        observations: ["interlock-skipped"],
        techniques: ["T1495", "T1542"],
      },
      {
        key: "unreviewed-firmware",
        title: "Unreviewed firmware reaches a delivered pallet",
        status: "open",
        owner: "Amara Bell",
        description:
          "A firmware change the customer has not approved is loaded on a delivered pallet.",
        threat: "A developer or supplier who introduces an unapproved change.",
        vulnerability: "The customer's board holds no baseline for the firmware.",
        likelihood: "moderate",
        impact: "high",
        severity: "high",
        rationale: "Three release candidates in six weeks, none seen by the customer's board.",
        assessed: -7,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Baseline the firmware with the customer's board before the next candidate.",
          "Amara Bell",
          14,
        ],
        observations: ["contractor-board-only"],
        techniques: ["T1195", "T1601"],
      },
      {
        key: "telemetry-rekey",
        title: "Telemetry is read by whoever holds the encryptor's test port",
        status: "investigating",
        owner: "Joel Barrantes",
        description: "A rekey over the test port gives its holder the telemetry key.",
        threat: "A range worker or maintainer with access to the pallet on the ground.",
        vulnerability: "The customer's draft interface names no authentication for a rekey.",
        likelihood: "moderate",
        impact: "moderate",
        severity: "moderate",
        rationale: "The interface document is a draft, and the port may be removed.",
        assessed: -24,
        assessor: "Joel Barrantes",
        response: [
          "transfer",
          "Raised with the customer, who owns the encryptor's design.",
          "Joel Barrantes",
          20,
        ],
        observations: ["rekey-unauthenticated"],
        techniques: ["T1040", "T1556"],
      },
      {
        key: "spoofed-range-safety",
        title: "A spoofed range safety command ends a test flight",
        status: "open",
        owner: "Tom Okafor",
        description: "The receiver acts on a command the range did not send.",
        threat: "A party able to transmit on the range safety frequency.",
        vulnerability: "How the receiver authenticates a command is unknown.",
        likelihood: "low",
        impact: "very_high",
        severity: "high",
        rationale: "Unknown until the vendor answers. Treated as high until then.",
        assessed: -5,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Obtain the vendor's data and test command authentication on the bench.",
          "Tom Okafor",
          30,
        ],
        observations: ["receiver-undocumented"],
        techniques: ["T1565"],
      },
      {
        key: "power-fault",
        title: "A pallet power fault reaches the aircraft's bus",
        status: "responding",
        owner: "Hana Lindqvist",
        description: "A fault in the pallet's power distribution disables aircraft systems.",
        threat: "A component failure or damage to the pallet in flight.",
        vulnerability: "No analysis shows the fault isolated from the aircraft.",
        likelihood: "low",
        impact: "high",
        severity: "moderate",
        rationale: "The unit is new and its protection is by design intent only.",
        assessed: -14,
        assessor: "Hana Lindqvist",
        response: [
          "mitigate",
          "Complete the fault isolation analysis and test the unit's protection.",
          "Hana Lindqvist",
          15,
        ],
        observations: ["pdu-no-analysis"],
        techniques: ["T1499"],
      },
      {
        key: "stale-keys",
        title: "Expired test keys invalidate link encryption results",
        status: "closed",
        owner: "Wes Duarte",
        description: "A test run with an expired key is taken as proof of the link's encryption.",
        threat: "None external: a test discipline failure.",
        vulnerability: "Test key expiry was not checked before a run.",
        likelihood: "very_low",
        impact: "moderate",
        severity: "low",
        rationale: "The run was repeated, and the test procedure now checks expiry.",
        assessed: -35,
        assessor: "Wes Duarte",
        response: [
          "avoid",
          "The test procedure checks key expiry before each run.",
          "Wes Duarte",
          null,
        ],
        observations: ["expired-test-key"],
        techniques: ["T1552"],
      },
      {
        key: "lapsed-calibration",
        title: "Maintenance on the aircraft uses a test set out of calibration",
        status: "accepted",
        owner: "Amara Bell",
        description: "A test set whose approval has lapsed is used on the customer's aircraft.",
        threat: "None external: an administrative lapse.",
        vulnerability: "The calibration certificate expires before the first flight test.",
        likelihood: "low",
        impact: "low",
        severity: "low",
        rationale: "No maintenance on the aircraft is planned before the renewal.",
        assessed: -11,
        assessor: "Amara Bell",
        response: [
          "accept",
          "Accepted until the certificate is renewed.",
          "Tom Okafor",
          null,
          "Victor Amsel",
          -10,
        ],
        observations: [],
        techniques: [],
      },
    ],
    poam: {
      title: "Customer B · X800 Palletized Integration POA&M",
      description:
        "What the program has committed to fix before Customer B's flight test readiness review.",
      published: -2,
      items: [
        {
          key: "interlock-fix",
          title: "Repeat the interlock check after any supply dip",
          status: "in_progress",
          owner: "Hana Lindqvist",
          description: "Release candidate 3 skips the interlock check after a brownout.",
          plan: "Restart sequencing from the interlock check after any supply dip, and repeat the brownout test on the next candidate.",
          resources: "Firmware team, one week. One pallet controller on the bench.",
          planned: 8,
          milestones: [
            ["Fault reproduced and its cause found", -9, -8, "completed"],
            ["Release candidate 4 built", 4, null, "in_progress"],
            ["Brownout test repeated", 8, null, "planned"],
          ],
          issues: ["interlock"],
          risks: ["unauthorized-release"],
        },
        {
          key: "customer-baseline",
          title: "Baseline the pallet firmware with the customer's configuration control board",
          status: "overdue",
          owner: "Amara Bell",
          description: "The customer's board has no baseline for the rewritten firmware.",
          plan: "Submit release candidate 3 as the baseline and route every later change through the customer's board.",
          resources: "Configuration manager. The customer's board meets monthly.",
          planned: -4,
          milestones: [
            ["Baseline submission prepared", -6, -6, "completed"],
            ["Baseline accepted by the customer's board", -4, null, "in_progress"],
          ],
          issues: ["firmware-ccb"],
          risks: ["unreviewed-firmware"],
        },
        {
          key: "pdu-analysis",
          title: "Analyze and test pallet power fault isolation",
          status: "open",
          owner: "Hana Lindqvist",
          description: "No analysis shows a pallet power fault kept from the aircraft.",
          plan: "Write the fault isolation analysis and test the unit's protection on the bench.",
          resources: "Power engineer, two weeks.",
          planned: 15,
          published: false,
          milestones: [
            ["Fault isolation analysis written", 9, null, "planned"],
            ["Protection tested on the bench", 15, null, "planned"],
          ],
          issues: ["pdu-analysis"],
          risks: [],
        },
        {
          key: "link-retest",
          title: "Repeat the aircraft link test with a current key",
          status: "completed",
          owner: "Wes Duarte",
          description: "The first run used an expired test key.",
          plan: "Load a current test key, repeat the test and add an expiry check to the procedure.",
          resources: "Test team, one day.",
          planned: -36,
          completed: -36,
          rationale: "The repeat run passed, and the procedure now checks key expiry.",
          milestones: [["Test repeated with a current key", -36, -36, "completed"]],
          issues: ["expired-key"],
          risks: ["stale-keys"],
        },
        {
          key: "calibration-renewal",
          title: "Renew the field test set's calibration",
          status: "risk_accepted",
          owner: "Amara Bell",
          description: "The calibration certificate expires before the first flight test.",
          plan: "Send the test set for calibration once the bench tests are done.",
          resources: "Calibration laboratory, ten days.",
          planned: 45,
          milestones: [["Test set sent for calibration", 30, null, "planned"]],
          issues: ["calibration"],
          risks: ["lapsed-calibration"],
        },
      ],
    },
    gates: [
      {
        title: "Requirements baseline review",
        status: "completed",
        due: -55,
        description: "CUSB-SRS Issue 2 agreed and allocated to the variant.",
        outcomes: ["outcome.SN.7", "outcome.SR.2", "outcome.SR.6"],
        criteria: ["CUSB-SRS Issue 2 is allocated to the variant's elements"],
        evidence: ["privilege-matrix"],
      },
      {
        title: "Pallet firmware design review",
        status: "completed",
        due: -28,
        description: "The rewritten sequencing design reviewed against the product's.",
        outcomes: ["outcome.DE.4", "outcome.DE.6"],
        criteria: ["The rewritten sequencing keeps every interlock of the product's"],
        evidence: ["firmware-build-record"],
      },
      {
        title: "Variant security plan approval",
        status: "in_review",
        due: 3,
        description: "The variant's SSP is published and with the customer for approval.",
        outcomes: ["outcome.CM.2"],
        criteria: ["The variant's SSP is published", "The delta assessment is planned"],
        evidence: [],
      },
      {
        title: "Telemetry encryptor integration review",
        status: "blocked",
        due: 12,
        description:
          "Blocked: the customer has not released the encryptor's final interface document.",
        outcomes: ["outcome.IN.1", "outcome.IN.5"],
        criteria: ["The encryptor's final interface control document is received"],
        evidence: ["encryptor-icd"],
      },
      {
        title: "Flight test readiness review",
        status: "at_risk",
        due: 45,
        description: "At risk: the interlock fault and the range safety receiver are open.",
        outcomes: ["outcome.VE.3", "outcome.VE.6", "outcome.RM.4"],
        criteria: [
          "The brownout test passes on the release firmware",
          "Range safety command authentication is tested",
        ],
        evidence: ["brownout-test"],
      },
      {
        title: "Customer acceptance",
        status: "not_started",
        due: 130,
        description: "Customer B accepts the palletized variant.",
        outcomes: ["outcome.VA.4", "outcome.TR.7"],
        criteria: [],
        evidence: [],
      },
    ],
    ssp: {
      publish: -3,
      owners: {
        default: "Joel Barrantes",
        CM: "Amara Bell",
        SA: "Hana Lindqvist",
        SR: "Amara Bell",
        SI: "Hana Lindqvist",
        MA: "Wes Duarte",
        PE: "Wes Duarte",
      },
    },
    assessment: {
      title: "Customer B · X800 Palletized Integration delta assessment",
      owner: "Ray Colston",
      status: "active",
      starts: -3,
      ends: 55,
      subject: "Customer B's variant of the X800 Missile, Palletized Launch",
      planPublished: -2,
      activities: [
        [
          "Examine the rewritten pallet firmware's records",
          "examine",
          "Build, review and configuration records of each release candidate.",
          [
            [
              "Read the build record of each release candidate.",
              "Each candidate is built from reviewed source.",
            ],
            [
              "Read the configuration control board's minutes.",
              "Each change is approved by the customer's board.",
            ],
          ],
        ],
        [
          "Test pallet sequencing under power disturbance",
          "test",
          "Sequencing with the supply dipped at each step.",
          [
            [
              "Dip the supply at each sequencing step.",
              "Sequencing restarts from the interlock check.",
            ],
            [
              "Send a release command without the aircraft's authentication.",
              "The pallet refuses the command.",
            ],
          ],
        ],
      ],
      events: [
        [
          "Assessor read-in",
          "completed",
          -3,
          -3,
          "Program office",
          "The program briefed the assessor on the variant's changes.",
        ],
        [
          "Pallet controller bench testing",
          "active",
          -2,
          20,
          "Pallet integration bench",
          "Sequencing and release tests on release candidate 3 and its successor.",
        ],
        [
          "Telemetry encryptor testing",
          "planned",
          22,
          30,
          "Range instrumentation laboratory",
          "Waits on the customer's final interface document.",
        ],
      ],
      results: {
        title: "Customer B delta assessment interim results",
        description:
          "Interim results from the first days of bench testing: the pallet controller's controls and a first sample of the program's own.",
        resultSet: "Pallet controller bench testing, first week",
        starts: -2,
        ends: -1,
        published: -1,
        assessor: "Ray Colston",
        judged: 26,
        named: [
          {
            control: "SI-7",
            determination: "other_than_satisfied",
            narrative:
              "After a supply dip the rewritten firmware resumes at the release step without repeating its integrity and interlock checks.",
            risk: "unauthorized-release",
            observation: "interlock-skipped",
            evidence: "brownout-test",
          },
          {
            control: "CM-4",
            determination: "other_than_satisfied",
            narrative:
              "The rewritten firmware's changes were analyzed and approved by the contractor's board alone. The customer's configuration control board has no baseline to analyze a change against.",
            risk: "unreviewed-firmware",
            observation: "contractor-board-only",
            evidence: "ccb-minutes",
          },
          {
            control: "SC-28",
            determination: "other_than_satisfied",
            narrative:
              "The customer's telemetry encryptor accepts a rekey over its test port without authentication, so telemetry recorded in the changed unit is readable by whoever holds that port.",
            risk: "telemetry-rekey",
            observation: "rekey-unauthenticated",
            evidence: "encryptor-icd",
          },
          {
            control: "CM-9",
            determination: "partially_satisfied",
            narrative:
              "Pallet firmware changes are approved by the contractor's board alone, outside the configuration management plan the customer approved.",
            risk: "unreviewed-firmware",
            observation: "contractor-board-only",
            evidence: "ccb-minutes",
          },
          {
            control: "SI-2",
            determination: "partially_satisfied",
            narrative:
              "The brownout interlock fault is found and its fix is under way; the corrected firmware is not yet retested.",
            observation: "interlock-skipped",
            evidence: "brownout-test",
          },
        ],
        areas: [
          {
            element: "LC-PFW",
            families: ["SI", "CM"],
            determination: "partially_satisfied",
            narrative:
              "Met by the product's sequencing logic. The pallet firmware as rewritten skips its release interlock after a brownout and changes outside the customer's configuration control, so the control is not shown met for it.",
            risk: "unauthorized-release",
            observation: "interlock-skipped",
            evidence: "brownout-test",
          },
          {
            element: "PS-TLM",
            families: ["SC"],
            determination: "partially_satisfied",
            narrative:
              "Met for the telemetry the product delivers. The customer's encryptor in the changed telemetry unit accepts an unauthenticated rekey over its test port, so the protection is not shown for it.",
            risk: "telemetry-rekey",
            observation: "rekey-unauthenticated",
            evidence: "encryptor-icd",
          },
          {
            families: ["PE"],
            determination: "partially_satisfied",
            narrative:
              "The pallet power distribution unit has no fault isolation analysis, so the program's power procedure is not shown to keep a pallet fault off the aircraft's bus.",
            risk: "power-fault",
            observation: "pdu-no-analysis",
          },
          {
            families: ["IA"],
            determination: "partially_satisfied",
            narrative:
              "The range safety receiver's command authentication is undocumented, so the program's identification procedure is not shown to cover the commands the receiver acts on.",
            risk: "spoofed-range-safety",
            observation: "receiver-undocumented",
          },
          {
            families: ["MA"],
            determination: "partially_satisfied",
            narrative:
              "The field test set's calibration certificate expires before first flight test, so the program's maintenance tools are not shown approved for the whole campaign.",
            risk: "lapsed-calibration",
            evidence: "test-set-certificate",
          },
        ],
      },
    },
    witness: {
      title: "Customer B flight test readiness witnessing",
      description:
        "The tests the assessor witnesses on the way to the flight test readiness review.",
      owner: "Ray Colston",
      status: "planned",
      starts: -2,
      ends: 50,
      plan: "Flight test readiness witnessing plan",
      schedule: [
        [
          "Witness the repeated aircraft link test",
          "completed",
          -37,
          -36,
          "Ray Colston",
          "Passed with a current test key.",
        ],
        ["Witness the brownout test on release candidate 4", "ready", 6, 8, "Ray Colston", null],
        ["Witness the sequencing integrity check", "planned", 10, 11, "Ray Colston", null],
        [
          "Witness telemetry encryption with the customer's encryptor",
          "blocked",
          22,
          24,
          "Ray Colston",
          "Blocked: the encryptor's final interface document is not released.",
        ],
        ["Witness range safety command authentication", "planned", 28, 30, "Ray Colston", null],
        [
          "Witness maintenance on the aircraft with approved tools",
          "planned",
          38,
          40,
          "Ray Colston",
          null,
        ],
      ],
    },
    configurationBaselines: [
      {
        name: "Pallet set 101 as built",
        description: "The first pallet set as built, with sequencing firmware release candidate 3.",
        published: -13,
        versions: { "LC-PFW": "2.0-rc3", "PS-TLM": "1.0-CB1" },
        note: "As built for pallet set 101.",
      },
    ],
    scans: [
      [
        "Pallet controller firmware static analysis, release candidate 3",
        "completed",
        -13,
        -13,
        "sarif",
        "2 high findings in the brownout handler and 14 low.",
      ],
      [
        "Field test set vulnerability scan",
        "completed",
        -25,
        -25,
        "nessus",
        "No critical finding. 3 high findings scheduled with the monthly patches.",
      ],
      [
        "Pallet controller firmware static analysis, release candidate 4",
        "validating",
        -1,
        null,
        "sarif",
        "The results file is being checked.",
      ],
    ],
    package: {
      title: "Customer B security acceptance package",
      owner: "Tom Okafor",
      description:
        "Draft of what Customer B is given at acceptance. So far it holds the variant's SSP and the delta assessment plan.",
      documents: ["ssp", "plan"],
    },
    capabilities: [
      [
        "X800C-RELEASE",
        "Authenticated pallet release",
        "The pallet authenticates each release command from the aircraft, and Customer B's aircraft mission system inherits command authentication at the pallet.",
      ],
    ],
    activity: [
      [-66, "Tom Okafor", "created", "opened the program for Customer B's palletized integration"],
      [
        -55,
        "Tom Okafor",
        "completed",
        "closed the requirements baseline review with CUSB-SRS Issue 2 allocated",
      ],
      [-36, "Wes Duarte", "completed", "repeated the aircraft link test with a current key"],
      [-28, "Hana Lindqvist", "completed", "closed the pallet firmware design review"],
      [
        -10,
        "Wes Duarte",
        "created",
        "opened a critical issue: the rewritten firmware skips the release interlock after a brownout",
      ],
      [
        -8,
        "Ray Colston",
        "reviewed",
        "found the firmware's changes approved by the contractor's board alone",
      ],
      [-3, "Joel Barrantes", "published", "published the variant's SSP"],
      [
        -2,
        "Ray Colston",
        "published",
        "published the delta assessment plan against X800 version 2",
      ],
      [
        -2,
        "Tom Okafor",
        "published",
        "published POA&M version 1 with four remediation commitments",
      ],
      [-1, "Ray Colston", "published", "published the delta assessment's interim results"],
    ],
    comments: [
      [
        "issue",
        "interlock",
        "Hana Lindqvist",
        "Cause found: the sequencer's state is restored from memory after the dip and the interlock result is restored with it. Release candidate 4 clears the result on any supply dip.",
      ],
      [
        "issue",
        "firmware-ccb",
        "Amara Bell",
        "The baseline submission is with the customer's board. Their next meeting is after our planned date, so this will run late.",
      ],
      [
        "risk",
        "spoofed-range-safety",
        "Tom Okafor",
        "The vendor has acknowledged the data request and promised an answer by the end of the month.",
      ],
      [
        "task",
        4,
        "Joel Barrantes",
        "The customer says the final document is in signature. No date.",
      ],
    ],
  },

  "PRG-2201": {
    sponsor: "Marcus Ryde",
    endsOn: "2027-06-30",
    systemOwner: "Wes Duarte",
    lifecycle: "development",
    roles: [
      ["program_manager", "Wes Duarte"],
      ["security_officer", "Joel Barrantes"],
      ["assessor", "Elena Vasquez"],
    ],
    scopes: [
      ["STN", "Launch control station", "The station as mounted in Customer C's command vehicle."],
    ],
    workstreams: [
      [
        "Vehicle installation",
        "Mounting and powering the station in Customer C's command vehicle.",
        "Wes Duarte",
        "active",
        -80,
        60,
      ],
      [
        "Customer configuration and backhaul",
        "The customer's battery layout, its engagement rules and its satellite backhaul.",
        "Joel Barrantes",
        "active",
        -60,
        90,
      ],
    ],
    tasks: [
      [
        "Test the customer's signed configuration against the launch control software",
        "in_progress",
        2,
        "Joel Barrantes",
        5,
        "high",
        "Verifies CUSC-SSS 5.1.2.",
      ],
      [
        "Test the satellite backhaul terminal's encryption",
        "open",
        2,
        "Joel Barrantes",
        -2,
        "high",
        "CUSC-SSS 5.2.2 is not met until the terminal is tested.",
      ],
      [
        "Demonstrate an orderly shutdown on loss of vehicle power",
        "waiting",
        1,
        "Wes Duarte",
        14,
        "normal",
        "Waiting on the customer's vehicle.",
      ],
      [
        "Answer the audit record retention requirement",
        "open",
        2,
        "Wes Duarte",
        2,
        "normal",
        "CUSC-SSS 5.3.2 has no compliance statement.",
      ],
      [
        "Fit the vehicle power interface in the first command vehicle",
        "done",
        1,
        "Wes Duarte",
        -24,
        "normal",
        null,
        -26,
      ],
      [
        "Obtain the backhaul terminal's export license",
        "blocked",
        2,
        "Wes Duarte",
        -9,
        "high",
        "Blocked: the license application is with the authority.",
      ],
      [
        "Write a fixed-site installation note",
        "cancelled",
        1,
        "Wes Duarte",
        -30,
        "low",
        "Cancelled: Customer C takes the vehicle-mounted configuration only.",
      ],
      [
        "Review the delta assessment's first results",
        "open",
        2,
        account,
        6,
        "normal",
        "The launch control software's controls were judged first.",
      ],
    ],
    taskLinks: [
      [1, "requirement", "5.1.2"],
      [2, "issue", "backhaul-untested"],
      [2, "requirement", "5.2.2"],
      [4, "requirement", "5.3.2"],
      [5, "evidence", "power-fit-record"],
    ],
    evidence: [
      {
        key: "operator-authentication-test",
        title: "Console operator authentication test report",
        kind: "test_record",
        owner: "Joel Barrantes",
        collected: -58,
        description: "Commands attempted with and without an authenticated operator.",
        claim: "Shows the console refuse a command from an operator who has not authenticated.",
        requirements: ["5.1.1"],
        review: ["accepted", "Elena Vasquez", "As the product was assessed.", -54],
      },
      {
        key: "configuration-signature-check",
        title: "Engagement rule configuration signature check record",
        kind: "test_record",
        owner: "Joel Barrantes",
        collected: -12,
        description: "The customer's configuration loaded with a valid and an altered signature.",
        claim: "Shows the software refuse an altered configuration.",
        requirements: ["5.1.2"],
        review: ["pending", "Elena Vasquez"],
      },
      {
        key: "launcher-link-test",
        title: "Launcher link encryption test record",
        kind: "test_record",
        owner: "Joel Barrantes",
        collected: -50,
        description: "Encryption on the links from the station to two launchers.",
        claim: "Shows the launcher links encrypted.",
        requirements: ["5.2.1"],
        review: ["accepted", "Elena Vasquez", "Both links were tested.", -47],
      },
      {
        key: "audit-extract",
        title: "Operator action audit extract",
        kind: "log",
        owner: "Joel Barrantes",
        collected: -40,
        description: "A day of operator actions from the audit log collector.",
        claim: "Shows each operator action recorded with its time.",
        requirements: ["5.3.1"],
        review: ["accepted", "Elena Vasquez", "Times agree with the time server.", -37],
      },
      {
        key: "power-fit-record",
        title: "Vehicle power interface installation record",
        kind: "document",
        owner: "Wes Duarte",
        collected: -26,
        description: "Installation of the power interface in the first command vehicle.",
        claim: "Shows the power interface fitted as the product's installation drawing requires.",
        requirements: ["5.4.1"],
        review: [
          "needs_revision",
          "Elena Vasquez",
          "The record does not show the hold-up time measured.",
          -22,
        ],
      },
      {
        key: "configuration-records",
        title: "Station configuration record, vehicles 1 and 2",
        kind: "dataset",
        owner: "Wes Duarte",
        collected: -18,
        description: "Configuration of the first two stations as installed.",
        claim: "Shows the configuration of each delivered station recorded.",
        requirements: ["5.5.1"],
        review: ["accepted", "Elena Vasquez", "Complete for both vehicles.", -15],
        expires: 180,
      },
    ],
    observations: [
      [
        "backhaul-not-tested",
        "The satellite backhaul terminal has not been tested",
        "No test shows what the terminal carries or how it is encrypted.",
        "interview",
        -20,
        "Elena Vasquez",
        [],
      ],
      [
        "hold-up-unmeasured",
        "The power interface's hold-up time is not measured in the vehicle",
        "The installation record shows the interface fitted and no measurement of how long it holds the station up.",
        "examine",
        -22,
        "Elena Vasquez",
        ["power-fit-record"],
      ],
      [
        "retention-ninety-days",
        "The audit log collector keeps ninety days of records",
        "The collector's storage is sized for ninety days, and the customer asks for a year.",
        "examine",
        -37,
        "Elena Vasquez",
        ["audit-extract"],
      ],
    ],
    issues: [
      {
        key: "backhaul-untested",
        title: "The satellite backhaul terminal is untested",
        description:
          "CUSC-SSS 5.2.2 is not met: nothing shows the backhaul carries only encrypted traffic.",
        severity: "high",
        status: "open",
        owner: "Joel Barrantes",
        opened: -20,
        observations: ["backhaul-not-tested"],
        evidence: [],
      },
      {
        key: "retention",
        title: "Audit records are kept for ninety days, not a year",
        description: "The collector's storage does not meet the customer's retention period.",
        severity: "moderate",
        status: "in_progress",
        owner: "Wes Duarte",
        opened: -37,
        observations: ["retention-ninety-days"],
        evidence: ["audit-extract"],
      },
      {
        key: "hold-up",
        title: "The power interface's hold-up time is not measured",
        description: "An orderly shutdown on loss of vehicle power is not yet shown.",
        severity: "moderate",
        status: "triaged",
        owner: "Wes Duarte",
        opened: -22,
        observations: ["hold-up-unmeasured"],
        evidence: ["power-fit-record"],
      },
      {
        key: "console-label",
        title: "The console's classification label is missing in vehicle 2",
        description: "Vehicle 2's console was installed without its label.",
        severity: "low",
        status: "resolved",
        owner: "Wes Duarte",
        opened: -17,
        closed: -15,
        closure: "The label was fitted and the configuration record updated.",
        observations: [],
        evidence: ["configuration-records"],
      },
    ],
    risks: [
      {
        key: "backhaul-cleartext",
        title: "Station traffic crosses the satellite backhaul in the clear",
        status: "open",
        owner: "Joel Barrantes",
        description: "Battery status or commands are read from the backhaul.",
        threat: "A party able to intercept the satellite link.",
        vulnerability: "The customer's terminal is untested, and its encryption is unknown.",
        likelihood: "moderate",
        impact: "high",
        severity: "high",
        rationale:
          "Satellite links are readily intercepted. What the terminal protects is unknown.",
        assessed: -19,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Test the terminal and route the backhaul through the link encryptor if it fails.",
          "Joel Barrantes",
          25,
        ],
        observations: ["backhaul-not-tested"],
        techniques: ["T1040", "T1048"],
      },
      {
        key: "audit-gap",
        title: "An operator action cannot be reconstructed after ninety days",
        status: "responding",
        owner: "Wes Duarte",
        description: "An investigation needs records the collector has already dropped.",
        threat: "An insider whose action is questioned months later.",
        vulnerability: "The collector keeps ninety days of records.",
        likelihood: "low",
        impact: "moderate",
        severity: "moderate",
        rationale: "The customer's investigations have run past ninety days before.",
        assessed: -35,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Export the collector's records to the customer's archive each month.",
          "Wes Duarte",
          20,
        ],
        observations: ["retention-ninety-days"],
        techniques: ["T1070"],
      },
      {
        key: "unclean-shutdown",
        title: "Loss of vehicle power leaves the station in an unknown state",
        status: "investigating",
        owner: "Wes Duarte",
        description:
          "A station that loses power mid-command restarts with launchers in an unknown state.",
        threat: "A vehicle power failure in the field.",
        vulnerability: "The interface's hold-up time is not measured in the vehicle.",
        likelihood: "low",
        impact: "high",
        severity: "moderate",
        rationale:
          "The product's interface is designed for it. The vehicle's supply is not characterized.",
        assessed: -21,
        assessor: "Wes Duarte",
        response: [
          "mitigate",
          "Measure the hold-up time in the vehicle and demonstrate the shutdown.",
          "Wes Duarte",
          14,
        ],
        observations: ["hold-up-unmeasured"],
        techniques: ["T1529"],
      },
    ],
    poam: {
      title: "Customer C · G25 Battery Control Fielding POA&M",
      description: "What the program has committed to fix before the first vehicle is fielded.",
      published: -4,
      items: [
        {
          key: "test-backhaul",
          title: "Test the satellite backhaul terminal's encryption",
          status: "open",
          owner: "Joel Barrantes",
          description: "The backhaul terminal is untested.",
          plan: "Test the terminal on the bench, and route the backhaul through the link encryptor if it does not encrypt.",
          resources: "One terminal on loan from the customer. The export license.",
          planned: 25,
          milestones: [
            ["Export license received", 10, null, "planned"],
            ["Terminal tested on the bench", 25, null, "planned"],
          ],
          issues: ["backhaul-untested"],
          risks: ["backhaul-cleartext"],
        },
        {
          key: "monthly-export",
          title: "Export audit records to the customer's archive each month",
          status: "in_progress",
          owner: "Wes Duarte",
          description:
            "The collector keeps ninety days of records, and the customer asks for a year.",
          plan: "Add a signed monthly export to the customer's archive and test a restore.",
          resources: "Software engineer, one week.",
          planned: 20,
          milestones: [
            ["Export format agreed with the customer", -12, -11, "completed"],
            ["Monthly export built and tested", 20, null, "in_progress"],
          ],
          issues: ["retention"],
          risks: ["audit-gap"],
        },
        {
          key: "measure-hold-up",
          title: "Measure the power interface's hold-up time in the vehicle",
          status: "open",
          owner: "Wes Duarte",
          description: "The hold-up time is not measured in the customer's vehicle.",
          plan: "Measure the hold-up time under the vehicle's worst supply and demonstrate the shutdown.",
          resources: "The customer's vehicle, two days.",
          planned: 14,
          published: false,
          milestones: [["Hold-up time measured", 14, null, "planned"]],
          issues: ["hold-up"],
          risks: [],
        },
      ],
    },
    gates: [
      {
        title: "Requirements baseline review",
        status: "completed",
        due: -62,
        description: "CUSC-SSS Draft 3 agreed and allocated to the variant.",
        outcomes: ["outcome.SN.7", "outcome.SR.2"],
        criteria: ["CUSC-SSS Draft 3 is allocated to the variant's elements"],
        evidence: ["operator-authentication-test"],
      },
      {
        title: "Vehicle installation review",
        status: "completed",
        due: -24,
        description: "The station is installed and powered in the first command vehicle.",
        outcomes: ["outcome.IN.4"],
        criteria: ["The station is installed to the product's installation drawing"],
        evidence: ["power-fit-record"],
      },
      {
        title: "Customer configuration review",
        status: "in_review",
        due: 6,
        description: "The customer's battery layout and engagement rules under test.",
        outcomes: ["outcome.VE.3"],
        criteria: ["The software refuses an altered configuration"],
        evidence: ["configuration-signature-check"],
      },
      {
        title: "Backhaul integration review",
        status: "at_risk",
        due: 30,
        description: "At risk: the terminal's export license is not granted.",
        outcomes: ["outcome.IN.5"],
        criteria: ["The backhaul carries only encrypted traffic"],
        evidence: [],
      },
      {
        title: "First vehicle fielding",
        status: "not_started",
        due: 85,
        description: "The first command vehicle is handed to Customer C's battery.",
        outcomes: ["outcome.TR.4", "outcome.TR.5"],
        criteria: [],
        evidence: [],
      },
    ],
    ssp: {
      publish: -14,
      owners: { default: "Joel Barrantes", PE: "Wes Duarte", CP: "Wes Duarte", MA: "Wes Duarte" },
    },
    assessment: {
      title: "Customer C · G25 Battery Control Fielding delta assessment",
      owner: "Elena Vasquez",
      status: "active",
      starts: -13,
      ends: 40,
      subject: "Customer C's variant of the G25 Launch Control Station, Vehicle-Mounted",
      planPublished: -12,
      activities: [
        [
          "Test the launch control software with the customer's configuration",
          "test",
          "The product's tests repeated with the customer's battery layout and engagement rules.",
          [
            ["Load the customer's signed configuration.", "The software accepts it."],
            ["Load the configuration with one rule altered.", "The software refuses it."],
          ],
        ],
      ],
      events: [
        [
          "Assessor read-in",
          "completed",
          -13,
          -13,
          "Program office",
          "The program briefed the assessor on the variant's changes.",
        ],
        [
          "Launch control software testing",
          "active",
          -11,
          6,
          "Software integration laboratory",
          "The product's tests with the customer's configuration.",
        ],
      ],
      results: {
        title: "Customer C delta assessment first results",
        description:
          "The launch control software's controls, judged first because the customer's configuration changes them.",
        resultSet: "Launch control software testing",
        starts: -11,
        ends: -5,
        published: -4,
        assessor: "Elena Vasquez",
        judged: 40,
        named: [
          {
            control: "SC-7(4)",
            determination: "other_than_satisfied",
            narrative:
              "The satellite backhaul terminal, the program's own link to its headquarters, has not been tested, so nothing shows its traffic leaves the station encrypted.",
            risk: "backhaul-cleartext",
            observation: "backhaul-not-tested",
          },
          {
            control: "AU-11",
            determination: "partially_satisfied",
            narrative:
              "The audit log collector keeps records for ninety days, not the year the customer requires.",
            risk: "audit-gap",
            observation: "retention-ninety-days",
            evidence: "audit-extract",
          },
          {
            control: "CP-10",
            determination: "partially_satisfied",
            narrative:
              "The vehicle power interface's hold-up time is not measured, so recovery to a known state after a loss of vehicle power is not shown.",
            risk: "unclean-shutdown",
            observation: "hold-up-unmeasured",
            evidence: "power-fit-record",
          },
          {
            control: "SI-7",
            determination: "partially_satisfied",
            narrative:
              "The launch control software accepts engagement rules only from a signed configuration; the station's own check of that signature on the second build is still being tested.",
            evidence: "configuration-signature-check",
          },
        ],
        areas: [
          {
            element: "OC-SW",
            families: ["SI", "CM", "SA"],
            determination: "partially_satisfied",
            narrative:
              "Met for the software as the product delivers it. The launch control software, configured with Customer C's battery layout and engagement rules, is not yet shown to keep the control for the configuration it now loads.",
            evidence: "configuration-signature-check",
          },
          {
            families: ["SC"],
            determination: "partially_satisfied",
            narrative:
              "Station traffic can leave through the program's own satellite backhaul, which is untested, so the program's boundary procedure is not shown for it.",
            risk: "backhaul-cleartext",
            observation: "backhaul-not-tested",
          },
          {
            families: ["AU"],
            determination: "partially_satisfied",
            narrative:
              "Audit records are kept for ninety days, not a year, so the program's audit procedure is not shown kept as the customer requires.",
            risk: "audit-gap",
            observation: "retention-ninety-days",
            evidence: "audit-extract",
          },
          {
            families: ["CP", "PE"],
            determination: "partially_satisfied",
            narrative:
              "The power interface's hold-up time is not measured, so the program's contingency procedure is not shown to bring the station down in a known state.",
            risk: "unclean-shutdown",
            observation: "hold-up-unmeasured",
            evidence: "power-fit-record",
          },
        ],
      },
    },
    witness: {
      title: "Customer C fielding witnessing",
      description: "The tests the assessor witnesses before the first vehicle is fielded.",
      owner: "Elena Vasquez",
      status: "planned",
      starts: -4,
      ends: 80,
      plan: "Fielding witnessing plan",
      schedule: [
        ["Witness the configuration signature check", "in_progress", -1, 5, "Elena Vasquez", null],
        ["Witness the shutdown on loss of vehicle power", "planned", 13, 14, "Elena Vasquez", null],
        ["Witness the backhaul terminal test", "planned", 24, 25, "Elena Vasquez", null],
      ],
    },
    configurationBaselines: [
      {
        name: "Vehicle 1 as installed",
        description: "The station as installed in the first command vehicle.",
        published: -23,
        versions: { "OC-SW": "1.0-CC1" },
        note: "As installed in vehicle 1.",
      },
    ],
    scans: [
      [
        "Console workstation vulnerability scan",
        "completed",
        -16,
        -16,
        "nessus",
        "No critical finding. 2 high findings patched the same week.",
      ],
      [
        "Launch control software static analysis, customer configuration",
        "ready",
        -3,
        -3,
        "sarif",
        "Validated and waiting for import.",
      ],
    ],
    package: {
      title: "Customer C fielding security package",
      owner: "Wes Duarte",
      description: "Draft of what Customer C is given when the first vehicle is fielded.",
      documents: ["ssp", "plan", "results"],
    },
    capabilities: [
      [
        "G25C-TIME",
        "Battery time service",
        "The station's time server gives the battery one authenticated time, and each launcher's records inherit their time stamps from it.",
      ],
    ],
    activity: [
      [-88, "Wes Duarte", "created", "opened the program for Customer C's command vehicles"],
      [
        -62,
        "Wes Duarte",
        "completed",
        "closed the requirements baseline review with CUSC-SSS Draft 3 allocated",
      ],
      [
        -26,
        "Wes Duarte",
        "completed",
        "fitted the vehicle power interface in the first command vehicle",
      ],
      [-20, "Elena Vasquez", "reviewed", "found the satellite backhaul terminal untested"],
      [-14, "Joel Barrantes", "published", "published the variant's SSP"],
      [-12, "Elena Vasquez", "published", "published the delta assessment plan"],
      [-4, "Elena Vasquez", "published", "published the delta assessment's first results"],
    ],
    comments: [
      [
        "issue",
        "backhaul-untested",
        "Joel Barrantes",
        "The customer will lend a terminal once the export license is granted. Nothing can be tested before then.",
      ],
      [
        "task",
        6,
        "Wes Duarte",
        "The authority has asked for the end-use statement again. Sent the same day.",
      ],
    ],
  },
};

const taskStatuses = ["open", "in_progress", "waiting", "blocked", "done", "cancelled"];
const priorities = ["low", "normal", "high", "urgent"];
const workstreamStatuses = ["planned", "active", "blocked", "completed", "cancelled"];
const gateStatuses = [
  "not_started",
  "in_review",
  "completed",
  "at_risk",
  "blocked",
  "passed",
  "failed",
  "waived",
];
const decidedGates = ["completed", "passed", "failed", "waived"];
const programRoles = [
  "program_manager",
  "system_owner",
  "security_officer",
  "control_owner",
  "assessor",
  "reviewer",
  "authorizing_official",
];
const evidenceKinds = [
  "document",
  "image",
  "dataset",
  "log",
  "scan",
  "interview",
  "test_record",
  "other",
];
const reviewDecisions = ["pending", "accepted", "needs_revision", "rejected"];
const methods = ["examine", "interview", "test", "inspection", "analysis", "demonstration"];
const activityMethods = ["examine", "interview", "test"];
const severities = ["low", "moderate", "high", "critical"];
const issueStatuses = ["open", "triaged", "in_progress", "resolved", "closed"];
const riskStatuses = ["open", "investigating", "responding", "accepted", "closed"];
const levels = ["very_low", "low", "moderate", "high", "very_high"];
const responses = ["mitigate", "accept", "transfer", "avoid"];
const itemStatuses = [
  "open",
  "in_progress",
  "deferred",
  "overdue",
  "completed",
  "risk_accepted",
  "cancelled",
];
const milestoneStatuses = ["planned", "in_progress", "completed", "cancelled"];
const determinations = ["satisfied", "partially_satisfied", "other_than_satisfied"];
const campaignStatuses = ["planned", "active", "completed", "cancelled"];
const scheduleStatuses = ["planned", "ready", "in_progress", "blocked", "completed", "cancelled"];
const scanStatuses = [
  "queued",
  "validating",
  "ready",
  "importing",
  "completed",
  "failed",
  "cancelled",
];
const eventTypes = [
  "created",
  "updated",
  "published",
  "reviewed",
  "completed",
  "reopened",
  "imported",
  "linked",
  "unlinked",
];
const commentTargets = ["task", "issue", "risk", "poam"];
const linkKinds = ["issue", "risk", "poam", "requirement", "evidence"];
const packageDocuments = ["ssp", "plan", "results", "poam"];
/** What a scanner import's file is, by the tool that wrote it: [media type, extension]. */
export const scanKinds = {
  nessus: ["application/xml", "nessus"],
  sarif: ["application/sarif+json", "sarif"],
};

/** Every program the step works in, with its customer's requirements: the two the products
 * scenario wrote and the one this step adds. */
export function workPrograms() {
  return [
    ...base.programs.map((program) => ({
      ...program,
      requirements: base.customerRequirements[program.code],
      product: base.product,
    })),
    ...productWork.programs.map((program) => ({
      ...program,
      product: productWork.products.find((item) => item.code === program.product),
    })),
  ];
}

const day = (value) => Number.isInteger(value);
const spreadOk = (values, length) =>
  Array.isArray(values) &&
  values.length === length &&
  values.every((value, index) => value > (values[index - 1] ?? 0) && value <= 100);

/** What is wrong with the step as written: an empty list is a step the seed can write. */
export function workIssues() {
  const issues = [];
  const say = (message) => issues.push(message);
  const known = (name, where) => {
    if (name !== account && !cast.includes(name)) say(`${where} names ${name}, who is not cast.`);
  };
  const elementTypeFor = { software: "software", hardware: "hardware", service: "service" };

  // Products.
  const libraries = new Map(productWork.libraries.map((library) => [library.code, library]));
  if (libraries.size !== productWork.libraries.length) say("Two component sets share a code.");
  const componentKeys = new Set(base.library.components.map((component) => component.key));
  for (const library of productWork.libraries)
    for (const component of library.components) {
      if (componentKeys.has(component.key)) say(`Two components share the key ${component.key}.`);
      componentKeys.add(component.key);
      if (!elementTypeFor[component.type]) say(`Component ${component.key} has no element type.`);
      for (const [family, share] of Object.entries(component.families)) {
        if (!base.familyPhrases[family])
          say(`Component ${component.key} claims ${family}, which has no phrase.`);
        if (!(share > 0 && share <= 100))
          say(`Component ${component.key} claims ${share}% of ${family}.`);
      }
    }
  const others = new Map(base.otherProducts.map((item) => [item.code, item]));
  const pinned = (entry, product, typeOf) => {
    const library = libraries.get(entry.library);
    if (!library) return say(`${entry.product} is pinned to the unknown set ${entry.library}.`);
    for (const [code, key] of Object.entries(entry.elements)) {
      const component = library.components.find((item) => item.key === key);
      const type = typeOf(code);
      if (!type) say(`${product} has no element ${code} to pin.`);
      else if (!component) say(`${product} ${code} is pinned to the unknown component ${key}.`);
      else if (elementTypeFor[component.type] !== type)
        say(`${product} ${code} is a ${type} pinned to a ${component.type} component.`);
    }
  };
  for (const entry of [...productWork.pins, ...productWork.revisions]) {
    const product = others.get(entry.product);
    if (!product) say(`${entry.product} is not a product of the scenario.`);
    else pinned(entry, entry.product, (code) => product.elements.find((e) => e[0] === code)?.[2]);
  }
  for (const entry of productWork.pins)
    if (others.get(entry.product)?.state !== "draft")
      say(`${entry.product} is pinned in place and is not a draft.`);
  for (const entry of productWork.revisions)
    if (others.get(entry.product)?.state !== "published")
      say(`${entry.product} is given a next version and is not published.`);
  const lines = new Set(base.businessLines.map((line) => line.code));
  for (const product of productWork.products) {
    if (base.product.code === product.code || others.has(product.code))
      say(`${product.code} is already a product of the scenario.`);
    if (!lines.has(product.businessLine)) say(`${product.code} names no business line.`);
    const configurations = new Set(product.configurations.map((item) => item.code));
    const seen = new Map();
    for (const [code, , type, parent, membership, key] of product.elements) {
      if (seen.has(code)) say(`${product.code} has two elements coded ${code}.`);
      if (parent !== null && !seen.has(parent))
        say(`${product.code} ${code} comes before its parent ${parent}.`);
      if (membership !== "*" && !configurations.has(membership))
        say(`${product.code} ${code} is in the unknown configuration ${membership}.`);
      if (parent !== null && seen.get(parent) !== "*" && seen.get(parent) !== membership)
        say(`${product.code} ${code} is in a configuration its parent ${parent} is not in.`);
      seen.set(code, membership);
      if (key === null) continue;
      const component = libraries.get(product.library)?.components.find((item) => item.key === key);
      if (!component) say(`${product.code} ${code} is pinned to the unknown component ${key}.`);
      else if (elementTypeFor[component.type] !== type)
        say(`${product.code} ${code} is a ${type} pinned to a ${component.type} component.`);
    }
  }
  const assessed = new Set([
    ...productWork.revisions.map((entry) => entry.product),
    ...productWork.products.map((product) => product.code),
  ]);
  for (const assessment of productWork.assessments) {
    if (!assessed.has(assessment.product))
      say(`${assessment.product} is assessed and has no version of this step's to assess.`);
    known(assessment.assessor, `${assessment.product}'s assessment`);
    if (!spreadOk(assessment.spread, 3) || !spreadOk(assessment.weakSpread, 3))
      say(`${assessment.product}'s assessment has a spread out of order.`);
    if (!spreadOk(assessment.wholeSpread, 3) || !(assessment.wholeShare > 0))
      say(`${assessment.product}'s whole-product share is out of order.`);
  }
  known(productWork.carried.assessor, "The carried assessment");
  if (productWork.carried.newElement.code !== base.product.nextVersion.element[0])
    say("The carried assessment judges an element the next version does not add.");
  if (!spreadOk(productWork.carried.newElement.spread, 3))
    say("The carried assessment's new element has a spread out of order.");
  for (const [line, owner] of Object.entries(businessLineOwners)) {
    if (!lines.has(line)) say(`${line} is not a business line of the scenario.`);
    known(owner, `Business line ${line}`);
  }
  // A line with a product and a program of its own, once the step has run.
  const programs = workPrograms();
  for (const line of lines) {
    const products = [base.product, ...base.otherProducts, ...productWork.products];
    if (!products.some((product) => product.businessLine === line))
      say(`Business line ${line} has no product.`);
    if (!programs.some((program) => program.businessLine === line))
      say(`Business line ${line} has no program.`);
  }
  for (const program of productWork.programs) {
    const product = productWork.products.find((item) => item.code === program.product);
    if (!product) {
      say(`${program.code} takes the unknown product ${program.product}.`);
      continue;
    }
    if (base.programs.some((item) => item.code === program.code))
      say(`${program.code} is already a program of the scenario.`);
    if (!lines.has(program.businessLine)) say(`${program.code} names no business line.`);
    const variant = program.variant;
    const membership = new Map(product.elements.map((item) => [item[0], item[4]]));
    const kept = (code) =>
      ["*", variant.configuration].includes(membership.get(code)) &&
      !variant.removed.includes(code);
    if (!product.configurations.some((item) => item.code === variant.configuration))
      say(`${program.code} takes the unknown configuration ${variant.configuration}.`);
    for (const [code, , , parent] of variant.added) {
      if (membership.has(code)) say(`${program.code} adds ${code}, which the product has.`);
      if (parent !== null && !kept(parent))
        say(`${program.code} adds ${code} under ${parent}, which it does not keep.`);
    }
    for (const [code, kinds, why] of variant.changes) {
      if (!kept(code)) say(`${program.code} changes ${code}, which it does not keep.`);
      if (!kinds.length || !why.trim()) say(`${program.code} changes ${code} without saying how.`);
    }
    const references = new Set();
    for (const [reference, title, statement, elements, controls, status] of program.requirements
      .items) {
      if (references.has(reference)) say(`${program.code} has two requirements at ${reference}.`);
      references.add(reference);
      if (!title.trim() || !statement.trim())
        say(`${program.code} ${reference} has no title or statement.`);
      if (!controls.length) say(`${program.code} ${reference} maps no control.`);
      for (const code of elements)
        if (!kept(code) && !variant.added.some((added) => added[0] === code))
          say(`${program.code} ${reference} is allocated to ${code}, which the variant lacks.`);
      if (
        status === "compliant" &&
        elements.some((code) => variant.changes.some((c) => c[0] === code))
      )
        say(`${program.code} ${reference} is compliant on a changed element.`);
    }
  }

  // The work of each program.
  for (const program of programs) {
    const entry = work[program.code];
    const at = (what) => `${program.code} ${what}`;
    if (!entry) {
      say(`${program.code} has no work.`);
      continue;
    }
    known(entry.sponsor, at("sponsor"));
    known(entry.systemOwner, at("system owner"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.endsOn) || entry.endsOn <= program.startsOn)
      say(at("ends before it starts."));
    for (const [role, person] of entry.roles) {
      if (!programRoles.includes(role)) say(at(`has the unknown role ${role}.`));
      known(person, at(`role ${role}`));
    }
    if (!entry.scopes.length) say(at("has no scope."));
    for (const [title, , owner, status, starts, ends] of entry.workstreams) {
      known(owner, at(`workstream "${title}"`));
      if (!workstreamStatuses.includes(status)) say(at(`workstream "${title}" has no status.`));
      if (!day(starts) || !day(ends) || ends < starts)
        say(at(`workstream "${title}" ends before it starts.`));
    }
    for (const [title, status, workstream, assignee, due, priority, , done] of entry.tasks) {
      known(assignee, at(`task "${title}"`));
      if (!taskStatuses.includes(status)) say(at(`task "${title}" has the status ${status}.`));
      if (!priorities.includes(priority)) say(at(`task "${title}" has no priority.`));
      if (!entry.workstreams[workstream - 1]) say(at(`task "${title}" has no workstream.`));
      if (!day(due)) say(at(`task "${title}" has no due day.`));
      if ((status === "done") !== day(done) || (day(done) && done > 0))
        say(at(`task "${title}" is done on no past day, or is not done and has one.`));
    }
    const evidence = new Map();
    const references = new Set(program.requirements.items.map((item) => item[0]));
    for (const item of entry.evidence) {
      if (evidence.has(item.key)) say(at(`has two evidence artifacts keyed ${item.key}.`));
      evidence.set(item.key, item);
      known(item.owner, at(`evidence ${item.key}`));
      if (!evidenceKinds.includes(item.kind)) say(at(`evidence ${item.key} has no kind.`));
      if (!day(item.collected) || item.collected > 0)
        say(at(`evidence ${item.key} is collected on no past day.`));
      if (item.draft) {
        if (item.requirements?.length || item.review || item.first)
          say(at(`evidence ${item.key} is a draft and is cited, reviewed or revised.`));
        continue;
      }
      if (!item.claim?.trim()) say(at(`evidence ${item.key} claims nothing.`));
      for (const reference of item.requirements)
        if (!references.has(reference))
          say(at(`evidence ${item.key} is cited by the unknown requirement ${reference}.`));
      for (const review of [item.review, item.first?.review]) {
        if (!review) continue;
        const [decision, reviewer, rationale, reviewed] = review;
        if (!reviewDecisions.includes(decision)) say(at(`evidence ${item.key} has no decision.`));
        known(reviewer, at(`evidence ${item.key}'s review`));
        if (decision !== "pending" && (!rationale?.trim() || !day(reviewed)))
          say(at(`evidence ${item.key} is decided without a reason or a day.`));
      }
      if (item.first && item.first.collected >= item.collected)
        say(at(`evidence ${item.key}'s first version is not the earlier one.`));
      if (item.expires !== undefined && !(day(item.expires) && item.expires > item.collected))
        say(at(`evidence ${item.key} expires before it is collected.`));
    }
    const published = (key) => evidence.has(key) && !evidence.get(key).draft;
    const observations = new Map();
    for (const [key, title, description, method, observed, observer, cited] of entry.observations) {
      if (observations.has(key)) say(at(`has two observations keyed ${key}.`));
      observations.set(key, title);
      if (!title.trim() || !description.trim()) say(at(`observation ${key} says nothing.`));
      if (!methods.includes(method)) say(at(`observation ${key} has the method ${method}.`));
      if (!day(observed) || observed > 0) say(at(`observation ${key} is on no past day.`));
      known(observer, at(`observation ${key}`));
      for (const cite of cited)
        if (!published(cite)) say(at(`observation ${key} cites the unpublished ${cite}.`));
    }
    const issueKeys = new Set();
    for (const item of entry.issues) {
      if (issueKeys.has(item.key)) say(at(`has two issues keyed ${item.key}.`));
      issueKeys.add(item.key);
      known(item.owner, at(`issue ${item.key}`));
      if (!severities.includes(item.severity)) say(at(`issue ${item.key} has no severity.`));
      if (!issueStatuses.includes(item.status)) say(at(`issue ${item.key} has no status.`));
      const shut = ["resolved", "closed"].includes(item.status);
      if (
        shut !== day(item.closed) ||
        (shut && (!item.closure?.trim() || item.closed < item.opened))
      )
        say(at(`issue ${item.key} is closed without a day and a reason, or open with one.`));
      for (const key of item.observations)
        if (!observations.has(key)) say(at(`issue ${item.key} names the observation ${key}.`));
      for (const key of item.evidence)
        if (!published(key)) say(at(`issue ${item.key} cites the unpublished ${key}.`));
    }
    const riskKeys = new Set();
    for (const item of entry.risks) {
      if (riskKeys.has(item.key)) say(at(`has two risks keyed ${item.key}.`));
      riskKeys.add(item.key);
      known(item.owner, at(`risk ${item.key}`));
      known(item.assessor, at(`risk ${item.key}'s assessment`));
      if (!riskStatuses.includes(item.status)) say(at(`risk ${item.key} has no status.`));
      if (!levels.includes(item.likelihood) || !levels.includes(item.impact))
        say(at(`risk ${item.key} has no likelihood or impact.`));
      if (!severities.includes(item.severity)) say(at(`risk ${item.key} has no severity.`));
      if (!day(item.assessed) || item.assessed > 0) say(at(`risk ${item.key} is assessed later.`));
      const [type, , owner, , approver] = item.response;
      if (!responses.includes(type)) say(at(`risk ${item.key} has the response ${type}.`));
      known(owner, at(`risk ${item.key}'s response`));
      if (approver) known(approver, at(`risk ${item.key}'s approval`));
      for (const key of item.observations)
        if (!observations.has(key)) say(at(`risk ${item.key} names the observation ${key}.`));
      for (const technique of item.techniques)
        if (!/^T\d{4}$/.test(technique)) say(at(`risk ${item.key} names ${technique}.`));
    }
    const itemKeys = new Set();
    for (const item of entry.poam.items) {
      if (itemKeys.has(item.key)) say(at(`has two remediation items keyed ${item.key}.`));
      itemKeys.add(item.key);
      known(item.owner, at(`remediation item ${item.key}`));
      if (!itemStatuses.includes(item.status))
        say(at(`remediation item ${item.key} has no status.`));
      if ((item.status === "completed") !== day(item.completed))
        say(at(`remediation item ${item.key} is completed without a day, or open with one.`));
      if (!item.milestones.length) say(at(`remediation item ${item.key} has no milestone.`));
      for (const [title, planned, reached, status] of item.milestones) {
        if (!milestoneStatuses.includes(status) || !day(planned))
          say(at(`milestone "${title}" has no status or planned day.`));
        if ((status === "completed") !== day(reached))
          say(at(`milestone "${title}" is reached without a day, or not reached with one.`));
      }
      for (const key of item.issues)
        if (!issueKeys.has(key)) say(at(`remediation item ${item.key} answers the issue ${key}.`));
      for (const key of item.risks)
        if (!riskKeys.has(key)) say(at(`remediation item ${item.key} names the risk ${key}.`));
    }
    if (!entry.poam.items.some((item) => item.published !== false))
      say(at("publishes a POA&M with no commitment in it."));
    for (const gate of entry.gates) {
      if (!gateStatuses.includes(gate.status)) say(at(`gate "${gate.title}" has no status.`));
      if (!day(gate.due)) say(at(`gate "${gate.title}" has no day.`));
      if (decidedGates.includes(gate.status) && gate.due > 0)
        say(at(`gate "${gate.title}" is decided on a day to come.`));
      for (const outcome of gate.outcomes)
        if (!/^outcome\.[A-Z]{2}\.\d+$/.test(outcome))
          say(at(`gate "${gate.title}" names the outcome ${outcome}.`));
      if (gate.evidence.length && !gate.criteria.length && !gate.outcomes.length)
        say(at(`gate "${gate.title}" holds evidence and no criterion.`));
      for (const key of gate.evidence)
        if (!published(key)) say(at(`gate "${gate.title}" cites the unpublished ${key}.`));
    }
    for (const [task, kind, key] of entry.taskLinks) {
      if (!entry.tasks[task - 1]) say(at(`links the unknown task ${task}.`));
      if (!linkKinds.includes(kind)) say(at(`links a task to a ${kind}.`));
      const found = {
        issue: issueKeys.has(key),
        risk: riskKeys.has(key),
        poam: itemKeys.has(key),
        requirement: references.has(key),
        evidence: published(key),
      }[kind];
      if (!found) say(at(`links task ${task} to the unknown ${kind} ${key}.`));
    }
    if (!entry.ssp.working?.trim() && !day(entry.ssp.publish))
      say(at("neither publishes its SSP nor drafts the next."));
    if (entry.takesVersion !== undefined) {
      const next = program.product.nextVersion;
      if (!next || entry.takesVersion !== 2)
        say(at(`takes version ${entry.takesVersion}, which its product does not have.`));
      else if (program.variant.added.some((added) => added[0] === next.element[0]))
        say(at(`already holds ${next.element[0]}, which the version it takes adds.`));
    }
    for (const person of Object.values(entry.ssp.owners)) known(person, at("SSP"));
    if (!entry.ssp.owners.default) say(at("names nobody for a control by default."));
    const assessment = entry.assessment;
    known(assessment.owner, at("delta assessment"));
    known(assessment.results.assessor, at("delta assessment results"));
    if (!campaignStatuses.includes(assessment.status)) say(at("delta assessment has no status."));
    if (!(assessment.planPublished <= assessment.results.starts))
      say(at("delta assessment judges before its plan is published."));
    if (!(assessment.results.starts <= assessment.results.ends))
      say(at("delta assessment results end before they start."));
    if (!(
      assessment.results.ends <= assessment.results.published && assessment.results.published <= 0
    ))
      say(at("delta assessment results are published before they end, or later."));
    if (!(assessment.results.judged > 0 && assessment.results.judged < 100))
      say(at("delta assessment judges every control or none."));
    // An area of the program's trouble: a modified element's controls in some families, or the
    // program's own controls in some families, found short for a reason its finding gives.
    const changedHere = new Set(program.variant.changes.map(([code]) => code));
    for (const area of assessment.results.areas) {
      const where = area.element ?? "the program's own controls";
      if (area.element && !changedHere.has(area.element))
        say(at(`finds trouble in ${area.element}, which the variant does not change.`));
      if (!area.families?.length) say(at(`finds trouble in ${where} in no family.`));
      if (!["partially_satisfied", "other_than_satisfied"].includes(area.determination))
        say(at(`finds trouble in ${where} that is not short of satisfied.`));
      if (!area.narrative?.trim()) say(at(`finds trouble in ${where} and does not say why.`));
      if (!area.risk && !area.observation && !area.evidence)
        say(at(`finds trouble in ${where} that rests on nothing the program recorded.`));
      if (area.risk && !riskKeys.has(area.risk))
        say(at(`ties trouble in ${where} to the unknown risk ${area.risk}.`));
      if (area.observation && !observations.has(area.observation))
        say(at(`ties trouble in ${where} to the unknown observation ${area.observation}.`));
      if (area.evidence && !published(area.evidence))
        say(at(`ties trouble in ${where} to the unpublished ${area.evidence}.`));
    }
    for (const [title, method, , steps] of assessment.activities) {
      if (!activityMethods.includes(method)) say(at(`activity "${title}" has no method.`));
      if (!steps.length) say(at(`activity "${title}" has no step.`));
    }
    for (const [title, status, starts, ends] of assessment.events)
      if (!campaignStatuses.includes(status) || ends < starts)
        say(at(`assessment event "${title}" has no status or ends before it starts.`));
    const named = new Set();
    for (const finding of assessment.results.named) {
      if (named.has(finding.control)) say(at(`judges ${finding.control} twice by name.`));
      named.add(finding.control);
      if (!determinations.includes(finding.determination))
        say(at(`judges ${finding.control} with no determination.`));
      if (finding.risk && !riskKeys.has(finding.risk))
        say(at(`ties ${finding.control} to the unknown risk ${finding.risk}.`));
      if (finding.observation && !observations.has(finding.observation))
        say(at(`ties ${finding.control} to the unknown observation ${finding.observation}.`));
      if (finding.evidence && !published(finding.evidence))
        say(at(`ties ${finding.control} to the unpublished ${finding.evidence}.`));
    }
    known(entry.witness.owner, at("witnessing"));
    if (!campaignStatuses.includes(entry.witness.status)) say(at("witnessing has no status."));
    for (const [title, status, starts, due, owner] of entry.witness.schedule) {
      if (!scheduleStatuses.includes(status)) say(at(`"${title}" has no status.`));
      if (["in_progress", "completed"].includes(status) && starts > 0)
        say(at(`"${title}" is under way or done and starts on a day to come.`));
      if (!day(starts) || !day(due) || due < starts) say(at(`"${title}" is due before it starts.`));
      known(owner, at(`"${title}"`));
    }
    if (entry.configurationBaselines[0]?.published === null)
      say(at("has no published configuration baseline."));
    for (const [title, status, started, completed, kind] of entry.scans) {
      if (!scanStatuses.includes(status)) say(at(`scan "${title}" has no status.`));
      if (!scanKinds[kind]) say(at(`scan "${title}" has the unknown kind ${kind}.`));
      if (status === "completed" && !(day(started) && day(completed) && completed >= started))
        say(at(`scan "${title}" is completed on no day.`));
    }
    known(entry.package.owner, at("package"));
    if (!entry.package.documents.length) say(at("package holds no document."));
    for (const document of entry.package.documents)
      if (!packageDocuments.includes(document)) say(at(`package holds the unknown ${document}.`));
    for (const [, person, type, description] of entry.activity) {
      known(person, at("activity"));
      if (!eventTypes.includes(type)) say(at(`activity has the event ${type}.`));
      // A recorded deed reads after the person who did it, so it starts in lower case.
      if (!/^[a-z]/.test(description)) say(at(`activity "${description}" is not a deed.`));
    }
    for (const [kind, key, author, body] of entry.comments) {
      known(author, at("comment"));
      if (!commentTargets.includes(kind) || !body.trim()) say(at("has a comment on nothing."));
      const found = {
        task: Boolean(entry.tasks[key - 1]),
        issue: issueKeys.has(key),
        risk: riskKeys.has(key),
        poam: itemKeys.has(key),
      }[kind];
      if (!found) say(at(`comments on the unknown ${kind} ${key}.`));
    }
  }
  for (const code of Object.keys(work))
    if (!programs.some((program) => program.code === code))
      say(`${code} has work and is not a program of the scenario.`);
  return issues;
}
