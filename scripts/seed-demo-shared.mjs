#!/usr/bin/env node
/**
 * Explicit demo step: make library components genuinely shared and assessed once. The X800 Missile
 * component set's Mission Computer, which the X800's GS-MC element is pinned to, also backs
 * WS-X90's CN-109101 mission computer; the set gets a named owner and a business line; and one
 * published component assessment carries the determinations the X800's first product assessment
 * recorded on GS-MC. The G25 set's Audit Log Collector is shared with WS-X90's CN-109118 the same
 * way. Then one finding flows up: an operational issue WS-X90 holds on its mission computer is
 * offered to the Mission Computer's owner and left waiting in the Review queue, so no other
 * consumer holds it yet. Last, what the component is made of and what is known to be wrong with
 * it: an SBOM of the Mission Computer, the CVE the finding names as a record of its own (on the
 * SBOM's OpenSSH server, bearing on two controls, with WS-X90's issue as its row there), and one
 * Cyber T&E campaign planned for WS-X90. Then the component's next version: version 2 of the X800
 * Missile component set, a draft that copies version 1's components and claims, says what it
 * changes in the Mission Computer and which controls that affects, and holds the SBOM of the
 * rebuilt image with the CVE recorded as fixed; and the remediation item in WS-X90's POA&M that
 * answers the issue, with its milestones. The version is left a draft, so nobody is behind and no
 * status read moves for it.
 *
 * The scenario is authored (scripts/demo/shared-scenario.mjs) and stands on the demo import
 * (npm run seed:demo) and the products scenario (npm run seed:demo-products). What it adds is
 * listed under its own provenance dataset; what it changes in records those steps wrote is kept
 * in its batch with the values it found, and --revert puts them back. Each run compares what the
 * existing reads answer for the programs it touches, before and after, and says which moved and by
 * how much: a program's control status now inherits what a component version was judged on, so a
 * program built from an assessed component moves, and the run says its totals both times and how
 * many controls and objectives it inherits. It also counts what the seed is meant to change (a
 * program's open issues, assessment campaigns and remediation items, the Review queue, the
 * standing SBOMs, the CVE records and the versions of the component sets) both times.
 * Defaults to a read-only plan; never runs at app boot.
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { sha256 } from "./demo/context.mjs";
import { sql, quote, json, queryJson, targetTenant } from "./demo/database.mjs";
import * as scenario from "./demo/shared-scenario.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scenarioPath = resolve(root, "scripts/demo/shared-scenario.mjs");
const transactionPath = resolve(root, "scripts/demo/seed-shared.sql");

/** The scenario as the transaction reads it. */
export function buildPayload({ tenantId, accountUserId, scenarioSha256 }) {
  return {
    tenantId,
    accountUserId,
    scenarioSha256,
    datasetId: scenario.datasetId,
    sharedComponents: scenario.sharedComponents,
    sharedFindings: scenario.sharedFindings,
    sharedSboms: scenario.sharedSboms,
    sharedVulnerabilities: scenario.sharedVulnerabilities,
    sharedCyberTests: scenario.sharedCyberTests,
    sharedVersions: scenario.versions(),
    sharedRemediation: scenario.sharedRemediation,
    watchedPrograms: scenario.watchedPrograms,
  };
}

/**
 * What the plan's read needs of the third and fourth chapters: the CVEs, the controls a CVE bears
 * on or a version's change affects, the cyber tests, the versions and the remediation items.
 */
const chapterThree = () => ({
  cves: scenario.sharedVulnerabilities.map((vulnerability) => vulnerability.cveId),
  controls: [
    ...new Set([
      ...scenario.sharedVulnerabilities.flatMap((item) => item.controls),
      ...scenario.sharedVersions.flatMap((entry) =>
        entry.changes.flatMap((change) => change.controls),
      ),
    ]),
  ],
  tests: scenario.sharedCyberTests.map(({ key, program, title, owner }) => ({
    key,
    program,
    title,
    owner,
  })),
  versions: scenario.sharedVersions.map(({ key, definition, version }) => ({
    key,
    definition,
    version,
  })),
  remediation: scenario.sharedRemediation.map(({ key, program, document, title, owner }) => ({
    key,
    program,
    document,
    title,
    owner,
  })),
});

