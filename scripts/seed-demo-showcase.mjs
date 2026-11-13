#!/usr/bin/env node
/**
 * Explicit demo step: lay the showcase scenario over the legacy demo import, so the screens the
 * archived prototype left empty have records to show — WS-X90's own tailoring with SA-24, its SSP
 * versions and the identity services it inherits, its two assessments' plans and published
 * results, authorization packages and decisions, a continuous-monitoring schedule, scanner imports,
 * configuration baselines, lifecycle gates with their security outcomes, ATT&CK techniques on its
 * risks and evidence reviews. Reference baselines for the other demo programs.
 *
 * The scenario is authored (scripts/demo/showcase-scenario.mjs), not archived source, and every
 * record it writes is listed under its own provenance dataset. Its determinations and evidence
 * reviews are the assessment results the archived WS-X90 platform seed records, read from disk.
 * Run after npm run seed:demo and npm run seed:demo-baseline. Defaults to a read-only plan; never
 * runs at app boot.
 */
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { datasetId as legacyDatasetId, sha256 } from "./demo/context.mjs";
import { sql, quote, json, queryJson, targetTenant } from "./demo/database.mjs";
import * as scenario from "./demo/showcase-scenario.mjs";
import { fixturePath } from "./seed-demo-baseline.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scenarioPath = resolve(root, "scripts/demo/showcase-scenario.mjs");
const transactionPath = resolve(root, "scripts/demo/seed-showcase.sql");

const day = 86_400_000;
const isoDay = (date) => date.toISOString().slice(0, 10);
const addDays = (asOf, days) => new Date(Date.parse(`${asOf}T00:00:00Z`) + days * day);

/** The archived WS-X90 platform seed: its assessments, their results and the findings they raised. */
export function readArchive() {
  return JSON.parse(readFileSync(resolve(root, fixturePath), "utf8"));
}

const outcomeRank = { fail: 3, inconclusive: 2, pass: 1, "not-assessed": 0 };
const listed = (items) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
const fill = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => {
    if (values[key] === undefined)
      throw new Error(`A narrative names {${key}}, which it is not given`);
    return values[key];
  });

/**
 * The archived results as the scenario records them. Each assessment's results go to a results
 * revision: the initial assessment's to its one, the expanded assessment's to the increment whose
 * `through` day they fall on or before, else to the last, the draft, up to the as-of day; a result
 * after the as-of day is not recorded yet. In a revision a control takes one determination: the worst
 * outcome among the results that judged it (a failure, then an inconclusive result, then a pass,
 * then one not carried out), the latest of them on a tie, with its words, its day, the evidence it
 * examined and the finding a failure raised. The evidence reviews follow the same results: each
 * version examined takes the review the worst result that examined it gives, on that result's day.
 */
