#!/usr/bin/env node
/**
 * Explicit demo step: write the products scenario, so the hierarchy a program draws on has
 * records to show — business lines, the X800 Missile with its three launch configurations and the
 * library components behind its elements, one published assessment of the product, two customer
 * programs that each take a configuration and change it, and a newer product version. Its fourth
 * step gives those programs their work (scripts/demo/products-work-scenario.mjs): a schedule,
 * findings, risks, remediation, evidence, an SSP and assessment results, and the assessments the
 * newer product versions were owed. Its fifth fills the records one click down
 * (scripts/demo/products-detail-scenario.mjs): every task's comment and activity, every risk's
 * task, every requirement's verification, citation and discussion, every control's narrative, each
 * system's inventory, each campaign's procedures and runs, and a variant of the two products no
 * program had taken. Its sixth publishes Customer A's overlay in the library, the controls its
 * requirements document adds to the High baseline and two it removes, and its seventh flows the
 * customers' requirements down into the variants' elements, with the evidence those elements hold.
 *
 * The scenario is authored (scripts/demo/products-scenario.mjs), not archived source, and what it
 * writes is listed under its own provenance dataset. It needs the pinned references
 * (npm run seed:reference) and nothing else: a person it names whom the workspace does not hold
 * is added by the fourth step. Defaults to a read-only plan; never runs at app boot.
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { sha256 } from "./demo/context.mjs";
import { sql, quote, json, queryJson, targetTenant } from "./demo/database.mjs";
import * as scenario from "./demo/products-scenario.mjs";
import * as workScenario from "./demo/products-work-scenario.mjs";
import * as detailScenario from "./demo/products-detail-scenario.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scenarioPath = resolve(root, "scripts/demo/products-scenario.mjs");
const workScenarioPath = resolve(root, "scripts/demo/products-work-scenario.mjs");
const transactionPath = resolve(root, "scripts/demo/seed-products.sql");
const workTransactionPath = resolve(root, "scripts/demo/seed-products-work.sql");
const detailScenarioPath = resolve(root, "scripts/demo/products-detail-scenario.mjs");
const detailTransactionPath = resolve(root, "scripts/demo/seed-products-detail.sql");

const today = () => new Date().toISOString().slice(0, 10);

/**
 * The scenario as the transaction reads it. The fourth step's days are counted from `asOf`; each
 * program's work carries the prefix of its variant's elements, and a program the step adds the
 * baseline of the product it takes.
 */
export function buildPayload({
  tenantId,
  accountUserId,
  scenarioSha256,
  workScenarioSha256 = scenarioSha256,
  detailScenarioSha256 = scenarioSha256,
  asOf = today(),
}) {
  const programs = workScenario.workPrograms();
  return {
    tenantId,
    accountUserId,
    scenarioSha256,
    workScenarioSha256,
    detailScenarioSha256,
    asOf,
    detailDatasetId: detailScenario.detailDatasetId,
    flowDownDatasetId: detailScenario.flowDownDatasetId,
    flowDown: detailScenario.flowDown,
    productDetail: detailScenario.productDetail,
    detail: detailScenario.detail,
    variantAssessments: detailScenario.variantAssessments,
    variantBaselines: detailScenario.variantBaselines,
    manufacturers: detailScenario.manufacturers,
    discussions: detailScenario.discussions,
    passageDiscussion: detailScenario.passageDiscussion,
    taskComments: detailScenario.taskComments,
    taskActivity: detailScenario.taskActivity,
    riskActivity: detailScenario.riskActivity,
    ownElementStatus: detailScenario.ownElementStatus,
    workDatasetId: workScenario.workDatasetId,
    cast: workScenario.cast,
    account: workScenario.account,
    businessLineOwners: workScenario.businessLineOwners,
    evidenceProvenance: workScenario.evidenceProvenance,
    familyProcedures: workScenario.familyProcedures,
    familyDocuments: workScenario.familyDocuments,
    sspNarratives: workScenario.sspNarratives,
    findingNarratives: workScenario.findingNarratives,
    scanKinds: workScenario.scanKinds,
    productWork: {
      ...workScenario.productWork,
      programs: workScenario.productWork.programs.map((program) => ({
        ...program,
        baseline: workScenario.productWork.products.find((item) => item.code === program.product)
          .baseline,
      })),
    },
    workOrder: programs.map((program) => program.code),
    work: Object.fromEntries(
      programs.map((program) => [
        program.code,
        { ...workScenario.work[program.code], prefix: program.variant.prefix },
      ]),
    ),
    datasetId: scenario.datasetId,
    requirementsDatasetId: scenario.requirementsDatasetId,
    assessmentDatasetId: scenario.assessmentDatasetId,
    deltaAssessments: scenario.deltaAssessments,
    overlayDatasetId: scenario.overlayDatasetId,
    customerOverlay: scenario.customerOverlay,
    customerRequirements: scenario.programs.map((program) => ({
      program: program.code,
      prefix: program.variant.prefix,
      ...scenario.customerRequirements[program.code],
    })),
    people: scenario.people,
    businessLines: scenario.businessLines,
    familyPhrases: scenario.familyPhrases,
    consumerResponsibilities: scenario.consumerResponsibilities,
    library: scenario.library,
    product: scenario.product,
    otherProducts: scenario.otherProducts,
    programs: scenario.programs,
  };
}

