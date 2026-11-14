import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { serializeFramework } from "../reference-transcribe/lib.mjs";
import {
  buildFrameworkRows,
  buildReferenceRows,
  referenceSql,
  rowStore,
} from "../seed-reference.mjs";

const result = await buildReferenceRows();
const rows = (table) => result.tables.get(table) ?? [];

test("pinned source releases retain complete published catalog and CCI counts", () => {
  assert.equal(result.sources.length, 10);
  assert.equal(rows("controls").length, 1196);
  assert.equal(rows("control_parts").length, 12730);
  assert.equal(rows("parameters").length, 1600);
  assert.equal(rows("cci_items").length, 5100);
  assert.equal(rows("cci_references").length, 10183);
  assert.deepEqual(result.baselineCounts, { low: 149, moderate: 287, high: 370, privacy: 96 });
});

test("all OSCAL part identities, hierarchy and source prose survive normalization", () => {
  const document = rows("oscal_document_revisions").find((row) => row.original_content.catalog);
  const controls = new Map(rows("controls").map((row) => [row.id, row.source_id]));
  const parts = new Map(rows("control_parts").map((row) => [row.id, row]));
  for (const part of parts.values()) {
    const original = part.source_pointer
      .split("/")
      .slice(1)
      .reduce((value, key) => value[key], document.original_content);
    assert.equal(part.source_id, original.id ?? null);
    assert.equal(part.name, original.name);
    assert.equal(part.prose, original.prose ?? null);
    assert.deepEqual(part.props, original.props ?? []);
    if (part.control_id) assert.ok(controls.has(part.control_id));
    if (part.parent_part_id) {
      const parent = parts.get(part.parent_part_id);
      assert.equal(parent.control_id, part.control_id);
      assert.equal(parent.group_id, part.group_id);
      assert.ok(part.source_pointer.startsWith(`${parent.source_pointer}/parts/`));
    }
  }
});

test("CCI provenance, dual types, absent contributors and historical references remain explicit", () => {
  assert.equal(
    rows("ref_sources").find((row) => row.code === "disa-cci-list-2024-mirror").authoritative,
    false,
  );
  assert.ok(rows("cci_items").some((row) => row.contributor === null));
  assert.ok(rows("cci_item_types").length > rows("cci_items").length);
  assert.ok(
    rows("cci_references").some((row) => row.resolution_status === "unsupported-publication"),
  );
  assert.equal(result.unresolvedRev5References, 0);
  assert.ok(
    rows("cci_control_links").every(
      (row) => row.control_part_id === null && row.mapping_basis === "source-control-index",
    ),
  );
});

test("every baseline selection is pinned to its source document, import and original directive", () => {
  const selections = new Map(rows("selected_controls").map((row) => [row.id, row]));
  const controls = new Map(rows("controls").map((row) => [row.id, row.source_id]));
  const imports = new Map(rows("profile_imports").map((row) => [row.id, row]));
  const revisions = new Map(rows("profile_revisions").map((row) => [row.id, row]));
  const documents = new Map(
    rows("oscal_document_revisions").map((row) => [row.id, row.original_content]),
  );
  for (const provenance of rows("selection_provenance")) {
    const imported = imports.get(provenance.profile_import_id);
    const document = documents.get(
      revisions.get(imported.profile_revision_id).document_revision_id,
    );
    const originalId = provenance.source_pointer
      .split("/")
      .slice(1)
      .reduce((value, key) => value[key], document);
    assert.equal(
      controls.get(selections.get(provenance.selected_control_id).control_id),
      originalId,
    );
  }
  for (const resolution of rows("profile_resolutions")) {
    assert.equal(
      rows("profile_resolution_inputs").filter((row) => row.profile_resolution_id === resolution.id)
        .length,
      2,
    );
  }
});

test("import is deterministic, transactional and contains only reference tables", async () => {
  const repeated = await buildReferenceRows();
  assert.deepEqual([...result.tables], [...repeated.tables]);
  const sql = referenceSql(result);
  assert.ok(sql.startsWith("begin;"));
  assert.ok(sql.endsWith("commit;"));
  assert.ok(sql.includes("pg_advisory_xact_lock"));
  assert.ok(sql.includes("where not exists"));
  assert.doesNotMatch(
    sql,
    /insert into public\."(?:programs|systems|test_runs|risks|parties|workspace_snapshots)"/,
  );
});

/* ——— Transcribed frameworks: the pinned files —————————————————————————————————————————————— */

const CYBER_RESILIENCY = "nist-sp800-160v2r1-cref";
const ATTACK = "nist-sp800-160v2r1-attack";
const ATTACK_ICS = "nist-sp800-160v2r1-attack-ics";
const LIFE_CYCLE = "nist-sp800-160v1r1-processes";
const pinnedFramework = (code) => result.frameworks.find((framework) => framework.code === code);
const itemsOf = (code) =>
  rows("framework_items").filter(
    (row) => row.framework_revision_id === pinnedFramework(code).revisionId,
  );

test("the pinned transcriptions are sources of their own kind, never authoritative copies", () => {
  const transcriptions = result.sources.filter(
    (source) => source.format === "reference-framework/1",
  );
  assert.deepEqual(
    transcriptions.map((source) => source.id),
    [
      "nist-sp800-160v2r1-cref-transcription",
      "nist-sp800-160v1r1-processes-transcription",
      "nist-sp800-160v2r1-attack-transcription",
      "nist-sp800-160v2r1-attack-ics-transcription",
    ],
  );
  // Appendices F and G name ATT&CK techniques: their entries carry MITRE's license and
  // designation too.
  for (const id of [
    "nist-sp800-160v2r1-attack-transcription",
    "nist-sp800-160v2r1-attack-ics-transcription",
  ]) {
    const appendix = transcriptions.find((source) => source.id === id);
    assert.match(
      appendix.rights,
      /The MITRE Corporation \(MITRE\) hereby grants you a non-exclusive, royalty-free license to use ATT&CK\u00ae/,
    );
    assert.match(
      appendix.rights,
      /"\u00a9 2026 The MITRE Corporation\. This work is reproduced and distributed with the permission of The MITRE Corporation\."/,
    );
  }
  for (const source of transcriptions) {
    assert.equal(source.authoritative, false);
    assert.match(source.authority, /transcribed by this project/);
    // The PDF is named by where it is published, its digest and its size, and is not in the repo.
    assert.equal(source.source_url, source.transcribed_from.url);
    assert.match(source.transcribed_from.url, /^https:\/\/nvlpubs\.nist\.gov\/.+\.pdf$/);
    assert.match(source.transcribed_from.sha256, /^[0-9a-f]{64}$/);
    assert.ok(source.transcribed_from.bytes > 1_000_000);
    assert.match(
      source.rights,
      /Republished courtesy of the National Institute of Standards and Technology\./,
    );
    const record = rows("ref_sources").find((row) => row.code === source.id);
    assert.equal(record.authoritative, false);
    assert.equal(record.rights, source.rights);
  }
  // A framework is built after the ones its links name: Appendices F and G name the approaches
  // of the cyber resiliency constructs. Among equals the order is alphabetical.
  assert.deepEqual(
    result.frameworks.map((framework) => framework.code),
    [LIFE_CYCLE, CYBER_RESILIENCY, ATTACK, ATTACK_ICS],
  );
  for (const framework of result.frameworks) {
    const record = rows("frameworks").find((row) => row.id === framework.frameworkId);
    const source = rows("ref_sources").find((row) => row.id === record.source_id);
    assert.equal(source.code, `${framework.code}-transcription`);
    const revision = rows("framework_revisions").find((row) => row.id === framework.revisionId);
    assert.equal(revision.format, "reference-framework/1");
    assert.equal(
      revision.content_sha256,
      result.sources.find((entry) => entry.id === source.code).sha256,
    );
    assert.equal(revision.method.tool, "pdftotext");
    assert.equal(revision.method.tool_version, "26.04.0");
    assert.equal(revision.corrections.length, framework.corrections);
  }
});

