import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import * as scenario from "../demo/products-scenario.mjs";
import * as workScenario from "../demo/products-work-scenario.mjs";
import * as detailScenario from "../demo/products-detail-scenario.mjs";
import { buildPayload, buildPlan } from "../seed-demo-products.mjs";

// The products scenario as written, without a database: what the seed's transaction relies on.

const emptyTarget = {
  seeded: false,
  baselines: 1,
  businessLines: [],
  products: [],
  definitions: [],
  programs: [],
  systems: [],
  people: Object.values(scenario.people),
};

test("the scenario is one the seed can write", () => {
  assert.deepEqual(scenario.scenarioIssues(), []);
});

test("every configuration has elements of its own, beside a common core", () => {
  const codes = scenario.product.configurations.map((configuration) => configuration.code);
  assert.deepEqual(codes, ["A", "B", "C"]);
  for (const code of codes)
    assert.ok(
      scenario.product.elements.some((element) => element[4] === code && element[5]),
      `configuration ${code} has no pinned element of its own`,
    );
  const core = scenario.product.elements.filter((element) => element[4] === "*");
  assert.ok(core.length > scenario.product.elements.length / 2, "the core is the larger part");
});

test("each program shows every kind of change", () => {
  const all = { removed: 0, added: 0, changes: 0 };
  for (const program of scenario.programs) {
    const variant = program.variant;
    assert.ok(variant.changes.length > 0, `${program.code} changes nothing it inherited`);
    assert.ok(variant.added.length > 0, `${program.code} adds nothing of its own`);
    all.removed += variant.removed.length;
    all.added += variant.added.length;
    all.changes += variant.changes.length;
  }
  assert.ok(all.removed > 0, "no program leaves an element out");
  // Two programs take two different configurations.
  assert.equal(new Set(scenario.programs.map((program) => program.variant.configuration)).size, 2);
});

test("a changed element is one a library component stands behind, so controls move", () => {
  const pinned = new Map(scenario.product.elements.map((element) => [element[0], element[5]]));
  for (const program of scenario.programs)
    for (const [code] of program.variant.changes)
      assert.ok(pinned.get(code), `${program.code} changes ${code}, which claims no control`);
});

test("the spreads leave room for every determination and for none", () => {
  const { spread, weakSpread, wholeSpread, wholeShare } = scenario.product.assessment;
  for (const values of [spread, weakSpread, wholeSpread]) {
    assert.equal(values.length, 3);
    assert.ok(0 < values[0] && values[0] < values[1] && values[1] < values[2] && values[2] <= 100);
  }
  assert.ok(spread[2] < 100, "some claims stay not assessed");
  assert.ok(weakSpread[0] < spread[0], "a weak element stands worse");
  assert.ok(wholeShare > 0 && wholeShare < 100);
});

test("the payload carries the scenario and names the dataset", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.equal(payload.datasetId, "products-v1");
  assert.equal(payload.product.code, "X800");
  assert.equal(payload.programs.length, scenario.programs.length);
  assert.equal(payload.library.components.length, scenario.library.components.length);
});

test("the plan refuses what it would overwrite and says who is missing", () => {
  assert.deepEqual(buildPlan({ target: emptyTarget }).issues, []);
  const seeded = buildPlan({ target: { ...emptyTarget, seeded: true } });
  assert.match(seeded.summary.state, /already holds/);
  const taken = buildPlan({ target: { ...emptyTarget, products: ["X800"], baselines: 0 } });
  assert.equal(taken.issues.filter((issue) => issue.blocks).length, 2);
  const alone = buildPlan({ target: { ...emptyTarget, people: [] } });
  assert.equal(alone.issues.length, 1);
  assert.equal(alone.issues[0].blocks, false);
});

test("the customers' requirements fit the variants they are written for", () => {
  assert.deepEqual(scenario.requirementIssues(), []);
});

