import { describe, expect, it } from "vitest";
import {
  componentsToReview,
  elementReuse,
  outsideConsumers,
  sharedCandidates,
  type ComponentReuseRow,
} from "./product-reuse";

const library = (componentName: string, version = "1") => ({
  revisionId: "set-v1",
  definitionId: "set",
  definitionCode: "x800-set",
  definitionName: "X800 Missile component set",
  componentName,
  componentType: "hardware",
  version,
});
/** The Guidance Section with three units: one from the library, one new, one with none. */
const specs = [
  { id: "gs", parentId: null, code: "GS", library: null },
  { id: "mc", parentId: "gs", code: "GS-MC", library: library("Mission Computer") },
  { id: "nav", parentId: "gs", code: "GS-NAV", library: library("Navigation Unit") },
  { id: "hmu", parentId: "gs", code: "GS-HMU", library: null },
];
const row = (values: Partial<ComponentReuseRow>): ComponentReuseRow => ({
  id: "row",
  name: "Mission Computer",
  component_definition_id: "set",
  component_definition_revision_id: "set-v2",
  version: 2,
  published_at: "2026-11-12T10:00:00Z",
  products: 1,
  programs: 2,
  assessment_id: null,
  controls_to_review: 0,
  ...values,
});
const components = [
  row({ id: "mc-row", programs: 3, assessment_id: "a1", controls_to_review: 2 }),
  row({ id: "nav-row", name: "Navigation Unit", programs: 2, controls_to_review: 0 }),
];

describe("elementReuse", () => {
  const reuse = elementReuse({
    specs,
    components,
    previousCodes: new Set(["GS", "GS-MC", "GS-NAV"]),
    outside: new Map([["mc-row", ["WS-X90 Sentinel Mission System"]]]),
  });

  it("says which library components are assessed once and used elsewhere", () => {
    expect(reuse.get("mc")).toMatchObject({
      assessedOnce: true,
      alsoIn: ["WS-X90 Sentinel Mission System"],
      isNew: false,
      noLibrary: false,
    });
    expect(reuse.get("nav")).toMatchObject({ assessedOnce: false, alsoIn: [] });
  });

  it("marks a part new against the version before, and one with no library component", () => {
    expect(reuse.get("hmu")).toMatchObject({ isNew: true, noLibrary: true, component: null });
    // A part that holds others is no unit missing its component.
    expect(reuse.get("gs")).toMatchObject({ noLibrary: false });
  });

  it("calls nothing new in a first version", () => {
    const first = elementReuse({ specs, components, previousCodes: null, outside: new Map() });
    expect([...first.values()].some((item) => item.isNew)).toBe(false);
  });
});

describe("shared components", () => {
  it("asks who else uses a component only where more programs or products use it", () => {
    expect(sharedCandidates(specs, components, 2)).toEqual(["mc-row"]);
    expect(sharedCandidates(specs, [row({ id: "mc-row", products: 2 })], 3)).toEqual(["mc-row"]);
  });

  it("names the other products and the programs that do not take this one, each once", () => {
    const names = outsideConsumers(
      {
        products: [
          { productId: "x800", productName: "X800 Missile", current: true },
          { productId: "g25", productName: "G25 Launch Control Station", current: true },
          { productId: "old", productName: "Old product", current: false },
        ] as never,
        systems: [
          { programId: "p1", programName: "Customer A" },
          { programId: "ws", programName: "WS-X90 Sentinel Mission System" },
          { programId: "ws", programName: "WS-X90 Sentinel Mission System" },
        ] as never,
      },
      "x800",
      new Set(["p1"]),
    );
    expect(names).toEqual(["G25 Launch Control Station", "WS-X90 Sentinel Mission System"]);
  });
});

describe("componentsToReview", () => {
  it("lists a newer published version of a pinned component that leaves controls to review", () => {
    expect(componentsToReview(specs, components)).toEqual([
      {
        name: "Mission Computer",
        componentId: "mc-row",
        definitionId: "set",
        revisionId: "set-v2",
        version: 2,
        publishedAt: "2026-11-12T10:00:00Z",
        controlsToReview: 2,
      },
    ]);
  });

  it("leaves out a component pinned at the latest version", () => {
    const pinned = specs.map((spec) =>
      spec.id === "mc" ? { ...spec, library: library("Mission Computer", "2") } : spec,
    );
    expect(componentsToReview(pinned, components)).toEqual([]);
  });
});
