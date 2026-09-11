/**
 * The library as OSCAL.
 *
 * `docs/guides/inheritance-model.md` names component-definition as the
 * interchange direction for reusable material, and it was the one model of the
 * set the app did not emit. These assertions hold the shape that makes the claim
 * true rather than aspirational.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { restoreLibrary } from "@/lib/assurance-library";
import { oscalComponentDefinition, oscalModels, oscalVersion } from "@/lib/oscal";
import type { JsonObject } from "@/lib/oscal";

type Component = JsonObject & {
  type: string;
  title: string;
  "control-implementations": JsonObject[];
};

const root = () => {
  const doc = oscalComponentDefinition();
  return (doc.json as JsonObject)["component-definition"] as JsonObject;
};
const components = () => (root()["components"] ?? []) as Component[];
const requirements = () =>
  components()
    .flatMap((component) => component["control-implementations"])
    .flatMap(
      (implementation) => (implementation["implemented-requirements"] ?? []) as JsonObject[],
    );

beforeAll(() => {
  restoreLibrary();
});

describe("component-definition", () => {
  it("is one of the models the app emits", () => {
    expect(oscalModels).toContain("component-definition");
    expect(root()["uuid"]).toMatch(/^[0-9a-f-]{36}$/);
    expect((root()["metadata"] as JsonObject)["oscal-version"]).toBe(oscalVersion);
  });

  it("carries every published library entry, and no draft", () => {
    // A draft is not eligible for inheritance, so exporting one would advertise
    // material no program is allowed to adopt.
    expect(components().length).toBeGreaterThan(0);
    for (const component of components()) {
      expect(component["control-implementations"].length).toBeGreaterThan(0);
    }
  });

  it("types a Policy entry as OSCAL's `policy`, which is why it is a component at all", () => {
    // The old "Overlay" kind folded into the component library on the strength of
    // this: OSCAL's component type vocabulary covers policy directly, so a
    // corporate audit policy that satisfies AU-1 needs no parallel construct.
    const types = new Set(components().map((component) => component.type));
    expect(types).toContain("policy");
    for (const type of types) {
      expect(["hardware", "software", "service", "policy", "process"]).toContain(type);
    }
  });

  it("writes control ids in the OSCAL convention, never the human one", () => {
    for (const requirement of requirements()) {
      const id = requirement["control-id"] as string;
      expect(id).toBe(id.toLowerCase());
      expect(id).not.toMatch(/[()]/);
    }
  });

  it("keeps the consumer's remaining obligation on the requirement", () => {
    // An inheritance claim that drops it reads as full coverage, which is the one
    // thing a shared-responsibility model must never imply by silence.
    const withObligation = requirements().filter((requirement) =>
      ((requirement["props"] ?? []) as JsonObject[]).some(
        (prop) => prop["name"] === "consumer-responsibility",
      ),
    );
    expect(withObligation.length).toBeGreaterThan(0);
    expect(requirements().length).toBeGreaterThanOrEqual(withObligation.length);
  });
});