test("each document shows every answer, an unanswered requirement and every way of being met", () => {
  for (const program of scenario.programs) {
    const { items } = scenario.customerRequirements[program.code];
    const variant = program.variant;
    const changed = new Set(variant.changes.map((change) => change[0]));
    const own = new Set(variant.added.map((added) => added[0]));
    const statuses = new Set(items.map((item) => item[5]));
    for (const status of ["compliant", "partially_compliant", "non_compliant", null])
      assert.ok(
        statuses.has(status),
        `${program.code} has no ${status ?? "unanswered"} requirement`,
      );
    const metBy = new Set(
      items.map(([, , , elements]) =>
        !elements.length
          ? "unallocated"
          : elements.some((element) => changed.has(element))
            ? "variant_change"
            : elements.some((element) => own.has(element))
              ? "program"
              : "product",
      ),
    );
    assert.deepEqual([...metBy].sort(), ["product", "program", "unallocated", "variant_change"]);
    // What rests on a changed element is not yet called compliant.
    for (const [reference, , , elements, , status] of items)
      if (elements.some((element) => changed.has(element)))
        assert.notEqual(
          status,
          "compliant",
          `${program.code} ${reference} is compliant on a changed element`,
        );
  }
});

test("the payload carries each program's document with its element prefix", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.equal(payload.requirementsDatasetId, "products-requirements-v1");
  assert.deepEqual(
    payload.customerRequirements.map((entry) => [entry.program, entry.prefix, entry.items.length]),
    [
      ["PRG-2101", "CA", 14],
      ["PRG-2102", "CB", 14],
    ],
  );
});

test("a delta assessment is planned for a program of the scenario, and not for every one", () => {
  const codes = scenario.programs.map((program) => program.code);
  assert.ok(scenario.deltaAssessments.length > 0);
  assert.ok(
    scenario.deltaAssessments.length < scenario.programs.length,
    "one program stays unplanned",
  );
  for (const entry of scenario.deltaAssessments) {
    assert.ok(codes.includes(entry.program), `${entry.program} is not a program of the scenario`);
    assert.ok(entry.title.trim());
  }
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.equal(payload.assessmentDatasetId, "products-assessment-v1");
  assert.deepEqual(payload.deltaAssessments, scenario.deltaAssessments);
});

