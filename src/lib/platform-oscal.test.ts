import { addRequirement } from "./requirements";
import { bundleFiles } from "./airgap";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { platformSeed } from "./platform-seed";
import { registerPlatformStructure } from "./platform-structure";
import { registerPlatformControls } from "./platform-controls";
import { registerPlatformAssurance } from "./platform-assurance";
import { platformNodeId, platformScopeId, platformRootScopeId } from "./platform-ids";
import { controlSetFor, recordTailoring } from "./scopes";
import { inForceRevision, proposeRevision, resolveDraft } from "./control-set";
import { workForProgram, setNarrative } from "./control-work";
import { controlMatrix } from "./control-matrix";
import { buildSctm } from "./sctm";
import {
  buildSnapshotProfile,
  buildSnapshotSsp,
  platformExportSnapshot,
  type PlatformExportSnapshot,
} from "./platform-oscal";
import { oscalSsp, oscalPackage, type JsonObject, type JsonValue } from "./oscal";

const obj = (value: JsonValue | undefined) => value as JsonObject;
const rows = (value: JsonValue | undefined) => value as JsonObject[];
const exportedRequirements = (value: PlatformExportSnapshot) =>
  rows(
    obj(obj(buildSnapshotSsp(value)["system-security-plan"])["control-implementation"])[
      "implemented-requirements"
    ],
  );
const schemaPath = process.env["OSCAL_SCHEMA_PATH"];

function expectConnectedUuidReferences(documents: JsonValue[]) {
  const ids = new Set<string>();
  const references: string[] = [];
  const visit = (value: JsonValue) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "uuid" && typeof item === "string") ids.add(item);
      if (key.endsWith("-uuid") && typeof item === "string") references.push(item);
      if (key.endsWith("-uuids") && Array.isArray(item))
        references.push(...item.filter((entry): entry is string => typeof entry === "string"));
      visit(item);
    }
  };
  documents.forEach(visit);
  expect([...new Set(references.filter((reference) => !ids.has(reference)))]).toEqual([]);
}

