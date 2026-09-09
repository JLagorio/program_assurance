import { describe, expect, it } from "vitest";
import {
  baselineControls,
  catalogVersion,
  controlTitle,
  nistControlById,
  nistControls,
  nistFamilies,
  nistAssessmentProvenance,
  nistCatalogProvenance,
  nistFamilyName,
  objectiveProvenance,
  controlProvenance,
  titleOf,
  type NistBaseline,
} from "./nist-catalog";
import { referenceSourceOrder } from "./reference-provenance";
import {
  controlTextFamilies,
  controlTextLoader,
  isControlTextFamily,
  loadAllControlText,
  loadControlFamily,
  loadControlText,
} from "./nist-control-text/registry";

describe("nist catalog", () => {
  it("indexes every control and enhancement", () => {
    expect(nistControls).toHaveLength(1196);
    expect(nistFamilies).toHaveLength(20);
    expect(nistControlById.size).toBe(1196);
    expect(catalogVersion).toBe("NIST SP 800-53 Rev. 5 (5.2.0)");
    expect(new Set(nistControls.map((c) => c.family)).size).toBe(20);
    for (const c of nistControls) expect(nistFamilyName.get(c.family)).toBeTruthy();
  });

  it("matches the SP 800-53B baseline counts", () => {
    const counts: Record<NistBaseline, number> = {
      Low: 149,
      Moderate: 287,
      High: 370,
      Privacy: 96,
    };
    for (const [level, n] of Object.entries(counts) as [NistBaseline, number][]) {
      expect(baselineControls(level)).toHaveLength(n);
    }
  });

  it("keeps the historic helper semantics", () => {
    const ac21 = nistControlById.get("AC-2(1)")!;
    expect(ac21.parent).toBe("AC-2");
    expect(ac21.parentTitle).toBe("Account Management");
    expect(controlTitle(ac21)).toBe("Account Management | Automated System Account Management");
    expect(controlTitle(nistControlById.get("AC-2")!)).toBe("Account Management");
    expect(titleOf("AC-2(1)")).toBe("Account Management | Automated System Account Management");
    expect(titleOf("NOPE-1")).toBe("NOPE-1");
  });

  it("marks the withdrawn enhancements", () => {
    const withdrawn = nistControls.filter((c) => c.withdrawn);
    expect(withdrawn).toHaveLength(182);
    expect(nistControlById.get("AC-2(10)")?.incorporatedInto).toEqual(["AC-2"]);
    expect(nistControlById.get("AC-2")?.withdrawn).toBeUndefined();
  });
});

describe("per-family control text", () => {
  it("loads one family without the rest", async () => {
    expect(controlTextFamilies).toHaveLength(20);
    expect(isControlTextFamily("ac")).toBe(true);
    expect(isControlTextFamily("AC-2(1)")).toBe(true);
    expect(isControlTextFamily("ZZ")).toBe(false);
    const ac = await loadControlFamily("AC");
    expect(Object.keys(ac)).toHaveLength(147);
    await expect(loadControlFamily("ZZ")).rejects.toThrow(/Unknown SP 800-53 family/);
  });

  it("resolves one control and the flat single objectives the old build dropped", async () => {
    for (const id of ["AC-3", "AC-4", "AC-6", "AC-2(1)"]) {
      const text = await loadControlText(id);
      expect(text, id).not.toBeNull();
      expect(text!.objectives.length, id).toBeGreaterThan(0);
    }
    expect(await loadControlText("NOPE-1")).toBeNull();
    expect(await loadControlText("ZZ-1")).toBeNull();
  });

  it("merges to the whole catalog and keeps AC-2 verbatim", async () => {
    const all = await loadAllControlText();
    expect(Object.keys(all)).toHaveLength(1196);
    const ac2 = all["AC-2"]!;
    expect(ac2.params).toHaveLength(10);
    expect(ac2.discussion.join(" ")).toHaveLength(2946);
    expect(ac2.statement).toHaveLength(12);
    expect(ac2.methods.map((m) => m.method)).toEqual(["Examine", "Interview", "Test"]);
    let nodes = 0;
    const count = (list: { items?: unknown[] }[]): void => {
      for (const o of list) {
        nodes += 1;
        if (o.items) count(o.items as { items?: unknown[] }[]);
      }
    };
    for (const t of Object.values(all)) count(t.objectives);
    expect(nodes).toBe(3237);
    const withoutObjectives = Object.values(all).filter((t) => t.objectives.length === 0);
    expect(withoutObjectives).toHaveLength(182);
  });

  it("has a text entry for every indexed control and no orphans", async () => {
    const all = await loadAllControlText();
    for (const c of nistControls) expect(all[c.id], c.id).toBeDefined();
    for (const id of Object.keys(all)) expect(nistControlById.has(id), id).toBe(true);
  });
});