test("the plan names only the steps a workspace still lacks", () => {
  const partly = buildPlan({ target: { ...emptyTarget, seeded: true, requirementsSeeded: true } });
  assert.match(partly.summary.state, /products scenario, the customers' requirements\.$/);
  assert.equal(partly.summary.customerRequirements, undefined);
  assert.equal(partly.summary.deltaAssessments.length, scenario.deltaAssessments.length);
  const whole = buildPlan({
    target: { ...emptyTarget, seeded: true, requirementsSeeded: true, assessmentsSeeded: true },
  });
  assert.equal(whole.summary.deltaAssessments, undefined);
  // A workspace that holds the first three is given the fourth alone.
  assert.match(whole.summary.state, /the delta assessments\.$/);
  assert.deepEqual(Object.keys(whole.summary.work.programs), ["PRG-2101", "PRG-2102", "PRG-2201"]);
  const all = buildPlan({
    target: {
      ...emptyTarget,
      seeded: true,
      requirementsSeeded: true,
      assessmentsSeeded: true,
      workSeeded: true,
    },
  });
  assert.match(all.summary.state, /the programs' work\.$/);
  assert.equal(all.summary.work, undefined);
  // A workspace that holds the first four is given the fifth alone.
  assert.deepEqual(Object.keys(all.summary.detail.programs), ["PRG-2101", "PRG-2102", "PRG-2201"]);
  // A workspace whose fifth step ran before the review queue's records is given them alone.
  const fifth = {
    ...emptyTarget,
    seeded: true,
    requirementsSeeded: true,
    assessmentsSeeded: true,
    workSeeded: true,
    detailSeeded: true,
  };
  const waiting = buildPlan({ target: fifth });
  assert.match(waiting.summary.state, /the programs' work\.$/);
  assert.equal(waiting.summary.detail, undefined);
  assert.match(waiting.summary.reviewQueue.productAssessment, /^G40 .* High baseline, a draft/);
  const every = buildPlan({ target: { ...fifth, reviewSeeded: true } });
  assert.match(every.summary.state, /the records one click down\.$/);
  assert.equal(every.summary.detail, undefined);
  assert.equal(every.summary.reviewQueue, undefined);
});

// The fourth step, the programs' work, as written.

const customerPrograms = scenario.programs.map((program) => program.code);
const openTask = (task) => !["done", "cancelled"].includes(task[1]);

test("the programs' work is a step the seed can write", () => {
  assert.deepEqual(workScenario.workIssues(), []);
  assert.deepEqual(
    workScenario.workPrograms().map((program) => program.code),
    Object.keys(workScenario.work),
  );
});

test("each customer program has a task in every status, some overdue and some due soon", () => {
  for (const code of customerPrograms) {
    const { tasks, workstreams } = workScenario.work[code];
    assert.deepEqual(
      [...new Set(tasks.map((task) => task[1]))].sort(),
      ["blocked", "cancelled", "done", "in_progress", "open", "waiting"],
      `${code} lacks a task status`,
    );
    const open = tasks.filter(openTask);
    assert.ok(
      open.some((task) => task[4] < 0),
      `${code} has no overdue task`,
    );
    // Due soon is today and the two days after it.
    assert.ok(
      open.some((task) => task[4] >= 0 && task[4] <= 2),
      `${code} has no task due soon`,
    );
    assert.ok(
      tasks.some((task) => task[3] === workScenario.account),
      `${code} has no task of the account's own`,
    );
    assert.ok(new Set(workstreams.map((workstream) => workstream[3])).size >= 3);
  }
});

test("each customer program's gates stand complete, under way, at risk and to come", () => {
  for (const code of customerPrograms) {
    const statuses = new Set(workScenario.work[code].gates.map((gate) => gate.status));
    for (const status of ["completed", "in_review", "at_risk", "not_started"])
      assert.ok(statuses.has(status), `${code} has no gate ${status}`);
    assert.ok(
      workScenario.work[code].gates.some((gate) => gate.outcomes.length && gate.criteria.length),
      `${code} has no gate with a drawn and a written criterion`,
    );
  }
});

test("each customer program has an issue at every severity and a risk in every status", () => {
  for (const code of customerPrograms) {
    const { issues, risks, observations } = workScenario.work[code];
    assert.deepEqual(
      [...new Set(issues.map((issue) => issue.severity))].sort(),
      ["critical", "high", "low", "moderate"],
      `${code} lacks an issue severity`,
    );
    assert.ok(issues.some((issue) => issue.status === "resolved"));
    assert.ok(issues.some((issue) => issue.status === "closed"));
    assert.ok(issues.filter((issue) => issue.observations.length).length >= issues.length / 2);
    assert.deepEqual(
      [...new Set(risks.map((risk) => risk.status))].sort(),
      ["accepted", "closed", "investigating", "open", "responding"],
      `${code} lacks a risk status`,
    );
    // Every observation is folded into an issue, so a risk that rests on one reaches its issue.
    const folded = new Set(issues.flatMap((issue) => issue.observations));
    for (const [key] of observations) assert.ok(folded.has(key), `${code} ${key} is in no issue`);
    assert.ok(risks.filter((risk) => risk.techniques.length).length >= 3);
    // The Portfolio's matrix places a risk by both.
    assert.ok(new Set(risks.map((risk) => `${risk.likelihood}|${risk.impact}`)).size >= 4);
  }
});

test("each customer program's remediation has milestones reached and still to reach", () => {
  for (const code of customerPrograms) {
    const { items } = workScenario.work[code].poam;
    const milestones = items.flatMap((item) => item.milestones);
    assert.ok(milestones.some((milestone) => milestone[3] === "completed"));
    assert.ok(milestones.some((milestone) => milestone[3] !== "completed"));
    assert.ok(items.some((item) => item.status === "completed"));
    assert.ok(items.some((item) => item.status === "overdue" && item.planned < 0));
    assert.ok(
      items.some((item) => item.published === false),
      `${code} has no commitment still a draft`,
    );
    for (const item of items) assert.ok(item.issues.length, `${code} ${item.key} answers nothing`);
  }
});

test("most of a customer's requirements cite evidence, and its reviews are not all alike", () => {
  for (const program of workScenario.workPrograms()) {
    const { evidence } = workScenario.work[program.code];
    const cited = new Set(evidence.flatMap((item) => item.requirements ?? []));
    assert.ok(
      cited.size > program.requirements.items.length / 2,
      `${program.code} cites evidence for ${cited.size} of its requirements`,
    );
    const decisions = new Set(evidence.map((item) => item.review?.[0]));
    for (const decision of ["accepted", "needs_revision", "pending"])
      assert.ok(decisions.has(decision), `${program.code} has no evidence ${decision}`);
    assert.ok(evidence.some((item) => item.first || program.code === "PRG-2201"));
  }
});

test("a delta assessment judges part of what a variant owes, and names what the issues found", () => {
  const judged = customerPrograms.map((code) => workScenario.work[code].assessment.results.judged);
  // Customer A's is taken further than Customer B's.
  assert.ok(judged[0] > 2 * judged[1] && judged[1] > 0);
  for (const code of customerPrograms) {
    const { named } = workScenario.work[code].assessment.results;
    assert.ok(named.some((finding) => finding.determination === "other_than_satisfied"));
    assert.ok(named.filter((finding) => finding.risk).length >= 2);
  }
});

test("one variant of the X800 takes its second version and the other is left the update", () => {
  const taking = customerPrograms.filter(
    (code) => workScenario.work[code].takesVersion !== undefined,
  );
  assert.deepEqual(taking, ["PRG-2102"]);
  assert.equal(
    workScenario.work["PRG-2102"].takesVersion,
    workScenario.productWork.carried.version,
  );
  // It takes the version once its SSP is published, which this step does.
  assert.ok(Number.isInteger(workScenario.work["PRG-2102"].ssp.publish));
});

test("neither business line is left without a product assessed and a program", () => {
  const programs = workScenario.workPrograms();
  const assessed = new Set([
    scenario.product.code,
    ...workScenario.productWork.assessments.map((assessment) => assessment.product),
  ]);
  const products = [
    scenario.product,
    ...scenario.otherProducts,
    ...workScenario.productWork.products,
  ];
  for (const line of scenario.businessLines) {
    assert.ok(
      products.some((product) => product.businessLine === line.code && assessed.has(product.code)),
      `${line.code} has no assessed product`,
    );
    assert.ok(
      programs.some((program) => program.businessLine === line.code),
      `${line.code} has no program`,
    );
    assert.ok(workScenario.businessLineOwners[line.code] && line.description.trim());
  }
  // The draft stays a draft, pinned so it shows what it claims; every published product is assessed.
  const draft = scenario.otherProducts.find((product) => product.state === "draft");
  assert.deepEqual(
    workScenario.productWork.pins.map((pin) => pin.product),
    [draft.code],
  );
  assert.equal(
    Object.keys(workScenario.productWork.pins[0].elements).length,
    draft.elements.length,
  );
  for (const product of scenario.otherProducts.filter((item) => item.state === "published"))
    assert.ok(assessed.has(product.code), `${product.code} is published and not assessed`);
});

test("the payload lays the work out from a day and carries each variant's prefix", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
    workScenarioSha256: "1".repeat(64),
    asOf: "2026-11-13",
  });
  assert.equal(payload.workDatasetId, "products-work-v1");
  assert.equal(payload.asOf, "2026-11-13");
  assert.equal(payload.workScenarioSha256, "1".repeat(64));
  assert.deepEqual(payload.workOrder, ["PRG-2101", "PRG-2102", "PRG-2201"]);
  assert.deepEqual(
    payload.workOrder.map((code) => payload.work[code].prefix),
    ["CA", "CB", "CC"],
  );
  assert.equal(payload.productWork.programs[0].baseline, "NIST SP 800-53 Rev 5 Moderate baseline");
  // The first three steps read what they read before.
  assert.equal(payload.datasetId, "products-v1");
  assert.equal(payload.customerRequirements.length, scenario.programs.length);
});

