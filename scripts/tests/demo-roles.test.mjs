import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as scenario from "../demo/roles-scenario.mjs";
import * as showcase from "../demo/showcase-scenario.mjs";
import { buildPayload, buildPlan } from "../seed-demo-roles.mjs";

// The program roles scenario as written, without a database: the roles it names are the ones the
// schema allows, a program gets one authorizing official and one lead assessor, the people are the
// demo's own, and what stops the plan.

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261117125128_program_roles_held_to_acts.sql",
    import.meta.url,
  ),
  "utf8",
);
const allowed = [
  ...migration
    .match(/add constraint program_role_assignments_role_check check \(role in \(([^)]*)\)/)[1]
    .matchAll(/'([^']*)'/g),
].map((match) => match[1]);

/** A workspace that holds every program and person, and none of the scenario's roles. */
const readyTarget = () => ({
  seeded: false,
  programs: Object.fromEntries(
    [...scenario.programRoles.map((entry) => entry.program), ...scenario.leftEmpty].map((code) => [
      code,
      { found: true, roles: [] },
    ]),
  ),
  people: Object.fromEntries(scenario.people().map((name) => [name, 1])),
});

test("every role is one the schema allows, one authorizing official and one lead assessor a program", () => {
  for (const { program, roles } of scenario.programRoles) {
    for (const [role] of roles) assert.ok(allowed.includes(role), `${program}: ${role}`);
    for (const one of ["authorizing_official", "lead_assessor"])
      assert.ok(roles.filter(([role]) => role === one).length <= 1, `${program}: two ${one}`);
  }
  const keys = scenario.assignments().map((entry) => entry.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("WS-X90's holders are the showcase's own people", () => {
  const wsx90 = Object.fromEntries(
    scenario.programRoles
      .find((entry) => entry.program === showcase.programCode)
      .roles.filter(([, holder]) => typeof holder === "string"),
  );
  assert.equal(wsx90.authorizing_official, showcase.people.authorizingOfficial);
  assert.equal(wsx90.lead_assessor, showcase.people.controlAssessor);
  assert.equal(wsx90.security_officer, showcase.people.isso);
  assert.equal(wsx90.system_owner, showcase.people.programOffice);
  assert.ok(
    scenario.programRoles
      .find((entry) => entry.program === showcase.programCode)
      .roles.some(([role, holder]) => role === "assessor" && holder === showcase.people.assessor),
  );
});

test("a program is left with no role, and the account holds one", () => {
  const named = new Set(scenario.programRoles.map((entry) => entry.program));
  assert.ok(scenario.leftEmpty.length > 0);
  for (const code of scenario.leftEmpty) assert.ok(!named.has(code), code);
  assert.deepEqual(
    scenario
      .assignments()
      .filter((entry) => entry.account)
      .map((entry) => entry.key),
    ["PRG-1090/assessor/account"],
  );
});

test("the payload names the assignments and the programs whose reads it reports", () => {
  const payload = buildPayload({ tenantId: "t", accountUserId: "u", scenarioSha256: "s" });
  assert.equal(payload.datasetId, "program-roles-v1");
  assert.equal(payload.assignments.length, scenario.assignments().length);
  assert.deepEqual(payload.watchedPrograms.slice(-scenario.leftEmpty.length), scenario.leftEmpty);
});

test("the plan writes every assignment on a ready workspace", () => {
  const plan = buildPlan({ target: readyTarget() });
  assert.deepEqual(plan.issues, []);
  assert.equal(plan.summary.writes.length, scenario.assignments().length);
});

test("the plan passes over a role already recorded and stops on what it cannot write", () => {
  const target = readyTarget();
  target.programs["PRG-1090"].roles = [{ role: "lead_assessor", holder: "D. Okafor" }];
  target.programs["PRG-1041"].roles = [{ role: "authorizing_official", holder: "Someone else" }];
  target.programs["PRG-1013"].roles = [{ role: "assessor", holder: "Someone" }];
  target.people["R. Calloway"] = 2;
  delete target.programs["PRG-2101"];
  const plan = buildPlan({ target });
  assert.deepEqual(plan.summary.passedOver, ["PRG-1090/lead_assessor/D. Okafor"]);
  const messages = plan.issues.filter((issue) => issue.blocks).map((issue) => issue.message);
  assert.ok(messages.includes("Expected one person named R. Calloway, found 2."));
  assert.ok(
    messages.includes(
      "PRG-1041 already records Someone else in the authorizing official role; the scenario does not name a second.",
    ),
  );
  assert.ok(
    messages.includes(
      "The program PRG-2101 is not in this workspace. Run npm run seed:demo first.",
    ),
  );
  assert.ok(
    messages.includes("PRG-1013 records a role, so no program would show one that records none."),
  );
});