/** What the workspace holds of what the scenario stands on, read and nothing written. */
export const readTarget = (tenantId) => queryJson(targetQuery(tenantId));

/** The one read-only query the plan is built from. */
export function targetQuery(tenantId) {
  const tenant = `${quote(tenantId)}::uuid`;
  return `with scenario as (select ${json(scenario.sharedComponents)} as sets, ${json(scenario.sharedFindings)} as findings, ${json(chapterThree())} as third),
    sets as (select s.value as entry from scenario, jsonb_array_elements(scenario.sets) s),
    findings as (select f.value as entry from scenario, jsonb_array_elements(scenario.findings) f),
    tests as (select x.value as entry from scenario, jsonb_array_elements(scenario.third->'tests') x),
    versions as (select x.value as entry from scenario, jsonb_array_elements(scenario.third->'versions') x),
    remediation as (select x.value as entry from scenario, jsonb_array_elements(scenario.third->'remediation') x),
    items as (select sets.entry->>'definition' as definition, c.value as item from sets, jsonb_array_elements(sets.entry->'components') c),
    head as (
      select distinct on (d.code) d.code, d.id as definition_id, d.owner_party_id, d.business_line_id, r.id as revision_id, r.version_number
      from public.component_definitions d
      left join public.component_definition_revisions r on r.tenant_id = d.tenant_id and r.component_definition_id = d.id and r.state = 'published'
      where d.tenant_id = ${tenant} and d.code in (select entry->>'definition' from sets)
      order by d.code, r.version_number desc nulls last)
    select jsonb_build_object(
      'seeded', exists (select 1 from public.demo_import_batches where tenant_id = ${tenant} and dataset_id = ${quote(scenario.datasetId)}),
      'people', (select coalesce(jsonb_object_agg(n.name, n.found), '{}'::jsonb) from (
        select x.name, (select count(*) from public.parties a where a.tenant_id = ${tenant} and a.name = x.name) as found
        from (select entry->>'owner' as name from sets union select entry->'assessment'->>'assessor' from sets
          union select entry->'offer'->>'offeredBy' from findings union select entry->>'owner' from tests
          union select entry->>'owner' from remediation) x) n),
      'businessLines', (select coalesce(jsonb_agg(b.code), '[]'::jsonb) from public.business_lines b
        where b.tenant_id = ${tenant} and b.code in (select entry->>'businessLine' from sets)),
      'definitions', (select coalesce(jsonb_object_agg(h.code, jsonb_build_object(
          'version', h.version_number,
          'owner', (select a.name from public.parties a where a.id = h.owner_party_id),
          'businessLine', (select b.code from public.business_lines b where b.id = h.business_line_id))), '{}'::jsonb) from head h),
      'components', (select coalesce(jsonb_object_agg(i.definition || '/' || (i.item->>'name'), jsonb_build_object(
          'found', (select count(*) from head h join public.defined_components c
            on c.tenant_id = ${tenant} and c.component_definition_revision_id = h.revision_id and c.name = i.item->>'name'
            where h.code = i.definition),
          'source', (select jsonb_build_object(
              'assessment', a.title, 'publishedAt', a.published_at,
              'pinned', exists (select 1 from head h join public.defined_components c
                on c.tenant_id = ${tenant} and c.component_definition_revision_id = h.revision_id and c.name = i.item->>'name'
                where h.code = i.definition and c.id = e.defined_component_id),
              'determinations', jsonb_build_object(
                'satisfied', (select count(*) from public.product_determinations d where d.product_assessment_id = a.id and d.product_element_id = e.id and d.determination = 'satisfied'),
                'partially_satisfied', (select count(*) from public.product_determinations d where d.product_assessment_id = a.id and d.product_element_id = e.id and d.determination = 'partially_satisfied'),
                'other_than_satisfied', (select count(*) from public.product_determinations d where d.product_assessment_id = a.id and d.product_element_id = e.id and d.determination = 'other_than_satisfied')))
            from public.product_assessments a
            join public.product_revisions r on r.tenant_id = a.tenant_id and r.id = a.product_revision_id
            join public.products x on x.tenant_id = r.tenant_id and x.id = r.product_id
            left join public.product_elements e on e.tenant_id = a.tenant_id and e.product_revision_id = r.id and e.code = i.item->'from'->>'element'
            where a.tenant_id = ${tenant} and a.state = 'published' and x.code = i.item->'from'->>'product'
              and r.version_number = (i.item->'from'->>'version')::integer
            order by a.published_at desc, a.id desc limit 1))), '{}'::jsonb) from items i),
      'uses', (select coalesce(jsonb_object_agg(format('%s/%s/%s', u.value->>'program', u.value->>'system', u.value->>'component'), (
          select jsonb_build_object('found', true, 'builtFrom', (
            select d.code || '/' || dc.name from public.defined_components dc
            join public.component_definition_revisions r on r.id = dc.component_definition_revision_id
            join public.component_definitions d on d.id = r.component_definition_id
            where dc.id = c.defined_component_id))
          from public.system_components c
          join public.systems s on s.tenant_id = c.tenant_id and s.id = c.system_id
          join public.programs g on g.tenant_id = s.tenant_id and g.id = s.program_id
          left join public.system_component_element_links k on k.tenant_id = c.tenant_id and k.id = c.id
          join public.systems e on e.tenant_id = c.tenant_id and e.id = coalesce(k.system_element_id, c.system_id)
          where c.tenant_id = ${tenant} and g.code = u.value->>'program' and s.code = u.value->>'system'
            and c.code = u.value->>'component' and e.code = u.value->>'element')), '{}'::jsonb)
        from items i, jsonb_array_elements(i.item->'uses') u),
      'findings', (select coalesce(jsonb_object_agg(f.entry->>'key', jsonb_build_object(
          'draftPlan', exists (select 1 from public.assessment_campaigns c
            join public.programs g on g.tenant_id = c.tenant_id and g.id = c.program_id
            join public.assessment_plan_revisions pl on pl.tenant_id = c.tenant_id and pl.campaign_id = c.id
            where c.tenant_id = ${tenant} and g.code = f.entry->'use'->>'program' and c.title = f.entry->>'campaign' and pl.state = 'draft'),
          'issueHeld', exists (select 1 from public.operational_issues o
            join public.programs g on g.tenant_id = o.tenant_id and g.id = o.program_id
            where o.tenant_id = ${tenant} and g.code = f.entry->'use'->>'program' and o.title = f.entry->'issue'->>'title'))), '{}'::jsonb)
        from findings f),
      'cvesHeld', (select coalesce(jsonb_agg(v.cve_id order by v.cve_id), '[]'::jsonb) from scenario, public.vulnerabilities v
        where v.tenant_id = ${tenant} and scenario.third->'cves' ? v.cve_id),
      'controls', (select coalesce(jsonb_object_agg(c.code, (select count(*) from public.controls k
          join public.catalog_revisions r on r.id = k.catalog_revision_id and r.state = 'published'
          where k.code = c.code and (k.tenant_id is null or k.tenant_id = ${tenant}))), '{}'::jsonb)
        from scenario, jsonb_array_elements_text(scenario.third->'controls') c(code)),
      'cyberTests', (select coalesce(jsonb_object_agg(x.entry->>'key', jsonb_build_object(
          'program', exists (select 1 from public.programs g where g.tenant_id = ${tenant} and g.code = x.entry->>'program'),
          'campaignHeld', exists (select 1 from public.assessment_campaigns c
            join public.programs g on g.tenant_id = c.tenant_id and g.id = c.program_id
            where c.tenant_id = ${tenant} and g.code = x.entry->>'program' and c.title = x.entry->>'title'))), '{}'::jsonb)
        from tests x),
      'versionsHeld', (select coalesce(jsonb_object_agg(v.entry->>'key', exists (select 1 from public.component_definitions d
          join public.component_definition_revisions r on r.tenant_id = d.tenant_id and r.component_definition_id = d.id
          where d.tenant_id = ${tenant} and d.code = v.entry->>'definition' and r.version_number = (v.entry->>'version')::integer)), '{}'::jsonb)
        from versions v),
      'remediation', (select coalesce(jsonb_object_agg(m.entry->>'key', jsonb_build_object(
          'documents', (select count(*) from public.poam_documents d
            join public.programs g on g.tenant_id = d.tenant_id and g.id = d.program_id
            where d.tenant_id = ${tenant} and g.code = m.entry->>'program' and d.title = m.entry->>'document'),
          'itemHeld', exists (select 1 from public.poam_items i
            join public.poam_documents d on d.tenant_id = i.tenant_id and d.id = i.poam_document_id
            join public.programs g on g.tenant_id = d.tenant_id and g.id = d.program_id
            where i.tenant_id = ${tenant} and g.code = m.entry->>'program' and i.title = m.entry->>'title'))), '{}'::jsonb)
        from remediation m)
    );`;
}

