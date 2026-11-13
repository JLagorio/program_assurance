/**
 * The records one click down in the products scenario: what a reader meets when they open a task,
 * a risk, an issue, a remediation item, a requirement, a control, a system or a campaign of the
 * customer programs, and the two products nobody had taken.
 *
 * Authored for this repository and illustrative, as the products scenario is. It is the fifth step
 * of scripts/seed-demo-products.mjs, under the provenance dataset `products-detail-v1`, and works
 * over what the fourth step (scripts/demo/products-work-scenario.mjs) wrote: a record of that step
 * is named here by the key it was written under there.
 *
 * As in the fourth step, a number where a date belongs is a day counted from the day the step is
 * seeded for, and a date written out is a fact of the product's history.
 */
import * as base from "./products-scenario.mjs";
import * as work from "./products-work-scenario.mjs";

export const detailDatasetId = "products-detail-v1";

const high = "NIST SP 800-53 Rev 5 High baseline";
const moderate = "NIST SP 800-53 Rev 5 Moderate baseline";

/**
 * The products. G40's draft is published and assessed, R210's first version is assessed for the
 * unit as a whole, and each is taken by a program as a variant of its own.
 */
export const productDetail = {
  publish: [
    {
      product: "G40",
      version: 1,
      effectiveFrom: "2026-10-26",
      remarks: "First released version, with its elements pinned to the G40 ground terminal set.",
    },
  ],
  /** Each assessment's determinations are recorded through record_product_determinations. */
  assessments: [
    {
      product: "R210",
      version: 1,
      baseline: high,
      title: "R210 Launcher Electronics Unit version 1 product assessment",
      description:
        "Judged for the unit as a whole, before its elements were pinned to a component set: its build, configuration, physical protection and supply chain records.",
      assessor: "Ray Colston",
      startedOn: "2026-08-17",
      completedOn: "2026-08-28",
      publishedAt: "2026-08-28T15:00:00Z",
      wholeFamilies: ["CM", "PE", "SA", "SR"],
      wholeShare: 55,
      wholeSpread: [78, 92, 100],
      wholeRationale:
        "Judged for the unit as a whole from its build, configuration, physical protection and supply chain records.",
    },
    {
      product: "G40",
      version: 1,
      baseline: moderate,
      title: "G40 Ground Terminal version 1 product assessment",
      description:
        "One assessment of the ground terminal against the Moderate baseline, judged element by element so it answers for a fixed site and for the transportable shelter.",
      assessor: "Elena Vasquez",
      startedOn: "2026-10-27",
      completedOn: "2026-11-06",
      publishedAt: "2026-11-06T16:00:00Z",
      spread: [72, 88, 96],
      weakElements: ["SW"],
      weakSpread: [55, 80, 95],
      wholeFamilies: ["CM", "PL", "SA", "SR"],
      wholeShare: 35,
      wholeSpread: [80, 94, 100],
      wholeRationale:
        "Judged for the terminal as a whole: its engineering, configuration and supply chain process.",
      elementRationale: "Judged on the element as delivered.",
    },
  ],
  /**
   * A variant of each, created through add_program_system as the account, with one element the
   * program changed so its Product delta reads a change.
   */
  variants: [
    {
      program: "PRG-2101",
      product: "R210",
      version: 2,
      code: "R210-STD-CUSA",
      name: "R210 Launcher Electronics Unit · Standard · Customer A",
      description: "The launcher electronics unit of Customer A's rail launcher.",
      type: "platform",
      configuration: "STD",
      prefix: "CA-LEU",
      impact: ["high", "high", "moderate"],
      rationale: "Categorized with the missile it launches, for the customer's mission.",
      owner: "Dan Whitfield",
      changes: [
        [
          "FW",
          ["firmware"],
          "Launch sequencing is set for Customer A's rail launcher and the X800's umbilical timing.",
        ],
      ],
      /** Customer requirements allocated to the variant's boundary itself. */
      allocate: ["3.4.2"],
    },
    {
      program: "PRG-2201",
      product: "G40",
      version: 1,
      code: "G40-TRN-CUSC",
      name: "G40 Ground Terminal · Transportable · Customer C",
      description: "The mission planning terminal that travels with Customer C's battery.",
      type: "information_system",
      configuration: "TRN",
      prefix: "CC-GT",
      impact: ["moderate", "moderate", "moderate"],
      rationale: "Categorized with the launch control station it plans missions for.",
      owner: "Wes Duarte",
      changes: [
        [
          "SW",
          ["data", "software"],
          "The planning software is loaded with Customer C's battery layout and planning rules.",
        ],
      ],
      allocate: ["5.6.2"],
    },
  ],
};

/**
 * The details of each program, by code. Lists name a fourth-step record by the key it was written
 * under there (an issue, a risk, a remediation item, an evidence artifact, `name@1` for its first
 * version), a task by its place in that step's list, from one.
 */
