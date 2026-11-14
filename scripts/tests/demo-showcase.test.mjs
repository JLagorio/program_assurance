import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import * as scenario from "../demo/showcase-scenario.mjs";
import { buildPayload, evidenceOwners, fiscalYear, readArchive } from "../seed-demo-showcase.mjs";

const framework = (name) =>
  JSON.parse(gunzipSync(readFileSync(resolve("supabase/reference", `${name}.json.gz`))));
const cref = framework("NIST_SP-800-160v2r1_cyber-resiliency");
const attack = framework("NIST_SP-800-160v2r1_appendix-f");
const processes = framework("NIST_SP-800-160v1r1_life-cycle-processes");
const payload = buildPayload({
  tenantId: "71e1f800-a900-5100-8100-000000000001",
  accountUserId: "71e1f800-a900-5100-8100-000000000002",
  asOf: "2026-11-12",
  scenarioSha256: "0".repeat(64),
});

test("the fiscal year runs October to September", () => {
  assert.deepEqual(fiscalYear("2026-11-12"), {
    label: "FY2027",
    startsAt: "2026-10-01T00:00:00Z",
    endsAt: "2027-09-30T23:59:59Z",
  });
  assert.equal(fiscalYear("2026-09-30").label, "FY2026");
  assert.equal(fiscalYear("2026-10-01").label, "FY2027");
});

test("SA-24's values name items of the pinned cyber resiliency framework, as the read matches them", () => {
  const titles = (...kinds) =>
    new Set(
      cref.items
        .filter((item) => kinds.includes(item.kind))
        .map((item) => item.title.toLowerCase()),
    );
  const { sa24 } = scenario.tailoring;
  const slots = [
    [sa24.goals, titles("goal")],
    [sa24.objectives, titles("objective")],
    [sa24.techniques, titles("technique")],
    [sa24.approaches, titles("approach")],
    [sa24.designPrinciples, titles("strategic-design-principle", "structural-design-principle")],
  ];
  for (const [values, vocabulary] of slots)
    for (const value of values)
      assert.ok(vocabulary.has(value.toLowerCase()), `${value} names no item`);
  // Every approach chosen stands under a technique chosen.
  const techniques = new Map(
    cref.items.filter((item) => item.kind === "technique").map((item) => [item.code, item.title]),
  );
  for (const approach of cref.items.filter(
    (item) => item.kind === "approach" && sa24.approaches.includes(item.title),
  ))
    assert.ok(
      sa24.techniques.includes(techniques.get(approach.parent)),
      `${approach.title} is under an unchosen technique`,
    );
});

test("the tailored-in controls support the techniques SA-24 names in Table E-1", () => {
  const chosen = new Set(
    cref.items
      .filter((item) => scenario.tailoring.sa24.techniques.includes(item.title))
      .map((item) => item.code),
  );
  const parent = new Map(cref.items.map((item) => [item.code, item.parent]));
  const supported = new Set(
    cref.control_links
      .filter((link) => chosen.has(link.item) || chosen.has(parent.get(link.item)))
      .map((link) => link.control.toUpperCase().replace(/\.(\d+)$/, "($1)")),
  );
  for (const [code] of scenario.tailoring.include.filter(([code]) => code !== "SA-24"))
    assert.ok(supported.has(code), `${code} supports none of the chosen techniques`);
});

test("risks and gates name reference items the pinned transcriptions hold", () => {
  const techniques = new Set(
    attack.items.filter((item) => item.kind === "attack-technique").map((item) => item.code),
  );
  for (const [risk, codes] of Object.entries(scenario.riskTechniques))
    for (const code of codes)
      assert.ok(techniques.has(code), `${risk}: ${code} is not in Appendix F`);
  const outcomes = new Set(
    processes.items.filter((item) => item.kind === "outcome").map((item) => item.code),
  );
  for (const [gate, , , codes = []] of scenario.gates)
    for (const code of codes)
      assert.ok(outcomes.has(code), `${gate}: ${code} is not a security outcome`);
  const gateTitles = new Set(scenario.gates.map(([title]) => title));
  for (const [gate] of scenario.writtenCriteria) assert.ok(gateTitles.has(gate));
});

test("every role the scenario assigns names someone, and the provider offers only what it implements", () => {
  const roles = new Set(Object.keys(scenario.people));
  for (const task of payload.monitoring.schedule) assert.ok(roles.has(task.owner));
  for (const pkg of scenario.packages) {
    assert.ok(roles.has(pkg.owner));
    for (const version of pkg.versions) {
      if (version.review) assert.ok(roles.has(version.review[0]));
      if (version.decision) {
        assert.ok(roles.has(version.decision.by));
        assert.ok(version.publishedAt, "a decision is made on a published package version");
        assert.ok(
          ["authorized", "authorized_with_conditions", "denied", "revoked"].includes(
            version.decision.decision,
          ),
        );
        if (version.decision.expiresOn)
          assert.ok(version.decision.expiresOn >= version.decision.effectiveOn);
      }
    }
  }
  for (const capability of scenario.provider.capabilities)
    for (const code of capability.controls)
      assert.ok(scenario.provider.controls[code], `${capability.code} offers ${code}`);
  const components = new Set(scenario.provider.components.map(([code]) => code));
  for (const [code, [component]] of Object.entries(scenario.provider.controls))
    assert.ok(components.has(component), `${code} names an unknown component`);
});