const list = (values) => values.map(quote).join(", ");

/** What the workspace holds that the scenario would meet. */
export function readTarget(tenantId) {
  const tenant = `${quote(tenantId)}::uuid`;
  const products = [scenario.product, ...scenario.otherProducts].map((item) => item.code);
  const systems = scenario.programs.map((program) => program.variant.code);
  const added = workScenario.productWork;
  const baselines = [
    ...new Set([...added.libraries, ...added.products].map((item) => item.baseline)),
  ];
  const capabilities = Object.values(workScenario.work).flatMap((entry) =>
    entry.capabilities.map((capability) => capability[0]),
  );
  return queryJson(`select jsonb_build_object(
    'seeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.datasetId)}),
    'workSeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(workScenario.workDatasetId)}),
    'detailSeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(detailScenario.detailDatasetId)}),
    'detailSystems', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.systems
      where tenant_id = ${tenant} and code in (${list(detailScenario.productDetail.variants.map((variant) => variant.code))})),
    'missingBaselines', (select coalesce(jsonb_agg(b.title), '[]'::jsonb) from unnest(array[${list(baselines)}]) b(title)
      where (select count(*) from public.profile_resolutions r
        join public.profile_revisions v on v.id = r.profile_revision_id
        join public.profiles pr on pr.id = v.profile_id
        where r.tenant_id is null and r.state = 'published' and pr.title = b.title) <> 1),
    'workProducts', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.products
      where tenant_id = ${tenant} and code in (${list(added.products.map((item) => item.code))})),
    'workDefinitions', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.component_definitions
      where tenant_id = ${tenant} and code in (${list(added.libraries.map((item) => item.code))})),
    'workPrograms', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.programs
      where tenant_id = ${tenant} and code in (${list(added.programs.map((item) => item.code))})),
    'workSystems', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.systems
      where tenant_id = ${tenant} and code in (${list(added.programs.map((item) => item.variant.code))})),
    'workCapabilities', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.provider_capabilities
      where tenant_id = ${tenant} and code in (${list(capabilities)})),
    'overlaySeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.overlayDatasetId)}),
    'flowDownSeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(detailScenario.flowDownDatasetId)}),
    'overlayTaken', exists (select 1 from public.control_overlays where tenant_id = ${tenant} and code = ${quote(scenario.customerOverlay.code)}),
    'overlayStacked', exists (
      with recursive chain as (
        select c.profile_resolution_id as id from public.program_reference_choices c join public.programs g on g.id = c.program_id
          where g.tenant_id = ${tenant} and g.code = ${quote(scenario.customerOverlay.program)}
        union all select r.base_profile_resolution_id from chain join public.profile_resolutions r on r.id = chain.id
          where r.base_profile_resolution_id is not null)
      select 1 from chain join public.profile_overlay_applications a on a.profile_resolution_id = chain.id
        join public.control_overlays o on o.id = a.overlay_id
        where o.tenant_id = ${tenant} and o.code = ${quote(scenario.customerOverlay.code)}),
    'requirementsSeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.requirementsDatasetId)}),
    'assessmentsSeeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.assessmentDatasetId)}),
    'baselines', (select count(*) from public.profile_resolutions r
      join public.profile_revisions v on v.id = r.profile_revision_id
      join public.profiles pr on pr.id = v.profile_id
      where r.tenant_id is null and r.state = 'published' and pr.title = ${quote(scenario.product.baseline)}),
    'businessLines', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.business_lines
      where tenant_id = ${tenant} and code in (${list(scenario.businessLines.map((line) => line.code))})),
    'products', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.products
      where tenant_id = ${tenant} and code in (${list(products)})),
    'definitions', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.component_definitions
      where tenant_id = ${tenant} and code = ${quote(scenario.library.code)}),
    'programs', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.programs
      where tenant_id = ${tenant} and code in (${list(scenario.programs.map((program) => program.code))})),
    'systems', (select coalesce(jsonb_agg(code), '[]'::jsonb) from public.systems
      where tenant_id = ${tenant} and code in (${list(systems)})),
    'people', (select coalesce(jsonb_agg(name), '[]'::jsonb) from public.parties
      where tenant_id = ${tenant} and name in (${list(Object.values(scenario.people))}))
  );`);
}