/** Who an offer waits on: the owner the scenario names for the component's set. */
const ownerOf = (finding) =>
  scenario.sharedComponents.find((set) => set.definition === finding.definition)?.owner ??
  "the component's owner";

/** What the seed is meant to change, said as before and after: "PRG-1090 open operational issues: open 43 to 44". */
export function effectLines({ before = {}, after = {} } = {}) {
  const lines = [];
  for (const [key, was] of Object.entries(before)) {
    const now = after[key] ?? {};
    const moved = Object.keys({ ...was, ...now })
      .filter((field) => typeof (now[field] ?? was[field]) === "number")
      .filter((field) => was[field] !== now[field])
      .map((field) => `${field.replace("_", " ")} ${was[field] ?? 0} to ${now[field] ?? 0}`);
    const kinds = Object.keys({ ...was.kinds, ...now.kinds })
      .filter((kind) => (was.kinds?.[kind] ?? 0) !== (now.kinds?.[kind] ?? 0))
      .map((kind) => `${kind} ${was.kinds?.[kind] ?? 0} to ${now.kinds?.[kind] ?? 0}`);
    if (moved.length || kinds.length) lines.push(`${key}: ${[...moved, ...kinds].join(", ")}`);
  }
  return lines;
}

/** A count's name as a reader says it: not_assessed is "not assessed". */
const said = (field) => field.replaceAll("_", " ");

