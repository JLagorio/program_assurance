import assert from "node:assert/strict";
import test from "node:test";
import * as scenario from "../demo/shared-scenario.mjs";
import * as products from "../demo/products-scenario.mjs";
import * as work from "../demo/products-work-scenario.mjs";
import {
  buildPayload,
  buildPlan,
  effectLines,
  readLines,
  targetQuery,
} from "../seed-demo-shared.mjs";

// The shared components scenario as written, without a database: what the seed's transaction
// relies on, and that it stands on the products scenario it names.

/** A workspace that holds everything the scenario stands on, as the seed's read-only read says it. */
const readyTarget = () => ({
  seeded: false,
  people: Object.fromEntries([
    ...scenario.sharedComponents.flatMap((set) => [
      [set.owner, 1],
      [set.assessment.assessor, 1],
    ]),
    ...scenario.sharedFindings.map((finding) => [finding.offer.offeredBy, 1]),
    ...scenario.sharedCyberTests.map((test) => [test.owner, 1]),
    ...scenario.sharedRemediation.map((item) => [item.owner, 1]),
  ]),
  businessLines: scenario.sharedComponents.map((set) => set.businessLine),
  definitions: Object.fromEntries(
    scenario.sharedComponents.map((set) => [
      set.definition,
      { version: 1, owner: null, businessLine: null },
    ]),
  ),
  components: Object.fromEntries(
    scenario.sharedComponents.flatMap((set) =>
      set.components.map((component) => [
        `${set.definition}/${component.name}`,
        {
          found: 1,
          source: {
            assessment: "A product assessment",
            pinned: true,
            determinations: { ...component.determinations },
          },
        },
      ]),
    ),
  ),
  uses: Object.fromEntries(
    scenario
      .uses()
      .map((use) => [
        `${use.program}/${use.system}/${use.component}`,
        { found: true, builtFrom: null },
      ]),
  ),
  findings: Object.fromEntries(
    scenario.sharedFindings.map((finding) => [finding.key, { draftPlan: true, issueHeld: false }]),
  ),
  cvesHeld: [],
  controls: Object.fromEntries(
    [
      ...scenario.sharedVulnerabilities.flatMap((item) => item.controls),
      ...scenario.sharedVersions.flatMap((entry) =>
        entry.changes.flatMap((change) => change.controls),
      ),
    ].map((code) => [code, 1]),
  ),
  cyberTests: Object.fromEntries(
    scenario.sharedCyberTests.map((test) => [test.key, { program: true, campaignHeld: false }]),
  ),
  versionsHeld: Object.fromEntries(scenario.sharedVersions.map((entry) => [entry.key, false])),
  remediation: Object.fromEntries(
    scenario.sharedRemediation.map((item) => [item.key, { documents: 1, itemHeld: false }]),
  ),
});

const blocking = (target) =>
  buildPlan({ target })
    .issues.filter((issue) => issue.blocks)
    .map((issue) => issue.message);

/** Each library of the products scenario, by its code, with its product. */
const libraries = [
  { library: products.library, product: products.product },
  ...work.productWork.libraries.map((library) => ({
    library,
    product: work.productWork.products.find((product) => product.library === library.code),
  })),
];

test("the scenario is one the seed can write", () => {
  assert.deepEqual(scenario.scenarioIssues(), []);
});

test("the Mission Computer is the component the founder named, carried from the X800's first assessment", () => {
  const [set] = scenario.sharedComponents;
  assert.equal(set.definition, "x800-components");
  assert.equal(set.owner, "Priya Raghavan");
  assert.equal(set.businessLine, "AD");
  assert.equal(set.assessment.assessor, "Elena Vasquez");
  assert.equal(set.assessment.completedOn, "2026-09-30");
  const [component] = set.components;
  assert.equal(component.name, "Mission Computer");
  assert.deepEqual(component.from, { product: "X800", version: 1, element: "GS-MC" });
  assert.deepEqual(component.determinations, {
    satisfied: 44,
    partially_satisfied: 6,
    other_than_satisfied: 4,
  });
  assert.equal(scenario.determinationCount(component), 54);
  assert.deepEqual(
    component.uses.map((use) => [use.program, use.system, use.element, use.component]),
    [["PRG-1090", "SYS-WSX90", "CN-109101", "LRU-001"]],
  );
});

