#!/usr/bin/env node
/**
 * Explicit demo step: record who holds RMF's roles on the demo programs (WS-X90's authorizing
 * official, lead assessor, assessors, ISSM, ISSO and system owner; the authorizing official and
 * lead assessor of the two other programs whose packages were decided; the lead assessor of each
 * customer program), by the names the demo data already uses, so a record's action slot can say
 * whose step it is. Corporate identity provider keeps none.
 *
 * The scenario is authored (scripts/demo/roles-scenario.mjs) and stands on the demo import
 * (npm run seed:demo), the showcase (npm run seed:demo-showcase) and the products scenario (npm run
 * seed:demo-products). What it adds is listed under its own provenance dataset; it changes no
 * record those steps wrote, passes over a role a program already records, and --revert removes what
 * it added. Each run says what program_roles answers for each program it names, before and after.
 * Defaults to a read-only plan; never runs at app boot.
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { sha256 } from "./demo/context.mjs";
import { sql, quote, json, queryJson, targetTenant } from "./demo/database.mjs";
import * as scenario from "./demo/roles-scenario.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scenarioPath = resolve(root, "scripts/demo/roles-scenario.mjs");
const transactionPath = resolve(root, "scripts/demo/seed-roles.sql");

/** The scenario as the transaction reads it. */
export function buildPayload({ tenantId, accountUserId, scenarioSha256 }) {
  return {
    tenantId,
    accountUserId,
    scenarioSha256,
    datasetId: scenario.datasetId,
    programRoles: scenario.programRoles,
    assignments: scenario.assignments(),
    leftEmpty: scenario.leftEmpty,
    watchedPrograms: [
      ...scenario.programRoles.map((entry) => entry.program),
      ...scenario.leftEmpty,
    ],
  };
}

/** The one read-only query the plan is built from: what the workspace holds of what it names. */
export function targetQuery(tenantId) {
  const tenant = `${quote(tenantId)}::uuid`;
  const programs = [...scenario.programRoles.map((entry) => entry.program), ...scenario.leftEmpty];
  return `select jsonb_build_object(
    'seeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.datasetId)}),
    'programs', (select coalesce(jsonb_object_agg(x.code, jsonb_build_object(
        'found', g.id is not null,
        'roles', (select coalesce(jsonb_agg(jsonb_build_object('role', a.role, 'holder', p.name) order by a.role, p.name), '[]'::jsonb)
          from public.program_role_assignments a join public.parties p on p.id = a.party_id
          where g.id is not null and a.tenant_id = ${tenant} and a.program_id = g.id))), '{}'::jsonb)
      from jsonb_array_elements_text(${json(programs)}) x(code)
      left join public.programs g on g.tenant_id = ${tenant} and g.code = x.code),
    'people', (select coalesce(jsonb_object_agg(x.name, (select count(*) from public.parties a
        where a.tenant_id = ${tenant} and a.party_type = 'person' and a.name = x.name)), '{}'::jsonb)
      from jsonb_array_elements_text(${json(scenario.people())}) x(name)));`;
}

/** What the workspace holds of what the scenario stands on, read and nothing written. */
export const readTarget = (tenantId) => queryJson(targetQuery(tenantId));

const oneHolder = new Set(["authorizing_official", "lead_assessor"]);
const holderName = (entry) => entry.person ?? "the account";

/**
 * What the run would do, and what stops it: a program or a person the workspace does not hold, a
 * program that names another authorizing official or lead assessor, or a program the scenario
 * leaves empty that records a role.
 */
