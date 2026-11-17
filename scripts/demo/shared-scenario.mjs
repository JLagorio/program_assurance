/**
 * The shared components scenario: library components that more than one consumer is built from,
 * each owned by name and assessed once.
 *
 * It is authored for this repository, not archived source, and it is illustrative. It writes no
 * new product, program or component: it stands on the products scenario (scripts/demo/
 * products-scenario.mjs and products-work-scenario.mjs) and the demo import's WS-X90, names an
 * owner and a business line for a component set, says that a system component of WS-X90 is built
 * from one of the set's components, and carries the determinations a product assessment already
 * recorded on the product element pinned to that component into one published component
 * assessment. Every determination is the product assessment's own, so nothing is judged twice and
 * nothing is invented. Its next chapter is what flows up: one finding a consumer made on a shared
 * component, offered to the component's owner and left waiting on the review (`sharedFindings`).
 * Its third is what the component is made of and what is known to be wrong with it: a software
 * bill of materials of the Mission Computer (`sharedSboms`), the CVE the finding names as a record
 * of its own, tied to the SBOM component that carries it, the controls it bears on and the issue
 * that is WS-X90's row for it (`sharedVulnerabilities`), and one Cyber T&E campaign planned for
 * WS-X90 (`sharedCyberTests`). Its fourth is the component's next version: version 2 of the X800
 * Missile component set, which copies version 1, says what it changes in the Mission Computer and
 * the controls that affects, holds the SBOM of the rebuilt image and is published, though nobody
 * has taken it yet (`sharedVersions`), and the remediation item that answers the finding in
 * WS-X90's POA&M (`sharedRemediation`). scripts/seed-demo-shared.mjs writes it under its own
 * provenance dataset.
 */
export const datasetId = "shared-components-v1";

/**
 * One entry a component set (a component definition, by its code). `owner` is a person of the
 * workspace by name and `businessLine` a business line by its code. `assessment` is the component
 * assessment of the set's latest published version: its dates and assessor are those of the product
 * assessment the determinations are carried from. A component is named as the set names it;
 * `from` is the product element whose determinations it takes, in the latest published assessment
 * of that product version, and `determinations` what that assessment recorded on it, which the
 * seed checks before it writes. A use is a system component of a program that is built from the
 * component: the system component by its code, on the element named.
 */
export const sharedComponents = [
  {
    definition: "x800-components",
    owner: "Priya Raghavan",
    businessLine: "AD",
    assessment: {
      title: "X800 Missile component set version 1 component assessment",
      description:
        "The Mission Computer assessed once, as a component, for everything built from it: the determinations of the X800 Missile's first assessment on its mission computer, carried onto the component itself.",
      assessor: "Elena Vasquez",
      startedOn: "2026-08-03",
      completedOn: "2026-09-30",
      publishedAt: "2026-09-30T16:00:00Z",
    },
    components: [
      {
        name: "Mission Computer",
        from: { product: "X800", version: 1, element: "GS-MC" },
        determinations: { satisfied: 44, partially_satisfied: 6, other_than_satisfied: 4 },
        uses: [
          {
            program: "PRG-1090",
            system: "SYS-WSX90",
            element: "CN-109101",
            component: "LRU-001",
            rationale:
              "WS-X90's mission computer is the X800 Missile's Mission Computer, taken from the X800 Missile component set as its version 1 delivers it.",
          },
        ],
      },
    ],
  },
  {
    definition: "g25-components",
    owner: "Marcus Ryde",
    businessLine: "MS",
    assessment: {
      title: "G25 launch control component set version 1 component assessment",
      description:
        "The Audit Log Collector assessed once, as a component, for everything built from it: the determinations of the G25 Launch Control Station's first assessment on its log collector, carried onto the component itself.",
      assessor: "Ray Colston",
      startedOn: "2026-06-08",
      completedOn: "2026-07-17",
      publishedAt: "2026-07-17T15:00:00Z",
    },
    components: [
      {
        name: "Audit Log Collector",
        from: { product: "G25", version: 1, element: "SV-LOG" },
        determinations: { satisfied: 13, partially_satisfied: 1, other_than_satisfied: 0 },
        uses: [
          {
            program: "PRG-1090",
            system: "SYS-WSX90",
            element: "CN-109118",
            component: "LRU-018",
            rationale:
              "WS-X90's security log collector is the G25 Launch Control Station's Audit Log Collector, taken from the G25 launch control component set as its version 1 delivers it.",
          },
        ],
      },
    ],
  },
];

/**
 * A sharing the scenario leaves out, and why: the schema has no clean way to write it. A product
 * element is pinned to one component, and a published product version no longer changes, so the
 * G25's link encryptor (CN-ENC, pinned to the G25 set's Link Encryptor) cannot also be built from
 * the X800 set's Cryptographic Module without a new G25 version, which would tell Customer C's
 * variant that an update is available.
 */