test("each shared component is one the products scenario defines, pinned by the element named", () => {
  for (const set of scenario.sharedComponents) {
    const entry = libraries.find((item) => item.library.code === set.definition);
    assert.ok(entry?.product, `${set.definition} is not a component set of the products scenario`);
    for (const component of set.components) {
      const defined = entry.library.components.find((item) => item.name === component.name);
      assert.ok(defined, `${set.definition} defines no ${component.name}`);
      assert.equal(entry.product.code, component.from.product);
      const element = entry.product.elements.find((item) => item[0] === component.from.element);
      assert.ok(element, `${component.from.product} has no element ${component.from.element}`);
      assert.equal(element.at(-1), defined.key, `${component.from.element} is pinned elsewhere`);
    }
  }
});

test("its owners are the business lines' own, and its people are ones the products scenario adds", () => {
  for (const set of scenario.sharedComponents) {
    assert.equal(work.businessLineOwners[set.businessLine], set.owner);
    assert.ok(work.cast.includes(set.owner), `${set.owner} is not in the cast`);
    assert.ok(
      work.cast.includes(set.assessment.assessor),
      `${set.assessment.assessor} is not in the cast`,
    );
  }
});

test("a component assessment's dates and assessor are those of the product assessment it carries", () => {
  const sources = {
    [products.product.code]: products.product.assessment,
    ...Object.fromEntries(
      work.productWork.assessments.map((assessment) => [assessment.product, assessment]),
    ),
  };
  for (const set of scenario.sharedComponents) {
    const source = sources[set.components[0].from.product];
    assert.ok(source, `${set.definition}'s source product has no assessment in the scenario`);
    for (const key of ["startedOn", "completedOn", "publishedAt"])
      assert.equal(set.assessment[key], source[key], `${set.definition} ${key}`);
    const assessor = products.people[source.assessor] ?? source.assessor;
    assert.equal(set.assessment.assessor, assessor);
  }
});

test("what it leaves out is said, with the reason", () => {
  assert.deepEqual(
    scenario.notShared.map((entry) => entry.component),
    ["Cryptographic Module"],
  );
  assert.match(scenario.notShared[0].reason, /published product version/);
  // No determinations are offered: WS-X90's findings on the controls left were made elsewhere.
  assert.deepEqual(
    scenario.notOffered.map((entry) => [entry.kind, entry.component, entry.controls]),
    [["determinations", "Mission Computer", ["AC-12", "SC-7(21)", "SC-28(1)"]]],
  );
  assert.match(scenario.notOffered[0].reason, /None of the three findings was made on the mission/);
});

test("the finding that flows up is WS-X90's, on the Mission Computer, and waits on its owner", () => {
  const [finding, ...rest] = scenario.sharedFindings;
  assert.deepEqual(rest, []);
  assert.equal(finding.issue.title, "CVE-2024-6387 in the OpenSSH server (regreSSHion)");
  assert.equal(finding.issue.severity, "high");
  assert.equal(finding.issue.openedAt.slice(0, 10), "2026-10-10");
  assert.match(finding.issue.description, /authored, illustrative demo content/);
  assert.match(finding.observation.description, /authored, illustrative demo content/);
  assert.deepEqual(finding.use, { program: "PRG-1090", system: "SYS-WSX90", component: "LRU-001" });
  assert.equal(finding.component, "Mission Computer");
  assert.equal(finding.offer.offeredBy, "Ingrid Solberg");
  assert.equal(finding.offer.offeredAt.slice(0, 10), "2026-11-14");
  assert.ok(work.cast.includes(finding.offer.offeredBy), "who offers is not in the cast");
  // It is offered from a system component the scenario builds from the component, whose set's
  // owner is who the offer waits on.
  const use = scenario
    .uses()
    .find((item) => item.program === "PRG-1090" && item.component === finding.use.component);
  assert.equal(use.definition, finding.definition);
  assert.equal(use.name, finding.component);
  const set = scenario.sharedComponents.find((item) => item.definition === finding.definition);
  assert.equal(set.owner, "Priya Raghavan");
});