test("the cyber resiliency constructs and Table E-1 are transcribed whole", () => {
  const framework = pinnedFramework(CYBER_RESILIENCY);
  assert.deepEqual(framework.items, {
    goal: 4,
    objective: 8,
    technique: 14,
    approach: 50,
    "architectural-layer": 11,
    "strategic-design-principle": 5,
    "structural-design-principle": 14,
  });
  assert.deepEqual(framework.itemLinks, { "used-at": 240, supports: 314 });
  assert.deepEqual(framework.controlLinks, { supports: 421 });
  assert.equal(framework.controls, 265);
  assert.equal(framework.corrections, 15);

  const items = new Map(itemsOf(CYBER_RESILIENCY).map((row) => [row.id, row]));
  const byCode = new Map([...items.values()].map((row) => [row.code, row]));
  // Every approach is held by one of the fourteen techniques.
  for (const item of items.values()) {
    if (item.kind === "approach") assert.equal(items.get(item.parent_item_id).kind, "technique");
    else assert.equal(item.parent_item_id, null);
  }
  // What supports what, by the kinds each table relates.
  const relates = {};
  for (const link of rows("framework_item_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  )) {
    const key = `${items.get(link.source_item_id).kind} > ${items.get(link.target_item_id).kind}`;
    relates[key] = (relates[key] ?? 0) + 1;
  }
  assert.deepEqual(relates, {
    "approach > architectural-layer": 240,
    "objective > goal": 19,
    "technique > objective": 59,
    "approach > objective": 145,
    "strategic-design-principle > objective": 26,
    "structural-design-principle > technique": 65,
  });

  // Table E-1: every label is an active control of the pinned catalog revision, named as the
  // catalog labels it, and every link is to an approach inside a technique group of its row.
  const controls = new Map(rows("controls").map((row) => [row.id, row]));
  const catalogRevision = rows("catalog_revisions")[0].id;
  const revision = rows("framework_revisions").find((row) => row.id === framework.revisionId);
  assert.equal(revision.catalog_revision_id, catalogRevision);
  const links = rows("framework_control_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  );
  assert.equal(links.length, 421);
  const groups = new Set();
  const outsideOwnTechnique = [];
  for (const link of links) {
    const control = controls.get(link.control_id);
    assert.equal(control.code, link.control_label);
    assert.equal(control.status, "active");
    assert.equal(control.catalog_revision_id, catalogRevision);
    assert.equal(link.catalog_revision_id, catalogRevision);
    assert.equal(link.resolution_status, "resolved");
    assert.equal(link.relation, "supports");
    assert.ok([1, 2, 3].includes(link.ordinal), link.source_identifier);
    const approach = items.get(link.item_id);
    assert.equal(approach.kind, "approach");
    const group = byCode.get(link.props.technique);
    assert.equal(group.kind, "technique", link.source_identifier);
    assert.equal(
      link.source_identifier.startsWith(`E-1:${link.control_label}:${link.ordinal}:`),
      true,
    );
    groups.add(`${link.control_label}:${link.ordinal}`);
    if (group.id !== approach.parent_item_id) outsideOwnTechnique.push(link.source_identifier);
  }
  assert.equal(new Set(links.map((link) => link.control_id)).size, 265);
  assert.equal(groups.size, 368);
  // A label as printed is the catalog's label: AC-2(6) is the control OSCAL identifies as ac-2.6.
  const dynamic = links.find((link) => link.source_identifier === "E-1:AC-2(6):1:1");
  assert.equal(controls.get(dynamic.control_id).source_id, "ac-2.6");
  assert.equal(items.get(dynamic.item_id).code, "approach.dynamic-privileges");
  assert.equal(dynamic.props.technique, "technique.privilege-restriction");
  // One row prints an approach in a group that is not its own technique: SR-7 lists
  // Self-Challenge, a Coordinated Protection approach, under Deception. It stays as printed.
  assert.deepEqual(outsideOwnTechnique, ["E-1:SR-7:1:3"]);
  const printed = links.find((link) => link.source_identifier === "E-1:SR-7:1:3");
  assert.equal(items.get(printed.item_id).code, "approach.self-challenge");
  assert.equal(printed.props.technique, "technique.deception");
  assert.equal(
    items.get(items.get(printed.item_id).parent_item_id).code,
    "technique.coordinated-protection",
  );
});

test("the guidance of Tables 2, 3 and D-4 is transcribed for every goal, objective, technique and approach", () => {
  const items = itemsOf(CYBER_RESILIENCY);
  const byCode = new Map(items.map((row) => [row.code, row]));
  const techniques = items.filter((row) => row.kind === "technique");
  const approaches = items.filter((row) => row.kind === "approach");
  /** A sentence as the table prints it: no label, no bullet, no space at either end. */
  const isSentence = (text) =>
    typeof text === "string" &&
    text === text.trim() &&
    /[.”]$/.test(text) &&
    !/^(Definition|Discussion|Informal description):/.test(text) &&
    !text.includes("•");
  // A technique's definition is its prose; the Discussion beside it is its one property.
  for (const technique of techniques) {
    assert.deepEqual(Object.keys(technique.props), ["discussion"], technique.code);
    assert.ok(isSentence(technique.props.discussion), technique.code);
    assert.ok(isSentence(technique.prose), technique.code);
  }
  // An approach keeps its informal description, and has a discussion and its examples, one a
  // bullet in printed order.
  let bullets = 0;
  for (const approach of approaches) {
    assert.deepEqual(
      Object.keys(approach.props),
      ["informal_description", "discussion", "examples"],
      approach.code,
    );
    assert.ok(isSentence(approach.props.informal_description), approach.code);
    assert.ok(isSentence(approach.props.discussion), approach.code);
    assert.ok(Array.isArray(approach.props.examples), approach.code);
    assert.ok(approach.props.examples.length >= 1, approach.code);
    for (const example of approach.props.examples) assert.ok(isSentence(example), example);
    assert.equal(new Set(approach.props.examples).size, approach.props.examples.length);
    bullets += approach.props.examples.length;
  }
  assert.equal(techniques.length, 14);
  assert.equal(approaches.length, 50);
  assert.equal(bullets, 193);
  // Tables 2 and 3 print a Discussion for each goal and objective, under its definition: the
  // definition is its prose and the Discussion its one property.
  const discussed = items.filter((row) => row.kind === "goal" || row.kind === "objective");
  assert.equal(discussed.length, 12);
  for (const item of discussed) {
    assert.deepEqual(Object.keys(item.props), ["discussion"], item.code);
    assert.ok(isSentence(item.props.discussion), item.code);
    assert.ok(isSentence(item.prose), item.code);
  }
  assert.equal(byCode.get("objective.constrain").prose, "Limit damage from adversity.");
  // A discussion that runs on to the next page is whole.
  assert.match(
    byCode.get("objective.reconstitute").props.discussion,
    /^This objective relates to essential functions, .* timely and correct availability of resources\.$/,
  );
  // No other kind carries a discussion or examples.
  for (const item of items)
    if (!["goal", "objective", "technique", "approach"].includes(item.kind)) {
      assert.equal("discussion" in item.props, false, item.code);
      assert.equal("examples" in item.props, false, item.code);
    }

  assert.equal(
    byCode.get("technique.segmentation").props.discussion,
    "Reduce the adversary’s scope for lateral movement or command and control (C2).",
  );
  const predefined = byCode.get("approach.predefined-segmentation");
  assert.equal(
    predefined.prose,
    "Define enclaves, segments, micro-segments, or other restricted types of resource sets based on criticality and trustworthiness so that they can be protected separately and, if necessary, isolated.",
  );
  assert.equal(
    predefined.props.discussion,
    "Predefined enclaves and micro-segmentation facilitate the risk-calibrated use of other security and cyber resiliency techniques.",
  );
  assert.equal(predefined.props.examples.length, 13);
  assert.equal(
    predefined.props.examples[0],
    "Use virtualization to maintain separate processing domains based on user privileges.",
  );
  // A bullet that wraps over lines is one example, and a word hyphenated at a line's end keeps
  // its hyphen.
  assert.equal(
    predefined.props.examples[3],
    "Isolate security functions from non-security functions.",
  );
  assert.equal(
    predefined.props.examples[6],
    "Separate subnets that connect to different security domains. In particular, provide a DMZ for Internet connectivity.",
  );
  // The examples of a row that runs on to the next page stay with their approach.
  const monitoring = byCode.get("approach.monitoring-and-damage-assessment").props.examples;
  assert.equal(monitoring.length, 7);
  assert.equal(monitoring[0], "Use hardware fault detection.");
  assert.equal(
    monitoring[6],
    "Monitor open-source information for indicators of disclosure or compromise.",
  );
  assert.deepEqual(byCode.get("approach.contextual-unpredictability").props.examples, [
    "Rotate roles and responsibilities.",
    "Implement random channel-hopping.",
    "Use random masking in dynamic data masking.",
  ]);
});

test("Table D-5's architectural layers are transcribed with the approaches each can be used at", () => {
  const framework = pinnedFramework(CYBER_RESILIENCY);
  const items = new Map(itemsOf(CYBER_RESILIENCY).map((row) => [row.id, row]));
  const layers = [...items.values()].filter((row) => row.kind === "architectural-layer");
  // The layers, in the order of the table's columns; the table defines none of them.
  assert.deepEqual(
    layers.map((row) => [row.code, row.ordinal]),
    [
      ["layer.hardware-and-firmware", 1],
      ["layer.networking-and-communications", 2],
      ["layer.other-software", 3],
      ["layer.operating-system", 4],
      ["layer.cloud-virtualization-middleware-infrastructure", 5],
      ["layer.application", 6],
      ["layer.information-storage-management", 7],
      ["layer.technical-system-as-a-whole", 8],
      ["layer.operations", 9],
      ["layer.support", 10],
      ["layer.environment-of-operation", 11],
    ],
  );
  for (const layer of layers) {
    assert.equal(layer.prose, null, layer.code);
    assert.equal(layer.parent_item_id, null, layer.code);
    assert.equal(layer.printed_in, "Table D-5", layer.code);
    // Every layer stands under the table's first heading, and some under more.
    assert.equal(layer.props.within[0], "Socio-Technical System", layer.code);
  }
  const within = (code) => layers.find((row) => row.code === code).props.within;
  assert.deepEqual(within("layer.application"), [
    "Socio-Technical System",
    "Technical System",
    "Software",
  ]);
  assert.deepEqual(within("layer.information-storage-management"), [
    "Socio-Technical System",
    "Technical System",
  ]);
  assert.deepEqual(within("layer.support"), ["Socio-Technical System"]);
  assert.equal(layers[7].title, "Technical System as a Whole");

  // An X under a layer is a link from the approach to the layer, named for the cell it fills.
  const links = rows("framework_item_links").filter(
    (row) => row.framework_revision_id === framework.revisionId && row.relation === "used-at",
  );
  assert.equal(links.length, 240);
  const byApproach = new Map();
  for (const link of links) {
    const approach = items.get(link.source_item_id);
    const layer = items.get(link.target_item_id);
    assert.equal(approach.kind, "approach");
    assert.equal(layer.kind, "architectural-layer");
    assert.equal(link.source_identifier, `D-5:${approach.code}:${layer.code}`);
    assert.equal(link.printed_in, "Table D-5");
    assert.equal(link.ordinal, null);
    assert.deepEqual(link.props, {});
    byApproach.set(approach.code, [...(byApproach.get(approach.code) ?? []), layer.code]);
  }
  // Every one of the fifty approaches can be used at one layer or more.
  assert.equal(byApproach.size, 50);
  assert.deepEqual(byApproach.get("approach.asset-mobility"), [
    "layer.operations",
    "layer.environment-of-operation",
  ]);
  assert.deepEqual(byApproach.get("approach.fragmentation"), [
    "layer.information-storage-management",
  ]);
  assert.deepEqual(byApproach.get("approach.calibrated-defense-in-depth"), [
    "layer.technical-system-as-a-whole",
    "layer.operations",
    "layer.support",
  ]);
  assert.equal(byApproach.get("approach.obfuscation").length, 8);
});

test("the life cycle processes are transcribed with their security outcomes and nothing reprinted", () => {
  const framework = pinnedFramework(LIFE_CYCLE);
  assert.deepEqual(framework.items, { "process-group": 4, process: 30, outcome: 181 });
  assert.deepEqual(framework.itemLinks, {});
  assert.deepEqual(framework.controlLinks, {});
  assert.equal(framework.corrections, 4);
  const items = new Map(itemsOf(LIFE_CYCLE).map((row) => [row.id, row]));
  const holds = { process: "process-group", outcome: "process" };
  for (const item of items.values()) {
    if (item.kind === "process-group") assert.equal(item.parent_item_id, null);
    else assert.equal(items.get(item.parent_item_id).kind, holds[item.kind]);
    // The purposes, which follow ISO/IEC/IEEE 15288, are left out: an item is its name alone.
    assert.equal(item.prose, null);
  }
  // It names no control, so its revision does not depend on the catalog.
  const revision = rows("framework_revisions").find((row) => row.id === framework.revisionId);
  assert.equal(revision.catalog_revision_id, null);
  assert.match(revision.source_document.rights_statement, /Reprinted with permission from IEEE/);
  const outcomes = [...items.values()].filter((item) => item.code.startsWith("outcome.BA."));
  assert.deepEqual(
    outcomes.map((item) => item.ordinal),
    outcomes.map((_, index) => index + 1),
  );
});

test("Appendix F is transcribed with its techniques, mitigations, approaches, effects and controls", () => {
  const framework = pinnedFramework(ATTACK);
  assert.deepEqual(framework.items, {
    tactic: 14,
    "attack-technique": 184,
    mitigation: 29,
    "candidate-mitigation": 115,
    effect: 20,
  });
  assert.deepEqual(framework.itemLinks, { tactic: 213, "affected-by": 1628 });
  assert.deepEqual(framework.controlLinks, { mitigates: 1920 });
  assert.equal(framework.controls, 186);
  assert.equal(framework.corrections, 18);

  const items = new Map(itemsOf(ATTACK).map((row) => [row.id, row]));
  const byCode = new Map([...items.values()].map((row) => [row.code, row]));
  const approaches = new Map(
    itemsOf(CYBER_RESILIENCY)
      .filter((row) => row.kind === "approach")
      .map((row) => [row.id, row]),
  );
  const approachIds = new Map(
    [...approaches.values()].map((row) => [`${CYBER_RESILIENCY}:${row.code}`, row.id]),
  );
  const effects = new Set(
    [...items.values()].filter((row) => row.kind === "effect").map((row) => row.title),
  );
  // Only an effect is held by another item: the five high-level effects hold the fifteen others.
  for (const item of items.values())
    if (item.parent_item_id !== null) {
      assert.equal(item.kind, "effect");
      assert.equal(items.get(item.parent_item_id).kind, "effect");
    }
  /** A row of a tactic's table names its tactic, its mitigation and its effects in the same way. */
  const checkRow = (link) => {
    assert.equal(byCode.get(link.props.tactic).kind, "tactic", link.source_identifier);
    assert.ok(
      ["mitigation", "candidate-mitigation"].includes(byCode.get(link.props.mitigation).kind),
      link.source_identifier,
    );
    assert.ok(link.props.effects.length > 0, link.source_identifier);
    for (const effect of link.props.effects) assert.ok(effects.has(effect), effect);
  };

  const itemLinks = rows("framework_item_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  );
  for (const link of itemLinks) {
    assert.equal(items.get(link.source_item_id).kind, "attack-technique");
    if (link.relation === "tactic") {
      assert.equal(items.get(link.target_item_id).kind, "tactic");
      continue;
    }
    // The approach is an item of the cyber resiliency constructs, in the revision pinned beside it.
    assert.equal(link.relation, "affected-by");
    assert.ok(approaches.has(link.target_item_id), link.source_identifier);
    assert.ok(link.ordinal >= 1 && link.ordinal <= 7, link.source_identifier);
    checkRow(link);
  }
  // A row that names several approaches is one link an approach, the approach closing its place.
  const several = itemLinks.find(
    (row) => row.source_identifier === "F-3:T1595:CM1160:1:obfuscation",
  );
  assert.equal(approaches.get(several.target_item_id).code, "approach.obfuscation");
  assert.deepEqual(several.props, {
    tactic: "tactic.reconnaissance",
    mitigation: "CM1160",
    effects: ["Degrade", "Exert", "Shorten"],
  });

  const controls = new Map(rows("controls").map((row) => [row.id, row]));
  const catalogRevision = rows("catalog_revisions")[0].id;
  const revision = rows("framework_revisions").find((row) => row.id === framework.revisionId);
  assert.equal(revision.catalog_revision_id, catalogRevision);
  const links = rows("framework_control_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  );
  assert.equal(links.length, 1920);
  const approachCounts = { one: 0, several: 0, none: 0 };
  for (const link of links) {
    const control = controls.get(link.control_id);
    assert.equal(control.code, link.control_label);
    assert.equal(control.status, "active");
    assert.equal(link.catalog_revision_id, catalogRevision);
    assert.equal(link.resolution_status, "resolved");
    assert.equal(link.relation, "mitigates");
    assert.equal(items.get(link.item_id).kind, "attack-technique");
    assert.ok(link.ordinal >= 1 && link.ordinal <= 7, link.source_identifier);
    checkRow(link);
    // Every approach of the row, in printed order; `approach` is the one when there is only one.
    for (const reference of link.props.approaches) assert.ok(approachIds.has(reference), reference);
    if (link.props.approaches.length === 1) {
      assert.equal(link.props.approach, link.props.approaches[0]);
      approachCounts.one += 1;
    } else {
      assert.equal(link.props.approach, null);
      approachCounts[link.props.approaches.length ? "several" : "none"] += 1;
    }
    // No Appendix F link is printed under a technique of the vocabulary: that is Table E-1's.
    assert.equal("technique" in link.props, false);
  }
  assert.deepEqual(approachCounts, { one: 1557, several: 359, none: 4 });
  assert.equal(new Set(links.map((link) => link.control_id)).size, 186);
  assert.equal(new Set(links.map((link) => link.item_id)).size, 184);

  // Two rows print "Standard practice" where an approach belongs, and a third prints it with no
  // control: none has an approach link, and the controls keep the words as printed.
  const standard = links.filter((link) => link.props.approach_as_printed !== undefined);
  assert.deepEqual(
    standard.map((link) => [link.source_identifier, link.props.approach_as_printed]),
    [
      ["F-9:T1601:M1043:1:IA-5(7)", "Standard practice"],
      ["F-9:T1601:M1043:1:SC-28(1)", "Standard practice"],
      ["F-10:T1003:M1043:1:IA-5", "Standard practice"],
      ["F-10:T1003:M1043:1:SC-29(1)", "Standard practice"],
    ],
  );
  assert.deepEqual(
    itemLinks
      .filter((link) => link.props.rows_without_approach !== undefined)
      .map((link) => [
        link.source_identifier,
        link.relation,
        link.props.rows_without_approach.length,
      ]),
    [
      ["F-9:T1601", "tactic", 1],
      ["F-10:T1003", "tactic", 1],
      ["F-10:T1528", "tactic", 1],
    ],
  );

  // One printed label names no control of the catalog: Table F-8 prints CM-4(4) for T1574 under
  // M1038. It makes no link and is kept on its row, beside the control that does resolve.
  assert.equal(
    rows("controls").some((row) => row.code === "CM-4(4)"),
    false,
  );
  assert.equal(
    links.some((link) => link.control_label === "CM-4(4)"),
    false,
  );
  assert.deepEqual(
    [...itemLinks, ...links]
      .filter((link) => link.props.controls_not_in_catalog !== undefined)
      .map((link) => [link.source_identifier, link.props.controls_not_in_catalog]),
    [
      ["F-8:T1574:M1038:1", ["CM-4(4)"]],
      ["F-8:T1574:M1038:1:CM-7(5)", ["CM-4(4)"]],
    ],
  );
});

test("Appendix G is transcribed with its ATT&CK for ICS techniques, mitigations, approaches and controls", () => {
  const framework = pinnedFramework(ATTACK_ICS);
  assert.deepEqual(framework.items, {
    tactic: 12,
    "attack-technique": 79,
    mitigation: 38,
    "candidate-mitigation": 50,
  });
  assert.deepEqual(framework.itemLinks, { tactic: 89, "affected-by": 706 });
  assert.deepEqual(framework.controlLinks, { mitigates: 999 });
  assert.equal(framework.controls, 129);
  assert.equal(framework.corrections, 4);

  const items = new Map(itemsOf(ATTACK_ICS).map((row) => [row.id, row]));
  const byCode = new Map([...items.values()].map((row) => [row.code, row]));
  // ATT&CK for ICS numbers its own techniques and mitigations: no identifier is one of Appendix F's.
  const enterprise = new Set(itemsOf(ATTACK).map((row) => row.code));
  for (const item of items.values()) {
    assert.equal(item.parent_item_id, null, item.code);
    if (item.kind === "tactic") continue;
    assert.equal(enterprise.has(item.code), false, item.code);
    assert.match(item.code, item.kind === "attack-technique" ? /^T08\d\d$/ : /^C?M[0-2]\d{3}$/);
  }
  // Its tactics share names with Enterprise's, as codes of another framework.
  assert.deepEqual(
    [...items.values()].filter((row) => row.kind === "tactic").map((row) => row.title),
    [
      "Initial Access",
      "Execution",
      "Persistence",
      "Privilege Escalation",
      "Evasion",
      "Discovery",
      "Lateral Movement",
      "Collection",
      "Command and Control",
      "Inhibit Response Function",
      "Impair Process Control",
      "Impact",
    ],
  );
  // A row names Table F-1's effects by title, as Appendix F's rows do: the appendix prints none.
  const effects = new Set(
    itemsOf(ATTACK)
      .filter((row) => row.kind === "effect")
      .map((row) => row.title),
  );
  const approaches = new Map(
    itemsOf(CYBER_RESILIENCY)
      .filter((row) => row.kind === "approach")
      .map((row) => [row.id, row]),
  );
  const approachReferences = new Set(
    [...approaches.values()].map((row) => `${CYBER_RESILIENCY}:${row.code}`),
  );
  const checkRow = (link) => {
    assert.equal(byCode.get(link.props.tactic).kind, "tactic", link.source_identifier);
    assert.ok(
      ["mitigation", "candidate-mitigation"].includes(byCode.get(link.props.mitigation).kind),
      link.source_identifier,
    );
    assert.ok(link.props.effects.length > 0, link.source_identifier);
    for (const effect of link.props.effects) assert.ok(effects.has(effect), effect);
  };
  const itemLinks = rows("framework_item_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  );
  for (const link of itemLinks) {
    assert.equal(items.get(link.source_item_id).kind, "attack-technique");
    assert.match(link.source_identifier, /^G-\d+:T08/);
    if (link.relation === "tactic") {
      assert.equal(items.get(link.target_item_id).kind, "tactic");
      continue;
    }
    assert.equal(link.relation, "affected-by");
    assert.ok(approaches.has(link.target_item_id), link.source_identifier);
    checkRow(link);
  }
  // Table G-7 gives Default Credentials no mitigation: its tactic link keeps the words it prints,
  // and nothing else links it.
  const bare = itemLinks.filter((link) => link.props.mitigation_as_printed !== undefined);
  assert.deepEqual(
    bare.map((link) => [link.source_identifier, link.relation, link.props.mitigation_as_printed]),
    [["G-7:T0812", "tactic", "No cyber resiliency mitigations or candidate mitigations"]],
  );
  // A technique printed in two tactics' tables is one item, linked to each tactic.
  const tacticsOf = (code) =>
    itemLinks
      .filter((link) => link.relation === "tactic" && items.get(link.source_item_id).code === code)
      .map((link) => items.get(link.target_item_id).title);
  assert.deepEqual(tacticsOf("T0858"), ["Execution", "Evasion"]);

  const controls = new Map(rows("controls").map((row) => [row.id, row]));
  const catalogRevision = rows("catalog_revisions")[0].id;
  const revision = rows("framework_revisions").find((row) => row.id === framework.revisionId);
  assert.equal(revision.catalog_revision_id, catalogRevision);
  const links = rows("framework_control_links").filter(
    (row) => row.framework_revision_id === framework.revisionId,
  );
  assert.equal(links.length, 999);
  let bold = 0;
  for (const link of links) {
    const control = controls.get(link.control_id);
    assert.equal(control.code, link.control_label);
    assert.equal(control.status, "active");
    assert.equal(link.catalog_revision_id, catalogRevision);
    assert.equal(link.relation, "mitigates");
    assert.equal(items.get(link.item_id).kind, "attack-technique");
    checkRow(link);
    for (const reference of link.props.approaches)
      assert.ok(approachReferences.has(reference), reference);
    assert.equal(link.props.approaches.length > 0, true, link.source_identifier);
    // Bold marks a control the analysis matched better than ATT&CK for ICS's own mapping of an
    // ATT&CK mitigation; a candidate mitigation is not ATT&CK's, and none of its controls is bold.
    if (link.props.bold !== undefined) {
      assert.equal(link.props.bold, true);
      assert.match(link.props.mitigation, /^M/, link.source_identifier);
      bold += 1;
    }
  }
  assert.equal(bold, 547);
  const weights = (prefix) =>
    links
      .filter((link) => link.source_identifier.startsWith(prefix))
      .map((link) => `${link.control_label}${link.props.bold ? "*" : ""}`);
  assert.deepEqual(weights("G-1:T0818:M0947:1:"), ["SI-7", "SI-7(1)*", "SI-7(9)*", "SI-7(10)*"]);
  assert.deepEqual(weights("G-1:T0810:CM1207:1:"), ["CA-8", "CA-8(2)"]);
  // The rows that print a short cell lower in a tall row keep it on their own row.
  assert.deepEqual(weights("G-1:T0819:M0930:1:"), ["AC-4(2)*", "SC-7(29)*", "SC-7(22)*"]);
  assert.deepEqual(weights("G-6:T0842:M0932:1:"), ["IA-2(6)*"]);
  // The row whose mitigation is printed without its identifier is CM1201's.
  assert.deepEqual(weights("G-1:T0819:CM1201:1:"), ["SC-30(4)"]);
  assert.equal(new Set(links.map((link) => link.control_id)).size, 129);
});

test("the import publishes each framework revision after the catalog and names it as current", () => {
  const sql = referenceSql(result);
  const catalogPublished = sql.indexOf(
    "update public.\"catalog_revisions\" set state = 'published'",
  );
  assert.notEqual(catalogPublished, -1);
  for (const framework of result.frameworks) {
    const published = sql.indexOf(
      `update public."framework_revisions" set state = 'published' where state = 'draft' and id = '${framework.revisionId}'::uuid;`,
    );
    const current = sql.indexOf(
      `update public."frameworks" set current_revision_id = '${framework.revisionId}'::uuid`,
    );
    assert.ok(catalogPublished < published && published < current, framework.code);
  }
  // Appendices F and G link items of the cyber resiliency revision, which is published first.
  const publishedAt = (code) =>
    sql.indexOf(
      `update public."framework_revisions" set state = 'published' where state = 'draft' and id = '${pinnedFramework(code).revisionId}'::uuid;`,
    );
  assert.ok(publishedAt(CYBER_RESILIENCY) < publishedAt(ATTACK));
  assert.ok(publishedAt(CYBER_RESILIENCY) < publishedAt(ATTACK_ICS));
});

/* ——— Transcribed frameworks: the importer's rules, on a fixture ————————————————————————————— */

const digest = (text) => createHash("sha256").update(text).digest("hex");
const fixtureItem = (code, kind, parent = null, ordinal = 1) => ({
  code,
  kind,
  title: `Title of ${code}`,
  prose: null,
  parent,
  ordinal,
  props: {},
  printed_in: "Fixture, p. 1",
});
const fixtureDocument = (code, parts = {}) => ({
  format: "reference-framework/1",
  framework: { code, title: `Fixture ${code}`, version: "Rev. 1" },
  source: {
    title: `Source of ${code}`,
    authority: "NIST",
    url: `https://example.test/${code}.pdf`,
    doi: "https://doi.org/10.0000/fixture",
    sha256: "a".repeat(64),
    bytes: 1000,
    pages: 10,
    published: "2021-12-01",
    rights_statement: null,
  },
  method: { tool: "pdftotext", tool_version: "26.04.0", script: "fixture" },
  items: [],
  item_links: [],
  control_links: [],
  corrections: [],
  ...parts,
});
const fixtureItemLink = (identifier, source, target, relation, props = {}) => ({
  source_identifier: identifier,
  source,
  target,
  relation,
  ordinal: null,
  props,
  printed_in: "Fixture, p. 2",
});
const fixtureControlLink = (identifier, control, item, relation, ordinal = null, props = {}) => ({
  source_identifier: identifier,
  control,
  item,
  relation,
  ordinal,
  props,
  printed_in: "Fixture, p. 3",
});
/** A manifest entry as the importer holds it: the pinned bytes and what the manifest says of them. */
const fixtureSource = (document, overrides = {}) => {
  const text = serializeFramework(document);
  return {
    id: `${document.framework.code}-transcription`,
    file: `${document.framework.code}.json.gz`,
    format: "reference-framework/1",
    source_url: document.source.url,
    authoritative: false,
    sha256: digest(text),
    transcribed_from: {
      title: document.source.title,
      url: document.source.url,
      sha256: document.source.sha256,
      bytes: document.source.bytes,
    },
    text,
    ...overrides,
  };
};
const fixtureControl = (n) => `00000000-0000-5000-8000-${String(n).padStart(12, "0")}`;
const fixtureCatalog = (sha256 = "c".repeat(64)) => ({
  revisionId: fixtureControl(900),
  sha256,
  title: "the fixture catalog",
  controls: new Map([
    ["AC-2(6)", { id: fixtureControl(1), status: "active" }],
    ["SI-4", { id: fixtureControl(2), status: "active" }],
    ["SC-30", { id: fixtureControl(3), status: "active" }],
    ["AC-2(10)", { id: fixtureControl(4), status: "withdrawn" }],
  ]),
});
/** A vocabulary and the controls that support it. An approach is listed before its technique. */
const resiliency = (parts = {}) =>
  fixtureDocument("fixture-resiliency", {
    items: [
      fixtureItem("approach.dynamic-privileges", "approach", "technique.privilege-restriction"),
      fixtureItem("objective.constrain", "objective"),
      fixtureItem("technique.privilege-restriction", "technique"),
      fixtureItem("technique.adaptive-response", "technique", null, 2),
      fixtureItem("approach.adaptive-management", "approach", "technique.adaptive-response"),
    ],
    item_links: [
      fixtureItemLink("D:1", "technique.privilege-restriction", "objective.constrain", "supports"),
    ],
    control_links: [
      fixtureControlLink(
        "E-1:AC-2(6):1:1",
        "AC-2(6)",
        "approach.dynamic-privileges",
        "supports",
        1,
        {
          technique: "technique.privilege-restriction",
        },
      ),
      fixtureControlLink(
        "E-1:AC-2(6):2:1",
        "AC-2(6)",
        "approach.adaptive-management",
        "supports",
        2,
        { technique: "technique.adaptive-response" },
      ),
      fixtureControlLink("E-1:SI-4:1:1", "SI-4", "approach.adaptive-management", "supports", 1, {
        technique: "technique.adaptive-response",
      }),
    ],
    corrections: [
      {
        printed_in: "Table E-1, p. 3",
        printed: "Adaptve Management",
        transcribed: "Adaptive Management",
        reason: "A misprint.",
      },
    ],
    ...parts,
  });
/** An analysis whose links name the vocabulary's approaches. */
const attack = (parts = {}) =>
  fixtureDocument("fixture-attack", {
    items: [
      fixtureItem("tactic.reconnaissance", "tactic"),
      fixtureItem("T1595", "attack-technique"),
    ],
    item_links: [
      fixtureItemLink("F:T1595:tactic", "T1595", "tactic.reconnaissance", "tactic"),
      fixtureItemLink(
        "F:T1595:1",
        "T1595",
        "fixture-resiliency:approach.adaptive-management",
        "affected-by",
        { effects: ["Detect"] },
      ),
    ],
    control_links: [fixtureControlLink("F:T1595:1:SC-30", "SC-30", "T1595", "mitigates")],
    ...parts,
  });
/** A framework with no links at all. */
const processes = () =>
  fixtureDocument("fixture-processes", {
    items: [
      fixtureItem("process.BA", "process"),
      fixtureItem("outcome.BA.1", "outcome", "process.BA"),
      fixtureItem("outcome.BA.2", "outcome", "process.BA", 2),
    ],
  });
function buildFixture(sources, catalog = fixtureCatalog()) {
  const { tables, add } = rowStore();
  const sourceIds = new Map(
    sources.map((source) => [source.id, add("ref_sources", source.id, { code: source.id })]),
  );
  const frameworks = buildFrameworkRows({ sources, sourceIds, catalog, add });
  const of = (table) => tables.get(table) ?? [];
  const revisionOf = (code) => frameworks.find((framework) => framework.code === code).revisionId;
  return { tables, frameworks, of, revisionOf, sourceIds };
}
const allThree = () =>
  [attack(), processes(), resiliency()].map((document) => fixtureSource(document));

test("transcribed frameworks are built in the order their links need, every reference resolved", () => {
  const built = buildFixture(allThree());
  // The analysis names the vocabulary's items, so it comes after it; equals go alphabetically.
  assert.deepEqual(
    built.frameworks.map((framework) => framework.code),
    ["fixture-processes", "fixture-resiliency", "fixture-attack"],
  );
  const items = built.of("framework_items");
  const item = (revision, code) =>
    items.find((row) => row.framework_revision_id === revision && row.code === code);
  const vocabulary = built.revisionOf("fixture-resiliency");
  // A parent is recorded before the item it holds, though the file lists the approach first.
  const approach = item(vocabulary, "approach.dynamic-privileges");
  const technique = item(vocabulary, "technique.privilege-restriction");
  assert.equal(approach.parent_item_id, technique.id);
  assert.ok(items.indexOf(technique) < items.indexOf(approach));
  assert.equal(technique.parent_item_id, null);

  const analysis = built.revisionOf("fixture-attack");
  const affected = built
    .of("framework_item_links")
    .find((row) => row.source_identifier === "F:T1595:1");
  assert.equal(affected.framework_revision_id, analysis);
  assert.equal(affected.source_item_id, item(analysis, "T1595").id);
  assert.equal(affected.target_item_id, item(vocabulary, "approach.adaptive-management").id);
  assert.deepEqual(affected.props, { effects: ["Detect"] });

  const links = built.of("framework_control_links");
  assert.equal(links.length, 4);
  for (const link of links) {
    assert.equal(link.resolution_status, "resolved");
    assert.equal(link.catalog_revision_id, fixtureControl(900));
    assert.equal(link.control_id, fixtureCatalog().controls.get(link.control_label).id);
  }
  const strongest = links.find((row) => row.source_identifier === "E-1:AC-2(6):1:1");
  assert.equal(strongest.ordinal, 1);
  assert.equal(strongest.item_id, approach.id);
  assert.deepEqual(strongest.props, { technique: "technique.privilege-restriction" });

  // A revision names the catalog revision only when it maps controls, and keeps its provenance.
  const revisions = new Map(built.of("framework_revisions").map((row) => [row.id, row]));
  assert.equal(revisions.get(vocabulary).catalog_revision_id, fixtureControl(900));
  assert.equal(revisions.get(built.revisionOf("fixture-processes")).catalog_revision_id, null);
  const source = fixtureSource(resiliency());
  assert.equal(revisions.get(vocabulary).content_sha256, source.sha256);
  assert.equal(revisions.get(vocabulary).source_document.url, source.source_url);
  assert.equal(revisions.get(vocabulary).corrections.length, 1);
  assert.equal(revisions.get(vocabulary).method.tool_version, "26.04.0");
  const framework = built.of("frameworks").find((row) => row.code === "fixture-resiliency");
  assert.equal(framework.source_id, built.sourceIds.get(source.id));
  assert.equal(revisions.get(vocabulary).framework_id, framework.id);

  assert.deepEqual(
    built.frameworks.find((row) => row.code === "fixture-resiliency"),
    {
      code: "fixture-resiliency",
      title: "Fixture fixture-resiliency",
      version: "Rev. 1",
      frameworkId: framework.id,
      revisionId: vocabulary,
      items: { approach: 2, objective: 1, technique: 2 },
      itemLinks: { supports: 1 },
      controlLinks: { supports: 3 },
      controls: 2,
      corrections: 1,
    },
  );
});

test("a framework revision's identity covers its transcription, its catalog and the frameworks it names", () => {
  const base = buildFixture(allThree());
  const revisions = (built) =>
    Object.fromEntries(built.frameworks.map((framework) => [framework.code, framework.revisionId]));
  // The same inputs give the same rows, whatever order the manifest lists the sources in.
  const again = buildFixture(allThree().reverse());
  assert.deepEqual(revisions(again), revisions(base));
  assert.deepEqual(
    again
      .of("framework_control_links")
      .map((row) => row.id)
      .sort(),
    base
      .of("framework_control_links")
      .map((row) => row.id)
      .sort(),
  );

  // Another catalog revision: every framework that maps controls is read again.
  const recataloged = buildFixture(allThree(), fixtureCatalog("d".repeat(64)));
  assert.notEqual(
    revisions(recataloged)["fixture-resiliency"],
    revisions(base)["fixture-resiliency"],
  );
  assert.notEqual(revisions(recataloged)["fixture-attack"], revisions(base)["fixture-attack"]);
  assert.equal(revisions(recataloged)["fixture-processes"], revisions(base)["fixture-processes"]);

  // A corrected vocabulary: a new revision of it, and of the analysis whose links name its items.
  const corrected = buildFixture(
    [attack(), processes(), resiliency({ corrections: [] })].map((document) =>
      fixtureSource(document),
    ),
  );
  assert.notEqual(
    revisions(corrected)["fixture-resiliency"],
    revisions(base)["fixture-resiliency"],
  );
  assert.notEqual(revisions(corrected)["fixture-attack"], revisions(base)["fixture-attack"]);
  assert.equal(revisions(corrected)["fixture-processes"], revisions(base)["fixture-processes"]);
  const target = corrected
    .of("framework_item_links")
    .find((row) => row.source_identifier === "F:T1595:1").target_item_id;
  assert.ok(
    corrected
      .of("framework_items")
      .some(
        (row) =>
          row.id === target &&
          row.framework_revision_id === revisions(corrected)["fixture-resiliency"],
      ),
  );

  // A corrected analysis alone leaves the vocabulary's revision as it is.
  const reanalyzed = buildFixture(
    [attack({ control_links: [] }), processes(), resiliency()].map((document) =>
      fixtureSource(document),
    ),
  );
  assert.equal(revisions(reanalyzed)["fixture-resiliency"], revisions(base)["fixture-resiliency"]);
  assert.notEqual(revisions(reanalyzed)["fixture-attack"], revisions(base)["fixture-attack"]);

  // The framework itself keeps one identity through every revision.
  for (const built of [again, recataloged, corrected, reanalyzed])
    assert.deepEqual(
      built
        .of("frameworks")
        .map((row) => row.id)
        .sort(),
      base
        .of("frameworks")
        .map((row) => row.id)
        .sort(),
    );
});

test("a control label that names no active control stops the import", () => {
  const document = resiliency({
    control_links: [
      fixtureControlLink(
        "E-1:AC-2(6):1:1",
        "AC-2(6)",
        "approach.dynamic-privileges",
        "supports",
        1,
      ),
      fixtureControlLink(
        "E-1:AC-2(10):1:1",
        "AC-2(10)",
        "approach.dynamic-privileges",
        "supports",
        1,
      ),
      fixtureControlLink("E-1:ZZ-9:1:1", "ZZ-9", "approach.dynamic-privileges", "supports", 1),
      fixtureControlLink("E-1:ZZ-9:1:2", "ZZ-9", "approach.adaptive-management", "supports", 1),
    ],
  });
  assert.throws(
    () => buildFixture([fixtureSource(document)]),
    (error) => {
      assert.match(
        error.message,
        /^fixture-resiliency\.json\.gz: 2 control label\(s\) name no active control of the fixture catalog; nothing was imported\./,
      );
      assert.match(error.message, /AC-2\(10\) is withdrawn \(E-1:AC-2\(10\):1:1\)/);
      assert.match(error.message, /ZZ-9 is not in the catalog \(E-1:ZZ-9:1:1, E-1:ZZ-9:1:2\)/);
      assert.doesNotMatch(error.message, /AC-2\(6\) is/);
      return true;
    },
  );
});

test("a reference no pinned transcription answers stops the import", () => {
  const missingItem = attack({
    item_links: [
      fixtureItemLink(
        "F:T1595:1",
        "T1595",
        "fixture-resiliency:approach.not-printed",
        "affected-by",
      ),
    ],
  });
  assert.throws(
    () => buildFixture([fixtureSource(missingItem), fixtureSource(resiliency())]),
    /fixture-attack\.json\.gz: item link F:T1595:1: target names no item of fixture-resiliency: "fixture-resiliency:approach\.not-printed"/,
  );
  // The technique a control link is printed under is an item of the same framework.
  const missingGroup = resiliency({
    control_links: [
      fixtureControlLink("E-1:SI-4:1:1", "SI-4", "approach.adaptive-management", "supports", 1, {
        technique: "technique.not-printed",
      }),
    ],
  });
  assert.throws(
    () => buildFixture([fixtureSource(missingGroup)]),
    /fixture-resiliency\.json\.gz: control link E-1:SI-4:1:1: props\.technique names no item of fixture-resiliency: "technique\.not-printed"/,
  );
  // The vocabulary the analysis names is not pinned at all.
  assert.throws(
    () => buildFixture([fixtureSource(attack())]),
    /fixture-attack\.json\.gz refers to framework fixture-resiliency, which no pinned source transcribes/,
  );
  // Two frameworks that name each other have no order to be read in.
  const circular = resiliency({
    item_links: [fixtureItemLink("D:1", "objective.constrain", "fixture-attack:T1595", "counters")],
  });
  assert.throws(
    () => buildFixture([fixtureSource(attack()), fixtureSource(circular)]),
    /refer to each other in a circle: fixture-attack, fixture-resiliency/,
  );
});

test("a transcription is what its manifest entry says it is", () => {
  const document = processes();
  const pinned = fixtureSource(document);
  assert.throws(
    () => buildFixture([{ ...pinned, authoritative: true }]),
    /fixture-processes\.json\.gz: a transcription is not an authoritative copy/,
  );
  assert.throws(
    () =>
      buildFixture([
        { ...pinned, transcribed_from: { ...pinned.transcribed_from, sha256: "b".repeat(64) } },
      ]),
    /the manifest's transcribed_from and source_url do not name the document/,
  );
  assert.throws(
    () => buildFixture([{ ...pinned, source_url: "https://example.test/another.pdf" }]),
    /the manifest's transcribed_from and source_url do not name the document/,
  );
  assert.throws(
    () => buildFixture([{ ...pinned, transcribed_from: undefined }]),
    /the manifest's transcribed_from and source_url do not name the document/,
  );
  // The same content in another spelling is not the pinned form.
  assert.throws(
    () => buildFixture([{ ...pinned, text: JSON.stringify(document, null, 2) }]),
    /fixture-processes\.json\.gz is not written as its format serializes it/,
  );
  // The format's own checks name the file.
  const { corrections, ...incomplete } = document;
  assert.throws(
    () => buildFixture([{ ...pinned, text: JSON.stringify(incomplete) }]),
    /fixture-processes\.json\.gz: Invalid reference-framework\/1 document: The document is missing "corrections"\./,
  );
  assert.throws(
    () => buildFixture([pinned, { ...pinned, id: "second-copy", file: "second-copy.json.gz" }]),
    /second-copy\.json\.gz: another pinned source already transcribes framework fixture-processes/,
  );
});

test("framework revisions are published in the order their links need, then named as current", () => {
  const built = buildFixture(allThree());
  const sql = referenceSql(built);
  const at = (text) => {
    const index = sql.indexOf(text);
    assert.notEqual(index, -1, text);
    return index;
  };
  // Every item is written before any link, so a link to another framework's item finds it.
  assert.ok(
    at('insert into public."framework_items"') < at('insert into public."framework_item_links"'),
  );
  assert.ok(
    at('insert into public."framework_item_links"') <
      at('insert into public."framework_control_links"'),
  );
  const published = (code) =>
    at(
      `update public."framework_revisions" set state = 'published' where state = 'draft' and id = '${built.revisionOf(code)}'::uuid;`,
    );
  const current = (code) =>
    at(`update public."frameworks" set current_revision_id = '${built.revisionOf(code)}'::uuid`);
  assert.ok(at('insert into public."framework_control_links"') < published("fixture-processes"));
  assert.ok(published("fixture-resiliency") < published("fixture-attack"));
  for (const code of ["fixture-processes", "fixture-resiliency", "fixture-attack"])
    assert.ok(published(code) < current(code));
  // A framework that already names the revision, under the same title, is not written again.
  assert.match(
    sql,
    /current_revision_id is distinct from '[0-9a-f-]{36}'::uuid or title is distinct from \$reference_[0-9a-f]{16}\$Fixture fixture-attack\$/,
  );
});