export const detail = {
  "PRG-2101": {
    /** Customer requirements allocated to each boundary itself, by the boundary's code. */
    boundaryAllocations: { "X800-A-CUSA": ["3.7.1"] },
    /** Evidence for the requirements the fourth step cited none for. */
    evidence: [
      {
        key: "function-list",
        title: "Flight program function list, customer build",
        kind: "document",
        owner: "Nadia Fournier",
        collected: -6,
        description:
          "The functions in the customer's build of the flight program, for the least functionality review.",
        claim: "Lists the functions the least functionality review weighs.",
        requirements: ["3.3.3"],
        review: ["pending", "Elena Vasquez"],
      },
      {
        key: "waveform-wiring",
        title: "Waveform module wiring inspection record, first article",
        kind: "image",
        owner: "Dan Whitfield",
        collected: -7,
        description:
          "Photographs of the waveform module's power and data wiring on the first article.",
        claim: "Shows how the waveform module is wired beside the datalink radio.",
        requirements: ["3.5.1"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Shows the shared power return the issue records.",
          -6,
        ],
      },
      {
        key: "waveform-test-plan",
        title: "Customer waveform module test plan",
        kind: "document",
        owner: "Dan Whitfield",
        collected: -5,
        description:
          "How the waveform module's confidentiality will be tested at the customer laboratory.",
        claim: "Sets out the confidentiality test of the waveform module.",
        requirements: ["3.5.2"],
        review: [
          "needs_revision",
          "Elena Vasquez",
          "The plan does not say how the waveform's key is loaded.",
          -3,
        ],
      },
      {
        key: "loader-delivery-record",
        title: "Delivery record extract: mission data loader not delivered",
        kind: "document",
        owner: "Amara Bell",
        collected: -60,
        description:
          "The first article's delivery record, which lists the mission data loader as outside the delivery.",
        claim: "Records the mission data loader as outside the delivered variant.",
        requirements: ["3.6.1"],
        review: ["accepted", "Victor Amsel", "Confirms the loader is outside the delivery.", -55],
      },
    ],
    /** The customer's document, cited by each of its requirements; it names no file in Storage. */
    document: {
      title: "CUSA-SSRD Rev C, Customer A System Security Requirements Document",
      uri: "https://portal.customer-a.example/x800-rail/CUSA-SSRD-0042-RevC.pdf",
      owner: "Sarah Chen",
      received: "2026-07-15",
      firstPage: 9,
      task: 11,
    },
    procedures: [
      {
        key: "maintenance",
        title: "Maintenance port access and audit test",
        description:
          "Shows the maintenance port refusing an unauthenticated session and recording every session.",
        method: "test",
        owner: "Dan Whitfield",
        preconditions: "First article on the integration bench with the field test set connected.",
        steps: [
          [
            "Open a maintenance session without a maintainer credential.",
            "The port refuses the session.",
          ],
          [
            "Open a session with a maintainer credential and run each maintenance function.",
            "Each function runs.",
          ],
          [
            "Read the audit record for the session.",
            "The session is recorded with its maintainer and time.",
          ],
        ],
        requirements: ["3.1.1", "3.1.2"],
      },
      {
        key: "datalink",
        title: "Datalink encryption and key management test",
        description:
          "Shows the datalink encrypted with the customer's suite and keys loaded and zeroized under its plan.",
        method: "test",
        owner: "Ingrid Solberg",
        preconditions:
          "Bench unit 2 with the customer's algorithm suite loaded and test keys issued.",
        steps: [
          [
            "Load test keys through the key load interface.",
            "The keys load and the module reports them.",
          ],
          ["Run the known-answer tests for each mode of the suite.", "Every mode passes."],
          [
            "Transmit over the datalink and capture the signal.",
            "No plaintext is recoverable from the capture.",
          ],
          ["Zeroize and read back every key store.", "No key material remains."],
        ],
        requirements: ["3.2.1", "3.2.2", "3.5.2"],
      },
      {
        key: "load-integrity",
        title: "Flight program load and image integrity test",
        description:
          "Shows secure boot running only signed loads and the mission data protected at rest.",
        method: "test",
        owner: "Dan Whitfield",
        preconditions:
          "First article with the customer's flight program signed by the approved authority.",
        steps: [
          ["Load the signed customer flight program and power up.", "The program runs."],
          ["Load a copy with one byte altered and power up.", "Secure boot refuses it."],
          ["Read the mission data segment from the stored image.", "The segment is encrypted."],
        ],
        requirements: ["3.2.3", "3.3.1", "3.3.2", "3.3.3"],
      },
      {
        key: "interfaces",
        title: "Launcher interface and tamper inspection",
        description:
          "Inspects the rail umbilical, the waveform module's separation and the guidance section's tamper seals.",
        method: "inspection",
        owner: "Amara Bell",
        preconditions: "First article and its rail umbilical interface document.",
        steps: [
          [
            "Compare the umbilical's signals with the interface document.",
            "Only the launch sequence's signals pass.",
          ],
          [
            "Inspect the waveform module's power and data wiring.",
            "Nothing is shared with the datalink radio.",
          ],
          [
            "Photograph each tamper seal with its serial number.",
            "Every seal is intact and its serial legible.",
          ],
        ],
        requirements: ["3.4.1", "3.4.2", "3.5.1"],
      },
      {
        key: "records",
        title: "Delivery records inspection",
        description: "Inspects the supply chain and loader records delivered with each unit.",
        method: "inspection",
        owner: "Amara Bell",
        preconditions: "The delivery record of the unit.",
        steps: [
          [
            "Trace each part of the unit to its approved source.",
            "Every part traces to an approved source.",
          ],
          [
            "Check the delivery record for the mission data loader.",
            "The loader is recorded as outside the delivery.",
          ],
        ],
        requirements: ["3.6.1", "3.7.1"],
      },
      {
        key: "leu-firmware",
        title: "Launch controller firmware and sequencing test",
        description:
          "Shows the R210's launch controller sequencing a rail launch with the customer's timing.",
        method: "test",
        owner: "Dan Whitfield",
        preconditions: "R210 unit on the launcher bench with the X800 umbilical simulator.",
        steps: [
          [
            "Load the launch controller firmware and check its integrity value.",
            "The value matches the release record.",
          ],
          [
            "Run a launch sequence against the umbilical simulator.",
            "The sequence follows the customer's timing.",
          ],
          [
            "Interrupt power during the sequence.",
            "The controller returns to safe and does not release.",
          ],
        ],
        requirements: ["3.4.2"],
      },
    ],
    /** A draft revision 2 of the delta assessment's plan, which schedules the retests. */
    retests: {
      title: "Customer A · X800 Rail Integration delta assessment, retest schedule",
      description:
        "Draft revision 2: schedules the retests of what revision 1's results found short. Its objectives are those controls.",
      schedule: [
        [
          "Retest mission data protection at rest (SC-28)",
          "planned",
          28,
          30,
          "Elena Vasquez",
          "After the flight program is built with the encrypted segment.",
        ],
        [
          "Retest the customer algorithm suite (SC-13)",
          "blocked",
          7,
          12,
          "Elena Vasquez",
          "Blocked: the corrected suite has not arrived from the customer.",
        ],
        ["Retest zeroization of key material (SC-12)", "planned", 19, 21, "Elena Vasquez", null],
        [
          "Review the remaining controls' evidence",
          "in_progress",
          -3,
          10,
          "Victor Amsel",
          "The controls not yet judged in revision 1.",
        ],
      ],
    },
    witness: {
      events: [
        [
          "Secure boot retest witnessing",
          "completed",
          -23,
          -22,
          "Integration laboratory, bench unit 2",
          "The assessor witnessed the retest of the re-signed load.",
        ],
        [
          "First-article acceptance witnessing",
          "planned",
          58,
          62,
          "Customer A test facility",
          "Witnessing of the first-article acceptance test.",
        ],
      ],
      activities: ["load-integrity", "interfaces"],
    },
    runs: [
      {
        campaign: "delta",
        event: 2,
        procedure: "load-integrity",
        title: "Secure boot test, customer load (first run)",
        started: -31,
        completed: -30,
        assessor: "Elena Vasquez",
        results: ["not_met", "met", "not_met"],
        findings: [
          "Secure boot refused the load: it was signed with a development key.",
          null,
          "The mission data segment reads in the clear.",
        ],
      },
      {
        campaign: "delta",
        event: 2,
        procedure: "load-integrity",
        title: "Secure boot test, customer load (retest)",
        started: -23,
        completed: -22,
        assessor: "Elena Vasquez",
        results: ["met", "met", "not_met"],
        findings: [null, null, "The mission data segment still reads in the clear."],
      },
      {
        campaign: "delta",
        event: 2,
        procedure: "datalink",
        title: "Datalink test, customer suite",
        started: -11,
        completed: null,
        assessor: "Ingrid Solberg",
        results: ["met", "not_met"],
        findings: [null, "Two of the five modes fail their known-answer tests."],
      },
      {
        campaign: "witness",
        procedure: "interfaces",
        title: "Tamper seal inspection (first set)",
        started: -31,
        completed: -31,
        assessor: "Elena Vasquez",
        results: ["met", "met", "not_met"],
        findings: [null, null, "Photographs 4 and 7 do not show the seal serial numbers."],
      },
      {
        campaign: "witness",
        procedure: "interfaces",
        title: "Tamper seal inspection (retaken set)",
        started: -27,
        completed: -27,
        assessor: "Elena Vasquez",
        results: ["met", "not_met", "met"],
        findings: [null, "The waveform module is wired to the radio's power return.", null],
      },
      {
        campaign: "R210-STD-CUSA",
        event: 1,
        procedure: "leu-firmware",
        title: "Launch controller test, customer timing (first run)",
        started: -9,
        completed: -9,
        assessor: "Ray Colston",
        results: ["met", "not_met", "met"],
        findings: [null, "The sequence used the product's default umbilical timing.", null],
      },
      {
        campaign: "R210-STD-CUSA",
        event: 1,
        procedure: "leu-firmware",
        title: "Launch controller test, customer timing (retest)",
        started: -4,
        completed: -4,
        assessor: "Ray Colston",
        results: ["met", "met", "met"],
        findings: [],
      },
    ],
    /** One more risk, for the records issues no other risk rests on. */
    risks: [
      {
        key: "records",
        title: "Inspection and interface records drift from the delivered article",
        status: "open",
        owner: "Amara Bell",
        description:
          "The documents the customer integrates and accepts against no longer describe the article delivered.",
        threat: "An integrator or inspector who relies on a superseded record.",
        vulnerability: "Records are revised after the article and are not checked against it.",
        likelihood: "moderate",
        impact: "low",
        severity: "low",
        rationale:
          "Two records were found out of step in one month; neither changed what was delivered.",
        assessed: -13,
        assessor: "Nadia Fournier",
        response: [
          "mitigate",
          "Check each record against the article at every configuration audit.",
          "Amara Bell",
          20,
        ],
        observations: ["icd-superseded-drawing", "seal-serials-illegible"],
        techniques: ["T1565"],
      },
    ],
    /** Observations of the issues the fourth step recorded none for. */
    observations: [
      [
        "icd-superseded-drawing",
        "icd-drawing",
        "The rail umbilical interface document cites connector drawing Rev C",
        "Rev B of the interface document refers to connector drawing Rev C, which the launcher's Rev D drawing replaced.",
        "examine",
        -14,
        "Amara Bell",
        ["umbilical-icd"],
      ],
      [
        "seal-serials-illegible",
        "seal-photos",
        "Two tamper seal photographs do not show serial numbers",
        "Photographs 4 and 7 of the first inspection set cannot be matched to the seal register.",
        "inspection",
        -29,
        "Elena Vasquez",
        ["tamper-seals@1"],
      ],
    ],
    /** Remediation for the issues the fourth step gave none. */
    remediation: [
      {
        key: "approved-sources",
        title: "Require approval for any buy outside the approved source list",
        status: "in_progress",
        owner: "Amara Bell",
        description:
          "A connector lot was bought outside the approved source list during a shortage.",
        plan: "Add the configuration manager's approval to any buy outside the list, and audit the next quarter's buys against it.",
        resources: "Configuration manager and buyer, two days.",
        planned: 18,
        milestones: [
          ["Buying rule drafted", -20, -19, "completed"],
          ["Rule approved by the configuration control board", 18, null, "planned"],
        ],
        issues: ["distributor"],
        risks: ["counterfeit"],
      },
      {
        key: "retake-seal-photos",
        title: "Retake the tamper seal photographs with serial numbers legible",
        status: "completed",
        owner: "Amara Bell",
        description:
          "Two photographs of the first inspection set do not show the seal serial numbers.",
        plan: "Retake the set under inspection lighting and file it as the record's next version.",
        resources: "Inspector, one hour.",
        planned: -27,
        completed: -27,
        rationale: "The retaken set is version 2 of the inspection record.",
        milestones: [["Photographs retaken and filed", -27, -27, "completed"]],
        issues: ["seal-photos"],
        risks: ["records"],
      },
      {
        key: "icd-revision",
        title: "Revise the rail umbilical interface document to cite drawing Rev D",
        status: "open",
        owner: "Amara Bell",
        description: "Rev B of the interface document cites a superseded connector drawing.",
        plan: "Issue Rev C of the interface document against drawing Rev D and agree it with the launcher integrator.",
        resources: "Interface engineer, three days.",
        planned: 20,
        published: false,
        milestones: [
          ["Rev C drafted", 12, null, "planned"],
          ["Rev C agreed with the launcher integrator", 20, null, "planned"],
        ],
        issues: ["icd-drawing"],
        risks: ["records"],
      },
    ],
    /** Draft remediation commitments of the fourth step that now name the risk they answer. */
    commitmentRisks: { "zeroize-buffer": ["key-residue"], "waveform-return": ["waveform-path"] },
    /**
     * The work each risk calls for, as a task: [title, status, due, priority, done]. The task is
     * assigned to the owner of the risk's response, and linked to the issues the risk rests on.
     */
    riskTasks: {
      "weak-suite": [
        "Get the corrected algorithm suite from the customer's cryptographic authority",
        "waiting",
        7,
        "high",
      ],
      "key-residue": [
        "Change the key load interface firmware to clear its buffer on zeroize",
        "open",
        10,
        "urgent",
      ],
      "test-set": [
        "Rebuild test set 1 on the supported operating system build",
        "in_progress",
        -4,
        "high",
      ],
      "waveform-path": [
        "Draw the harness change that gives the waveform module its own return",
        "open",
        10,
        "normal",
      ],
      "unsigned-load": [
        "Restrict depot releases to loads signed by the approved authority",
        "done",
        -21,
        "normal",
        -21,
      ],
      attribution: [
        "Check the test set issue log at each maintenance session",
        "in_progress",
        30,
        "normal",
      ],
      counterfeit: [
        "Add configuration manager approval to buys outside the approved source list",
        "in_progress",
        18,
        "normal",
      ],
      records: [
        "Check the interface document and seal records against the first article",
        "open",
        20,
        "low",
      ],
    },
    /** Components of the program's own elements, and the controls each plausibly implements. */
    elementComponents: {
      "CS-CWM": { type: "hardware", controls: ["SC-7", "SC-8", "SC-13"] },
    },
  },

  "PRG-2102": {
    boundaryAllocations: { "X800-C-CUSB": ["4.6.1", "4.6.2"] },
    /** Evidence for the requirements the fourth step cited none for. */
    evidence: [
      {
        key: "recorder-protection",
        title: "Telemetry recorder write-protection description",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -9,
        description: "How the telemetry recorder protects what it has written.",
        claim: "Describes how the telemetry record is protected from change.",
        requirements: ["4.2.3"],
        review: ["pending", "Ray Colston"],
      },
      {
        key: "pdu-schematic",
        title: "Pallet power distribution unit protection schematic",
        kind: "document",
        owner: "Hana Lindqvist",
        collected: -14,
        description: "The protection devices between the pallet's outputs and the aircraft bus.",
        claim: "Shows the protection between the pallet's power outputs and the aircraft bus.",
        requirements: ["4.3.1"],
        review: [
          "needs_revision",
          "Ray Colston",
          "No analysis of the fault current is attached yet.",
          -12,
        ],
      },
      {
        key: "receiver-data-request",
        title: "Range safety receiver data request and vendor acknowledgement",
        kind: "document",
        owner: "Tom Okafor",
        collected: -5,
        description: "The data request to the receiver vendor and its acknowledgement.",
        claim: "Records what is asked of the vendor about command authentication.",
        requirements: ["4.3.2"],
        review: ["pending", "Ray Colston"],
      },
      {
        key: "incident-procedure",
        title: "Contractor incident reporting procedure, Rev F",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -70,
        description: "The contractor's procedure for reporting security incidents to customers.",
        claim: "Sets out reporting to the customer within one working day.",
        requirements: ["4.6.2"],
        review: [
          "accepted",
          "Ray Colston",
          "Reporting within one working day is in the procedure.",
          -66,
        ],
      },
    ],
    document: {
      title: "CUSB-SRS Issue 2, Customer B Security Requirements Specification",
      uri: "https://portal.customer-b.example/x800-pallet/CUSB-SRS-0117-Issue2.pdf",
      owner: "Tom Okafor",
      received: "2026-09-10",
      firstPage: 7,
      task: 6,
    },
    procedures: [
      {
        key: "release",
        title: "Pallet release and sequencing test",
        description:
          "Shows the pallet releasing only on an authenticated command and sequencing safely through a power dip.",
        method: "test",
        owner: "Hana Lindqvist",
        preconditions: "Pallet controller on the bench with the aircraft command simulator.",
        steps: [
          [
            "Send a release command without the aircraft's authentication.",
            "The pallet refuses it.",
          ],
          ["Send an authenticated release command.", "The pallet sequences and releases."],
          [
            "Dip the supply at each sequencing step.",
            "Sequencing restarts from the interlock check.",
          ],
        ],
        requirements: ["4.1.1", "4.1.2"],
      },
      {
        key: "links",
        title: "Aircraft link and telemetry encryption test",
        description:
          "Shows the pallet's link to the aircraft and the telemetry encrypted with current keys.",
        method: "test",
        owner: "Wes Duarte",
        preconditions: "Current test keys loaded through the key load interface.",
        steps: [
          ["Check the loaded test keys are current.", "Every key is within its validity."],
          ["Capture the pallet-to-aircraft link during a release.", "No plaintext is recoverable."],
          ["Capture the telemetry stream.", "No plaintext is recoverable."],
        ],
        requirements: ["4.2.1", "4.2.2", "4.2.3", "4.4.3"],
      },
      {
        key: "range-power",
        title: "Range safety and power fault test",
        description:
          "Shows range safety commands authenticated and a pallet power fault kept from the aircraft.",
        method: "test",
        owner: "Hana Lindqvist",
        preconditions: "Range safety receiver and pallet power distribution unit on the bench.",
        steps: [
          ["Send an unauthenticated range safety command.", "The receiver ignores it."],
          ["Short a pallet power output.", "The aircraft bus stays within limits."],
        ],
        requirements: ["4.3.1", "4.3.2"],
      },
      {
        key: "flight-software",
        title: "Flight software and mission computer access test",
        description:
          "Shows the flight software verified at power-up and each mission computer role limited.",
        method: "test",
        owner: "Wes Duarte",
        preconditions: "Flight article with the role matrix loaded.",
        steps: [
          [
            "Power up the flight article three times.",
            "Secure boot verifies the flight software each time.",
          ],
          ["Attempt each restricted function from each role.", "Only the permitted roles succeed."],
          ["Load the role matrix and read it back.", "The matrix matches the approved one."],
        ],
        requirements: ["4.4.1", "4.4.2"],
      },
      {
        key: "records",
        title: "Configuration and maintenance records inspection",
        description:
          "Inspects firmware configuration control, maintenance tools and incident reporting records.",
        method: "inspection",
        owner: "Amara Bell",
        preconditions: "Configuration status report and maintenance log of the pallet sets.",
        steps: [
          [
            "Check each firmware change against the customer's board minutes.",
            "Every change was approved by the board.",
          ],
          [
            "Check the maintenance log's tools against the approved list.",
            "Every tool is approved and calibrated.",
          ],
          [
            "Check the configuration status report against the delivered units.",
            "Every unit's versions are recorded.",
          ],
        ],
        requirements: ["4.1.3", "4.5.1", "4.6.1", "4.6.2"],
      },
    ],
    retests: {
      title: "Customer B · X800 Palletized Integration delta assessment, retest schedule",
      description:
        "Draft revision 2: schedules the retests of the interim results' findings. Its objectives are those controls.",
      schedule: [
        [
          "Retest pallet sequencing after a supply dip (SI-7)",
          "ready",
          6,
          8,
          "Ray Colston",
          "On release candidate 4.",
        ],
        [
          "Re-examine firmware change approval (CM-4)",
          "planned",
          14,
          16,
          "Ray Colston",
          "Once the customer's board holds the baseline.",
        ],
        [
          "Test telemetry encryption with the customer's encryptor",
          "blocked",
          22,
          24,
          "Ray Colston",
          "Blocked: the final interface document is not released.",
        ],
      ],
    },
    witness: {
      events: [
        [
          "Aircraft link test witnessing",
          "completed",
          -44,
          -36,
          "Pallet integration bench",
          "Both runs of the aircraft link test.",
        ],
        [
          "Flight test readiness witnessing",
          "planned",
          38,
          45,
          "Customer B flight test range",
          "Witnessing before the flight test readiness review.",
        ],
      ],
      activities: ["links", "release"],
    },
    runs: [
      {
        campaign: "delta",
        event: 2,
        procedure: "flight-software",
        title: "Flight software and access test (first run)",
        started: -2,
        completed: -2,
        assessor: "Ray Colston",
        results: ["met", "met", "blocked"],
        findings: [null, null, "The role matrix was not loaded on the flight article."],
      },
      {
        campaign: "delta",
        event: 2,
        procedure: "flight-software",
        title: "Flight software and access test (rerun)",
        started: -1,
        completed: -1,
        assessor: "Ray Colston",
        results: ["met", "met", "met"],
        findings: [],
      },
      {
        campaign: "delta",
        event: 2,
        procedure: "release",
        title: "Pallet release test, release candidate 3",
        started: -2,
        completed: -2,
        assessor: "Ray Colston",
        results: ["met", "met", "not_met"],
        findings: [
          null,
          null,
          "After a dip at the release step the sequence resumed without the interlock check.",
        ],
      },
      {
        campaign: "witness",
        task: 1,
        procedure: "links",
        title: "Aircraft link test (first run)",
        started: -44,
        completed: -44,
        assessor: "Ray Colston",
        results: ["not_met", "met", "met"],
        findings: ["The loaded test key expired nine days before the run.", null, null],
      },
      {
        campaign: "witness",
        task: 1,
        procedure: "links",
        title: "Aircraft link test (repeat)",
        started: -36,
        completed: -36,
        assessor: "Ray Colston",
        results: ["met", "met", "met"],
        findings: [],
      },
    ],
    risks: [
      {
        key: "records",
        title: "Configuration records misstate a delivered pallet set",
        status: "investigating",
        owner: "Amara Bell",
        description:
          "A delivered pallet set runs a firmware version its configuration record does not show.",
        threat: "A maintainer or investigator who relies on the configuration record.",
        vulnerability: "The status report is compiled by hand from the build records.",
        likelihood: "low",
        impact: "moderate",
        severity: "moderate",
        rationale:
          "One blank field in the first report; the firmware changes often while it is rewritten.",
        assessed: -16,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Generate the status report from the build records.",
          "Amara Bell",
          5,
        ],
        observations: ["unit-103-blank"],
        techniques: ["T1565"],
      },
    ],
    observations: [
      [
        "certificate-expiry",
        "calibration",
        "The field test set's calibration certificate expires before the first flight test",
        "The certificate is valid for two more days; the first flight test is planned in six weeks.",
        "examine",
        -12,
        "Ray Colston",
        ["test-set-certificate"],
      ],
      [
        "unit-103-blank",
        "unit-103",
        "The configuration status report leaves unit 103's firmware version blank",
        "The first issue of the report has no firmware version for unit 103.",
        "examine",
        -20,
        "Ray Colston",
        ["configuration-status@1"],
      ],
    ],
    /** A risk reassessed with an observation it rests on, as a new published assessment. */
    reassessed: {
      "lapsed-calibration": {
        observations: ["certificate-expiry"],
        assessed: -10,
        rationale:
          "Reassessed once the certificate's expiry was recorded. No maintenance on the aircraft is planned before the renewal.",
      },
    },
    remediation: [
      {
        key: "rekey-port",
        title: "Have the customer authenticate or remove the encryptor's rekey port",
        status: "open",
        owner: "Joel Barrantes",
        description:
          "The customer's draft interface shows a rekey on the test port with no authentication.",
        plan: "Ask the customer's encryptor design authority to authenticate the port or remove it, and test the final design.",
        resources: "Security officer. The customer's design authority.",
        planned: 20,
        milestones: [
          ["Raised with the customer's encryptor design authority", -24, -24, "completed"],
          ["Final interface document received", 12, null, "planned"],
        ],
        issues: ["encryptor-rekey"],
        risks: ["telemetry-rekey"],
      },
      {
        key: "receiver-authentication",
        title: "Establish and test the range safety receiver's command authentication",
        status: "open",
        owner: "Tom Okafor",
        description: "How the range safety receiver authenticates a command is undocumented.",
        plan: "Obtain the vendor's description and test command authentication on the bench.",
        resources: "Test team, two days. The receiver vendor.",
        planned: 30,
        milestones: [
          ["Data request sent to the receiver vendor", -6, -6, "completed"],
          ["Command authentication tested on the bench", 30, null, "planned"],
        ],
        issues: ["receiver-authentication"],
        risks: ["spoofed-range-safety"],
      },
      {
        key: "status-report",
        title: "Reissue the configuration status report with every firmware version recorded",
        status: "completed",
        owner: "Amara Bell",
        description: "The first issue of the report left unit 103's firmware version blank.",
        plan: "Reissue the report and check every field against the build records.",
        resources: "Configuration manager, half a day.",
        planned: -17,
        completed: -17,
        rationale: "Reissued with unit 103's firmware version recorded.",
        milestones: [["Report reissued", -17, -17, "completed"]],
        issues: ["unit-103"],
        risks: ["records"],
      },
    ],
    commitmentRisks: { "pdu-analysis": ["power-fault"] },
    /** ATT&CK techniques for a risk the fourth step named none for. */
    techniques: { "lapsed-calibration": ["T1200"] },
    riskTasks: {
      "unauthorized-release": [
        "Repeat the brownout test on release candidate 4",
        "open",
        8,
        "urgent",
      ],
      "unreviewed-firmware": [
        "Submit release candidate 3 to the customer's board as the firmware baseline",
        "done",
        -6,
        "high",
        -6,
      ],
      "telemetry-rekey": [
        "Ask the customer to authenticate or remove the encryptor's rekey port",
        "waiting",
        20,
        "normal",
      ],
      "spoofed-range-safety": [
        "Bench-test the range safety receiver's command authentication",
        "open",
        30,
        "high",
      ],
      "power-fault": [
        "Test the pallet power distribution unit's fault protection on the bench",
        "open",
        15,
        "normal",
      ],
      "stale-keys": [
        "Add a key expiry check to the link test procedure",
        "done",
        -35,
        "normal",
        -35,
      ],
      "lapsed-calibration": ["Book the field test set's calibration", "open", 30, "low"],
      records: [
        "Generate the configuration status report from the build records",
        "in_progress",
        5,
        "normal",
      ],
    },
    elementComponents: {
      "LC-PDU": { type: "hardware", controls: ["PE-9", "PE-11"] },
      "PS-RSR": { type: "hardware", controls: ["IA-3", "SC-8"] },
    },
  },

  "PRG-2201": {
    boundaryAllocations: { "G25-VEH-CUSC": ["5.5.1"] },
    document: {
      title: "CUSC-SSS Draft 3, Customer C System Security Specification",
      uri: "https://portal.customer-c.example/g25-battery/CUSC-SSS-0009-Draft3.pdf",
      owner: "Wes Duarte",
      received: "2026-08-24",
      firstPage: 5,
      task: 4,
    },
    /**
     * Requirements the customer added to its draft for the planning terminal, in the fourth step's
     * form; their evidence is listed with the program's other evidence below.
     */
    requirements: [
      [
        "5.6.1",
        "Mission plan transfer integrity",
        "Mission plans shall be transferred from the planning terminal to the station only with an integrity check.",
        ["GT-SW"],
        ["SI-7", "SI-10"],
        "partially_compliant",
        "test",
        "The planning software adds an integrity value. The station's check on receipt is to be tested with Customer C's layout loaded.",
      ],
      [
        "5.6.2",
        "Planner authentication",
        "Planners shall authenticate before they can create or change a mission plan.",
        [],
        ["IA-2", "AC-3"],
        "compliant",
        "similarity",
        "Met by the product's planning workstation as assessed in version 1.",
      ],
    ],
    evidence: [
      {
        key: "planner-authentication-test",
        title: "Planning terminal authentication test record",
        kind: "test_record",
        owner: "Joel Barrantes",
        collected: -7,
        description: "Plan changes attempted with and without an authenticated planner.",
        claim: "Shows the terminal refuse a plan change from a planner who has not authenticated.",
        requirements: ["5.6.2"],
        review: ["accepted", "Elena Vasquez", "As the product was assessed.", -5],
      },
      {
        key: "plan-transfer-test-plan",
        title: "Mission plan transfer integrity test plan",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -4,
        description: "How the station's integrity check on a received plan will be tested.",
        claim: "Sets out the test of the station's integrity check on a received mission plan.",
        requirements: ["5.6.1"],
        review: ["pending", "Elena Vasquez"],
      },
      {
        key: "backhaul-data-sheet",
        title: "Satellite backhaul terminal data sheet",
        kind: "document",
        owner: "Joel Barrantes",
        collected: -20,
        description: "The vendor's data sheet of the customer's satellite backhaul terminal.",
        claim: "Describes the terminal's link encryption options.",
        requirements: ["5.2.2"],
        review: [
          "needs_revision",
          "Elena Vasquez",
          "The data sheet does not say which traffic the terminal encrypts.",
          -18,
        ],
      },
      {
        key: "collector-sizing",
        title: "Audit log collector storage sizing note",
        kind: "document",
        owner: "Wes Duarte",
        collected: -37,
        description: "How much audit record the collector's storage holds.",
        claim: "Shows the collector holds ninety days of records.",
        requirements: ["5.3.2"],
        review: [
          "accepted",
          "Elena Vasquez",
          "Shows ninety days of capacity; the gap the issue records is real.",
          -35,
        ],
      },
    ],
    procedures: [
      {
        key: "operator-configuration",
        title: "Operator authentication and configuration integrity test",
        description:
          "Shows the console authenticating operators and refusing an altered configuration.",
        method: "test",
        owner: "Joel Barrantes",
        preconditions: "Launch control software with the customer's signed configuration.",
        steps: [
          ["Issue a command without an authenticated operator.", "The console refuses it."],
          ["Load the customer's signed configuration.", "The software accepts it."],
          ["Load the configuration with one rule altered.", "The software refuses it."],
        ],
        requirements: ["5.1.1", "5.1.2"],
      },
      {
        key: "links",
        title: "Launcher link and backhaul encryption test",
        description:
          "Shows the links to the launchers and the satellite backhaul carrying only encrypted traffic.",
        method: "test",
        owner: "Joel Barrantes",
        preconditions: "Two launchers on the battery network and the backhaul terminal on loan.",
        steps: [
          ["Capture the link to each launcher.", "No plaintext is recoverable."],
          ["Capture the backhaul.", "No plaintext is recoverable."],
        ],
        requirements: ["5.2.1", "5.2.2"],
      },
      {
        key: "audit-power",
        title: "Audit record and vehicle power test",
        description:
          "Shows operator actions recorded and kept, and the station shutting down cleanly on loss of power.",
        method: "test",
        owner: "Wes Duarte",
        preconditions: "Station installed in the command vehicle.",
        steps: [
          [
            "Take a set of operator actions and read the audit record.",
            "Each action is recorded with its time.",
          ],
          ["Check the oldest record the collector holds.", "Records go back a year."],
          ["Cut vehicle power during a command.", "The station shuts down in a known state."],
          ["Compare the station with its configuration record.", "They match."],
        ],
        requirements: ["5.3.1", "5.3.2", "5.4.1", "5.5.1"],
      },
      {
        key: "planning-terminal",
        title: "Mission planning terminal test",
        description:
          "Shows planners authenticated and a mission plan checked when the station receives it.",
        method: "test",
        owner: "Joel Barrantes",
        preconditions: "G40 terminal in its shelter, linked to the station.",
        steps: [
          ["Change a mission plan without authenticating.", "The terminal refuses it."],
          ["Transfer a plan to the station.", "The station accepts it."],
          ["Transfer a plan with one value altered.", "The station refuses it."],
        ],
        requirements: ["5.6.1", "5.6.2"],
      },
    ],
    retests: {
      title: "Customer C · G25 Battery Control Fielding delta assessment, retest schedule",
      description: "Draft revision 2: schedules the retests of the first results' findings.",
      schedule: [
        [
          "Retest the configuration signature check on the second build",
          "in_progress",
          -2,
          5,
          "Elena Vasquez",
          null,
        ],
        [
          "Retest audit record retention after the monthly export",
          "planned",
          18,
          20,
          "Elena Vasquez",
          "Once the export is built.",
        ],
        [
          "Review the satellite backhaul's encryption",
          "blocked",
          10,
          25,
          "Elena Vasquez",
          "Blocked: the terminal's export license is not granted.",
        ],
      ],
    },
    witness: {
      events: [
        [
          "Configuration signature check witnessing",
          "active",
          -1,
          5,
          "Software integration laboratory",
          "The assessor witnesses the retest on the second build.",
        ],
        [
          "Vehicle shutdown witnessing",
          "planned",
          13,
          14,
          "Customer C motor pool",
          "Shutdown on loss of vehicle power, in the first command vehicle.",
        ],
      ],
      activities: ["operator-configuration", "audit-power"],
    },
    runs: [
      {
        campaign: "delta",
        event: 2,
        procedure: "operator-configuration",
        title: "Operator and configuration test, first build",
        started: -11,
        completed: -11,
        assessor: "Elena Vasquez",
        results: ["met", "met", "not_met"],
        findings: [null, null, "The first build accepted a configuration with one rule altered."],
      },
      {
        campaign: "delta",
        event: 2,
        procedure: "operator-configuration",
        title: "Operator and configuration test, second build",
        started: -6,
        completed: -6,
        assessor: "Elena Vasquez",
        results: ["met", "met", "met"],
        findings: [],
      },
      {
        campaign: "witness",
        procedure: "audit-power",
        title: "Audit and power test, vehicle 1",
        started: -37,
        completed: -37,
        assessor: "Elena Vasquez",
        results: ["met", "not_met", "not_met", "met"],
        findings: [
          null,
          "The collector holds ninety days of records.",
          "The vehicle supply was not available for the cut.",
          null,
        ],
      },
      {
        campaign: "witness",
        procedure: "audit-power",
        title: "Audit and power test, vehicle 1 (repeat)",
        started: -15,
        completed: -15,
        assessor: "Elena Vasquez",
        results: ["met", "not_met", "met", "met"],
        findings: [null, "The collector still holds ninety days of records.", null, null],
      },
      {
        campaign: "G40-TRN-CUSC",
        event: 1,
        procedure: "planning-terminal",
        title: "Planning terminal test (first run)",
        started: -6,
        completed: -6,
        assessor: "Elena Vasquez",
        results: ["met", "met", "not_met"],
        findings: [null, null, "The station accepted a plan with one value altered."],
      },
      {
        campaign: "G40-TRN-CUSC",
        event: 1,
        procedure: "planning-terminal",
        title: "Planning terminal test (second run)",
        started: -3,
        completed: -3,
        assessor: "Elena Vasquez",
        results: ["met", "met", "not_met"],
        findings: [
          null,
          null,
          "Still accepted; the check is not enabled in the station's configuration.",
        ],
      },
    ],
    risks: [
      {
        key: "records",
        title: "A delivered station does not match its configuration record",
        status: "closed",
        owner: "Wes Duarte",
        description: "A station is operated in a configuration its record does not describe.",
        threat: "An operator or maintainer who relies on the record.",
        vulnerability: "Installation is checked against the drawing and not against the record.",
        likelihood: "low",
        impact: "low",
        severity: "low",
        rationale: "Found once, on a missing label; the installation audit now checks the record.",
        assessed: -15,
        assessor: "Joel Barrantes",
        response: [
          "mitigate",
          "Audit each installation against its configuration record.",
          "Wes Duarte",
          null,
        ],
        observations: ["console-label-missing"],
        techniques: ["T1565"],
      },
    ],
    observations: [
      [
        "console-label-missing",
        "console-label",
        "Vehicle 2's console has no classification label",
        "The installation audit found vehicle 2's console installed without its label.",
        "inspection",
        -17,
        "Elena Vasquez",
        [],
      ],
    ],
    remediation: [
      {
        key: "console-label",
        title: "Fit vehicle 2's console label and update its configuration record",
        status: "completed",
        owner: "Wes Duarte",
        description: "Vehicle 2's console was installed without its classification label.",
        plan: "Fit the label and record it in vehicle 2's configuration record.",
        resources: "Installer, one hour.",
        planned: -15,
        completed: -15,
        rationale: "Label fitted and the record updated.",
        milestones: [["Label fitted and record updated", -15, -15, "completed"]],
        issues: ["console-label"],
        risks: ["records"],
      },
    ],
    commitmentRisks: { "measure-hold-up": ["unclean-shutdown"] },
    riskTasks: {
      "backhaul-cleartext": [
        "Route the backhaul through the link encryptor if the terminal fails its test",
        "open",
        25,
        "high",
      ],
      "audit-gap": [
        "Test a restore from the customer's audit archive",
        "in_progress",
        20,
        "normal",
      ],
      "unclean-shutdown": [
        "Measure the vehicle power interface's hold-up time under worst-case supply",
        "waiting",
        14,
        "normal",
      ],
      records: [
        "Audit vehicle 2's station against its configuration record",
        "done",
        -15,
        "low",
        -15,
      ],
    },
    elementComponents: {
      "CN-SAT": { type: "hardware", controls: ["SC-7", "SC-8"] },
    },
  },
};