test("the SBOM is the Mission Computer's: a CycloneDX 1.5 list with the OpenSSH server the scan read", () => {
  const [sbom, ...rest] = scenario.sharedSboms;
  assert.deepEqual(rest, []);
  assert.equal(sbom.definition, "x800-components");
  assert.equal(sbom.component, "Mission Computer");
  assert.equal(sbom.format, "cyclonedx");
  assert.equal(sbom.specVersion, "1.5");
  assert.match(sbom.serial, /^urn:uuid:[0-9a-f-]{36}$/);
  // About a dozen components, each listed once, every one inside the image but the image itself.
  assert.equal(sbom.components.length, 13);
  assert.equal(new Set(sbom.components.map((item) => `${item.name} ${item.version}`)).size, 13);
  const [image, ...inside] = sbom.components;
  assert.equal(image.parent, undefined);
  assert.ok(inside.every((item) => item.parent === image.ref));
  // The server is the version the second chapter's observation read on LRU-001, and the SBOM was
  // generated before that scan.
  const server = sbom.components.find((item) => item.name === "openssh-server");
  assert.equal(server.version, "9.6p1");
  const [finding] = scenario.sharedFindings;
  assert.match(finding.observation.title, /OpenSSH server 9\.6p1/);
  assert.ok(sbom.generatedOn <= finding.observation.observedAt.slice(0, 10));
  // It describes a component the scenario shares, in the set it is shared from.
  assert.ok(
    scenario
      .uses()
      .some((use) => use.definition === sbom.definition && use.name === sbom.component),
  );
});