export const notShared = [
  {
    component: "Cryptographic Module",
    definition: "x800-components",
    with: "G25 Launch Control Station's CN-ENC Link Encryptor",
    reason:
      "CN-ENC is pinned to the G25 set's own Link Encryptor in a published product version, which cannot be pinned again; a new G25 version would change what Customer C's variant reads.",
  },
];

/**
 * What a consumer found on a shared component and offered to the component's owner. One entry a
 * finding: an operational issue of the program, tied to its system component the way the schema
 * ties an issue to a component (an observation of the issue whose assessment subject is the system
 * component, in the draft plan of the campaign named, since only a draft plan takes a subject),
 * and an offer of that issue on the component version the system component is built from. The
 * offer is left waiting on the component's owner, so the finding counts in the offering program
 * alone: no other consumer holds it until the owner accepts it. `use` is one of the uses above,
 * which is what makes the system component a consumer of the component.
 *
 * The issue is authored and illustrative. CVE-2024-6387 is a real vulnerability of the OpenSSH
 * server (a signal handler race, fixed in 9.8p1); that WS-X90's mission computer carries it is
 * demo content, and the demo import holds no such issue.
 */
export const sharedFindings = [
  {
    key: "cve-2024-6387",
    definition: "x800-components",
    component: "Mission Computer",
    use: { program: "PRG-1090", system: "SYS-WSX90", component: "LRU-001" },
    campaign: "WS-X90 continuous monitoring — FY2027",
    issue: {
      title: "CVE-2024-6387 in the OpenSSH server (regreSSHion)",
      description:
        "The Mission Computer's maintenance image runs OpenSSH server 9.6p1, which CVE-2024-6387 (regreSSHion) affects: a signal handler race in sshd that lets an unauthenticated remote attacker run code as root on a glibc-based Linux. The server listens on the maintenance interface only. OpenSSH 9.8p1 fixes it; until the image is rebuilt, LoginGraceTime 0 closes the race at the cost of connection exhaustion. This issue is authored, illustrative demo content.",
      severity: "high",
      owner: "Ingrid Solberg",
      openedAt: "2026-10-10T15:00:00Z",
    },
    observation: {
      title: "OpenSSH server 9.6p1 answers on the Mission Computer's maintenance interface",
      description:
        "A credentialed vulnerability scan of LRU-001 read the sshd banner and package version on the maintenance interface: OpenSSH 9.6p1, inside the range CVE-2024-6387 affects (8.5p1 to 9.7p1). No other interface of the unit answers on the service. This observation is authored, illustrative demo content.",
      method: "test",
      observedAt: "2026-10-10T13:30:00Z",
    },
    subject:
      "LRU-001 Mission Computer, scanned for known vulnerabilities under continuous monitoring",
    offer: {
      title: "CVE-2024-6387 in the Mission Computer's OpenSSH server",
      note: "Found on WS-X90's LRU-001, which runs the Mission Computer's image as version 1 of the component set delivers it. Every system built from that version carries the same server.",
      offeredBy: "Ingrid Solberg",
      offeredAt: "2026-11-14T16:30:00Z",
    },
  },
];

/**
 * An offer the scenario leaves out, and why. The Mission Computer claims 61 controls and its
 * component assessment determines 54 of them. WS-X90's published assessment results judge three of
 * the seven left, and none of those findings was made on the mission computer, which is what an
 * offer of determinations asserts.
 */
export const notOffered = [
  {
    kind: "determinations",
    component: "Mission Computer",
    definition: "x800-components",
    from: "PRG-1090's published assessment results",
    controls: ["AC-12", "SC-7(21)", "SC-28(1)"],
    reason:
      "None of the three findings was made on the mission computer: AC-12 was assessed by interview on LRU-013 and LRU-014, SC-7(21) by route traces across the payload segment and its switch configuration, and SC-28(1) on the storage module's media. An offer of determinations says its findings were made on the component, so none is offered.",
  },
];

/**
 * What a shared component is made of. One entry a software bill of materials of a component of a
 * set, in the set's latest published version: its format and the version of the format's
 * specification, the document's own serial, the day it was generated and the components it lists.
 * A component gives the document's reference for it (`ref`) and, where it sits inside another,
 * that one's reference as its `parent`.
 *
 * The SBOM is authored and illustrative: a plausible component list of an embedded Linux
 * maintenance image, written for this repository. It is no real product's bill of materials; the
 * names, versions and licenses are those of well-known open-source packages, chosen so that the
 * OpenSSH server is the 9.6p1 that the second chapter's observation read on LRU-001.
 */