test("the schedule and the scanner imports are laid out from the as-of day", () => {
  assert.equal(payload.monitoring.fiscalYear, "FY2027");
  const statuses = new Set([
    "planned",
    "ready",
    "in_progress",
    "blocked",
    "completed",
    "cancelled",
  ]);
  for (const task of payload.monitoring.schedule) {
    assert.ok(statuses.has(task.status));
    assert.ok(task.dueOn >= task.startsAt.slice(0, 10), `${task.title} is due before it starts`);
    assert.ok(
      task.startsAt >= payload.monitoring.startsAt,
      `${task.title} starts before the fiscal year`,
    );
    assert.ok(!task.title.includes("previous month"));
  }
  const open = payload.monitoring.schedule.filter(
    (task) => !["completed", "cancelled"].includes(task.status),
  );
  assert.ok(
    open.some((task) => task.dueOn < "2026-11-12"),
    "one open assessment reads overdue",
  );
  assert.ok(
    open.some((task) => task.dueOn >= "2026-11-12" && task.dueOn <= "2026-11-14"),
    "one reads due soon",
  );
  const uris = new Set();
  const jobStatuses = new Set([
    "queued",
    "validating",
    "ready",
    "importing",
    "completed",
    "failed",
    "cancelled",
  ]);
  for (const job of payload.scans.flatMap((group) => group.jobs)) {
    assert.ok(jobStatuses.has(job.status));
    assert.match(job.sha256, /^[a-f0-9]{64}$/);
    assert.ok(!uris.has(job.sourceUri), `${job.sourceUri} is named twice`);
    uris.add(job.sourceUri);
    if (job.status === "completed") assert.ok(job.completedAt >= job.startedAt);
    if (job.status === "queued") assert.equal(job.startedAt, undefined);
  }
});

// WS-X90's assessments: the archived results as determinations (archivedAssessments).

const archive = readArchive();
const determinationWords = new Set([
  "satisfied",
  "partially_satisfied",
  "other_than_satisfied",
  "not_assessed",
]);

test("the initial assessment records the archive's 74-control scope, one determination a control", () => {
  const { initial } = payload.assessments;
  const scope = archive.assessments.find((assessment) => assessment.id === initial.source);
  assert.equal(scope.scope.control_ids.length, 74);
  assert.deepEqual(
    initial.determinations.map((entry) => entry.control).sort(),
    [...scope.scope.control_ids].sort(),
  );
  for (const entry of initial.determinations) {
    assert.ok(determinationWords.has(entry.determination), entry.control);
    assert.ok(entry.determinedAt >= initial.startsAt && entry.determinedAt <= initial.endsAt);
    assert.ok(entry.determinedAt < initial.resultsPublishedAt);
    assert.ok(!/\{\w+\}/.test(entry.description), `${entry.control} keeps a placeholder`);
  }
});

test("a failure raised its finding, and the finding's severity decides how short it falls", () => {
  const raised = new Map(archive.findings.map((finding) => [finding.id, finding]));
  const short = [payload.assessments.initial, ...payload.assessments.expanded.increments]
    .flatMap((revision) => revision.determinations)
    .filter((entry) =>
      ["partially_satisfied", "other_than_satisfied"].includes(entry.determination),
    );
  assert.ok(short.length > 0);
  for (const entry of short) {
    const finding = raised.get(entry.finding);
    assert.ok(finding, `${entry.control} names no finding`);
    assert.ok(
      finding.control_ids.includes(entry.control),
      `${entry.finding} is not about ${entry.control}`,
    );
    assert.equal(
      entry.determination,
      ["high", "critical"].includes(finding.severity)
        ? "other_than_satisfied"
        : "partially_satisfied",
    );
  }
  for (const entry of payload.assessments.initial.determinations.filter(
    (item) => item.determination === "satisfied" || item.determination === "not_assessed",
  ))
    assert.equal(entry.finding, null);
});