test("the CVE record says the facts given and no others, on the server, two controls and WS-X90's issue", () => {
  const [vulnerability, ...rest] = scenario.sharedVulnerabilities;
  assert.deepEqual(rest, []);
  assert.deepEqual(
    { ...vulnerability, title: undefined, description: undefined, affects: undefined },
    {
      cveId: "CVE-2024-6387",
      title: undefined,
      description: undefined,
      severity: "high",
      cvssScore: 8.1,
      cvssVector: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H",
      publishedOn: "2024-07-01",
      fixedIn: "OpenSSH 9.8p1",
      sourceUri: "https://nvd.nist.gov/vuln/detail/CVE-2024-6387",
      knownExploited: false,
      affects: undefined,
      controls: ["RA-5", "SI-2"],
      issues: ["cve-2024-6387"],
    },
  );
  assert.match(vulnerability.title, /regreSSHion/);
  assert.match(vulnerability.description, /signal handler race in OpenSSH's sshd/);
  assert.match(vulnerability.description, /8\.5p1 through 9\.7p1 and is fixed in 9\.8p1/);
  assert.deepEqual(
    vulnerability.affects.map((item) => [item.sbom, item.component, item.version, item.state]),
    [["mission-computer-image", "openssh-server", "9.6p1", "affected"]],
  );
  // Its row in WS-X90 is the issue the second chapter wrote and offered.
  const finding = scenario.sharedFindings.find((item) => item.key === vulnerability.issues[0]);
  assert.match(finding.issue.title, /^CVE-2024-6387 /);
  assert.equal(finding.issue.severity, vulnerability.severity);
  assert.equal(finding.use.program, "PRG-1090");
});

test("one Cyber T&E campaign is planned for WS-X90: cooperative vulnerability identification, early 2027", () => {
  const [test_, ...rest] = scenario.sharedCyberTests;
  assert.deepEqual(rest, []);
  assert.equal(test_.program, "PRG-1090");
  assert.equal(test_.phase, "cvi");
  assert.equal(test_.status, "planned");
  assert.equal(test_.startsAt.slice(0, 7), "2027-01");
  assert.equal(test_.endsAt.slice(0, 7), "2027-02");
  assert.match(test_.description, /authored, illustrative demo content/);
  assert.ok(work.cast.includes(test_.owner), "who owns the campaign is not in the cast");
  assert.ok(scenario.watchedPrograms.includes(test_.program));
});

test("version 2 of the X800 set is a draft that changes the Mission Computer's software and affects two controls", () => {
  const [entry, ...rest] = scenario.sharedVersions;
  assert.deepEqual(rest, []);
  assert.equal(entry.definition, "x800-components");
  assert.equal(entry.version, 2);
  // Left a draft, so nobody is behind yet.
  assert.equal(entry.state, "draft");
  assert.match(entry.remarks, /authored, illustrative demo content/);
  assert.deepEqual(
    entry.changes.map((change) => [change.component, change.kinds, change.controls]),
    [["Mission Computer", ["software"], ["RA-5", "SI-2"]]],
  );
  assert.match(entry.changes[0].summary, /OpenSSH server 9\.8p1/);
  // The controls its change affects are the ones the CVE bears on.
  assert.deepEqual(entry.changes[0].controls, scenario.sharedVulnerabilities[0].controls);
  // It is a version of a set the scenario assessed, of a component it shares.
  const set = scenario.sharedComponents.find((item) => item.definition === entry.definition);
  assert.ok(set.components.some((component) => component.name === entry.changes[0].component));
});

test("its SBOM is the first one's components with the fixed OpenSSH server, and records the CVE as fixed", () => {
  const [entry] = scenario.versions();
  const [sbom, ...rest] = entry.sboms;
  assert.deepEqual(rest, []);
  const [first] = scenario.sharedSboms;
  assert.equal(sbom.from, first.key);
  assert.equal(sbom.component, "Mission Computer");
  assert.equal(sbom.format, first.format);
  assert.equal(sbom.specVersion, first.specVersion);
  assert.notEqual(sbom.serial, first.serial);
  assert.ok(sbom.generatedOn > first.generatedOn);
  // The same thirteen components, in the same places, but for the server.
  assert.equal(sbom.components.length, 13);
  const differing = sbom.components.filter(
    (component, index) => JSON.stringify(component) !== JSON.stringify(first.components[index]),
  );
  assert.deepEqual(
    differing.map((component) => [component.name, component.version, component.parent]),
    [["openssh-server", "9.8p1", "image"]],
  );
  assert.match(differing[0].cpe, /openssh:9\.8:p1/);
  assert.deepEqual(
    sbom.vulnerabilities.map((item) => [item.cveId, item.component, item.state]),
    [["CVE-2024-6387", "openssh-server", "fixed"]],
  );
  // The version named is the one the CVE record says fixes it.
  assert.match(scenario.sharedVulnerabilities[0].fixedIn, /9\.8p1/);
});

test("the remediation item answers the CVE issue in WS-X90's POA&M, with three milestones in order", () => {
  const [item, ...rest] = scenario.sharedRemediation;
  assert.deepEqual(rest, []);
  assert.equal(item.program, "PRG-1090");
  assert.equal(item.document, "WS-X90 Sentinel Mission System — POA&M");
  assert.equal(item.status, "open");
  assert.match(item.description, /authored, illustrative demo content/);
  assert.deepEqual(
    item.milestones.map((milestone) => [milestone.title, milestone.plannedOn]),
    [
      ["Set LoginGraceTime 0 on the maintenance interface", "2026-11-17"],
      ["Take Mission Computer version 2", "2026-12-01"],
      ["Rescan LRU-001", "2026-12-08"],
    ],
  );
  assert.equal(item.plannedCompletion, "2026-12-08");
  // It answers the finding the second chapter wrote, in that finding's program, and is owned by
  // the person who owns the issue.
  const finding = scenario.sharedFindings.find((entry) => entry.key === item.finding);
  assert.equal(finding.use.program, item.program);
  assert.equal(finding.issue.owner, item.owner);
  assert.match(finding.issue.title, /^CVE-2024-6387 /);
});

test("the payload carries the scenario and the programs whose reads are compared", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.equal(payload.datasetId, "shared-components-v1");
  assert.deepEqual(payload.sharedComponents, scenario.sharedComponents);
  assert.deepEqual(payload.sharedFindings, scenario.sharedFindings);
  assert.deepEqual(payload.sharedSboms, scenario.sharedSboms);
  assert.deepEqual(payload.sharedVulnerabilities, scenario.sharedVulnerabilities);
  assert.deepEqual(payload.sharedCyberTests, scenario.sharedCyberTests);
  // A version goes with its SBOM written out, component by component.
  assert.deepEqual(payload.sharedVersions, scenario.versions());
  assert.equal(payload.sharedVersions[0].sboms[0].components.length, 13);
  assert.deepEqual(payload.sharedRemediation, scenario.sharedRemediation);
  assert.deepEqual(payload.watchedPrograms, ["PRG-1090", "PRG-2101"]);
});