beforeAll(() => {
  registerPlatformStructure();
  registerPlatformControls();
  registerPlatformAssurance();
});
describe("native platform controls and SSP", () => {
  it("resolves the exact imported profile and ordered overlays in every native surface", () => {
    const profile = platformSeed.profiles[0]!;
    const root = controlSetFor(platformRootScopeId)!;
    expect(root.controls.map((row) => row.control.id).sort()).toEqual(
      [...profile.effective_control_ids].sort(),
    );
    expect(root.overlays.map((item) => item.id)).toEqual(
      profile.overlays.map((item) => item.overlay_id),
    );
    expect(root.removed.map((row) => row.control.id).sort()).toEqual(["AC-18", "AC-20"]);
    expect(root.added).toHaveLength(8);
    expect(controlMatrix("PRG-1090")).toHaveLength(74);
    expect(resolveDraft(inForceRevision(platformRootScopeId)!)).toMatchObject({ total: 74 });
    const child = controlSetFor(platformScopeId("LRU-001"))!;
    expect(child.total).toBe(74);
    expect(child.scope.selectionSource?.parentScope).toBe(platformScopeId("SUB-01"));
    const draft = proposeRevision(child.scope.id, "Review component selection")!;
    expect(resolveDraft(draft).total).toBe(74);
    expect(controlMatrix("PRG-1041").length).toBeGreaterThan(74);
  });
  it("assembles the real 225 component contributions with source UUIDs and no inferred status", () => {
    const value = platformExportSnapshot();
    const exported = exportedRequirements(value);
    expect(exported).toHaveLength(74);
    expect(exported.flatMap((item) => rows(item["by-components"]) ?? [])).toHaveLength(225);
    const aggregate = platformSeed.control_implementations.find(
      (item) => item.control_id === "AC-2",
    )!;
    const actual = exported.find((item) => item["control-id"] === "ac-2")!;
    expect(actual["uuid"]).toBe(aggregate.uuid);
    expect(
      rows(actual["by-components"])
        .map((item) => item["component-uuid"])
        .sort(),
    ).toEqual(aggregate.by_component.map((item) => item.component_uuid).sort());
    expect(
      rows(actual["by-components"]).every((item) => item["implementation-status"] === undefined),
    ).toBe(true);
    expect(JSON.stringify(buildSnapshotSsp(value))).toBe(JSON.stringify(buildSnapshotSsp(value)));
    expect(JSON.stringify(oscalSsp("PRG-1090", []).json)).toContain(aggregate.uuid);
  });
  it("exports current native narratives, evidence links, and actual requirement allocations", () => {
    const contribution = workForProgram("PRG-1090").find(
      (item) => item.componentId && item.control === "AC-2",
    )!;
    const before = contribution.narrative;
    const beforeUuid = obj(buildSnapshotSsp(platformExportSnapshot())["system-security-plan"])[
      "uuid"
    ];
    setNarrative(
      contribution.id,
      "Current component implementation recorded in the existing control record.",
    );
    const exported = buildSnapshotSsp(platformExportSnapshot());
    expect(JSON.stringify(exported)).toContain(contribution.narrative);
    expect(obj(exported["system-security-plan"])["uuid"]).not.toBe(beforeUuid);
    const sctm = buildSctm("PRG-1090", controlMatrix("PRG-1090"), null);
    const requirement = platformSeed.requirements[0]!;
    const requirementRow = sctm.rows.find(
      (row) => row.unit === "Requirement" && row.requirement === requirement.id,
    )!;
    expect(requirementRow.responsibleNodes.sort()).toEqual(
      requirement.component_ids.map(platformNodeId).sort(),
    );
    expect(requirementRow.evidence.length).toBeGreaterThan(0);
    const evidence = platformSeed.evidence[0]!;
    expect(JSON.stringify(exported)).toContain(evidence.uuid);
    expect(JSON.stringify(exported)).toContain(evidence.uri);
    setNarrative(contribution.id, before);
  });
  it("applies local exclusions without rewriting a parent or sibling obligation", () => {
    const componentScope = platformScopeId("LRU-001");
    recordTailoring(componentScope, {
      overlays: [],
      excluded: new Map([["AC-2", "Not allocated to this component"]]),
      included: new Map(),
    });
    const value = platformExportSnapshot();
    const actual = exportedRequirements(value).find((item) => item["control-id"] === "ac-2")!;
    const component = platformSeed.components.find((item) => item.id === "LRU-001")!;
    expect(
      rows(actual["by-components"]).some((item) => item["component-uuid"] === component.uuid),
    ).toBe(false);
    expect(
      controlSetFor(platformRootScopeId)!.controls.some((row) => row.control.id === "AC-2"),
    ).toBe(true);
    recordTailoring(componentScope, { overlays: [], excluded: new Map(), included: new Map() });
  });
  it("retains newly authored independent requirements and bundles the referenced profile", () => {
    const record = addRequirement({
      program: "PRG-1090",
      parent: null,
      type: "Process",
      text: "The maintainer shall record the mission-readiness inspection.",
      owner: "Maintenance lead",
      method: "Inspection",
      successCriteria: "Inspection record signed.",
      derivations: [
        {
          sourceType: "Policy",
          sourceId: "MISSION-INSPECTION",
          sourceLabel: "Mission inspection policy",
          rationale: "Operational readiness requirement.",
        },
      ],
    });
    const value = platformExportSnapshot();
    const native = value.dataset.requirements.find((item) => item.id === record.id)!;
    expect(native.control_ids).toEqual([]);
    const resources = rows(
      obj(obj(buildSnapshotSsp(value)["system-security-plan"])["back-matter"])["resources"],
    );
    expect(
      resources.some(
        (resource) =>
          resource["uuid"] === native.uuid && String(resource["description"]).includes(record.text),
      ),
    ).toBe(true);
    const files = bundleFiles(
      "PRG-1090",
      buildSctm("PRG-1090", controlMatrix("PRG-1090"), null).rows,
    );
    const ssp = obj(
      JSON.parse(files.find((file) => file.path === "oscal/ssp.json")!.text)[
        "system-security-plan"
      ],
    );
    const poam = obj(
      JSON.parse(files.find((file) => file.path === "oscal/poam.json")!.text)[
        "plan-of-action-and-milestones"
      ],
    );
    expect(rows(poam["poam-items"])).toHaveLength(16);
    const tasks = rows(poam["risks"])
      .flatMap((risk) => rows(risk["remediations"]) ?? [])
      .flatMap((remediation) => rows(remediation["tasks"]) ?? []);
    expect(tasks).toHaveLength(48);
    expect(tasks.every((task) => task["timing"] === undefined)).toBe(true);
    expect(new Set(rows(poam["poam-items"]).map((item) => item["uuid"]))).toEqual(
      new Set(platformSeed.poam_items.map((item) => item.uuid)),
    );
    const href = String(obj(ssp["import-profile"])["href"]);
    expect(files.some((file) => file.path === `oscal/${href.replace(/^\.\//, "")}`)).toBe(true);
  });
  it("keeps OSCAL record UUID references connected across the program package", () => {
    const documents = oscalPackage(
      "PRG-1090",
      buildSctm("PRG-1090", controlMatrix("PRG-1090"), null).rows,
    ).map((document) => document.json);
    expectConnectedUuidReferences(documents);
  });
  it.skipIf(!schemaPath)("validates the native Profile and SSP against the official schema", () => {
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath!, "utf8")));
    const value = platformExportSnapshot();
    for (const document of [
      buildSnapshotProfile(value),
      buildSnapshotSsp(value),
      ...oscalPackage("PRG-1090", buildSctm("PRG-1090", controlMatrix("PRG-1090"), null).rows).map(
        (doc) => doc.json,
      ),
    ])
      expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
  });

  it("exports created, renamed and moved elements with their own implementation and evidence", async () => {
    const entries = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
      },
    });
    try {
      const { createCompositionNode, updateCompositionNode, moveCompositionNode } =
        await import("./composition-store");
      const { nextNodeId } = await import("./composition");
      const { scopesForProgram } = await import("./scopes");
      const { addAllocation } = await import("./requirements");
      const { workFor, linkEvidence } = await import("./control-work");
      const { createEvidence } = await import("./evidence-catalog");
      const before = platformExportSnapshot();
      const sourceMission = platformSeed.components.find((item) => item.id === "LRU-001")!;
      updateCompositionNode("CN-109000", {
        name: "WS-X90 integration configuration",
        note: "Current system boundary description.",
      });
      updateCompositionNode("CN-109001", { name: "Renamed mission subsystem" });
      const subsystem = createCompositionNode({
        id: nextNodeId(),
        program: "PRG-1090",
        parent: "CN-109000",
        name: "Payload integration",
        kind: "Subsystem",
        class: "System",
        note: "Payload integration boundary.",
      });
      const component = createCompositionNode({
        id: nextNodeId(),
        program: "PRG-1090",
        parent: "CN-109001",
        name: "Payload processor",
        kind: "Chassis",
        class: "Hardware",
      });
      updateCompositionNode(component.id, {
        name: "Payload processor Block 2",
        version: "2.1",
        supplier: "Integration supplier",
        note: "Records payload audit events.",
      });
      moveCompositionNode("CN-109101", subsystem.id);
      moveCompositionNode(component.id, "CN-109101");
      const scope = scopesForProgram("PRG-1090").find((item) => item.element === component.id)!;
      addAllocation({
        requirement: "REQ-015",
        target: component.id,
        targetKind: "node",
        responsibility: "Primary",
        coverage: "Full",
        scope: "Payload audit logging",
        owner: "Payload team",
        rationale: "New processor records audit events.",
      });
      const implementation = workFor("PRG-1090", scope.id, "AU-6");
      setNarrative(
        implementation.id,
        "Payload processor Block 2 reviews its recorded audit events.",
      );
      const evidence = createEvidence({
        program: "PRG-1090",
        label: "Payload audit review",
        owner: "Payload team",
        kind: "Test result",
        version: "2.1",
        provenance: "Processor audit test execution.",
        collected: "2026-09-09",
        url: "https://example.com/payload-audit-review",
        scopeIds: [scope.id],
      });
      linkEvidence(implementation.id, evidence.id);

      const value = platformExportSnapshot();
      const document = buildSnapshotSsp(value);
      const ssp = obj(document["system-security-plan"]);
      const inventory = rows(obj(ssp["system-implementation"])["components"]);
      const hasProp = (record: JsonObject, name: string, expected: string) =>
        rows(record["props"]).some((item) => item["name"] === name && item["value"] === expected);
      const exported = inventory.find((item) => hasProp(item, "node-id", component.id))!;
      const exportedMission = inventory.find((item) => item["uuid"] === sourceMission.uuid)!;
      const exportedSubsystem = inventory.find((item) => hasProp(item, "node-id", subsystem.id))!;
      expect(obj(ssp["system-characteristics"])["system-name"]).toBe(
        "WS-X90 integration configuration",
      );
      expect(value.dataset.subsystems.find((item) => item.id === "SUB-01")?.name).toBe(
        "Renamed mission subsystem",
      );
      expect(exported["title"]).toBe("Payload processor Block 2");
      expect(exported["description"]).toBe("Records payload audit events.");
      expect(hasProp(exported, "version", "2.1")).toBe(true);
      expect(hasProp(exported, "supplier", "Integration supplier")).toBe(true);
      expect(hasProp(exported, "parent-node-id", "CN-109101")).toBe(true);
      expect(hasProp(exported, "subsystem-id", subsystem.id)).toBe(true);
      expect(exported["links"]).toContainEqual({ href: `#${sourceMission.uuid}`, rel: "parent" });
      expect(exportedMission["links"]).toContainEqual({
        href: `#${exportedSubsystem["uuid"]}`,
        rel: "parent",
      });
      expect(value.dataset.components.find((item) => item.id === "LRU-001")).toMatchObject({
        uuid: sourceMission.uuid,
        subsystem_id: subsystem.id,
      });
      expect(
        value.dataset.requirements.find((item) => item.id === "REQ-015")?.component_ids,
      ).toContain(component.id);
      expect(value.dataset.evidence.find((item) => item.id === evidence.id)?.component_ids).toEqual(
        [component.id],
      );
      const au6 = exportedRequirements(value).find((item) => item["control-id"] === "au-6")!;
      const contribution = rows(au6["by-components"]).find(
        (item) => item["component-uuid"] === exported["uuid"],
      )!;
      expect(contribution["description"]).toBe(implementation.narrative);
      expect(contribution["implementation-status"]).toBeUndefined();
      expect(hasProp(contribution, "requirement-id", "REQ-015")).toBe(true);
      expect(contribution["links"]).toContainEqual({
        href: `#${value.dataset.evidence.find((item) => item.id === evidence.id)!.uuid}`,
        rel: "evidence",
      });
      expect(
        rows(au6["by-components"]).filter(
          (item) => item["description"] === implementation.narrative,
        ),
      ).toHaveLength(1);
      expect(ssp["uuid"]).not.toBe(obj(buildSnapshotSsp(before)["system-security-plan"])["uuid"]);
      const repeated = platformExportSnapshot();
      expect(buildSnapshotSsp(repeated)).toEqual(document);
      const resources = rows(obj(ssp["back-matter"])["resources"]);
      const hierarchy = resources.find((item) => hasProp(item, "type", "system-composition"))!;
      expect(JSON.parse(String(hierarchy["description"]))).toContainEqual(
        expect.objectContaining({
          nodeId: component.id,
          parentNodeId: "CN-109101",
          scopeId: scope.id,
        }),
      );
      expect(new Set(inventory.map((item) => item["uuid"])).size).toBe(inventory.length);
      expect(platformSeed.components.find((item) => item.id === "LRU-001")?.subsystem_id).toBe(
        "SUB-01",
      );
      const documents = oscalPackage(
        "PRG-1090",
        buildSctm("PRG-1090", controlMatrix("PRG-1090"), null).rows,
      ).map((item) => item.json);
      expectConnectedUuidReferences(documents);
      if (schemaPath) {
        const ajv = new Ajv({ strict: false, allErrors: true });
        addFormats(ajv);
        const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")));
        for (const exportedDocument of [document, buildSnapshotProfile(value), ...documents])
          expect(validate(exportedDocument), JSON.stringify(validate.errors)).toBe(true);
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