test("the expanded assessment's first increment is published and the rest, to the as-of day, a draft", () => {
  const [first, second] = payload.assessments.expanded.increments;
  assert.ok(first.publishedAt > `${first.through}T23:59:59Z`);
  assert.equal(second.publishedAt, undefined);
  assert.equal(second.endsAt, null);
  for (const entry of first.determinations)
    assert.ok(entry.determinedAt.slice(0, 10) <= first.through);
  for (const entry of second.determinations) {
    assert.ok(entry.determinedAt.slice(0, 10) > first.through);
    assert.ok(
      entry.determinedAt.slice(0, 10) <= payload.asOf,
      `${entry.control} is judged after the as-of day`,
    );
  }
  // The first increment holds roughly half the widened scope, as the archive says.
  const widened = archive.assessments.find(
    (item) => item.id === payload.assessments.expanded.source,
  );
  const share = first.determinations.length / widened.scope.control_ids.length;
  assert.ok(share > 0.4 && share < 0.6, `the first increment holds ${share} of the scope`);
  // The expanded assessment judges what the widened scope added, not the original 74 again.
  const original = new Set(
    payload.assessments.initial.determinations.map((entry) => entry.control),
  );
  for (const entry of first.determinations) assert.ok(!original.has(entry.control), entry.control);
});

test("each evidence review follows the worst result that examined the version, on its day", () => {
  const reviews = Object.entries(payload.evidenceReviews);
  assert.ok(reviews.length > 0);
  const examined = new Map();
  for (const result of archive.assessment_results)
    if (result.assessed_on.slice(0, 10) <= payload.asOf)
      for (const evidence of result.evidence_ids)
        examined.set(evidence, [...(examined.get(evidence) ?? []), result]);
  for (const [evidence, review] of reviews) {
    const results = examined.get(evidence) ?? [];
    assert.ok(results.length, `${evidence} is reviewed and no result examined it`);
    const failed = results.some((result) => ["fail", "inconclusive"].includes(result.outcome));
    assert.equal(review.decision, failed ? "needs_revision" : "accepted", evidence);
    assert.ok(
      results.some((result) => result.assessed_on === review.reviewedAt),
      evidence,
    );
  }
});

test("each risk the showcase links a technique to says its threat, its weakness and why it carries its levels", () => {
  const { risks, fromRequirement, levels, due, dueAt } = scenario.riskAssessments;
  for (const title of Object.keys(scenario.riskTechniques)) {
    const words = risks[title];
    assert.ok(words, `${title} has no threat or vulnerability`);
    const [threat, vulnerability, rationale] = words;
    assert.ok(threat.trim() && vulnerability.trim(), title);
    assert.match(rationale, /likelihood: .+ impact: /i, `${title}'s rationale names no levels`);
  }
  for (const kind of ["Monitoring", "Configuration", "Enforcement", "Verification"]) {
    const [threat, vulnerability] = fromRequirement[kind];
    for (const text of [threat, vulnerability, fromRequirement.rationale])
      for (const [, key] of text.matchAll(/\{(\w+)\}/g))
        assert.ok(
          ["requirement", "controls", "elements", "likelihood", "impact"].includes(key),
          `${kind} names {${key}}`,
        );
    assert.match(vulnerability, /^\{requirement\} is not met: /);
  }
  assert.deepEqual(Object.keys(levels), ["very_low", "low", "moderate", "high", "very_high"]);
  // A response is due sooner the more severe its risk, whatever the response.
  for (const [response, days] of Object.entries(due)) {
    assert.ok(
      days.critical < days.high && days.high < days.moderate && days.moderate < days.low,
      response,
    );
  }
  assert.match(dueAt, /^\d{2}:\d{2}:\d{2}Z$/);
  assert.deepEqual(payload.riskAssessments, scenario.riskAssessments);
});

// Issue requirements (issue_requirements): the six "Unmet requirement" issues that cite no evidence.
test("each issue the scenario links names the requirement its title says it is about", () => {
  const links = Object.entries(scenario.issueRequirements);
  assert.equal(links.length, 6);
  for (const [issue, code] of links) {
    assert.match(code, /^REQ-\d{3}$/);
    assert.equal(issue, `Unmet requirement ${code}`);
  }
  assert.deepEqual(payload.issueRequirements, scenario.issueRequirements);
});

test("an artifact waiting on a review is owned by the person who holds its requirement's role", () => {
  const archive = readArchive();
  const roles = new Set(archive.requirements.map((item) => item.owner_role));
  // Every role the archive gives a requirement is held by someone of the program's team.
  assert.deepEqual([...roles].sort(), Object.keys(scenario.evidenceOwnerRoles).sort());
  const owners = evidenceOwners(archive);
  assert.equal(Object.keys(owners).length, archive.evidence.length);
  const team = new Set(Object.values(scenario.people));
  for (const [id, owner] of Object.entries(owners)) {
    assert.ok(team.has(owner), `${id} is owned by ${owner}, who is not on the team`);
    // The assessor reviews the evidence; nobody reviews what they own.
    assert.notEqual(owner, scenario.people.assessor);
  }
  const requirement = new Map(archive.requirements.map((item) => [item.id, item]));
  const first = archive.evidence[0];
  assert.equal(
    owners[first.id],
    scenario.people[
      scenario.evidenceOwnerRoles[requirement.get(first.requirement_ids[0]).owner_role]
    ],
  );
  assert.deepEqual(payload.evidenceOwners, owners);
});