test("the fourth step refuses what it would overwrite and a baseline it cannot find", () => {
  const held = { ...emptyTarget, seeded: true, requirementsSeeded: true, assessmentsSeeded: true };
  assert.deepEqual(buildPlan({ target: held }).issues, []);
  const taken = buildPlan({
    target: {
      ...held,
      workProducts: ["G25"],
      workPrograms: ["PRG-2201"],
      missingBaselines: ["NIST SP 800-53 Rev 5 Moderate baseline"],
    },
  });
  assert.equal(taken.issues.filter((issue) => issue.blocks).length, 3);
  // Once the step has run, what it wrote is its own and stops nothing.
  const done = buildPlan({
    target: { ...held, workSeeded: true, workProducts: ["G25"], workPrograms: ["PRG-2201"] },
  });
  assert.deepEqual(done.issues, []);
});

// The fifth step, the records one click down, as written.

const detailPrograms = Object.keys(detailScenario.detail);

test("the records one click down are a step the seed can write", () => {
  assert.deepEqual(detailScenario.detailIssues(), []);
  assert.deepEqual(
    detailPrograms,
    workScenario.workPrograms().map((program) => program.code),
  );
});

test("every customer requirement is verified by a procedure of its program", () => {
  for (const program of workScenario.workPrograms()) {
    const entry = detailScenario.detail[program.code];
    const references = [
      ...program.requirements.items.map((item) => item[0]),
      ...(entry.requirements ?? []).map((item) => item[0]),
    ];
    const verified = new Set(entry.procedures.flatMap((procedure) => procedure.requirements));
    for (const reference of references)
      assert.ok(verified.has(reference), `${program.code} ${reference} has no verification`);
  }
});