export function buildPlan({ target }) {
  const issues = [];
  const stop = (message) => issues.push({ blocks: true, message });
  if (target.seeded)
    issues.push({ blocks: false, message: "This workspace already holds the scenario." });
  for (const name of scenario.people())
    if (target.people[name] !== 1)
      stop(`Expected one person named ${name}, found ${target.people[name] ?? 0}.`);
  const writes = [];
  const passed = [];
  for (const entry of scenario.assignments()) {
    const program = target.programs[entry.program];
    if (!program?.found) {
      stop(`The program ${entry.program} is not in this workspace. Run npm run seed:demo first.`);
      continue;
    }
    const held = program.roles.filter((item) => item.role === entry.role);
    if (entry.person && held.some((item) => item.holder === entry.person)) {
      passed.push(entry.key);
      continue;
    }
    const other = held.find((item) => item.holder !== entry.person);
    if (oneHolder.has(entry.role) && other)
      stop(
        `${entry.program} already records ${other.holder} in the ${entry.role.replaceAll("_", " ")} role; the scenario does not name a second.`,
      );
    writes.push(`${entry.program}: ${holderName(entry)} as ${entry.role.replaceAll("_", " ")}`);
  }
  for (const code of scenario.leftEmpty) {
    const program = target.programs[code];
    if (program?.roles.length)
      stop(`${code} records a role, so no program would show one that records none.`);
  }
  return { issues, summary: { writes, passedOver: passed, leftEmpty: scenario.leftEmpty } };
}

/** Run the seed, or its revert, in one transaction: committed, or rolled back. */
export function applyRoles(transaction, payload, { commit = false, revert = false } = {}) {
  const result = sql(
    [
      "begin;",
      transaction,
      `select pg_temp.${revert ? "revert_roles" : "seed_roles"}(${json(payload)});`,
      commit ? "commit;" : "rollback;",
    ].join("\n"),
  );
  const answer = JSON.parse(
    result
      .split("\n")
      .filter((line) => line.startsWith("{"))
      .at(-1),
  );
  return { ...answer, committed: commit };
}

async function main() {
  const args = process.argv.slice(2),
    options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--tenant", "--account"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = args[++index];
    } else if (["--apply", "--check", "--revert", "--help"].includes(arg))
      options[arg.slice(2)] = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.help) {
    console.log(
      "node scripts/seed-demo-roles.mjs --tenant UUID --account EMAIL [--check | --apply] [--revert]\nDefault: read-only plan of the program roles scenario. --check runs the complete transaction and rolls it back, and says what program_roles answers for each program before and after. --apply commits it. --revert undoes a committed run instead: rolled back unless --apply is given with it.",
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error(
      "Supply --tenant UUID and --account EMAIL explicitly; no workspace is selected implicitly.",
    );
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  const tenant = targetTenant(options.tenant, options.account);
  const payload = buildPayload({
    tenantId: options.tenant,
    accountUserId: tenant.personal_owner_id,
    scenarioSha256: sha256(await readFile(scenarioPath)),
  });
  const transaction = await readFile(transactionPath, "utf8");
  if (options.revert) {
    console.log(
      JSON.stringify(
        { mode: options.apply ? "revert" : "revert check, rolled back", tenantId: options.tenant },
        null,
        2,
      ),
    );
    const result = applyRoles(transaction, payload, {
      commit: Boolean(options.apply),
      revert: true,
    });
    console.log(JSON.stringify(result, null, 2));
    console.log(
      !result.changed
        ? result.reason
        : options.apply
          ? `Reverted: ${result.removed} role assignment(s) removed with the scenario's provenance.`
          : "Revert check passed; the transaction was rolled back and nothing was changed.",
    );
    return;
  }
  const plan = buildPlan({ target: readTarget(options.tenant) });
  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : options.check ? "rollback check" : "read-only plan",
        tenantId: options.tenant,
        ...plan.summary,
        issues: plan.issues,
      },
      null,
      2,
    ),
  );
  if (!options.apply && !options.check) return;
  const blocking = plan.issues.filter((issue) => issue.blocks);
  if (blocking.length)
    throw new Error(`Nothing was written. ${blocking.map((issue) => issue.message).join(" ")}`);
  const result = applyRoles(transaction, payload, { commit: Boolean(options.apply) });
  console.log(JSON.stringify(result, null, 2));
  console.log(
    !result.changed
      ? result.reason
      : options.apply
        ? `Committed: ${result.records} role assignment(s) listed under ${scenario.datasetId}.`
        : "Check passed; the transaction was rolled back and nothing was written.",
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