test("the plan says what would be written, and nothing stops a workspace that holds what it stands on", () => {
  const plan = buildPlan({ target: readyTarget() });
  assert.deepEqual(plan.issues, []);
  const [set] = plan.summary.componentSets;
  assert.equal(set.owner, "Priya Raghavan");
  assert.match(set.assessment, /by Elena Vasquez, completed 2026-09-30/);
  assert.match(
    set.components[0].carries,
    /^54 determinations \(44 satisfied, 6 partially satisfied, 4 other than satisfied\) from X800 version 1/,
  );
  assert.deepEqual(set.components[0].alsoBacks, ["PRG-1090 SYS-WSX90: LRU-001 on CN-109101"]);
  assert.equal(plan.summary.notShared.length, 1);
  assert.deepEqual(plan.summary.offers, [
    {
      finding:
        "CVE-2024-6387 in the OpenSSH server (regreSSHion): high, opened 2026-10-10 in PRG-1090, observed on LRU-001",
      offer:
        "Offered on Mission Computer 2026-11-14 by Ingrid Solberg, waiting on Priya Raghavan in the Review queue",
    },
  ]);
  assert.equal(plan.summary.notOffered.length, 1);
  assert.match(plan.summary.notOffered[0], /^determinations on Mission Computer from PRG-1090/);
  assert.deepEqual(plan.summary.sboms, [
    "Mission Computer maintenance image SBOM: CycloneDX 1.5, generated 2026-10-08, 13 components of Mission Computer in x800-components",
  ]);
  assert.deepEqual(plan.summary.vulnerabilities, [
    {
      cve: "CVE-2024-6387: high, CVSS 8.1, published 2024-07-01, fixed in OpenSSH 9.8p1",
      affects: ["openssh-server 9.6p1 of mission-computer-image (affected)"],
      bearsOn: ["RA-5", "SI-2"],
      rows: ["PRG-1090: CVE-2024-6387 in the OpenSSH server (regreSSHion)"],
    },
  ]);
  assert.deepEqual(plan.summary.cyberTests, [
    "PRG-1090: WS-X90 cooperative vulnerability identification — FY2027, phase cvi, planned, 2027-01-11 to 2027-02-05, owned by Ingrid Solberg, with no plan yet",
  ]);
  assert.deepEqual(plan.summary.versions, [
    {
      version:
        "x800-components version 2, a draft: every component of version 1 with what it claims",
      changes: ["Mission Computer: software; affects RA-5, SI-2"],
      sboms: [
        "Mission Computer maintenance image SBOM, version 2: CycloneDX 1.5, generated 2026-11-15, 13 components, openssh-server 9.8p1; CVE-2024-6387 fixed",
      ],
    },
  ]);
  assert.deepEqual(plan.summary.remediation, [
    {
      item: "PRG-1090: Remediate CVE-2024-6387 on the Mission Computer, open, owned by Ingrid Solberg, planned for 2026-12-08, in WS-X90 Sentinel Mission System — POA&M",
      milestones: [
        "Set LoginGraceTime 0 on the maintenance interface, 2026-11-17",
        "Take Mission Computer version 2, 2026-12-01",
        "Rescan LRU-001, 2026-12-08",
      ],
    },
  ]);
});