export const sharedSboms = [
  {
    key: "mission-computer-image",
    definition: "x800-components",
    component: "Mission Computer",
    title: "Mission Computer maintenance image SBOM",
    format: "cyclonedx",
    specVersion: "1.5",
    serial: "urn:uuid:63d63818-ca79-406b-939d-74a552feae25",
    generatedOn: "2026-10-08",
    components: [
      { ref: "image", name: "mission-computer-image", version: "1.0.0", kind: "firmware" },
      {
        ref: "u-boot",
        parent: "image",
        name: "u-boot",
        version: "2024.01",
        kind: "firmware",
        purl: "pkg:generic/u-boot@2024.01",
        license: "GPL-2.0-or-later",
      },
      {
        ref: "linux",
        parent: "image",
        name: "linux",
        version: "6.6.21",
        kind: "operating-system",
        purl: "pkg:generic/linux@6.6.21",
        license: "GPL-2.0-only",
      },
      {
        ref: "glibc",
        parent: "image",
        name: "glibc",
        version: "2.39",
        kind: "library",
        purl: "pkg:generic/glibc@2.39",
        license: "LGPL-2.1-or-later",
      },
      {
        ref: "busybox",
        parent: "image",
        name: "busybox",
        version: "1.36.1",
        kind: "application",
        purl: "pkg:generic/busybox@1.36.1",
        license: "GPL-2.0-only",
      },
      {
        ref: "systemd",
        parent: "image",
        name: "systemd",
        version: "255.4",
        kind: "application",
        purl: "pkg:generic/systemd@255.4",
        license: "LGPL-2.1-or-later",
      },
      {
        ref: "dbus",
        parent: "image",
        name: "dbus",
        version: "1.14.10",
        kind: "application",
        purl: "pkg:generic/dbus@1.14.10",
        license: "AFL-2.1 OR GPL-2.0-or-later",
      },
      {
        ref: "openssl",
        parent: "image",
        name: "openssl",
        version: "3.2.1",
        kind: "library",
        purl: "pkg:generic/openssl@3.2.1",
        license: "Apache-2.0",
      },
      {
        ref: "zlib",
        parent: "image",
        name: "zlib",
        version: "1.3.1",
        kind: "library",
        purl: "pkg:generic/zlib@1.3.1",
        license: "Zlib",
      },
      {
        ref: "openssh-server",
        parent: "image",
        name: "openssh-server",
        version: "9.6p1",
        kind: "application",
        purl: "pkg:generic/openssh@9.6p1",
        cpe: "cpe:2.3:a:openbsd:openssh:9.6:p1:*:*:*:*:*:*",
        license: "BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT",
      },
      {
        ref: "chrony",
        parent: "image",
        name: "chrony",
        version: "4.5",
        kind: "application",
        purl: "pkg:generic/chrony@4.5",
        license: "GPL-2.0-only",
      },
      {
        ref: "libpcap",
        parent: "image",
        name: "libpcap",
        version: "1.10.4",
        kind: "library",
        purl: "pkg:generic/libpcap@1.10.4",
        license: "BSD-3-Clause",
      },
      {
        ref: "sqlite",
        parent: "image",
        name: "sqlite",
        version: "3.45.1",
        kind: "library",
        purl: "pkg:generic/sqlite@3.45.1",
        license: "blessing",
      },
    ],
  },
];

/**
 * What is known to be wrong with it. One entry a CVE, recorded once in the workspace: the SBOM
 * components it is found in (`affects`, by the SBOM's key and the component's name and version,
 * with its state in VEX's words), the controls it bears on by code, and the findings above whose
 * operational issue is a program's row for it (`issues`, by a finding's key).
 *
 * The record's facts are real and are all the scenario says of the CVE: CVE-2024-6387
 * (regreSSHion) is a signal handler race in OpenSSH's sshd; its CVSS 3.1 base score is 8.1 with
 * the vector given, a high severity; it was published on 2024-07-01, affects OpenSSH 8.5p1
 * through 9.7p1 and is fixed in 9.8p1; it is not marked known exploited. That the Mission
 * Computer's image carries the server, and that SI-2 and RA-5 are the controls it bears on here,
 * is authored, illustrative demo content.
 */
export const sharedVulnerabilities = [
  {
    cveId: "CVE-2024-6387",
    title: "Signal handler race in OpenSSH's sshd (regreSSHion)",
    description:
      "A signal handler race in OpenSSH's sshd, known as regreSSHion. It affects OpenSSH 8.5p1 through 9.7p1 and is fixed in 9.8p1.",
    severity: "high",
    cvssScore: 8.1,
    cvssVector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
    publishedOn: "2024-07-01",
    fixedIn: "OpenSSH 9.8p1",
    sourceUri: "https://nvd.nist.gov/vuln/detail/CVE-2024-6387",
    knownExploited: false,
    affects: [
      {
        sbom: "mission-computer-image",
        component: "openssh-server",
        version: "9.6p1",
        state: "affected",
        note: "9.6p1 is inside the affected range, OpenSSH 8.5p1 through 9.7p1.",
      },
    ],
    controls: ["RA-5", "SI-2"],
    issues: ["cve-2024-6387"],
  },
];