test("every customer requirement cites evidence once the fifth step has run", () => {
  for (const program of workScenario.workPrograms()) {
    const entry = detailScenario.detail[program.code];
    const steps = workScenario.work[program.code];
    const cited = new Set([
      ...steps.evidence.filter((item) => !item.draft).flatMap((item) => item.requirements ?? []),
      ...(entry.evidence ?? []).flatMap((item) => item.requirements),
    ]);
    for (const reference of [
      ...program.requirements.items.map((item) => item[0]),
      ...(entry.requirements ?? []).map((item) => item[0]),
    ])
      assert.ok(cited.has(reference), `${program.code} ${reference} cites no evidence`);
  }
  assert.match(detailScenario.passageDiscussion.body, /\{reference\}/);
});

test("each campaign of a program has two completed runs of one procedure to compare", () => {
  for (const [code, entry] of Object.entries(detailScenario.detail)) {
    const campaigns = [
      "delta",
      "witness",
      ...detailScenario.productDetail.variants
        .filter((variant) => variant.program === code)
        .map((variant) => variant.code),
    ];
    for (const campaign of campaigns) {
      const completed = entry.runs.filter(
        (run) => run.campaign === campaign && run.completed !== null,
      );
      const byProcedure = Object.groupBy(completed, (run) => run.procedure);
      assert.ok(
        Object.values(byProcedure).some((runs) => runs.length >= 2),
        `${code} ${campaign} has nothing to compare`,
      );
    }
    // A run's results say something wherever a step is short of met.
    for (const run of entry.runs)
      run.results.forEach((result, index) => {
        if (result !== "met")
          assert.ok(run.findings[index], `${code} "${run.title}" step ${index + 1}`);
      });
  }
});

test("every issue gets an observation, a remediation item and, through its risk, a task", () => {
  for (const code of detailPrograms) {
    const steps = workScenario.work[code];
    const entry = detailScenario.detail[code];
    const observed = new Set([
      ...steps.issues.filter((issue) => issue.observations.length).map((issue) => issue.key),
      ...entry.observations.map((item) => item[1]),
    ]);
    const answered = new Set([
      ...steps.poam.items.flatMap((item) => item.issues),
      ...entry.remediation.flatMap((item) => item.issues),
    ]);
    // Each observation an issue holds belongs to a risk that has a task.
    const risks = [...steps.risks, ...entry.risks];
    const linked = new Set(
      steps.taskLinks.filter((link) => link[1] === "risk").map((link) => link[2]),
    );
    const tasked = new Set(
      risks
        .filter((risk) => linked.has(risk.key) || entry.riskTasks[risk.key])
        .map((risk) => risk.key),
    );
    const observationsOf = (risk) => [
      ...risk.observations,
      ...(entry.reassessed?.[risk.key]?.observations ?? []),
    ];
    const issueObservations = (issue) => [
      ...issue.observations,
      ...entry.observations.filter((item) => item[1] === issue.key).map((item) => item[0]),
    ];
    for (const issue of steps.issues) {
      assert.ok(observed.has(issue.key), `${code} ${issue.key} has no observation`);
      assert.ok(answered.has(issue.key), `${code} ${issue.key} has no remediation item`);
      assert.ok(
        risks.some(
          (risk) =>
            tasked.has(risk.key) &&
            observationsOf(risk).some((key) => issueObservations(issue).includes(key)),
        ),
        `${code} ${issue.key} rests under no risk with a task`,
      );
    }
  }
});

test("the products nobody had taken are published, assessed and taken", () => {
  const variants = detailScenario.productDetail.variants;
  const assessed = new Set(detailScenario.productDetail.assessments.map((item) => item.product));
  for (const product of scenario.otherProducts) {
    assert.ok(
      variants.some((variant) => variant.product === product.code),
      `${product.code} has no variant`,
    );
    assert.ok(assessed.has(product.code), `${product.code} has no assessment`);
  }
  // Each new variant reads a change and has its own delta assessment.
  for (const variant of variants) {
    assert.ok(variant.changes.length, `${variant.code} changes nothing`);
    assert.ok(detailScenario.variantAssessments[variant.code], `${variant.code} is not assessed`);
  }
  // R210's first version is judged for the unit as a whole, having no element pinned.
  const r210 = detailScenario.productDetail.assessments.find(
    (item) => item.product === "R210" && item.version === 1,
  );
  assert.ok(r210 && !r210.spread && r210.wholeFamilies.length);
});