/** The numbers of one record that differ, each as "satisfied 174 to 176". */
const moved = (was = {}, now = {}) =>
  Object.keys({ ...was, ...now })
    .filter((field) => typeof (now[field] ?? was[field]) === "number")
    .filter((field) => (was[field] ?? 0) !== (now[field] ?? 0))
    .map((field) => `${said(field)} ${was[field] ?? 0} to ${now[field] ?? 0}`);

/**
 * The existing reads that answer differently, each with what moved: "PRG-1090
 * program_control_status: satisfied 174 to 176, no evidence 235 to 234; 2 controls hold 5 inherited
 * objectives (0 and 0 before)". A read whose totals stand and whose answer differs says so, so a
 * change the totals do not show is still reported.
 */
export function readLines({ changed = [], before = {}, after = {} } = {}) {
  return changed.map((key) => {
    const was = before[key] ?? {};
    const now = after[key] ?? {};
    const parts = [
      ...moved(was.totals, now.totals),
      ...moved(was.elements, now.elements).map((part) => `elements ${part}`),
    ];
    const held = now.inherited ?? was.inherited;
    const inheritance = held
      ? `${now.inherited?.controls ?? 0} controls hold ${now.inherited?.objectives ?? 0} inherited objectives (${was.inherited?.controls ?? 0} and ${was.inherited?.objectives ?? 0} before)`
      : null;
    const totals = parts.length ? parts.join(", ") : "its totals stand and its answer differs";
    return `${key}: ${inheritance ? `${totals}; ${inheritance}` : totals}`;
  });
}

/** An SBOM's format as a reader says it: CycloneDX 1.5. */
const formatName = (sbom) =>
  `${{ cyclonedx: "CycloneDX", spdx: "SPDX", other: "Another format" }[sbom.format]}${sbom.specVersion ? ` ${sbom.specVersion}` : ""}`;