export function archivedAssessments({ asOf, archive = readArchive() }) {
  const { initial, expanded, outcomes, methods, narrative, claim } = scenario.assessments;
  const raised = new Map();
  for (const finding of archive.findings)
    for (const requirement of finding.requirement_ids)
      raised.set(`${finding.assessment_id}/${requirement}`, finding);
  const known = new Set(archive.assessments.map((assessment) => assessment.id));
  for (const source of [initial.source, expanded.source])
    if (!known.has(source)) throw new Error(`${fixturePath} records no assessment ${source}`);
  const revisions = new Map([
    ["initial", new Map()],
    ...expanded.increments.map((_, index) => [`increment-${index + 1}`, new Map()]),
  ]);
  const reviews = new Map();
  for (const result of archive.assessment_results) {
    // The archive leaves the initial assessment's results without an assessment id.
    const source = result.assessment_id ?? initial.source;
    const on = result.assessed_on.slice(0, 10);
    if (on > asOf) continue;
    let key;
    if (source === initial.source) key = "initial";
    else if (source === expanded.source) {
      const index = expanded.increments.findIndex(
        (increment, at) => at === expanded.increments.length - 1 || on <= increment.through,
      );
      key = `increment-${index + 1}`;
    } else continue;
    const finding =
      result.outcome === "fail" ? raised.get(`${source}/${result.requirement_id}`) : undefined;
    if (result.outcome === "fail" && !finding)
      throw new Error(`${result.requirement_id} failed in ${source} and raised no finding`);
    const determination =
      result.outcome === "fail" ? outcomes.fail[finding.severity] : outcomes[result.outcome];
    if (!determination)
      throw new Error(`${result.requirement_id}'s outcome in ${source} has no determination`);
    const values = {
      requirement: result.requirement_id,
      method: methods[result.method],
      components: listed(result.component_ids),
      finding: finding?.description,
    };
    const description =
      source === initial.source
        ? fill(
            determination === "satisfied"
              ? narrative.satisfied
              : determination === "not_assessed"
                ? narrative.not_assessed
                : narrative.short,
            values,
          )
        : result.notes;
    const entry = {
      determination,
      determinedAt: result.assessed_on,
      description,
      requirement: result.requirement_id,
      evidence: result.evidence_ids,
      finding: finding?.id ?? null,
      rank: outcomeRank[result.outcome],
    };
    const byControl = revisions.get(key);
    for (const control of result.control_ids) {
      const held = byControl.get(control);
      if (
        !held ||
        entry.rank > held.rank ||
        (entry.rank === held.rank &&
          (entry.determinedAt > held.determinedAt ||
            (entry.determinedAt === held.determinedAt && entry.requirement > held.requirement)))
      )
        byControl.set(control, entry);
    }
    const review =
      result.outcome === "pass"
        ? ["accepted", scenario.evidenceReview.accepted]
        : result.outcome === "fail"
          ? ["needs_revision", scenario.evidenceReview.short]
          : result.outcome === "inconclusive"
            ? ["needs_revision", scenario.evidenceReview.inconclusive]
            : null;
    if (review)
      for (const evidence of result.evidence_ids) {
        const held = reviews.get(evidence);
        if (
          !held ||
          entry.rank > held.rank ||
          (entry.rank === held.rank && entry.determinedAt > held.reviewedAt)
        )
          reviews.set(evidence, {
            decision: review[0],
            rationale: review[1],
            reviewedAt: entry.determinedAt,
            rank: entry.rank,
          });
      }
  }
  const determinations = (key) =>
    [...revisions.get(key)]
      .map(([control, { rank, ...entry }]) => ({ control, ...entry }))
      .sort(
        (a, b) =>
          a.determinedAt.localeCompare(b.determinedAt) || a.control.localeCompare(b.control),
      );
  const last = expanded.increments.length - 1;
  return {
    claim,
    initial: { ...initial, determinations: determinations("initial") },
    expanded: {
      ...expanded,
      increments: expanded.increments.map((increment, index) => ({
        ...increment,
        startsAt:
          index === 0
            ? expanded.startsAt
            : `${isoDay(addDays(expanded.increments[index - 1].through, 1))}T13:00:00Z`,
        endsAt: index === last ? null : `${increment.through}T21:00:00Z`,
        determinations: determinations(`increment-${index + 1}`),
      })),
    },
    evidenceReviews: Object.fromEntries(
      [...reviews].map(([evidence, { rank, ...review }]) => [evidence, review]),
    ),
  };
}

/** The fiscal year the as-of date falls in, October to September (FY2027 starts 2026-10-01). */
export function fiscalYear(asOf) {
  const [year, month] = asOf.split("-").map(Number);
  const ends = month >= 10 ? year + 1 : year;
  return {
    label: `FY${ends}`,
    startsAt: `${ends - 1}-10-01T00:00:00Z`,
    endsAt: `${ends}-09-30T23:59:59Z`,
  };
}