test("the customer documents are cited from a reserved host and name no file", () => {
  for (const entry of Object.values(detailScenario.detail)) {
    assert.match(entry.document.uri, /^https:\/\/[a-z0-9.-]+\.example\//);
    assert.ok(entry.document.firstPage > 0);
  }
});

test("the payload carries the fifth step", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
    detailScenarioSha256: "2".repeat(64),
    asOf: "2026-11-13",
  });
  assert.equal(payload.detailDatasetId, "products-detail-v1");
  assert.equal(payload.detailScenarioSha256, "2".repeat(64));
  assert.deepEqual(Object.keys(payload.detail), detailPrograms);
  assert.equal(payload.productDetail.variants.length, 2);
  for (const status of [
    "compliant",
    "partially_compliant",
    "non_compliant",
    "not_applicable",
    "unanswered",
  ])
    assert.ok(payload.discussions[status]?.subject, `no discussion opens on ${status}`);
  for (const status of ["open", "in_progress", "waiting", "blocked", "done", "cancelled"])
    assert.ok(payload.taskComments[status], `no comment for a task ${status}`);
});

test("the fifth step refuses a variant code the workspace already has", () => {
  const held = {
    ...emptyTarget,
    seeded: true,
    requirementsSeeded: true,
    assessmentsSeeded: true,
    workSeeded: true,
  };
  assert.deepEqual(buildPlan({ target: held }).issues, []);
  const taken = buildPlan({ target: { ...held, detailSystems: ["R210-STD-CUSA"] } });
  assert.equal(taken.issues.filter((issue) => issue.blocks).length, 1);
  const done = buildPlan({
    target: { ...held, detailSeeded: true, detailSystems: ["R210-STD-CUSA"] },
  });
  assert.deepEqual(done.issues, []);
});

// The sixth step, Customer A's overlay, and the seventh, the flow-down, as written.

const highBaseline = new Set(
  JSON.parse(
    gunzipSync(
      readFileSync(resolve("supabase/reference/NIST_SP-800-53_rev5_HIGH-baseline_profile.json.gz")),
    ),
  ).profile.imports.flatMap((entry) =>
    (entry["include-controls"] ?? []).flatMap((selection) => selection["with-ids"] ?? []),
  ),
);
// "SI-7(6)" as the profile names it: "si-7.6".
const profileId = (code) => code.toLowerCase().replace(/\((\d+)\)$/, ".$1");

test("Customer A's overlay changes the High baseline with every decision, for a reason", () => {
  const overlay = scenario.customerOverlay;
  assert.equal(highBaseline.size, 370);
  assert.equal(new Set(overlay.decisions.map(([code]) => code)).size, overlay.decisions.length);
  const paragraphs = new Set(
    scenario.customerRequirements[overlay.program].items.map(([ref]) => ref),
  );
  for (const [code, action, rationale] of overlay.decisions) {
    assert.ok(["include", "exclude"].includes(action), `${code}: ${action}`);
    assert.equal(
      highBaseline.has(profileId(code)),
      action === "exclude",
      `${code} changes nothing`,
    );
    assert.ok(rationale.trim().length > 20, `${code} has no rationale`);
    if (action === "include") {
      // An add cites the paragraph of the customer's document that calls for it.
      const cited = rationale.match(/^CUSA-SSRD (\d+\.\d+\.\d+) /)?.[1];
      assert.ok(cited && paragraphs.has(cited), `${code} cites no paragraph of CUSA-SSRD`);
    }
  }
  const adds = overlay.decisions.filter(([, action]) => action === "include").length;
  assert.ok(adds >= 4 && adds <= 8, "a handful of adds");
  assert.ok(overlay.decisions.length - adds >= 1, "a removal");
});