/**
 * The delta assessments of the two new variants: planned through plan_delta_assessment once the
 * variant's SSP is published, then given their subject, activities, events and schedule while
 * their plan is a draft.
 */
export const variantAssessments = {
  "R210-STD-CUSA": {
    title: "Customer A · R210 Launcher Electronics delta assessment",
    owner: "Ray Colston",
    status: "active",
    starts: -10,
    ends: 30,
    subject: "Customer A's variant of the R210 Launcher Electronics Unit, Standard",
    activities: [
      [
        "Test the launch controller as changed",
        "test",
        "The product's sequencing tests repeated with the customer's firmware.",
        "leu-firmware",
      ],
    ],
    events: [
      [
        "Launcher bench testing",
        "active",
        -9,
        6,
        "Launcher integration bench",
        "Sequencing tests of the launch controller with the customer's timing.",
      ],
      ["Results review with Customer A", "planned", 25, 25, "Customer A program office", null],
    ],
    schedule: [
      [
        "Test the launch controller with the customer's timing",
        "completed",
        -9,
        -4,
        "Ray Colston",
        null,
      ],
      ["Examine the firmware's release record", "in_progress", -2, 6, "Ray Colston", null],
      [
        "Review the unit's physical protection with the launcher integrator",
        "planned",
        12,
        20,
        "Ray Colston",
        null,
      ],
    ],
  },
  "G40-TRN-CUSC": {
    title: "Customer C · G40 Ground Terminal delta assessment",
    owner: "Elena Vasquez",
    status: "active",
    starts: -7,
    ends: 35,
    subject: "Customer C's variant of the G40 Ground Terminal, Transportable",
    activities: [
      [
        "Test the planning software as changed",
        "test",
        "Plan transfer and planner authentication with Customer C's layout loaded.",
        "planning-terminal",
      ],
    ],
    events: [
      [
        "Planning terminal testing",
        "active",
        -6,
        8,
        "Customer C shelter, software integration laboratory",
        "Plan transfer and authentication tests.",
      ],
      ["Results review with Customer C", "planned", 30, 30, "Customer C program office", null],
    ],
    schedule: [
      [
        "Test plan transfer integrity",
        "in_progress",
        -6,
        4,
        "Elena Vasquez",
        "Two runs so far; the station's check is not enabled.",
      ],
      ["Examine the planning software's release record", "planned", 6, 10, "Elena Vasquez", null],
      ["Interview the battery's planners", "planned", 14, 15, "Victor Amsel", null],
    ],
  },
};