describe("the whole-catalog facade", () => {
  it("still exports controlText the way the SCTM, ConMon and baseline loaders read it", async () => {
    const mod = await import("./nist-control-text");
    const { controlText } = mod;
    expect(Object.keys(controlText)).toHaveLength(1196);
    expect(controlText["AC-2"]?.params).toHaveLength(10);
    expect(controlText["SR-12"]).toBeDefined();
    // the lazy API is re-exported for discoverability
    expect(typeof mod.loadControlText).toBe("function");
    expect(typeof mod.loadControlFamily).toBe("function");
    expect(mod.controlTextFamilies).toHaveLength(20);
  });
});

describe("the objective-unwrap rule is lossless", () => {
  /**
   * The control-level assessment-objective part is unwrapped only when it has
   * children AND no prose. Unwrapping on the child test alone deleted a real
   * SP 800-53A Rev. 5 objective from seven controls; five of those were
   * substantive. These are the exact five.
   */
  it("keeps the prose of a container that also has children", async () => {
    const all = await loadAllControlText();
    const first = (id: string) => all[id]!.objectives[0]!;
    expect(first("CA-7(4)").prose).toBe(
      "risk monitoring is an integral part of the continuous monitoring strategy;",
    );
    expect(first("PM-24").prose).toBe("a Data Integrity Board is established;");
    expect(first("PM-31").prose).toBe(
      "an organization-wide continuous monitoring strategy is developed;",
    );
    expect(first("CM-7(7)").prose).toContain("confined physical or virtual machine environments");
    expect(first("PE-11(2)").prose).toContain("alternate power supply");
    // ...and each still carries the children it wrapped.
    for (const id of ["CA-7(4)", "CM-7(7)", "PE-11(2)", "PM-24", "PM-31"]) {
      expect(all[id]!.objectives[0]!.items?.length, id).toBeGreaterThan(0);
    }
  });

  it("still unwraps the prose-less container, and never drops a flat objective", async () => {
    const all = await loadAllControlText();
    // AC-2's objectives start at the lettered items, not at the "AC-02" wrapper.
    expect(all["AC-2"]!.objectives[0]!.label).toBe("AC-02a.");
    // The 149 controls the old generator dropped entirely.
    for (const id of ["AC-3", "AC-4", "AC-6", "AC-2(1)"]) {
      expect(all[id]!.objectives.length, id).toBeGreaterThan(0);
    }
    expect(all["AC-3"]!.objectives[0]!.prose).toContain(
      "approved authorizations for logical access",
    );
  });

  it("gives every objective the OSCAL part id an assessment result cites", async () => {
    const all = await loadAllControlText();
    expect(all["AC-3"]!.objectives[0]!.id).toBe("ac-3_obj");
    expect(all["AC-2"]!.objectives[0]!.id).toBe("ac-2_obj.a");
    const seen = new Set<string>();
    const walk = (list: { id: string; items?: { id: string }[] }[]): void => {
      for (const o of list) {
        expect(o.id, JSON.stringify(o)).toBeTruthy();
        expect(seen.has(o.id), o.id).toBe(false);
        seen.add(o.id);
        if (o.items) walk(o.items as { id: string; items?: { id: string }[] }[]);
      }
    };
    for (const t of Object.values(all)) walk(t.objectives);
    expect(seen.size).toBe(3237);
  });
});

describe("catalog provenance", () => {
  it("is machine-readable, not just a file header", () => {
    expect(nistCatalogProvenance.id).toBe("NIST-800-53-R5");
    expect(nistCatalogProvenance.authoritative).toBe(true);
    expect(nistCatalogProvenance.authority).toBe("National Institute of Standards and Technology");
    expect(nistCatalogProvenance.release).toBe("5.2.0");
    expect(nistCatalogProvenance.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(nistAssessmentProvenance.id).toBe("NIST-800-53A-R5");
    expect(nistAssessmentProvenance.citation).toContain("800-53A");
    for (const p of [nistCatalogProvenance, nistAssessmentProvenance]) {
      expect(referenceSourceOrder).toContain(p.id);
      expect(p.rights).toMatch(/public domain/);
    }
  });

  it("answers per record, and refuses to attribute a foreign id to NIST", () => {
    expect(controlProvenance("AC-2")).toBe(nistCatalogProvenance);
    expect(objectiveProvenance("AC-2")).toBe(nistAssessmentProvenance);
    expect(controlProvenance("ZZ-1")).toBeNull();
    expect(objectiveProvenance("ZZ-1")).toBeNull();
  });

  it("records the withdrawn dispositions, including the family-level one", () => {
    expect(nistControlById.get("SA-12")?.withdrawn).toBe(true);
    // Upstream SA-12 points at the whole SR family ("#sr"), not a control.
    expect(nistControlById.get("SA-12")?.incorporatedInto).toEqual(["SR"]);
    expect(nistControlById.get("AU-8(1)")?.movedTo).toEqual(["SC-45(1)"]);
    expect(nistControls.filter((c) => c.withdrawn).length).toBe(182);
  });

  it("exposes the shared lazy-loader shape", () => {
    expect(controlTextLoader.families).toEqual(controlTextFamilies);
    expect(controlTextLoader.isFamily("ac")).toBe(true);
    expect(controlTextLoader.isFamily("AC-2(1)")).toBe(true);
    expect(controlTextLoader.isFamily("ZZ")).toBe(false);
  });
});