test("the overlay step is planned once, and refuses a code the workspace already uses", () => {
  const held = { ...emptyTarget, seeded: true, requirementsSeeded: true, assessmentsSeeded: true };
  const plan = buildPlan({ target: { ...held, workSeeded: true, detailSeeded: true } });
  assert.deepEqual(plan.summary.customerOverlay.adds, [
    "CM-14",
    "SI-7(6)",
    "SC-12(2)",
    "AC-4(21)",
    "SC-32",
    "SR-4",
  ]);
  assert.deepEqual(plan.summary.customerOverlay.removes, ["SC-15", "PE-17"]);
  const taken = buildPlan({ target: { ...held, overlayTaken: true } });
  assert.equal(taken.issues.filter((issue) => issue.blocks).length, 1);
  // A workspace that holds the overlay but not its place on Customer A's stack is given that place.
  const unstacked = buildPlan({ target: { ...held, overlaySeeded: true, overlayTaken: true } });
  assert.deepEqual(unstacked.issues, []);
  assert.match(unstacked.summary.customerOverlay, /puts it on top of PRG-2101's stack/);
  const done = buildPlan({
    target: { ...held, overlaySeeded: true, overlayTaken: true, overlayStacked: true },
  });
  assert.deepEqual(done.issues, []);
  assert.equal(done.summary.customerOverlay, undefined);
  assert.match(done.summary.state, /the customer overlay\.$/);
  // A stack that holds the overlay, where a control it adds is not yet mapped, is given the mapping.
  const unmapped = buildPlan({
    target: {
      ...held,
      overlaySeeded: true,
      overlayTaken: true,
      overlayStacked: true,
      overlayUnmapped: ["SC-32"],
    },
  });
  assert.equal(
    unmapped.summary.customerOverlay,
    "OVL-CUSA-SSRD is in the library; the run maps SC-32 to the requirements that call for them.",
  );
});

test("each control the overlay adds is mapped to the paragraph that calls for it", () => {
  const overlay = scenario.customerOverlay;
  const items = new Map(
    scenario.customerRequirements[overlay.program].items.map((item) => [item[0], item]),
  );
  const maps = scenario.overlayRequirementMaps();
  assert.deepEqual(
    maps.map(([control]) => control),
    overlay.decisions.filter(([, action]) => action === "include").map(([control]) => control),
  );
  for (const [control, reference] of maps) {
    assert.ok(items.has(reference), `${control} cites ${reference}, which CUSA-SSRD does not hold`);
    assert.ok(highBaseline.has(profileId(control)) === false, `${control} is in the High baseline`);
  }
  // 3.3.2 maps CM-14 from the import; the other five are mapped by the sixth step.
  const already = maps.filter(([control, reference]) => items.get(reference)[4].includes(control));
  assert.deepEqual(already, [["CM-14", "3.3.2"]]);
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.deepEqual(payload.overlayMaps, maps);
  assert.equal(payload.overlayDocument, "CUSA-SSRD");
  assert.ok(payload.overlayMapRationale.trim());
});

test("what waits on a reviewer: a draft product assessment and a package with the customer", () => {
  const { productAssessment, package: submitted } = detailScenario.reviewQueue;
  const g40 = scenario.otherProducts.find((item) => item.code === productAssessment.product);
  const elements = new Set(g40.elements.map((element) => element[0]));
  const judged = new Set();
  for (const [element, controls, determination, rationale] of productAssessment.determinations) {
    assert.ok(element === null || elements.has(element), `${element} is not an element of the G40`);
    assert.ok(["satisfied", "partially_satisfied", "other_than_satisfied"].includes(determination));
    assert.ok(rationale.trim().length > 20, `${controls} have no rationale`);
    for (const control of controls) {
      // A determination names a control of the assessment's baseline, once an element.
      assert.ok(highBaseline.has(profileId(control)), `${control} is not in the High baseline`);
      const key = `${element}/${control}`;
      assert.ok(!judged.has(key), `${key} is judged twice`);
      judged.add(key);
    }
  }
  assert.ok(judged.size >= 5 && judged.size <= 15, "a handful of determinations");
  assert.ok(
    productAssessment.determinations.some(([element]) => element === null),
    "something is judged for the terminal as a whole",
  );
  // The package holds what its program's draft package holds, and is reviewed once submitted.
  const draft = workScenario.work[submitted.program].package;
  for (const document of submitted.documents) assert.ok(draft.documents.includes(document));
  assert.ok(submitted.review[3] >= submitted.submitted);
  const gate = workScenario.work[submitted.program].gates.find(
    (item) => item.title === "Variant security plan approval",
  );
  assert.equal(gate.status, "in_review");
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
  });
  assert.deepEqual(payload.reviewQueue, detailScenario.reviewQueue);
});