/** A configuration baseline for each new variant, pinning every component it holds. */
export const variantBaselines = {
  "R210-STD-CUSA": {
    name: "R210 unit for Customer A as delivered",
    description: "The launcher electronics unit delivered for Customer A's rail launcher.",
    published: -12,
    note: "As delivered.",
    versions: { FW: "2.1-CA1" },
  },
  "G40-TRN-CUSC": {
    name: "G40 terminal for Customer C as delivered",
    description: "The transportable terminal delivered with Customer C's battery.",
    published: -9,
    note: "As delivered.",
    versions: { SW: "1.0-CC1" },
  },
};

/** Who makes what an inventory item records, by the product the element comes from. */
export const manufacturers = {
  X800: "Air Defense production",
  R210: "Air Defense production",
  G25: "Mission Systems production",
  G40: "Mission Systems production",
  own: "Government-furnished",
};

/**
 * The words the step writes where it fills many records alike. A review discussion opens on a
 * customer requirement by the program's answer to it; `{statement}` is the compliance statement
 * and `{reference}` the requirement's paragraph.
 */
export const discussions = {
  compliant: {
    subject: "Basis for compliance",
    body: "{statement} Confirm nothing this variant changes touches it before the matrix goes to the customer.",
    reply: "Checked against the variant's declared changes: none of them touches this requirement.",
    resolve: true,
  },
  partially_compliant: {
    subject: "What closes the gap",
    body: "{statement} What evidence closes the rest, and by when?",
    reply: "The test is on the retest schedule; the record will be linked here when it is run.",
    resolve: false,
  },
  non_compliant: {
    subject: "Plan to reach compliance",
    body: "{statement} The remediation item needs a date the customer will accept.",
    reply: "Raised at the program review; the date goes in the next matrix.",
    resolve: false,
  },
  not_applicable: {
    subject: "Customer agreement that it does not apply",
    body: "{statement} The customer agreed this at the requirements review.",
    reply: "Recorded in the review minutes.",
    resolve: true,
  },
  unanswered: {
    subject: "Answer needed",
    body: "No compliance statement is recorded for {reference} yet. Who answers it, and by when?",
    reply: null,
    resolve: false,
  },
};