test("the plan is built from one query that reads and writes nothing", () => {
  const query = targetQuery("00000000-0000-4000-8000-000000000001");
  assert.doesNotMatch(query, /\b(insert|update|delete|alter|create|drop|truncate)\b/i);
  // A component finds its element as the reads do: the one it names, else its inventory item's.
  assert.match(query, /system_component_element_links/);
  assert.match(query, /'shared-components-v1'/);
  // It asks whether the finding's campaign has a draft plan and whether the issue is there already.
  assert.match(query, /'draftPlan'/);
  assert.match(query, /'issueHeld'/);
  // And, for the third chapter, whether the CVE is recorded already, whether each control it bears
  // on is found once, and whether the cyber test's program and campaign are there.
  assert.match(query, /'cvesHeld'/);
  assert.match(query, /"CVE-2024-6387"/);
  assert.match(query, /'controls'/);
  assert.match(query, /'campaignHeld'/);
  // For the fourth, whether the set holds the version already, and whether the program holds the
  // POA&M document named and the remediation item.
  assert.match(query, /'versionsHeld'/);
  assert.match(query, /'documents'/);
  assert.match(query, /'itemHeld'/);
  assert.match(query, /WS-X90 Sentinel Mission System — POA&M/);
});

test("a workspace that already holds the scenario is left as it is", () => {
  const plan = buildPlan({ target: { ...readyTarget(), seeded: true } });
  assert.deepEqual(plan.issues, []);
  assert.match(plan.summary.state, /already holds the shared components scenario/);
});