test("the flow-down names each element once a requirement, and only requirements of its program", () => {
  const { allocations, evidence } = detailScenario.flowDown;
  const references = (program) =>
    new Set(
      [
        ...(scenario.customerRequirements[program]?.items ?? []),
        ...(workScenario.productWork.programs.find((item) => item.code === program)?.requirements
          .items ?? []),
        ...(detailScenario.detail[program]?.requirements ?? []),
      ].map(([reference]) => reference),
    );
  const prefixes = { "PRG-2101": "CA-", "PRG-2102": "CB-", "PRG-2201": "CC-" };
  assert.deepEqual(Object.keys(allocations), Object.keys(prefixes));
  for (const [program, list] of Object.entries(allocations)) {
    const known = references(program);
    const seen = new Set();
    const perElement = new Map();
    for (const [reference, element, rationale] of list) {
      assert.ok(known.has(reference), `${program} allocates the unknown ${reference}`);
      assert.ok(
        element.startsWith(prefixes[program]),
        `${element} is not an element of ${program}`,
      );
      assert.ok(rationale.trim().length > 20, `${reference} to ${element} has no rationale`);
      assert.ok(!seen.has(`${reference}/${element}`), `${reference} to ${element} twice`);
      seen.add(`${reference}/${element}`);
      perElement.set(element, (perElement.get(element) ?? 0) + 1);
    }
    // An element carries what concerns it, never every requirement.
    for (const [element, count] of perElement) assert.ok(count <= 2, `${element} carries ${count}`);
  }
  assert.match(detailScenario.flowDown.parent, /\{elements\}/);
  const cast = new Set(workScenario.cast);
  const keys = new Set();
  for (const item of evidence) {
    assert.ok(references(item.program).has(item.requirement), `${item.key}: ${item.requirement}`);
    assert.ok(cast.has(item.owner) && cast.has(item.reviewer), `${item.key} names someone unknown`);
    assert.ok(item.collected < 0, `${item.key} is collected in the future`);
    assert.ok(!keys.has(item.key), `${item.key} twice`);
    keys.add(item.key);
  }
});

test("the payload carries the sixth and seventh steps, and the plan names them", () => {
  const payload = buildPayload({
    tenantId: "t",
    accountUserId: "u",
    scenarioSha256: "0".repeat(64),
    asOf: "2026-11-13",
  });
  assert.equal(payload.overlayDatasetId, "products-overlay-v1");
  assert.deepEqual(payload.customerOverlay, scenario.customerOverlay);
  assert.equal(payload.flowDownDatasetId, "products-flowdown-v1");
  assert.deepEqual(payload.flowDown, detailScenario.flowDown);
  const plan = buildPlan({
    target: {
      ...emptyTarget,
      seeded: true,
      requirementsSeeded: true,
      assessmentsSeeded: true,
      workSeeded: true,
      detailSeeded: true,
      overlaySeeded: true,
    },
  });
  assert.deepEqual(Object.keys(plan.summary.flowDown.allocations), [
    "PRG-2101",
    "PRG-2102",
    "PRG-2201",
  ]);
  assert.equal(plan.summary.flowDown.evidence.length, detailScenario.flowDown.evidence.length);
});

test("a delta assessment's results follow the program's trouble, not a spread", () => {
  for (const program of workScenario.workPrograms()) {
    const { results } = workScenario.work[program.code].assessment;
    assert.equal(results.spread, undefined, `${program.code} keeps a spread`);
    assert.equal(results.changedSpread, undefined, `${program.code} keeps a spread`);
    assert.ok(results.areas.length > 0, `${program.code} finds no trouble`);
    // Other than satisfied is said of a named control only, where the story's worst trouble sits.
    assert.ok(results.areas.every((area) => area.determination === "partially_satisfied"));
    assert.ok(results.named.some((finding) => finding.determination === "other_than_satisfied"));
    for (const finding of results.named.filter((item) => item.determination !== "satisfied"))
      assert.ok(finding.risk || finding.observation || finding.evidence, finding.control);
    // An area is a modified element of the variant, or the program's own controls.
    const changed = new Set(program.variant.changes.map(([code]) => code));
    for (const area of results.areas) if (area.element) assert.ok(changed.has(area.element));
  }
  assert.deepEqual(Object.keys(workScenario.findingNarratives), ["satisfied"]);
});