/**
 * The discussion each cited passage opens on: `{reference}` is the paragraph and `{document}` the
 * customer's document. It is resolved where the requirement is answered and settled.
 */
export const passageDiscussion = {
  subject: "Paragraph as received",
  body: "§{reference} as printed in {document}. Check it against the customer's next issue before the matrix is resubmitted.",
  reply: "Unchanged in the issue the program holds.",
  resolveFor: ["compliant", "not_applicable"],
};

/** A task's comment by its status; `{note}` is its note. */
export const taskComments = {
  open: "Picked up. {note}",
  in_progress: "Under way. {note}",
  waiting: "Waiting. {note}",
  blocked: "Escalated to the program manager. {note}",
  done: "Done, and the record is filed against the task.",
  cancelled: "Cancelled; nothing further to do.",
};

/** A task's activity: what each status adds after the line that records its creation. */
export const taskActivity = {
  in_progress: ["updated", "started the task"],
  waiting: ["updated", "marked the task waiting"],
  blocked: ["updated", "marked the task blocked"],
  done: ["completed", "completed the task"],
  cancelled: ["updated", "cancelled the task"],
};

/** A risk's activity after the line that records it and the one that publishes its assessment. */
export const riskActivity = {
  investigating: ["updated", "started investigating the risk"],
  responding: ["updated", "started the response"],
  accepted: ["reviewed", "accepted the risk"],
  closed: ["completed", "closed the risk"],
};