/**
 * Cyber T&E is a kind of assessment. One entry a cyber test campaign of a program: its phase
 * (cvi, cooperative vulnerability identification; acd, adversarial cybersecurity DT&E; cvpa,
 * cooperative vulnerability and penetration assessment; aa, adversarial assessment), its window
 * and who owns it. It is planned and has no plan yet, so it holds no objective and decides
 * nothing. The campaign is authored and illustrative.
 */
export const sharedCyberTests = [
  {
    key: "ws-x90-cvi-fy2027",
    program: "PRG-1090",
    title: "WS-X90 cooperative vulnerability identification — FY2027",
    description:
      "Cyber T&E for WS-X90: a cooperative vulnerability identification of the mission computer and its maintenance interface, with the program's engineers, ahead of the adversarial phases. This campaign is authored, illustrative demo content.",
    phase: "cvi",
    status: "planned",
    owner: "Ingrid Solberg",
    startsAt: "2027-01-11T14:00:00Z",
    endsAt: "2027-02-05T22:00:00Z",
  },
];

/**
 * The next version of a shared component's set, and what it changes. One entry a version of a set,
 * by the set's code: the version copies every component of the version before with what each
 * claims, as a new version of a set is written (a draft revision, then its components and their
 * claims). `changes` says, for a component of the set by name, what this version changes against
 * the version before: which kinds (software, firmware, hardware, data), a summary, and the controls
 * the set's owner lists as affected by the change, by code, whose determinations are not carried
 * forward. `sboms` gives the version's own bill of materials for a component: the components of
 * the SBOM named in `from`, with those in `replaces` in place of the ones of the same name, and the
 * state the new document records for a CVE on one of them. A version whose `state` is `published`
 * is published at `publishedAt` once all of that is written, since a published version's content
 * no longer changes; nobody takes it, so every consumer stays on the version it took and reads as
 * behind. `standing` is what the version then reads, by component (component_control_status: its
 * totals, and the controls its change leaves to review), which the seed checks before it commits.
 *
 * The version is authored and illustrative. That OpenSSH 9.8p1 fixes CVE-2024-6387 is a fact; that
 * the Mission Computer's next image carries it, and that its owner lists AC-17(2), SC-23, SI-2 and
 * RA-5 as the controls the change affects, is demo content. The Mission Computer claims neither SI-2
 * nor RA-5, so those two change nothing on it; version 1 was judged satisfied on AC-17(2) and SC-23,
 * which the change leaves to review.
 */
export const sharedVersions = [
  {
    key: "x800-components-v2",
    definition: "x800-components",
    version: 2,
    state: "published",
    publishedAt: "2026-11-12T17:00:00Z",
    remarks:
      "Rebuilds the Mission Computer's maintenance image with OpenSSH server 9.8p1, which fixes CVE-2024-6387. Every other component is as version 1 delivers it. This version is authored, illustrative demo content.",
    changes: [
      {
        component: "Mission Computer",
        kinds: ["software"],
        summary:
          "The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.",
        controls: ["AC-17(2)", "SC-23", "SI-2", "RA-5"],
      },
    ],
    standing: [
      {
        component: "Mission Computer",
        totals: {
          controls: 61,
          satisfied: 42,
          partially_satisfied: 6,
          other_than_satisfied: 4,
          not_assessed: 9,
          carried: 52,
          to_review: 2,
        },
        toReview: ["AC-17(2)", "SC-23"],
      },
    ],
    sboms: [
      {
        key: "mission-computer-image-v2",
        component: "Mission Computer",
        from: "mission-computer-image",
        title: "Mission Computer maintenance image SBOM, version 2",
        serial: "urn:uuid:8f2b1c7e-5a4d-4e39-9c61-2d7f0b3a6e15",
        generatedOn: "2026-11-12",
        replaces: [
          {
            name: "openssh-server",
            version: "9.8p1",
            purl: "pkg:generic/openssh@9.8p1",
            cpe: "cpe:2.3:a:openbsd:openssh:9.8:p1:*:*:*:*:*:*",
          },
        ],
        vulnerabilities: [
          {
            cveId: "CVE-2024-6387",
            component: "openssh-server",
            state: "fixed",
            note: "9.8p1 holds the fix.",
          },
        ],
      },
    ],
  },
];