const tally = (values) =>
  Object.entries(
    values.reduce((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {}),
  )
    .map(([value, count]) => `${count} ${value.replaceAll("_", " ")}`)
    .join(", ");

/** What the fourth step would write, as a reader sees it before it runs. */
export function workSummary(asOf = today()) {
  const added = workScenario.productWork;
  return {
    asOf,
    products: {
      assessments: [added.carried, ...added.assessments].map((assessment) => assessment.title),
      componentSets: added.libraries.map(
        (library) => `${library.code}: ${library.components.length} components`,
      ),
      pinned: added.pins.map(
        (pin) => `${pin.product}'s draft, ${Object.keys(pin.elements).length} elements`,
      ),
      nextVersions: added.revisions.map((revision) => `${revision.product}: ${revision.remarks}`),
      added: added.products.map((product) => `${product.code} ${product.name}`),
      programs: added.programs.map(
        (program) =>
          `${program.code} ${program.name}, with ${program.requirements.items.length} customer requirements`,
      ),
    },
    programs: Object.fromEntries(
      workScenario.workPrograms().map((program) => {
        const entry = workScenario.work[program.code];
        return [
          program.code,
          {
            tasks: tally(entry.tasks.map((task) => task[1])),
            lifecycleGates: tally(entry.gates.map((gate) => gate.status)),
            operationalIssues: tally(entry.issues.map((issue) => issue.severity)),
            risks: tally(entry.risks.map((risk) => risk.status)),
            remediationItems: tally(entry.poam.items.map((item) => item.status)),
            evidence: `${entry.evidence.length} artifacts, ${entry.evidence.filter((item) => item.requirements?.length).length} cited by a customer requirement`,
            ssp:
              entry.ssp.publish === undefined
                ? "narratives in a working draft, the next revision"
                : "narratives written, then published",
            ...(entry.takesVersion === undefined
              ? {}
              : { product: `takes version ${entry.takesVersion} of ${program.product.name}` }),
            deltaAssessment: `${entry.assessment.title}: results for ${entry.assessment.results.judged}% of its objectives`,
          },
        ];
      }),
    ),
  };
}

/** What the fifth step would write, as a reader sees it before it runs. */
export function detailSummary() {
  const products = detailScenario.productDetail;
  return {
    products: {
      published: products.publish.map((entry) => `${entry.product} version ${entry.version}`),
      assessments: products.assessments.map((assessment) => assessment.title),
      variants: products.variants.map(
        (variant) =>
          `${variant.code} in ${variant.program}, from ${variant.product} version ${variant.version}`,
      ),
    },
    programs: Object.fromEntries(
      Object.entries(detailScenario.detail).map(([code, entry]) => [
        code,
        {
          procedures: entry.procedures.length,
          testRuns: entry.runs.length,
          remediationItems: entry.remediation.length,
          risks: entry.risks.length,
          riskTasks: Object.keys(entry.riskTasks).length,
          ...(entry.requirements ? { requirementsAdded: entry.requirements.length } : {}),
        },
      ]),
    ),
    everyRecord:
      "every task a comment and activity, every risk activity, every customer requirement an owner, a verification, a citation and a discussion, every control a narrative, statements and a contribution, every system element an inventory item",
  };
}

/** What the sixth step would write, as a reader sees it before it runs. */
export function overlaySummary() {
  const overlay = scenario.customerOverlay;
  const decided = (action) =>
    overlay.decisions.filter((decision) => decision[1] === action).map(([control]) => control);
  return {
    overlay: `${overlay.code} ${overlay.title}, published in the library`,
    adds: decided("include"),
    removes: decided("exclude"),
    program: `Put on top of ${overlay.program}'s stack through set_program_baseline_overlays; its SSP revisions keep the baseline they were pinned to.`,
  };
}

/** What the seventh step would write, as a reader sees it before it runs. */
export function flowDownSummary() {
  const { allocations, evidence } = detailScenario.flowDown;
  return {
    allocations: Object.fromEntries(
      Object.entries(allocations).map(([program, list]) => [
        program,
        `${list.length} to ${new Set(list.map((item) => item[1])).size} elements, then each element that holds others carries what they carry`,
      ]),
    ),
    evidence: evidence.map((item) => `${item.program}: ${item.title}`),
  };
}

/** The plan a reader sees before anything is written, and what would stop it. */
export function buildPlan({ target, asOf }) {
  const issues = [
    ...scenario.scenarioIssues(),
    ...scenario.requirementIssues(),
    ...workScenario.workIssues(),
    ...detailScenario.detailIssues(),
  ].map((message) => ({
    blocks: true,
    message,
  }));
  const work = workSummary(asOf);
  const detail = detailSummary();
  if (!target.detailSeeded && target.detailSystems?.length)
    issues.push({
      blocks: true,
      message: `The workspace already has a system coded ${target.detailSystems.join(", ")}; the scenario does not overwrite it.`,
    });
  if (!target.overlaySeeded && target.overlayTaken)
    issues.push({
      blocks: true,
      message: `The workspace already has an overlay coded ${scenario.customerOverlay.code}; the scenario does not overwrite it.`,
    });
  if (!target.workSeeded) {
    for (const title of target.missingBaselines ?? [])
      issues.push({
        blocks: true,
        message: `Expected one published reference baseline "${title}". Run npm run seed:reference first.`,
      });
    for (const [noun, codes] of [
      ["product", target.workProducts],
      ["library component", target.workDefinitions],
      ["program", target.workPrograms],
      ["system", target.workSystems],
      ["provider capability", target.workCapabilities],
    ])
      if (codes?.length)
        issues.push({
          blocks: true,
          message: `The workspace already has a ${noun} coded ${codes.join(", ")}; the scenario does not overwrite it.`,
        });
  }
  const customerRequirements = Object.fromEntries(
    Object.entries(scenario.customerRequirements).map(([program, entry]) => [
      program,
      `${entry.source.code} ${entry.source.versionLabel}: ${entry.items.length} requirements, ${entry.items.filter((item) => item[5] === null).length} unanswered`,
    ]),
  );
  const deltaAssessments = scenario.deltaAssessments.map(
    (entry) => `${entry.program}: its variant's SSP published, then ${entry.title}`,
  );
  if (target.seeded) {
    // What is already here is left as it is; the steps still to run are the plan.
    const held = [
      "the products scenario",
      target.requirementsSeeded && "the customers' requirements",
      target.assessmentsSeeded && "the delta assessments",
      target.workSeeded && "the programs' work",
      target.detailSeeded && "the records one click down",
      target.overlaySeeded && target.overlayStacked && "the customer overlay",
      target.flowDownSeeded && "the flow-down",
    ].filter(Boolean);
    return {
      issues,
      summary: {
        state: `This workspace already holds ${held.join(", ")}.`,
        ...(target.requirementsSeeded ? {} : { customerRequirements }),
        ...(target.assessmentsSeeded ? {} : { deltaAssessments }),
        ...(target.workSeeded ? {} : { work }),
        ...(target.detailSeeded ? {} : { detail }),
        ...(target.overlaySeeded && target.overlayStacked
          ? {}
          : {
              customerOverlay: target.overlaySeeded
                ? `${scenario.customerOverlay.code} is in the library; the run puts it on top of ${scenario.customerOverlay.program}'s stack.`
                : overlaySummary(),
            }),
        ...(target.flowDownSeeded ? {} : { flowDown: flowDownSummary() }),
      },
    };
  }
  if (target.baselines !== 1)
    issues.push({
      blocks: true,
      message: `Expected one published reference baseline "${scenario.product.baseline}", found ${target.baselines}. Run npm run seed:reference first.`,
    });
  const taken = [
    ["business line", target.businessLines],
    ["product", target.products],
    ["library component", target.definitions],
    ["program", target.programs],
    ["system", target.systems],
  ];
  for (const [noun, codes] of taken)
    if (codes.length)
      issues.push({
        blocks: true,
        message: `The workspace already has a ${noun} coded ${codes.join(", ")}; the scenario does not overwrite it.`,
      });
  const missing = Object.values(scenario.people).filter((name) => !target.people.includes(name));
  if (missing.length)
    issues.push({
      blocks: false,
      message: `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not in this workspace, so the first step leaves ${missing.length === 1 ? "that role" : "those roles"} empty. The fourth step adds the people it names and gives each business line its owner.`,
    });
  const configurations = (code) => (code === "*" ? "every configuration" : `configuration ${code}`);
  const pinned = scenario.product.elements.filter((element) => element[5]).length;
  return {
    issues,
    summary: {
      businessLines: scenario.businessLines.map((line) => `${line.code} ${line.name}`),
      product: {
        name: `${scenario.product.code} ${scenario.product.name}`,
        configurations: scenario.product.configurations.map(
          (configuration) => `${configuration.code} ${configuration.name}`,
        ),
        elements: `${scenario.product.elements.length} elements, ${pinned} pinned to a library component`,
        ownElements: Object.fromEntries(
          scenario.product.configurations.map((configuration) => [
            configuration.code,
            scenario.product.elements.filter((element) => element[4] === configuration.code).length,
          ]),
        ),
        assessment: `${scenario.product.assessment.title}, against the ${scenario.product.baseline}`,
        nextVersion: scenario.product.nextVersion.remarks,
      },
      otherProducts: scenario.otherProducts.map(
        (item) => `${item.code} ${item.name} (${item.state})`,
      ),
      customerRequirements,
      deltaAssessments,
      work,
      detail,
      customerOverlay: overlaySummary(),
      flowDown: flowDownSummary(),
      programs: scenario.programs.map((program) => ({
        program: `${program.code} ${program.name}`,
        variant: `${program.variant.code}, from ${configurations(program.variant.configuration)}`,
        removes: program.variant.removed,
        adds: program.variant.added.map((element) => element[0]),
        changes: program.variant.changes.map(([code, kinds]) => `${code} (${kinds.join(", ")})`),
      })),
    },
  };
}

export function applyProducts(transaction, payload, { commit = false } = {}) {
  const result = sql(
    [
      "begin;",
      transaction,
      `select pg_temp.seed_products(${json(payload)});`,
      `select pg_temp.seed_product_requirements(${json(payload)});`,
      `select pg_temp.seed_product_delta_assessments(${json(payload)});`,
      `select pg_temp.seed_product_work(${json(payload)});`,
      `select pg_temp.seed_product_detail(${json(payload)});`,
      `select pg_temp.seed_product_overlay(${json(payload)});`,
      `select pg_temp.seed_product_flowdown(${json(payload)});`,
      commit ? "commit;" : "rollback;",
    ].join("\n"),
  );
  const [products, requirements, assessments, work, detail, overlay, flowDown] = result
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .slice(-7)
    .map((line) => JSON.parse(line));
  const steps = [products, requirements, assessments, work, detail, overlay, flowDown];
  return {
    products,
    requirements,
    assessments,
    work,
    detail,
    overlay,
    flowDown,
    changed: steps.some((step) => step.changed),
    records: steps.reduce((sum, step) => sum + (step.records ?? 0), 0),
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
      "node scripts/seed-demo-products.mjs --tenant UUID --account EMAIL [--as-of YYYY-MM-DD] [--check | --apply]\nDefault: read-only plan of the products scenario. --check runs the complete transaction and rolls it back. --apply commits it. --as-of lays the programs' work out from that day (default today, UTC), so what is overdue and what is due soon read true on it.",
    );
    return;
  }
  if (!options.tenant || !options.account)
    throw new Error(
      "Supply --tenant UUID and --account EMAIL explicitly; no workspace is selected implicitly.",
    );
  if (options.check && options.apply) throw new Error("Choose --check or --apply, not both.");
  const asOf = options["as-of"] ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T00:00:00Z`)))
    throw new Error("--as-of must be a day, YYYY-MM-DD");
  const tenant = targetTenant(options.tenant, options.account);
  const plan = buildPlan({ target: readTarget(options.tenant), asOf });
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
  const payload = buildPayload({
    tenantId: options.tenant,
    accountUserId: tenant.personal_owner_id,
    scenarioSha256: sha256(await readFile(scenarioPath)),
    workScenarioSha256: sha256(await readFile(workScenarioPath)),
    detailScenarioSha256: sha256(await readFile(detailScenarioPath)),
    asOf,
  });
  // The later steps' transaction bodies stand on the earlier ones' helpers, so all are loaded.
  const transaction = [
    await readFile(transactionPath, "utf8"),
    await readFile(workTransactionPath, "utf8"),
    await readFile(detailTransactionPath, "utf8"),
  ].join("\n");
  const result = applyProducts(transaction, payload, { commit: Boolean(options.apply) });
  const written = [
    result.products.changed && scenario.datasetId,
    result.requirements.changed && scenario.requirementsDatasetId,
    result.assessments.changed && scenario.assessmentDatasetId,
    result.work.changed && workScenario.workDatasetId,
    result.detail.changed && detailScenario.detailDatasetId,
    result.overlay.changed && scenario.overlayDatasetId,
    result.flowDown.changed && detailScenario.flowDownDatasetId,
  ].filter(Boolean);
  console.log(JSON.stringify(result, null, 2));
  console.log(
    !result.changed
      ? "Nothing changed: this workspace already holds the whole scenario."
      : options.apply
        ? `Committed: ${result.records} record(s) listed under ${written.join(", ")}.${
            result.overlay.changed && result.overlay.stack?.controls
              ? ` ${scenario.customerOverlay.program}'s control baseline is ${result.overlay.stack.controls.after} controls (${result.overlay.stack.controls.before} before).`
              : ""
          }`
        : "Check passed; the transaction was rolled back and nothing was written.",
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