const counted = (determinations) =>
  `${determinations.satisfied} satisfied, ${determinations.partially_satisfied} partially satisfied, ${determinations.other_than_satisfied} other than satisfied`;

/** The plan a reader sees before anything is written, and what would stop it. */
export function buildPlan({ target }) {
  const issues = scenario.scenarioIssues().map((message) => ({ blocks: true, message }));
  const stop = (message) => issues.push({ blocks: true, message });
  if (target.seeded)
    return {
      issues,
      summary: {
        state:
          "This workspace already holds the shared components scenario. --revert puts back what it changed and removes what it added.",
      },
    };
  for (const set of scenario.sharedComponents) {
    const held = target.definitions[set.definition];
    if (!held)
      stop(
        `The component set ${set.definition} is not in this workspace. Run npm run seed:demo-products first.`,
      );
    else if (held.version === null)
      stop(`The component set ${set.definition} has no published version to assess.`);
    else if (
      (held.owner && held.owner !== set.owner) ||
      (held.businessLine && held.businessLine !== set.businessLine)
    )
      stop(
        `The component set ${set.definition} already names another owner or business line; the scenario does not overwrite it.`,
      );
    for (const name of new Set([set.owner, set.assessment.assessor]))
      if (target.people[name] !== 1)
        stop(`Expected one person named ${name}, found ${target.people[name] ?? 0}.`);
    if (!target.businessLines.includes(set.businessLine))
      stop(`The business line ${set.businessLine} is not in this workspace.`);
    for (const component of set.components) {
      const found = target.components[`${set.definition}/${component.name}`];
      if (held?.version != null && found?.found !== 1)
        stop(
          `Expected one component named ${component.name} in ${set.definition} version ${held.version}, found ${found?.found ?? 0}.`,
        );
      const { product, version, element } = component.from;
      if (!found?.source)
        stop(
          `${product} version ${version} has no published product assessment to carry determinations from.`,
        );
      else if (!found.source.pinned)
        stop(
          `${product}'s element ${element} is not pinned to ${component.name} of ${set.definition}.`,
        );
      else if (counted(found.source.determinations) !== counted(component.determinations))
        stop(
          `The product assessment recorded ${counted(found.source.determinations)} on ${product}'s ${element}, not the ${counted(component.determinations)} the scenario carries.`,
        );
      for (const use of component.uses) {
        const key = `${use.program}/${use.system}/${use.component}`;
        const component_ = target.uses[key];
        if (!component_?.found)
          stop(
            `${use.program}'s ${use.system} holds no component ${use.component} on element ${use.element}. Run npm run seed:demo first.`,
          );
        else if (
          component_.builtFrom &&
          component_.builtFrom !== `${set.definition}/${component.name}`
        )
          stop(
            `${use.program}'s component ${use.component} is already built from ${component_.builtFrom}; the scenario does not overwrite it.`,
          );
      }
    }
  }
  for (const finding of scenario.sharedFindings) {
    const { program, component } = finding.use;
    const held = target.findings?.[finding.key];
    if (target.people[finding.offer.offeredBy] !== 1)
      stop(
        `Expected one person named ${finding.offer.offeredBy}, found ${target.people[finding.offer.offeredBy] ?? 0}.`,
      );
    if (!held?.draftPlan)
      stop(
        `${program}'s campaign ${finding.campaign} has no draft plan to take ${component} as an assessment subject.`,
      );
    if (held?.issueHeld)
      stop(
        `${program} already holds an operational issue titled ${finding.issue.title}; the scenario does not write it twice.`,
      );
  }
  for (const vulnerability of scenario.sharedVulnerabilities) {
    if (target.cvesHeld?.includes(vulnerability.cveId))
      stop(
        `This workspace already holds a record of ${vulnerability.cveId}; the scenario does not write it twice.`,
      );
    for (const code of vulnerability.controls)
      if (target.controls?.[code] !== 1)
        stop(
          `Expected one control coded ${code} in a published catalog, found ${target.controls?.[code] ?? 0}.`,
        );
  }
  for (const test of scenario.sharedCyberTests) {
    const held = target.cyberTests?.[test.key];
    if (!held?.program)
      stop(`The program ${test.program} is not in this workspace. Run npm run seed:demo first.`);
    if (held?.campaignHeld)
      stop(
        `${test.program} already holds an assessment campaign titled ${test.title}; the scenario does not write it twice.`,
      );
    if (target.people[test.owner] !== 1)
      stop(`Expected one person named ${test.owner}, found ${target.people[test.owner] ?? 0}.`);
  }
  for (const entry of scenario.sharedVersions) {
    const held = target.definitions[entry.definition];
    if (target.versionsHeld?.[entry.key])
      stop(
        `The component set ${entry.definition} already holds a version ${entry.version}; the scenario does not write it twice.`,
      );
    else if (held && held.version !== null && held.version !== entry.version - 1)
      stop(
        `The latest published version of ${entry.definition} is ${held.version}, not the ${entry.version - 1} that version ${entry.version} follows.`,
      );
    for (const code of new Set(entry.changes.flatMap((change) => change.controls)))
      if (target.controls?.[code] !== 1)
        stop(
          `Expected one control coded ${code} in a published catalog, found ${target.controls?.[code] ?? 0}.`,
        );
  }
  for (const item of scenario.sharedRemediation) {
    const held = target.remediation?.[item.key];
    if (held?.documents !== 1)
      stop(
        `Expected one POA&M document titled ${item.document} in ${item.program}, found ${held?.documents ?? 0}.`,
      );
    if (held?.itemHeld)
      stop(
        `${item.program} already holds a remediation item titled ${item.title}; the scenario does not write it twice.`,
      );
    if (target.people[item.owner] !== 1)
      stop(`Expected one person named ${item.owner}, found ${target.people[item.owner] ?? 0}.`);
  }
  return {
    issues,
    summary: {
      componentSets: scenario.sharedComponents.map((set) => ({
        set: set.definition,
        owner: set.owner,
        businessLine: set.businessLine,
        assessment: `${set.assessment.title}, by ${set.assessment.assessor}, completed ${set.assessment.completedOn}, published`,
        components: set.components.map((component) => ({
          component: component.name,
          carries: `${scenario.determinationCount(component)} determinations (${counted(component.determinations)}) from ${component.from.product} version ${component.from.version}'s product assessment on ${component.from.element}`,
          alsoBacks: component.uses.map(
            (use) => `${use.program} ${use.system}: ${use.component} on ${use.element}`,
          ),
        })),
      })),
      notShared: scenario.notShared.map(
        (entry) => `${entry.component} with ${entry.with}: ${entry.reason}`,
      ),
      offers: scenario.sharedFindings.map((finding) => ({
        finding: `${finding.issue.title}: ${finding.issue.severity}, opened ${finding.issue.openedAt.slice(0, 10)} in ${finding.use.program}, observed on ${finding.use.component}`,
        offer: `Offered on ${finding.component} ${finding.offer.offeredAt.slice(0, 10)} by ${finding.offer.offeredBy}, waiting on ${ownerOf(finding)} in the Review queue`,
      })),
      notOffered: scenario.notOffered.map(
        (entry) =>
          `${entry.kind} on ${entry.component} from ${entry.from} (${entry.controls.join(", ")}): ${entry.reason}`,
      ),
      sboms: scenario.sharedSboms.map(
        (sbom) =>
          `${sbom.title}: ${formatName(sbom)}, generated ${sbom.generatedOn}, ${sbom.components.length} components of ${sbom.component} in ${sbom.definition}`,
      ),
      vulnerabilities: scenario.sharedVulnerabilities.map((vulnerability) => ({
        cve: `${vulnerability.cveId}: ${vulnerability.severity}, CVSS ${vulnerability.cvssScore}, published ${vulnerability.publishedOn}, fixed in ${vulnerability.fixedIn}`,
        affects: vulnerability.affects.map(
          (affected) =>
            `${affected.component} ${affected.version} of ${affected.sbom} (${affected.state.replaceAll("_", " ")})`,
        ),
        bearsOn: vulnerability.controls,
        rows: vulnerability.issues.map((key) => {
          const finding = scenario.sharedFindings.find((item) => item.key === key);
          return `${finding.use.program}: ${finding.issue.title}`;
        }),
      })),
      cyberTests: scenario.sharedCyberTests.map(
        (test) =>
          `${test.program}: ${test.title}, phase ${test.phase}, ${test.status}, ${test.startsAt.slice(0, 10)} to ${test.endsAt.slice(0, 10)}, owned by ${test.owner}, with no plan yet`,
      ),
      versions: scenario.versions().map((entry) => ({
        version: `${entry.definition} version ${entry.version}, a ${entry.state}: every component of version ${entry.version - 1} with what it claims`,
        changes: entry.changes.map(
          (change) =>
            `${change.component}: ${change.kinds.join(", ")}; affects ${change.controls.join(", ")}`,
        ),
        sboms: entry.sboms.map(
          (sbom) =>
            `${sbom.title}: ${formatName(sbom)}, generated ${sbom.generatedOn}, ${sbom.components.length} components, ${sbom.replaces.map((item) => `${item.name} ${item.version}`).join(", ")}; ${sbom.vulnerabilities.map((item) => `${item.cveId} ${item.state.replaceAll("_", " ")}`).join(", ")}`,
        ),
      })),
      remediation: scenario.sharedRemediation.map((item) => ({
        item: `${item.program}: ${item.title}, ${item.status.replaceAll("_", " ")}, owned by ${item.owner}, planned for ${item.plannedCompletion}, in ${item.document}`,
        milestones: item.milestones.map(
          (milestone) => `${milestone.title}, ${milestone.plannedOn}`,
        ),
      })),
      existingReads: `Compared before and after for ${scenario.watchedPrograms.join(" and ")}: each program's control status, each SSP's register and each variant's delta. A control status that inherits a component's determinations moves, and the run says by how much.`,
    },
  };
}