/**
 * What answers the finding in the program that holds it. One entry a remediation item of the
 * program's POA&M, by the document's title: the item, its first commitment (a draft, as the
 * program's other items keep theirs) with what is planned and the day it is planned to be done,
 * its milestones in order, and the finding above whose operational issue and observation it
 * answers. The item is authored and illustrative.
 */
export const sharedRemediation = [
  {
    key: "cve-2024-6387",
    finding: "cve-2024-6387",
    program: "PRG-1090",
    document: "WS-X90 Sentinel Mission System — POA&M",
    title: "Remediate CVE-2024-6387 on the Mission Computer",
    owner: "Ingrid Solberg",
    status: "open",
    description:
      "LRU-001 runs the Mission Computer's maintenance image as version 1 of the component set delivers it, with OpenSSH server 9.6p1, which CVE-2024-6387 affects. This remediation item is authored, illustrative demo content.",
    plan: "Close the race on the maintenance interface now, take version 2 of the Mission Computer, which carries OpenSSH server 9.8p1, and rescan LRU-001 to confirm the fix.",
    plannedCompletion: "2026-12-08",
    milestones: [
      { title: "Set LoginGraceTime 0 on the maintenance interface", plannedOn: "2026-11-17" },
      { title: "Take Mission Computer version 2", plannedOn: "2026-12-01" },
      { title: "Rescan LRU-001", plannedOn: "2026-12-08" },
    ],
  },
];

/**
 * The programs whose existing reads the seed compares before and after it writes (their control
 * status, each SSP's register and each variant's delta): the program that takes the shared
 * components, and a customer program built from the product they come from.
 */
export const watchedPrograms = ["PRG-1090", "PRG-2101"];

const DETERMINATIONS = ["satisfied", "partially_satisfied", "other_than_satisfied"];
const SEVERITIES = ["low", "moderate", "high", "critical"];
const METHODS = ["examine", "interview", "test", "inspection", "analysis", "demonstration"];
const SBOM_FORMATS = ["cyclonedx", "spdx", "other"];
const SBOM_KINDS = [
  "library",
  "application",
  "operating-system",
  "firmware",
  "container",
  "device",
  "file",
];
const VEX_STATES = ["affected", "not_affected", "fixed", "under_investigation"];
const CYBER_TEST_PHASES = ["cvi", "acd", "cvpa", "aa"];
const CHANGE_KINDS = ["software", "firmware", "hardware", "data"];
const POAM_STATUSES = [
  "open",
  "in_progress",
  "deferred",
  "overdue",
  "completed",
  "risk_accepted",
  "cancelled",
];
const day = /^\d{4}-\d{2}-\d{2}$/;
const cve = /^CVE-\d{4}-\d{4,}$/;

/** How many determinations a component carries. */
export const determinationCount = (component) =>
  DETERMINATIONS.reduce((sum, key) => sum + (component.determinations[key] ?? 0), 0);

/** Every use the scenario writes, with its component set and component. */
export function uses() {
  return sharedComponents.flatMap((set) =>
    set.components.flatMap((component) =>
      component.uses.map((use) => ({ ...use, definition: set.definition, name: component.name })),
    ),
  );
}

/**
 * Each version as the seed writes it: every SBOM with its format and the components it lists, those
 * of the SBOM it starts from with the replaced ones in their place.
 */
export function versions() {
  return sharedVersions.map((entry) => ({
    ...entry,
    sboms: entry.sboms.map((sbom) => {
      const source = sharedSboms.find((item) => item.key === sbom.from);
      return {
        ...sbom,
        format: source?.format,
        specVersion: source?.specVersion,
        components: (source?.components ?? []).map((component) => ({
          ...component,
          ...sbom.replaces.find((item) => item.name === component.name),
        })),
      };
    }),
  }));
}

