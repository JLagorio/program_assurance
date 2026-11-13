import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import * as scenario from "../demo/showcase-scenario.mjs";
import { buildPayload, fiscalYear } from "../seed-demo-showcase.mjs";

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