/** What a contribution of an element the program added says of the control. */
export const ownElementStatus = "planned";

/** The dataset of the flow-down, written after the records one click down. */
export const flowDownDatasetId = "products-flowdown-v1";

/**
 * The customers' requirements flowed down into the variants' elements, so each element's own
 * Requirements and Evidence tabs hold what it carries. The import allocated each requirement to
 * the elements the customer's document names; this step adds, by program, the elements that also
 * carry one, as [reference, element code, rationale], chosen by what the element is and the
 * controls its library component claims. An element that holds others then carries what they
 * carry (`parent` writes its rationale), and an element allocated a requirement shows that
 * requirement's evidence on its Evidence tab. `evidence` is what such an element holds where the
 * requirement's own evidence does not show it: each artifact is created through the product's
 * command as the account, published, reviewed and cited by the requirement, and `collected` is a
 * day counted from the as-of day. No requirement of CUSC-SSS concerns the planning terminal's
 * shelter power unit, so it carries none.
 */
export const flowDown = {
  allocations: {
    "PRG-2101": [
      [
        "3.4.1",
        "CA-GS-NAV",
        "Inside the guidance section the requirement protects, behind the same tamper seals.",
      ],
      [
        "3.2.3",
        "CA-GS-NAV",
        "Holds the mission's waypoints, which are mission data at rest in the missile.",
      ],
      [
        "3.4.1",
        "CA-GS-SKR",
        "Inside the guidance section the requirement protects, behind the same tamper seals.",
      ],
      [
        "3.3.1",
        "CA-GS-SKR",
        "Runs its own software load, which secure boot verifies before it runs, as it does the flight program.",
      ],
      [
        "3.1.1",
        "CA-SE-TS",
        "The maintainer reaches the maintenance port through the field test set, which authenticates them first.",
      ],
      [
        "3.1.2",
        "CA-SE-TS",
        "The field test set keeps its own record of each maintenance session it opens.",
      ],
      [
        "3.7.1",
        "CA-PS-PWR",
        "Delivered in every missile, so it is among the parts each unit's supply chain record covers.",
      ],
      ["3.4.2", "CA-LEU-CTL", "The launch controller drives the launcher's side of the umbilical."],
      [
        "3.4.2",
        "CA-LEU-FW",
        "Customer A's launch sequencing in this firmware sets what crosses the umbilical.",
      ],
      [
        "3.7.1",
        "CA-LEU-PSU",
        "Delivered in every launcher electronics unit, so it is among the parts each unit's supply chain record covers.",
      ],
    ],
    "PRG-2102": [
      [
        "4.2.2",
        "CB-CS-DL",
        "Telemetry leaves the missile through the datalink radio, encrypted by the customer's encryptor before it.",
      ],
      [
        "4.4.1",
        "CB-GS-NAV",
        "The navigation unit's software is part of the flight software verified before it runs.",
      ],
      [
        "4.4.1",
        "CB-GS-SKR",
        "The seeker interface unit's software is part of the flight software verified before it runs.",
      ],
      [
        "4.6.2",
        "CB-PS-HMU",
        "The health monitoring unit raises the anomalies a security incident report starts from.",
      ],
      [
        "4.3.1",
        "CB-PS-PWR",
        "The power conditioning unit is where a missile power fault would first reach the pallet.",
      ],
      ["4.5.1", "CB-SE-MDL", "The mission data loader is one of the tools used on the aircraft."],
    ],
    "PRG-2201": [
      [
        "5.6.2",
        "CC-GT-WS",
        "Planners sign in at the planning workstation before they open a mission plan.",
      ],
      [
        "5.6.1",
        "CC-GT-RLY",
        "Mission plans reach the station through the terminal's datalink relay.",
      ],
    ],
  },
  /** An element that holds others carries what they carry; `{elements}` names those that do. */
  parent: "Carried through its {elements}.",
  /** What the reviewer wrote accepting each artifact below. */
  review: "Shows what the requirement asks of the element, for the configuration delivered.",
  evidence: [
    {
      program: "PRG-2101",
      key: "leu-supply-chain",
      title: "Supply chain record sample, R210 units for Customer A",
      kind: "document",
      owner: "Dan Whitfield",
      reviewer: "Elena Vasquez",
      collected: -16,
      requirement: "3.7.1",
      description:
        "The supply chain records of the first two launcher electronics units delivered for Customer A, with the controller and power supply each holds.",
      claim: "Shows the supply chain record kept for each R210 unit and its parts.",
    },
    {
      program: "PRG-2102",
      key: "pcu-fault-isolation",
      title: "Power conditioning unit fault isolation analysis",
      kind: "document",
      owner: "Hana Lindqvist",
      reviewer: "Ray Colston",
      collected: -21,
      requirement: "4.3.1",
      description:
        "Analysis of a short and an overcurrent in the missile's power conditioning unit, and the protection that keeps either from reaching the pallet's bus.",
      claim: "Shows a missile power fault isolated before it reaches the pallet.",
    },
    {
      program: "PRG-2102",
      key: "loader-approval",
      title: "Mission data loader tool approval record",
      kind: "document",
      owner: "Wes Duarte",
      reviewer: "Ray Colston",
      collected: -12,
      requirement: "4.5.1",
      description:
        "The customer's approval of the mission data loader release used on the aircraft, with its version and the log it keeps of each load.",
      claim: "Shows the mission data loader approved, and its use recorded.",
    },
    {
      program: "PRG-2102",
      key: "hmu-anomaly-log",
      title: "Health monitoring unit anomaly log extract, units 101 to 103",
      kind: "log",
      owner: "Joel Barrantes",
      reviewer: "Ray Colston",
      collected: -6,
      requirement: "4.6.2",
      description:
        "The anomalies the health monitoring unit raised on the first three units, each marked where it was screened as a possible security incident.",
      claim: "Shows the anomalies an incident report would start from, and their screening.",
    },
  ],
};

