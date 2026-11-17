import { describe, expect, it } from "vitest";
import type { ProductConsumer, SystemConsumer } from "./component-reuse";

const { componentVersions, consumerLines, controlStanding, standingLine, usedInWords } =
  await import("./component-record");
const { componentStandings } = await import("./status");

describe("a component's standing", () => {
  it("says a control to review apart from the rest not assessed", () => {
    expect(controlStanding({ status: "not_assessed", toReview: true })).toBe("to_review");
    expect(controlStanding({ status: "not_assessed", toReview: false })).toBe("not_assessed");
    expect(controlStanding({ status: "partially_satisfied", toReview: false })).toBe(
      "partially_satisfied",
    );
    // Every standing has its words, the worst first.
    expect(Object.keys(componentStandings)).toEqual([
      "other_than_satisfied",
      "partially_satisfied",
      "to_review",
      "not_assessed",
      "satisfied",
    ]);
  });

  it("counts the line as Mission Computer version 2 reads: 61, 2 to review, 52 carried", () => {
    const line = standingLine({
      total: 61,
      counts: { satisfied: 42, partially_satisfied: 6, other_than_satisfied: 4, not_assessed: 9 },
      carried: 52,
      toReview: 2,
      controls: [
        { carriedFrom: { definedComponentId: "v1", version: 1 } },
        { carriedFrom: { definedComponentId: "v1", version: 1 } },
        { carriedFrom: null },
      ],
    });
    expect(line.counts).toEqual({
      other_than_satisfied: 4,
      partially_satisfied: 6,
      to_review: 2,
      not_assessed: 7,
      satisfied: 42,
    });
    expect(Object.values(line.counts).reduce((sum, count) => sum + count, 0)).toBe(61);
    expect(line.carriedFrom).toBe(1);
    expect(line.carried).toBe(52);
  });

  it("names no one version where the carried determinations come from several", () => {
    const line = standingLine({
      total: 2,
      counts: { satisfied: 2, partially_satisfied: 0, other_than_satisfied: 0, not_assessed: 0 },
      carried: 2,
      toReview: 0,
      controls: [
        { carriedFrom: { definedComponentId: "v1", version: 1 } },
        { carriedFrom: { definedComponentId: "v2", version: 2 } },
      ],
    });
    expect(line.carriedFrom).toBeNull();
  });
});

describe("what a component is used in", () => {
  it("says products and programs, leaving out what it is not in", () => {
    expect(usedInWords({ products: 1, programs: 3 })).toBe("1 product · 3 programs");
    expect(usedInWords({ products: 0, programs: 1 })).toBe("1 program");
    expect(usedInWords({ products: 2, programs: 0 })).toBe("2 products");
    expect(usedInWords({ products: 0, programs: 0 })).toBeNull();
  });

  const product = (over: Partial<ProductConsumer>): ProductConsumer => ({
    productId: "x800",
    productCode: "X800",
    productName: "X800 Missile",
    businessLineId: null,
    productRevisionId: "x800-2",
    productVersion: 2,
    productState: "published",
    current: true,
    elementId: "gs-mc-2",
    elementCode: "GS-MC",
    elementName: "Mission Computer",
    configurations: [],
    definedComponentId: "mc-1",
    version: 1,
    behind: 1,
    vulnerabilitiesOpen: 1,
    ...over,
  });
  const system = (over: Partial<SystemConsumer>): SystemConsumer => ({
    key: "sc",
    programId: "p",
    programCode: "PRG",
    programName: "Program",
    businessLineId: null,
    systemId: "s",
    systemCode: "SYS",
    systemName: "System",
    elementId: "e",
    elementCode: "LRU-001",
    elementName: "Mission Computer",
    systemComponentId: "sc",
    componentCode: "LRU-001",
    componentName: "Mission Computer",
    componentVersion: null,
    productElementId: null,
    definedComponentId: "mc-1",
    version: 1,
    behind: 1,
    pin: null,
    change: null,
    changeKinds: [],
    changeRationale: null,
    findings: [],
    findingsOpen: 0,
    vulnerabilitiesOpen: 1,
    controlsJudged: 54,
    controlsInherited: 50,
    ...over,
  });

  it("puts a product's variants under its current version, and a program's own after", () => {
    const lines = consumerLines({
      products: [product({ current: false, elementId: "gs-mc-1" }), product({})],
      systems: [
        system({ key: "wsx90", programName: "WS-X90", systemName: "Sentinel Mission System" }),
        // Customer A was created from version 1 of the product, Customer B from version 2.
        system({ key: "a", programName: "Customer A", productElementId: "gs-mc-1" }),
        system({
          key: "b",
          programName: "Customer B",
          productElementId: "gs-mc-2",
          change: "removed",
        }),
      ],
    });
    expect(lines.map((line) => line.name)).toEqual(["X800 Missile", "WS-X90"]);
    expect(lines[0]!.children?.map((line) => line.name)).toEqual(["Customer A", "Customer B"]);
    // A variant that left the element out sits on none and inherits nothing.
    expect(lines[0]!.children?.[1]).toMatchObject({ elementCode: null, controlsInherited: null });
    expect(lines[1]).toMatchObject({ detail: "Sentinel Mission System", controlsInherited: 50 });
  });

  it("marks the program that offered a finding which now stands on the component", () => {
    const [line] = consumerLines({
      products: [],
      systems: [
        system({
          findingsOpen: 1,
          findings: [
            {
              offerId: "o",
              issueId: "i",
              title: "CVE-2024-6387",
              severity: "high",
              status: "open",
              openedAt: null,
              source: true,
            },
          ],
        }),
      ],
    });
    expect(line).toMatchObject({ offered: true, findingsOpen: 1 });
  });
});

describe("the versions a component is part of", () => {
  it("lists each version of the set that holds the component, the newest first", () => {
    const revisions = [
      { id: "r1", version_number: 1, state: "published" as const, published_at: "2026-09-30" },
      { id: "r2", version_number: 2, state: "published" as const, published_at: "2026-11-12" },
      { id: "r3", version_number: 3, state: "draft" as const, published_at: null },
    ];
    const components = [
      { id: "mc-1", component_definition_revision_id: "r1" },
      { id: "mc-2", component_definition_revision_id: "r2" },
    ];
    expect(componentVersions(revisions, components)).toEqual([
      { id: "mc-2", version: 2, state: "published", publishedAt: "2026-11-12" },
      { id: "mc-1", version: 1, state: "published", publishedAt: "2026-09-30" },
    ]);
  });
});