/** What is wrong with the scenario as written; empty when the seed can write it. */
export function scenarioIssues() {
  const issues = [];
  const definitions = new Set();
  const linked = new Set();
  for (const set of sharedComponents) {
    if (definitions.has(set.definition)) issues.push(`${set.definition} is listed more than once.`);
    definitions.add(set.definition);
    if (!set.owner?.trim()) issues.push(`${set.definition} names no owner.`);
    if (!set.businessLine?.trim()) issues.push(`${set.definition} names no business line.`);
    const { assessment } = set;
    for (const key of ["title", "assessor"])
      if (!assessment[key]?.trim()) issues.push(`${set.definition}'s assessment has no ${key}.`);
    for (const key of ["startedOn", "completedOn"])
      if (!day.test(assessment[key] ?? ""))
        issues.push(`${set.definition}'s assessment ${key} is not a day.`);
    if (assessment.completedOn < assessment.startedOn)
      issues.push(`${set.definition}'s assessment ends before it starts.`);
    if (
      Number.isNaN(Date.parse(assessment.publishedAt)) ||
      assessment.publishedAt.slice(0, 10) < assessment.completedOn
    )
      issues.push(`${set.definition}'s assessment is published before it is completed.`);
    if (!set.components.length) issues.push(`${set.definition} shares no component.`);
    const names = new Set();
    for (const component of set.components) {
      if (names.has(component.name))
        issues.push(`${set.definition} lists ${component.name} more than once.`);
      names.add(component.name);
      if (Object.keys(component.determinations).sort().join() !== [...DETERMINATIONS].sort().join())
        issues.push(`${component.name} does not count each determination once.`);
      if (determinationCount(component) < 1)
        issues.push(`${component.name} carries no determination.`);
      if (!component.uses.length) issues.push(`${component.name} is used by no system.`);
      for (const use of component.uses) {
        const key = `${use.program}/${use.system}/${use.component}`;
        if (linked.has(key)) issues.push(`${key} is built from more than one component.`);
        linked.add(key);
        if (!use.rationale?.trim()) issues.push(`${key} gives no rationale.`);
      }
    }
  }
  const keys = new Set();
  for (const finding of sharedFindings) {
    if (keys.has(finding.key)) issues.push(`${finding.key} is listed more than once.`);
    keys.add(finding.key);
    const { program, system, component } = finding.use;
    // The system component is a consumer of the component because the scenario says so above.
    if (
      !uses().some(
        (use) =>
          use.definition === finding.definition &&
          use.name === finding.component &&
          use.program === program &&
          use.system === system &&
          use.component === component,
      )
    )
      issues.push(
        `${finding.key} is offered from ${program}/${system}/${component}, which the scenario does not build from ${finding.component}.`,
      );
    if (!finding.campaign?.trim()) issues.push(`${finding.key} names no campaign.`);
    if (!finding.subject?.trim()) issues.push(`${finding.key} describes no assessment subject.`);
    for (const key of ["title", "description"]) {
      if (!finding.issue[key]?.trim()) issues.push(`${finding.key}'s issue has no ${key}.`);
      if (!finding.observation[key]?.trim())
        issues.push(`${finding.key}'s observation has no ${key}.`);
    }
    if (!SEVERITIES.includes(finding.issue.severity))
      issues.push(`${finding.key}'s issue has no severity.`);
    if (!METHODS.includes(finding.observation.method))
      issues.push(`${finding.key}'s observation has no method.`);
    if (!finding.offer.title?.trim()) issues.push(`${finding.key}'s offer has no title.`);
    if (!finding.offer.offeredBy?.trim()) issues.push(`${finding.key}'s offer names nobody.`);
    const [observed, opened, offered] = [
      finding.observation.observedAt,
      finding.issue.openedAt,
      finding.offer.offeredAt,
    ].map((moment) => Date.parse(moment));
    if ([observed, opened, offered].some(Number.isNaN))
      issues.push(`${finding.key} gives a moment that is not one.`);
    else if (observed > opened || opened > offered)
      issues.push(`${finding.key} is not observed, then opened, then offered.`);
  }
  const sboms = new Set();
  for (const sbom of sharedSboms) {
    if (sboms.has(sbom.key)) issues.push(`${sbom.key} is listed more than once.`);
    sboms.add(sbom.key);
    // An SBOM describes a component the scenario shares.
    if (
      !sharedComponents.some(
        (set) =>
          set.definition === sbom.definition &&
          set.components.some((component) => component.name === sbom.component),
      )
    )
      issues.push(`${sbom.key} describes ${sbom.component}, which the scenario does not share.`);
    if (!sbom.title?.trim()) issues.push(`${sbom.key} has no title.`);
    if (!SBOM_FORMATS.includes(sbom.format)) issues.push(`${sbom.key} has no format.`);
    if (!day.test(sbom.generatedOn ?? "")) issues.push(`${sbom.key}'s generatedOn is not a day.`);
    if (!sbom.components.length || sbom.components.length > 5000)
      issues.push(`${sbom.key} does not list between 1 and 5,000 components.`);
    const listed = new Set();
    const refs = new Set();
    for (const component of sbom.components) {
      const name = `${component.name} ${component.version ?? ""}`.trim();
      if (!component.name?.trim()) issues.push(`${sbom.key} lists a component with no name.`);
      if (listed.has(name)) issues.push(`${sbom.key} lists ${name} more than once.`);
      listed.add(name);
      if (!SBOM_KINDS.includes(component.kind)) issues.push(`${sbom.key}'s ${name} has no kind.`);
      if (component.ref && refs.has(component.ref))
        issues.push(`${sbom.key} gives the reference ${component.ref} twice.`);
      if (component.ref) refs.add(component.ref);
    }
    for (const component of sbom.components)
      if (component.parent && (!refs.has(component.parent) || component.parent === component.ref))
        issues.push(
          `${sbom.key}'s ${component.name} sits inside ${component.parent}, which is not another of its components.`,
        );
  }
  const cves = new Set();
  for (const vulnerability of sharedVulnerabilities) {
    const id = vulnerability.cveId;
    if (!cve.test(id ?? "")) issues.push(`${id} is not a CVE identifier.`);
    if (cves.has(id)) issues.push(`${id} is listed more than once.`);
    cves.add(id);
    if (!vulnerability.title?.trim()) issues.push(`${id} has no title.`);
    if (!SEVERITIES.includes(vulnerability.severity)) issues.push(`${id} has no severity.`);
    if (!(vulnerability.cvssScore >= 0 && vulnerability.cvssScore <= 10))
      issues.push(`${id}'s CVSS score is not between 0 and 10.`);
    if (!day.test(vulnerability.publishedOn ?? ""))
      issues.push(`${id}'s publishedOn is not a day.`);
    if (typeof vulnerability.knownExploited !== "boolean")
      issues.push(`${id} does not say whether it is known exploited.`);
    for (const affected of vulnerability.affects) {
      const sbom = sharedSboms.find((item) => item.key === affected.sbom);
      if (
        !sbom?.components.some(
          (component) =>
            component.name === affected.component && component.version === affected.version,
        )
      )
        issues.push(
          `${id} affects ${affected.component} ${affected.version}, which ${affected.sbom} does not list.`,
        );
      if (!VEX_STATES.includes(affected.state))
        issues.push(`${id} has no state on ${affected.component}.`);
    }
    if (new Set(vulnerability.controls).size !== vulnerability.controls.length)
      issues.push(`${id} names a control more than once.`);
    for (const key of vulnerability.issues)
      if (!sharedFindings.some((finding) => finding.key === key))
        issues.push(`${id} names the finding ${key}, which the scenario does not hold.`);
  }
  const tests = new Set();
  for (const test of sharedCyberTests) {
    if (tests.has(test.key)) issues.push(`${test.key} is listed more than once.`);
    tests.add(test.key);
    if (!test.program?.trim()) issues.push(`${test.key} names no program.`);
    if (!test.title?.trim()) issues.push(`${test.key} has no title.`);
    if (!test.owner?.trim()) issues.push(`${test.key} names no owner.`);
    if (!CYBER_TEST_PHASES.includes(test.phase)) issues.push(`${test.key} names no phase.`);
    if (test.status !== "planned") issues.push(`${test.key} is not planned.`);
    const [starts, ends] = [test.startsAt, test.endsAt].map((moment) => Date.parse(moment));
    if (Number.isNaN(starts) || Number.isNaN(ends) || ends < starts)
      issues.push(`${test.key} does not start, then end.`);
  }
  const versionKeys = new Set();
  for (const entry of versions()) {
    if (versionKeys.has(entry.key)) issues.push(`${entry.key} is listed more than once.`);
    versionKeys.add(entry.key);
    const set = sharedComponents.find((item) => item.definition === entry.definition);
    // A version follows the one the scenario assessed.
    if (!set) issues.push(`${entry.key} is a version of ${entry.definition}, which is not shared.`);
    if (!Number.isInteger(entry.version) || entry.version < 2)
      issues.push(`${entry.key} is not a version after the first.`);
    if (!["draft", "published"].includes(entry.state))
      issues.push(`${entry.key} is neither a draft nor published.`);
    if (entry.state === "published" && Number.isNaN(Date.parse(entry.publishedAt ?? "")))
      issues.push(`${entry.key} is published at a moment that is not one.`);
    if (entry.state === "draft" && entry.publishedAt !== undefined)
      issues.push(`${entry.key} is a draft with a publication moment.`);
    if (!entry.remarks?.trim()) issues.push(`${entry.key} has no remarks.`);
    // What the version reads once written: its totals add up, and a control left to review is one
    // its change lists.
    for (const standing of entry.standing ?? []) {
      const change = entry.changes.find((item) => item.component === standing.component);
      const { totals } = standing;
      if (!change)
        issues.push(
          `${entry.key} says how ${standing.component} stands, which it does not change.`,
        );
      if (
        totals.controls !==
        totals.satisfied +
          totals.partially_satisfied +
          totals.other_than_satisfied +
          totals.not_assessed
      )
        issues.push(`${entry.key}'s standing of ${standing.component} does not add up.`);
      if (
        totals.carried >
        totals.satisfied + totals.partially_satisfied + totals.other_than_satisfied
      )
        issues.push(`${entry.key} carries more determinations than ${standing.component} holds.`);
      if (totals.to_review !== standing.toReview.length || totals.to_review > totals.not_assessed)
        issues.push(`${entry.key} does not count what ${standing.component} leaves to review.`);
      for (const code of standing.toReview)
        if (!change?.controls.includes(code))
          issues.push(`${entry.key} leaves ${code} to review, which its change does not list.`);
    }
    const changed = new Set();
    for (const change of entry.changes) {
      if (changed.has(change.component))
        issues.push(`${entry.key} changes ${change.component} more than once.`);
      changed.add(change.component);
      if (!set?.components.some((component) => component.name === change.component))
        issues.push(`${entry.key} changes ${change.component}, which the scenario does not share.`);
      if (!change.kinds.length || change.kinds.some((kind) => !CHANGE_KINDS.includes(kind)))
        issues.push(`${entry.key}'s change to ${change.component} names no kind the schema knows.`);
      if (new Set(change.kinds).size !== change.kinds.length)
        issues.push(`${entry.key}'s change to ${change.component} names a kind more than once.`);
      if (!change.summary?.trim())
        issues.push(`${entry.key}'s change to ${change.component} has no summary.`);
      if (new Set(change.controls).size !== change.controls.length)
        issues.push(`${entry.key}'s change to ${change.component} names a control more than once.`);
    }
    for (const sbom of entry.sboms) {
      if (sboms.has(sbom.key)) issues.push(`${sbom.key} is listed more than once.`);
      sboms.add(sbom.key);
      const source = sharedSboms.find((item) => item.key === sbom.from);
      if (!source || source.definition !== entry.definition || source.component !== sbom.component)
        issues.push(`${sbom.key} does not start from an SBOM of ${sbom.component}.`);
      if (!sbom.title?.trim()) issues.push(`${sbom.key} has no title.`);
      if (!day.test(sbom.generatedOn ?? "")) issues.push(`${sbom.key}'s generatedOn is not a day.`);
      if (source && sbom.generatedOn <= source.generatedOn)
        issues.push(`${sbom.key} is not generated after the SBOM it starts from.`);
      if (source && sbom.serial === source.serial)
        issues.push(`${sbom.key} has the serial of the SBOM it starts from.`);
      if (entry.state === "published" && entry.publishedAt?.slice(0, 10) < sbom.generatedOn)
        issues.push(`${sbom.key} is generated after its version is published.`);
      for (const replaced of sbom.replaces)
        if (!source?.components.some((component) => component.name === replaced.name))
          issues.push(`${sbom.key} replaces ${replaced.name}, which ${sbom.from} does not list.`);
      const listed = sbom.components.map((item) => `${item.name} ${item.version ?? ""}`.trim());
      if (new Set(listed).size !== listed.length)
        issues.push(`${sbom.key} lists a component more than once.`);
      for (const recorded of sbom.vulnerabilities) {
        if (!sharedVulnerabilities.some((item) => item.cveId === recorded.cveId))
          issues.push(`${sbom.key} records ${recorded.cveId}, which the scenario does not hold.`);
        if (!sbom.components.some((component) => component.name === recorded.component))
          issues.push(
            `${sbom.key} records a CVE on ${recorded.component}, which it does not list.`,
          );
        if (!VEX_STATES.includes(recorded.state))
          issues.push(`${sbom.key} gives ${recorded.cveId} no state.`);
      }
    }
  }
  const items = new Set();
  for (const item of sharedRemediation) {
    if (items.has(item.key)) issues.push(`${item.key} is remediated more than once.`);
    items.add(item.key);
    const finding = sharedFindings.find((entry) => entry.key === item.finding);
    // A remediation item answers a finding of its own program.
    if (!finding) issues.push(`${item.key} answers ${item.finding}, which the scenario lacks.`);
    else if (finding.use.program !== item.program)
      issues.push(`${item.key} answers a finding of another program than ${item.program}.`);
    for (const key of ["document", "title", "owner", "plan"])
      if (!item[key]?.trim()) issues.push(`${item.key}'s remediation item has no ${key}.`);
    if (!POAM_STATUSES.includes(item.status)) issues.push(`${item.key} has no status.`);
    if (!day.test(item.plannedCompletion ?? ""))
      issues.push(`${item.key}'s plannedCompletion is not a day.`);
    if (!item.milestones.length) issues.push(`${item.key} has no milestone.`);
    let before = "";
    for (const milestone of item.milestones) {
      if (!milestone.title?.trim()) issues.push(`${item.key} has a milestone with no title.`);
      if (!day.test(milestone.plannedOn ?? "") || milestone.plannedOn < before)
        issues.push(`${item.key}'s milestones are not planned in order.`);
      before = milestone.plannedOn;
    }
    if (before > item.plannedCompletion)
      issues.push(`${item.key}'s last milestone is planned after its completion.`);
  }
  return issues;
}