test("what the scenario stands on must be there, and what is there is never overwritten", () => {
  const without = (change) => {
    const target = readyTarget();
    change(target);
    return blocking(target);
  };
  assert.match(
    without((target) => delete target.definitions["x800-components"])[0],
    /x800-components is not in this workspace/,
  );
  assert.match(
    without((target) => (target.definitions["x800-components"].version = null))[0],
    /no published version/,
  );
  assert.match(
    without((target) => (target.definitions["x800-components"].owner = "Someone else"))[0],
    /already names another owner or business line/,
  );
  assert.match(
    without((target) => (target.people["Elena Vasquez"] = 0))[0],
    /Expected one person named Elena Vasquez, found 0/,
  );
  assert.match(
    without((target) => (target.businessLines = ["MS"]))[0],
    /business line AD is not in this workspace/,
  );
  assert.match(
    without((target) => (target.components["x800-components/Mission Computer"].source = null))[0],
    /X800 version 1 has no published product assessment/,
  );
  assert.match(
    without(
      (target) => (target.components["x800-components/Mission Computer"].source.pinned = false),
    )[0],
    /GS-MC is not pinned to Mission Computer/,
  );
  assert.match(
    without(
      (target) =>
        (target.components["x800-components/Mission Computer"].source.determinations.satisfied =
          40),
    )[0],
    /recorded 40 satisfied, 6 partially satisfied, 4 other than satisfied on X800's GS-MC, not the 44 satisfied/,
  );
  assert.match(
    without((target) => (target.uses["PRG-1090/SYS-WSX90/LRU-001"] = null))[0],
    /holds no component LRU-001 on element CN-109101/,
  );
  assert.match(
    without(
      (target) =>
        (target.uses["PRG-1090/SYS-WSX90/LRU-001"].builtFrom = "component-a11/Mission Computer X"),
    )[0],
    /already built from component-a11\/Mission Computer X/,
  );
  assert.match(
    without((target) => (target.people["Ingrid Solberg"] = 0))[0],
    /Expected one person named Ingrid Solberg, found 0/,
  );
  assert.match(
    without((target) => (target.findings["cve-2024-6387"].draftPlan = false))[0],
    /WS-X90 continuous monitoring — FY2027 has no draft plan to take LRU-001/,
  );
  assert.match(
    without((target) => (target.findings["cve-2024-6387"].issueHeld = true))[0],
    /already holds an operational issue titled CVE-2024-6387 in the OpenSSH server/,
  );
  assert.match(
    without((target) => (target.cvesHeld = ["CVE-2024-6387"]))[0],
    /already holds a record of CVE-2024-6387/,
  );
  assert.match(
    without((target) => (target.controls["SI-2"] = 0))[0],
    /Expected one control coded SI-2 in a published catalog, found 0/,
  );
  assert.match(
    without((target) => (target.controls["RA-5"] = 2))[0],
    /Expected one control coded RA-5 in a published catalog, found 2/,
  );
  assert.match(
    without((target) => (target.cyberTests["ws-x90-cvi-fy2027"].program = false))[0],
    /program PRG-1090 is not in this workspace/,
  );
  assert.match(
    without((target) => (target.cyberTests["ws-x90-cvi-fy2027"].campaignHeld = true))[0],
    /already holds an assessment campaign titled WS-X90 cooperative vulnerability identification/,
  );
  assert.match(
    without((target) => (target.versionsHeld["x800-components-v2"] = true))[0],
    /x800-components already holds a version 2/,
  );
  assert.match(
    without((target) => (target.definitions["x800-components"].version = 3))[0],
    /latest published version of x800-components is 3, not the 1 that version 2 follows/,
  );
  assert.match(
    without((target) => (target.remediation["cve-2024-6387"].documents = 0))[0],
    /Expected one POA&M document titled WS-X90 Sentinel Mission System — POA&M in PRG-1090, found 0/,
  );
  assert.match(
    without((target) => (target.remediation["cve-2024-6387"].itemHeld = true))[0],
    /already holds a remediation item titled Remediate CVE-2024-6387 on the Mission Computer/,
  );
  // A component already built from the scenario's own component is no obstacle.
  assert.deepEqual(
    without(
      (target) =>
        (target.uses["PRG-1090/SYS-WSX90/LRU-001"].builtFrom = "x800-components/Mission Computer"),
    ),
    [],
  );
});

test("what the seed is meant to change is said as before and after, and nothing else is", () => {
  const before = {
    "PRG-1090 open operational issues": { open: 43, high: 11, low: 7, no_owner: 43 },
    "PRG-2101 open operational issues": { open: 7, high: 3, low: 1, no_owner: 0 },
    "review queue": { rows: 132, kinds: { evidence: 81, gate: 8 } },
  };
  const after = {
    "PRG-1090 open operational issues": { open: 44, high: 12, low: 7, no_owner: 43 },
    "PRG-2101 open operational issues": { open: 7, high: 3, low: 1, no_owner: 0 },
    "review queue": { rows: 133, kinds: { evidence: 81, gate: 8, component_offer: 1 } },
  };
  assert.deepEqual(effectLines({ before, after }), [
    "PRG-1090 open operational issues: open 43 to 44, high 11 to 12",
    "review queue: rows 132 to 133, component_offer 0 to 1",
  ]);
  assert.deepEqual(effectLines({ before, after: before }), []);
  assert.deepEqual(effectLines(), []);
  // The third chapter's counts read the same way: campaigns by kind, SBOMs and CVE records.
  assert.deepEqual(
    effectLines({
      before: {
        "PRG-1090 assessment campaigns": { campaigns: 3, kinds: { control_assessment: 3 } },
        "standing SBOMs": { sboms: 0, components: 0 },
        "CVE records": { records: 0, sbom_components: 0, programs_open: 0 },
      },
      after: {
        "PRG-1090 assessment campaigns": {
          campaigns: 4,
          kinds: { control_assessment: 3, cyber_test: 1 },
        },
        "standing SBOMs": { sboms: 1, components: 13 },
        "CVE records": { records: 1, sbom_components: 1, programs_open: 1 },
      },
    }),
    [
      "PRG-1090 assessment campaigns: campaigns 3 to 4, cyber_test 0 to 1",
      "standing SBOMs: sboms 0 to 1, components 0 to 13",
      "CVE records: records 0 to 1, sbom components 0 to 1, programs open 0 to 1",
    ],
  );
  // And the fourth's: the versions of the component sets and a program's remediation items.
  assert.deepEqual(
    effectLines({
      before: {
        "component set versions": { versions: 2, published: 2, drafts: 0, changes: 0 },
        "PRG-1090 remediation items": { items: 40, open: 33, milestones: 120 },
      },
      after: {
        "component set versions": { versions: 3, published: 2, drafts: 1, changes: 1 },
        "PRG-1090 remediation items": { items: 41, open: 34, milestones: 123 },
      },
    }),
    [
      "component set versions: versions 2 to 3, drafts 0 to 1, changes 0 to 1",
      "PRG-1090 remediation items: items 40 to 41, open 33 to 34, milestones 120 to 123",
    ],
  );
});