/** Run the seed, or its revert, in one transaction: committed, or rolled back. */
export function applyShared(transaction, payload, { commit = false, revert = false } = {}) {
  const result = sql(
    [
      "begin;",
      transaction,
      `select pg_temp.${revert ? "revert_shared" : "seed_shared"}(${json(payload)});`,
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
      "node scripts/seed-demo-shared.mjs --tenant UUID --account EMAIL [--check | --apply] [--revert]\nDefault: read-only plan of the shared components scenario. --check runs the complete transaction and rolls it back, and says which existing reads answer differently, with their totals before and after and how many controls and objectives a program inherits. --apply commits it. --revert undoes a committed run instead: rolled back unless --apply is given with it.",
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
    const mode = options.apply ? "revert" : "revert check, rolled back";
    console.log(JSON.stringify({ mode, tenantId: options.tenant }, null, 2));
    const result = applyShared(transaction, payload, {
      commit: Boolean(options.apply),
      revert: true,
    });
    console.log(JSON.stringify(result, null, 2));
    const undone = effectLines(result.effects);
    const back = readLines(result.existingReads);
    console.log(
      !result.changed
        ? result.reason
        : `${
            options.apply
              ? `Reverted: ${result.restored} record(s) put back as they were and the scenario's records removed.`
              : "Revert check passed; the transaction was rolled back and nothing was changed."
          }${back.length ? ` Existing reads that answer differently: ${back.join("; ")}.` : ""}${
            undone.length ? ` What changes back: ${undone.join("; ")}.` : ""
          }`,
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
  const result = applyShared(transaction, payload, { commit: Boolean(options.apply) });
  console.log(JSON.stringify(result, null, 2));
  const changed = readLines(result.existingReads);
  const effects = effectLines(result.effects);
  console.log(
    !result.changed
      ? "Nothing changed: this workspace already holds the shared components scenario."
      : `${
          options.apply
            ? `Committed: ${result.records} record(s) listed under ${scenario.datasetId}, ${result.updated.length} existing record(s) changed.`
            : "Check passed; the transaction was rolled back and nothing was written."
        } ${
          changed.length
            ? `Existing reads that answer differently: ${changed.join("; ")}.`
            : "No existing read answers differently."
        }${effects.length ? ` What changes: ${effects.join("; ")}.` : ""}`,
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch((error) => {
    console.error(error.stderr?.toString() || error.message);
    process.exitCode = 1;
  });