/** The scenario with its moving dates laid out from the as-of date. */
export function buildPayload({ tenantId, accountUserId, asOf, scenarioSha256, archive }) {
  const fy = fiscalYear(asOf);
  const { evidenceReviews, ...assessments } = archivedAssessments({
    asOf,
    ...(archive ? { archive } : {}),
  });
  const schedule = scenario.monitoring.schedule.map(
    ([title, status, start, due, owner, description]) => {
      if (!scenario.people[owner]) throw new Error(`The schedule names an unknown role ${owner}`);
      if (due < start) throw new Error(`"${title}" is due before it starts`);
      return {
        title: title.replace("(previous month)", `(${monthName(addDays(asOf, start))})`),
        status,
        owner,
        description,
        startsAt: `${isoDay(addDays(asOf, start))}T13:00:00Z`,
        dueOn: isoDay(addDays(asOf, due)),
      };
    },
  );
  const scans = scenario.scans.map(({ program, jobs }) => ({
    program,
    jobs: jobs.map(([title, status, started, completed, kind, summary]) => {
      const [mediaType, extension] = scenario.scanKinds[kind];
      const slug = title
        .toLowerCase()
        .replace(/previous month/, monthName(addDays(asOf, started ?? 0)).toLowerCase())
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const stamp = started === null ? isoDay(addDays(asOf, 0)) : isoDay(addDays(asOf, started));
      const sourceUri = `urn:demo:scan:${program.toLowerCase()}/${stamp}/${slug}.${extension}`;
      return {
        title: title.replace("previous month", monthName(addDays(asOf, started ?? 0))),
        status,
        summary,
        mediaType,
        sourceUri,
        // The hash of the scan's name, standing in for the file the scenario has no bytes for.
        sha256: sha256(sourceUri),
        startedAt: started === null ? undefined : `${isoDay(addDays(asOf, started))}T02:15:00Z`,
        completedAt:
          completed === null ? undefined : `${isoDay(addDays(asOf, completed))}T03:40:00Z`,
      };
    }),
  }));
  return {
    tenantId,
    accountUserId,
    asOf,
    datasetId: scenario.datasetId,
    scenarioSha256,
    programCode: scenario.programCode,
    boundaryCode: scenario.boundaryCode,
    people: scenario.people,
    addedPeople: scenario.addedPeople,
    programBaselines: scenario.programBaselines,
    tailoring: scenario.tailoring,
    tailoredProgress: scenario.tailoredProgress,
    configurationBaselines: scenario.configurationBaselines,
    provider: scenario.provider,
    ssp: scenario.ssp,
    legacyDatasetId,
    assessments,
    evidenceReviews,
    monitoring: {
      campaign: scenario.monitoring.campaign,
      plan: scenario.monitoring.plan,
      planDescription: scenario.monitoring.planDescription,
      fiscalYear: fy.label,
      startsAt: fy.startsAt,
      endsAt: fy.endsAt,
      schedule,
    },
    gates: scenario.gates,
    writtenCriteria: scenario.writtenCriteria,
    packages: scenario.packages,
    scans,
    riskTechniques: scenario.riskTechniques,
    riskAssessments: scenario.riskAssessments,
    // Issue requirements: the requirement each named issue is about (issue_requirements).
    issueRequirements: scenario.issueRequirements,
  };
}
function monthName(date) {
  return date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

/** Read-only: what the workspace holds that the scenario stands on, and what it already has. */
function readTarget(tenantId) {
  return queryJson(`select jsonb_build_object(
    'applied', exists(select 1 from public.demo_import_batches where tenant_id=${quote(tenantId)}::uuid and dataset_id=${quote(scenario.datasetId)}),
    'program', (select jsonb_build_object('id', p.id, 'name', p.name) from public.programs p where p.tenant_id=${quote(tenantId)}::uuid and p.code=${quote(scenario.programCode)}),
    'baseline', (select pr.code from public.program_reference_choices c join public.programs g on g.id=c.program_id
       join public.profile_resolutions r on r.id=c.profile_resolution_id join public.profile_revisions v on v.id=r.profile_revision_id
       join public.profiles pr on pr.id=v.profile_id where c.tenant_id=${quote(tenantId)}::uuid and g.code=${quote(scenario.programCode)} limit 1),
    'programsWithoutBaseline', (select coalesce(jsonb_agg(p.code order by p.code), '[]'::jsonb) from public.programs p
       where p.tenant_id=${quote(tenantId)}::uuid and not exists(select 1 from public.program_reference_choices c where c.program_id=p.id)),
    'gates', (select count(*) from public.lifecycle_gates g join public.programs p on p.id=g.program_id where g.tenant_id=${quote(tenantId)}::uuid and p.code=${quote(scenario.programCode)})
  );`);
}

/** What each results revision would record, as the archive gives it, before a workspace is read. */
export function assessmentSummary(asOf, archive) {
  const recorded = archivedAssessments({ asOf, ...(archive ? { archive } : {}) });
  const counted = (determinations) =>
    Object.entries(
      determinations.reduce(
        (counts, { determination }) => ({
          ...counts,
          [determination]: (counts[determination] ?? 0) + 1,
        }),
        {},
      ),
    )
      .map(([determination, count]) => `${count} ${determination.replaceAll("_", " ")}`)
      .join(", ");
  return [
    { ...recorded.initial, publishedAt: recorded.initial.resultsPublishedAt },
    ...recorded.expanded.increments,
  ].map(
    (revision) =>
      `${revision.results} (${revision.publishedAt ? "published" : "draft"}): ${revision.determinations.length} controls, ${counted(revision.determinations) || "none yet"}`,
  );
}

export function buildPlan({ target, asOf = new Date().toISOString().slice(0, 10) }) {
  const issues = [];
  if (target.applied)
    issues.push({
      blocks: false,
      message:
        "This workspace already holds the showcase; a run writes only what its risks still lack (a threat, a vulnerability, a rationale, a response's due moment).",
    });
  if (!target.program)
    issues.push({
      blocks: true,
      message: `${scenario.programCode} is not in this workspace. Run npm run seed:demo first.`,
    });
  else if (target.baseline !== scenario.tailoring.base && !target.applied)
    issues.push({
      blocks: true,
      message: target.baseline
        ? `${scenario.programCode}'s control baseline is ${target.baseline}, not ${scenario.tailoring.base}.`
        : `${scenario.programCode} has no control baseline. Run npm run seed:demo-baseline first.`,
    });
  const packages = scenario.packages.map((pkg) => ({
    package: pkg.title,
    versions: pkg.versions.map((version, index) => ({
      version: index + 1,
      state: version.publishedAt ? "published" : "draft",
      decision: version.decision?.decision,
    })),
  }));
  return {
    issues,
    summary: {
      program: target.program ? { code: scenario.programCode, name: target.program.name } : null,
      controlBaseline: {
        now: target.baseline,
        tailoring: `${scenario.tailoring.code}: SA-24 and ${scenario.tailoring.include.length - 1} cyber resiliency controls tailored in`,
        sa24Techniques: scenario.tailoring.sa24.techniques,
      },
      referenceBaselines: scenario.programBaselines.filter((choice) =>
        target.programsWithoutBaseline.includes(choice.program),
      ),
      ssp: "SSP 2 published on the tailored baseline and Block 1; SSP 3 the working draft on Block 1.1",
      inheritance: scenario.provider.capabilities.map(
        (capability) => `${capability.code} ${capability.name}`,
      ),
      assessments: assessmentSummary(asOf),
      monitoring: `${scenario.monitoring.schedule.length} scheduled assessments`,
      gates: target.gates
        ? "kept: the program already has gates"
        : `${scenario.gates.length} gates`,
      packages,
      scans: scenario.scans.reduce((sum, group) => sum + group.jobs.length, 0),
      riskTechniques: Object.keys(scenario.riskTechniques).length,
      issueRequirements: Object.keys(scenario.issueRequirements).length,
      riskAssessments: `${Object.keys(scenario.riskAssessments.risks).length} risks in their own words, the rest from the requirement they arise from; each response due by its severity`,
    },
  };
}

/**
 * The showcase, then what its risks still lack: on a workspace that already holds the showcase the
 * first changes nothing and the second fills only empty fields, recording them under its batch.
 */
export function applyShowcase(transaction, payload, { commit = false } = {}) {
  const result = sql(
    [
      "begin;",
      transaction,
      `select pg_temp.seed_showcase(${json(payload)});`,
      `select pg_temp.seed_showcase_risk_details(${json(payload)});`,
      commit ? "commit;" : "rollback;",
    ].join("\n"),
  );
  const [showcase, riskDetails] = result
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .slice(-2)
    .map((line) => JSON.parse(line));
  return {
    ...showcase,
    riskDetails,
    changed: Boolean(showcase.changed || riskDetails.changed),
    showcaseChanged: Boolean(showcase.changed),
    committed: commit,
  };
}

async function main() {
  const args = process.argv.slice(2),
    options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--tenant", "--account", "--as-of"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = args[++index];
    } else if (["--apply", "--check", "--help"].includes(arg)) options[arg.slice(2)] = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (options.help) {
    console.log(
      "node scripts/seed-demo-showcase.mjs --tenant UUID --account EMAIL [--as-of YYYY-MM-DD] [--check | --apply]\nDefault: read-only plan of the showcase scenario. --check runs the complete transaction then rolls back. --apply explicitly commits. --as-of lays out the continuous-monitoring schedule and scanner imports from that day (default today, UTC). Runs once a workspace; a repeat changes nothing.",
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error(
      "Supply --tenant UUID and --account EMAIL explicitly; no workspace is selected implicitly.",
    );
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  const asOf = options["as-of"] ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T00:00:00Z`)))
    throw new Error("--as-of must be a day, YYYY-MM-DD");
  const tenant = targetTenant(options.tenant, options.account);
  const target = readTarget(options.tenant);
  const plan = buildPlan({ target, asOf });
  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : options.check ? "rollback check" : "read-only plan",
        tenantId: options.tenant,
        asOf,
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
  const payload = buildPayload({
    tenantId: options.tenant,
    accountUserId: tenant.personal_owner_id,
    asOf,
    scenarioSha256: sha256(await readFile(scenarioPath)),
  });
  const result = applyShowcase(await readFile(transactionPath, "utf8"), payload, {
    commit: Boolean(options.apply),
  });
  console.log(JSON.stringify(result, null, 2));
  const filled = `${result.riskDetails.riskRevisions} risk revision(s) and ${result.riskDetails.riskResponses} response(s) filled`;
  console.log(
    !result.changed
      ? "Nothing changed: this workspace already holds the showcase and everything its risks need."
      : !options.apply
        ? "Check passed; the transaction was rolled back and nothing was written."
        : result.showcaseChanged
          ? `Committed: ${result.records} showcase record(s) written under the ${scenario.datasetId} provenance dataset, ${filled}.`
          : `Committed: ${filled}, recorded under the ${scenario.datasetId} batch.`,
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