test("an existing read that moves is said with its totals before and after and what is inherited", () => {
  const status = (satisfied, noEvidence, notAssessed, controls, objectives) => ({
    totals: { controls: 560, satisfied, no_evidence: noEvidence, not_assessed: notAssessed },
    md5: `${satisfied}-${objectives}`,
    inherited: { controls, objectives },
  });
  const before = {
    "PRG-1090 program_control_status": status(174, 235, 90, 0, 0),
    "PRG-2101 program_control_status": status(98, 0, 4, 0, 0),
    "PRG-2101 X800-A-CUSA variant_control_delta": {
      totals: { controls: 374, inherited: 113, program_only: 152 },
      elements: { inherited: 10, modified: 2 },
      md5: "a",
    },
    "PRG-1090 SYS-WSX90 SSP 3 (published) ssp_control_rows": {
      totals: { controls: 546 },
      md5: "b",
    },
  };
  const after = {
    ...before,
    "PRG-1090 program_control_status": status(176, 234, 89, 2, 5),
    "PRG-2101 X800-A-CUSA variant_control_delta": {
      totals: { controls: 374, inherited: 114, program_only: 151 },
      elements: { inherited: 9, modified: 3 },
      md5: "c",
    },
    "PRG-1090 SYS-WSX90 SSP 3 (published) ssp_control_rows": {
      totals: { controls: 546 },
      md5: "d",
    },
  };
  // Only the reads the transaction names are said, in its order; one it does not name is not.
  assert.deepEqual(
    readLines({
      changed: [
        "PRG-1090 SYS-WSX90 SSP 3 (published) ssp_control_rows",
        "PRG-1090 program_control_status",
        "PRG-2101 X800-A-CUSA variant_control_delta",
      ],
      before,
      after,
    }),
    [
      "PRG-1090 SYS-WSX90 SSP 3 (published) ssp_control_rows: its totals stand and its answer differs",
      "PRG-1090 program_control_status: satisfied 174 to 176, no evidence 235 to 234, not assessed 90 to 89; 2 controls hold 5 inherited objectives (0 and 0 before)",
      "PRG-2101 X800-A-CUSA variant_control_delta: inherited 113 to 114, program only 152 to 151, elements inherited 10 to 9, elements modified 2 to 3",
    ],
  );
  // A revert reads the same way, the other way round; nothing moved says nothing.
  assert.deepEqual(
    readLines({ changed: ["PRG-1090 program_control_status"], before: after, after: before }),
    [
      "PRG-1090 program_control_status: satisfied 176 to 174, no evidence 234 to 235, not assessed 89 to 90; 0 controls hold 0 inherited objectives (2 and 5 before)",
    ],
  );
  assert.deepEqual(readLines({ changed: [], before, after }), []);
  assert.deepEqual(readLines(), []);
});