const taskStatuses = ["open", "in_progress", "waiting", "blocked", "done", "cancelled"];
const priorities = ["low", "normal", "high", "urgent"];
const determinations = ["met", "not_met", "blocked", "not_applicable"];
const levels = ["very_low", "low", "moderate", "high", "very_high"];
const severities = ["low", "moderate", "high", "critical"];
const riskStatuses = ["open", "investigating", "responding", "accepted", "closed"];
const itemStatuses = [
  "open",
  "in_progress",
  "deferred",
  "overdue",
  "completed",
  "risk_accepted",
  "cancelled",
];
const methods = ["examine", "interview", "test", "inspection", "analysis", "demonstration"];
const day = (value) => Number.isInteger(value);

/** What is wrong with the step as written: an empty list is a step the seed can write. */
export function detailIssues() {
  const issues = [];
  const say = (message) => issues.push(message);
  const known = (name, where) => {
    if (name !== work.account && !work.cast.includes(name))
      say(`${where} names ${name}, who is not cast.`);
  };
  const others = new Map(base.otherProducts.map((item) => [item.code, item]));
  for (const entry of productDetail.publish)
    if (others.get(entry.product)?.state !== "draft")
      say(`${entry.product} is not a draft to publish.`);
  for (const assessment of productDetail.assessments) {
    known(assessment.assessor, `${assessment.product}'s assessment`);
    if (!others.has(assessment.product))
      say(`${assessment.product} is not a product of the scenario.`);
    if (!(assessment.wholeShare > 0 && assessment.wholeShare <= 100))
      say(`${assessment.product}'s whole-product share is out of range.`);
  }
  const programs = new Map(work.workPrograms().map((program) => [program.code, program]));
  for (const variant of productDetail.variants) {
    const program = programs.get(variant.program);
    const product = others.get(variant.product);
    if (!program) say(`${variant.code} is taken by the unknown program ${variant.program}.`);
    if (!product) say(`${variant.code} is a variant of the unknown product ${variant.product}.`);
    else {
      if (!product.configurations.some((item) => item.code === variant.configuration))
        say(`${variant.code} takes the unknown configuration ${variant.configuration}.`);
      for (const [code, kinds, why] of variant.changes)
        if (
          !product.elements.some((element) => element[0] === code) ||
          !kinds.length ||
          !why.trim()
        )
          say(
            `${variant.code} changes ${code}, which ${variant.product} does not hold, or says not how.`,
          );
    }
    known(variant.owner, `${variant.code}`);
    if (!variantAssessments[variant.code]) say(`${variant.code} has no delta assessment.`);
    if (!variantBaselines[variant.code]) say(`${variant.code} has no configuration baseline.`);
  }
  for (const [code, entry] of Object.entries(detail)) {
    const program = programs.get(code);
    const at = (what) => `${code} ${what}`;
    if (!program) {
      say(`${code} has details and is not a program of the scenario.`);
      continue;
    }
    const steps = work.work[code];
    const references = new Set([
      ...program.requirements.items.map((item) => item[0]),
      ...(entry.requirements ?? []).map((item) => item[0]),
    ]);
    const verified = new Set(entry.procedures.flatMap((procedure) => procedure.requirements));
    // Every customer requirement cites evidence once this step has run.
    const evidenced = new Set([
      ...steps.evidence.filter((item) => !item.draft).flatMap((item) => item.requirements ?? []),
      ...(entry.evidence ?? []).flatMap((item) => item.requirements ?? []),
    ]);
    for (const reference of references)
      if (!evidenced.has(reference)) say(at(`requirement ${reference} cites no evidence.`));
    for (const item of entry.evidence ?? []) {
      known(item.owner, at(`evidence ${item.key}`));
      if (item.review) known(item.review[1], at(`evidence ${item.key}'s review`));
      if (steps.evidence.some((existing) => existing.key === item.key))
        say(at(`adds the evidence ${item.key} twice.`));
    }
    for (const reference of references)
      if (!verified.has(reference)) say(at(`requirement ${reference} has no verification.`));
    const procedures = new Set();
    for (const procedure of entry.procedures) {
      if (procedures.has(procedure.key)) say(at(`has two procedures keyed ${procedure.key}.`));
      procedures.add(procedure.key);
      if (!methods.includes(procedure.method)) say(at(`procedure ${procedure.key} has no method.`));
      known(procedure.owner, at(`procedure ${procedure.key}`));
      if (procedure.steps.length < 2)
        say(at(`procedure ${procedure.key} has fewer than two steps.`));
      for (const reference of procedure.requirements)
        if (!references.has(reference))
          say(at(`procedure ${procedure.key} verifies ${reference}.`));
    }
    const campaigns = new Set([
      "delta",
      "witness",
      ...productDetail.variants.filter((v) => v.program === code).map((v) => v.code),
    ]);
    const runsBy = new Map();
    for (const run of entry.runs) {
      if (!campaigns.has(run.campaign))
        say(at(`run "${run.title}" belongs to the unknown campaign ${run.campaign}.`));
      const procedure = entry.procedures.find((item) => item.key === run.procedure);
      if (!procedure) say(at(`run "${run.title}" follows the unknown procedure ${run.procedure}.`));
      else if (
        run.results.length > procedure.steps.length ||
        (run.completed !== null && run.results.length !== procedure.steps.length)
      )
        say(at(`run "${run.title}" records a result a step does not have, or misses one.`));
      if (run.results.some((result) => !determinations.includes(result)))
        say(at(`run "${run.title}" has an unknown result.`));
      run.results.forEach((result, index) => {
        if (result !== "met" && !run.findings[index]?.trim())
          say(at(`run "${run.title}" says nothing of a result short of met.`));
      });
      if (
        !day(run.started) ||
        (run.completed !== null && (!day(run.completed) || run.completed < run.started))
      )
        say(at(`run "${run.title}" ends before it starts.`));
      known(run.assessor, at(`run "${run.title}"`));
      if (run.completed !== null) {
        const key = `${run.campaign}/${run.procedure}`;
        runsBy.set(key, (runsBy.get(key) ?? 0) + 1);
      }
    }
    // Each campaign compares two completed runs of one procedure revision.
    for (const campaign of campaigns)
      if (![...runsBy].some(([key, count]) => key.startsWith(`${campaign}/`) && count >= 2))
        say(at(`campaign ${campaign} has no two completed runs of one procedure to compare.`));
    for (const activity of entry.witness.activities)
      if (!procedures.has(activity))
        say(at(`witness activity follows the unknown procedure ${activity}.`));
    for (const [title, , starts, due, owner] of entry.retests.schedule) {
      if (!day(starts) || !day(due) || due < starts)
        say(at(`retest "${title}" is due before it starts.`));
      known(owner, at(`retest "${title}"`));
    }
    const issueKeys = new Set(steps.issues.map((issue) => issue.key));
    const observed = new Set([
      ...steps.issues.flatMap((issue) => issue.observations),
      ...entry.observations.map((item) => item[1] && item[0]),
    ]);
    const evidenceKeys = new Set([
      ...steps.evidence.filter((item) => !item.draft).map((item) => item.key),
      ...(entry.evidence ?? []).map((item) => item.key),
    ]);
    for (const [
      key,
      issue,
      title,
      description,
      method,
      at_,
      observer,
      cited,
    ] of entry.observations) {
      if (!issueKeys.has(issue)) say(at(`observation ${key} is of the unknown issue ${issue}.`));
      if (!title.trim() || !description.trim() || !methods.includes(method) || !day(at_) || at_ > 0)
        say(at(`observation ${key} is incomplete.`));
      known(observer, at(`observation ${key}`));
      for (const cite of cited)
        if (!evidenceKeys.has(cite.split("@")[0]))
          say(at(`observation ${key} cites the unknown ${cite}.`));
    }
    // Every issue of the program has an observation, once this step has run.
    for (const issue of steps.issues)
      if (!issue.observations.length && !entry.observations.some((item) => item[1] === issue.key))
        say(at(`issue ${issue.key} has no observation.`));
    const riskKeys = new Set([
      ...steps.risks.map((risk) => risk.key),
      ...entry.risks.map((risk) => risk.key),
    ]);
    for (const risk of entry.risks) {
      if (steps.risks.some((item) => item.key === risk.key))
        say(at(`adds the risk ${risk.key} twice.`));
      if (
        !riskStatuses.includes(risk.status) ||
        !levels.includes(risk.likelihood) ||
        !levels.includes(risk.impact) ||
        !severities.includes(risk.severity)
      )
        say(at(`risk ${risk.key} is incomplete.`));
      known(risk.owner, at(`risk ${risk.key}`));
      known(risk.assessor, at(`risk ${risk.key}'s assessment`));
      if (!risk.observations.length || !risk.techniques.length)
        say(at(`risk ${risk.key} rests on nothing or names no technique.`));
      for (const key of risk.observations)
        if (!entry.observations.some((item) => item[0] === key))
          say(at(`risk ${risk.key} rests on the unknown ${key}.`));
    }
    // Every risk rests on an observation and names a technique, once this step has run.
    for (const risk of steps.risks) {
      if (!risk.observations.length && !entry.reassessed?.[risk.key])
        say(at(`risk ${risk.key} rests on nothing.`));
      if (!risk.techniques.length && !entry.techniques?.[risk.key])
        say(at(`risk ${risk.key} names no ATT&CK technique.`));
    }
    void observed;
    const itemKeys = new Set([
      ...steps.poam.items.map((item) => item.key),
      ...entry.remediation.map((item) => item.key),
    ]);
    for (const item of entry.remediation) {
      if (steps.poam.items.some((existing) => existing.key === item.key))
        say(at(`adds the remediation item ${item.key} twice.`));
      if (
        !itemStatuses.includes(item.status) ||
        (item.status === "completed") !== day(item.completed)
      )
        say(at(`remediation item ${item.key} is completed without a day, or open with one.`));
      known(item.owner, at(`remediation item ${item.key}`));
      for (const key of item.issues)
        if (!issueKeys.has(key)) say(at(`remediation item ${item.key} answers ${key}.`));
      for (const key of item.risks)
        if (!riskKeys.has(key)) say(at(`remediation item ${item.key} names ${key}.`));
      if (!item.milestones.length || !item.risks.length)
        say(at(`remediation item ${item.key} has no milestone or risk.`));
    }
    // Every issue has a remediation item, and every remediation item names a risk.
    const answered = new Set([
      ...steps.poam.items.flatMap((item) => item.issues),
      ...entry.remediation.flatMap((item) => item.issues),
    ]);
    for (const issue of steps.issues)
      if (!answered.has(issue.key)) say(at(`issue ${issue.key} has no remediation item.`));
    for (const item of steps.poam.items)
      if (!item.risks.length && !entry.commitmentRisks[item.key]?.length)
        say(at(`remediation item ${item.key} names no risk.`));
    for (const [key, risks] of Object.entries(entry.commitmentRisks)) {
      const item = steps.poam.items.find((existing) => existing.key === key);
      if (!item || item.published !== false)
        say(at(`commitment ${key} is not a draft of the fourth step.`));
      for (const risk of risks)
        if (!riskKeys.has(risk)) say(at(`commitment ${key} names ${risk}.`));
    }
    // Every risk has a task: the fourth step's, or one this step writes.
    const linked = new Set(
      steps.taskLinks.filter((link) => link[1] === "risk").map((link) => link[2]),
    );
    for (const key of riskKeys)
      if (!linked.has(key) && !entry.riskTasks[key]) say(at(`risk ${key} has no task.`));
    for (const [key, [title, status, due, priority, done]] of Object.entries(entry.riskTasks)) {
      if (!riskKeys.has(key)) say(at(`a task answers the unknown risk ${key}.`));
      if (
        !title.trim() ||
        !taskStatuses.includes(status) ||
        !priorities.includes(priority) ||
        !day(due)
      )
        say(at(`the task for ${key} is incomplete.`));
      if ((status === "done") !== day(done))
        say(at(`the task for ${key} is done on no day, or not done and has one.`));
    }
    if (!steps.tasks[entry.document.task - 1])
      say(at(`the document is filed against the unknown task ${entry.document.task}.`));
    if (!/^https:\/\/[a-z0-9.-]+\.example\//.test(entry.document.uri))
      say(at("the customer document is not on a reserved example host."));
    for (const [element, component] of Object.entries(entry.elementComponents))
      if (
        !program.variant.added.some((added) => added[0] === element) ||
        !component.controls.length
      )
        say(at(`element ${element} is not one the program added, or implements nothing.`));
    for (const [boundary, refs] of Object.entries(entry.boundaryAllocations)) {
      if (boundary !== program.variant.code)
        say(at(`allocates to the unknown boundary ${boundary}.`));
      for (const reference of refs)
        if (!references.has(reference)) say(at(`allocates the unknown ${reference}.`));
    }
  }
  for (const variant of productDetail.variants) {
    const entry = detail[variant.program];
    for (const reference of variant.allocate)
      if (
        !programs.get(variant.program)?.requirements.items.some((item) => item[0] === reference) &&
        !(entry.requirements ?? []).some((item) => item[0] === reference)
      )
        say(`${variant.code} is allocated the unknown requirement ${reference}.`);
  }
  for (const code of programs.keys()) if (!detail[code]) say(`${code} has no details.`);
  return issues;
}
