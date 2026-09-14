/**
 * The DISA CCI layer is generated (node scripts/gen-cci-catalog.mjs) from
 * U_CCI_List_2024.xml. These are the release's real numbers: if a regeneration
 * moves one, the source release changed and the layer needs a fresh look.
 */
import { describe, expect, it } from "vitest";

import { nistControlById, nistControls } from "@/lib/nist-catalog";
import { referenceSourceOrder } from "@/lib/reference-provenance";

import {
  cciById,
  cciCounts,
  cciDefinitionLoader,
  cciFamilies,
  cciIdsForControl,
  cciItems,
  cciItemsForFamily,
  cciProvenance,
  cciReferences,
  cciReferencesForControl,
  cciSourceVersion,
  cciTextFamilies,
  cciUnparsableIndexes,
  cciUnresolvedRev5Indexes,
  ccisForControl,
  controlIdsForCci,
  legacyCciReferences,
  loadCciDefinition,
  loadCciDefinitionsForControl,
  loadCciFamily,
  referencesForCci,
} from "@/lib/cci-catalog";

describe("cci catalog", () => {
  it("decodes every record", () => {
    expect(cciItems.length).toBe(5100);
    expect(cciReferences.length).toBe(10183);
    expect(cciSourceVersion).toBe("2024-01-10");
    expect(cciProvenance.authoritative).toBe(false);
    expect(cciItems.filter((c) => c.status === "draft").length).toBe(5029);
    expect(cciItems.filter((c) => c.status === "deprecated").length).toBe(71);
    expect(cciItems.filter((c) => c.type === "policy").length).toBe(4396);
    expect(cciItems.filter((c) => c.type === "technical").length).toBe(704);
    expect(cciItems.filter((c) => c.types.length > 1).length).toBe(182);
    expect(cciCounts.items).toBe(cciItems.length);
    expect(cciCounts.references).toBe(cciReferences.length);
    expect(cciCounts.catalogControls).toBe(1196);
    expect(cciCounts.controlsWithCcis).toBe(1007);
  });

  it("keeps the revision distribution", () => {
    const byRevision = new Map<string, number>();
    for (const r of cciReferences)
      byRevision.set(r.revision, (byRevision.get(r.revision) ?? 0) + 1);
    expect(Object.fromEntries(byRevision)).toEqual({
      "800-53r3": 1683,
      "800-53r4": 3001,
      "800-53r5": 3816,
      "800-53Ar1": 1683,
    });
  });

  it("resolves rev-5 indexes and only rev-5 indexes", () => {
    const rev5 = cciReferences.filter((r) => r.revision === "800-53r5");
    expect(rev5.filter((r) => r.controlId !== null).length).toBe(3816);
    expect(cciUnresolvedRev5Indexes).toEqual([]);
    for (const ref of rev5) {
      expect(ref.legacyControlIds).toEqual([]);
      // Resolved at generation time against the OSCAL catalog, in the app's id
      // convention: "AC-2", "AC-2(1)" — never zero padded.
      for (const id of ref.controlIds) expect(id).toMatch(/^[A-Z]{2}-\d+(\(\d+\))?$/);
    }
    for (const ref of cciReferences.filter((r) => r.revision !== "800-53r5")) {
      expect(ref.controlId).toBeNull();
      expect(ref.controlIds).toEqual([]);
      expect(ref.item).toBeNull();
    }
    expect(cciUnparsableIndexes.length).toBe(2);
  });

  it("goes both ways", () => {
    // CCI-000002: "AC-1 a 1 (a)" under Rev. 5, "AC-1 a 1" under Rev. 4.
    expect(controlIdsForCci("CCI-000002")).toEqual(["AC-1"]);
    expect(controlIdsForCci("CCI-000002", "800-53r4")).toEqual(["AC-1"]);
    expect(referencesForCci("CCI-000002").map((r) => r.revision)).toEqual([
      "800-53r3",
      "800-53r4",
      "800-53r5",
      "800-53Ar1",
    ]);
    const ac2 = cciIdsForControl("AC-2");
    expect(ac2.length).toBeGreaterThan(10);
    for (const id of ac2) expect(controlIdsForCci(id)).toContain("AC-2");
    expect(ccisForControl("AC-2").map((c) => c.id)).toEqual(ac2);
    expect(cciIdsForControl("AC-2(1)")).not.toEqual(ac2);
    expect(cciReferencesForControl("AC-2").every((r) => r.revision === "800-53r5")).toBe(true);
    expect(legacyCciReferences("AC-2", "800-53r4").every((r) => r.revision === "800-53r4")).toBe(
      true,
    );
    expect(cciIdsForControl("ZZ-99")).toEqual([]);
  });

  it("parses statement items", () => {
    const byIndex = new Map(
      cciReferences.filter((r) => r.revision === "800-53r5").map((r) => [r.index, r]),
    );
    expect(byIndex.get("AC-1 a 1 (a)")?.item).toBe("a.1.a");
    expect(byIndex.get("AC-2 (1)")?.item).toBeNull();
    expect(byIndex.get("AC-2 (1)")?.controlId).toBe("AC-2(1)");
    expect(byIndex.get("IA-5 (2) (b) (1)")?.controlId).toBe("IA-5(2)");
    expect(byIndex.get("IA-5 (2) (b) (1)")?.item).toBe("b.1");
    expect(byIndex.get("CP-9 (a)")?.controlId).toBe("CP-9");
    expect(byIndex.get("CP-9 (a)")?.item).toBe("a");
    expect(byIndex.get("SC-37, SC-37 (1)")?.controlIds).toEqual(["SC-37", "SC-37(1)"]);
  });

  it("files every CCI into a loadable chunk", async () => {
    expect(cciFamilies.length).toBe(28);
    expect(cciFamilies.filter((f) => f.inRev5).length).toBe(20);
    expect(cciFamilies.reduce((n, f) => n + f.count, 0)).toBe(5100);
    let total = 0;
    for (const { id: family } of cciFamilies) {
      const rows = cciItemsForFamily(family);
      total += rows.length;
      const chunk = await loadCciFamily(family);
      expect(Object.keys(chunk).length).toBe(rows.length);
      for (const row of rows) expect(chunk[row.id]!.length).toBeGreaterThan(0);
    }
    expect(total).toBe(5100);
    await expect(loadCciFamily("nope")).rejects.toThrow(/Unknown CCI family/);
    // Same shape as @/lib/nist-control-text/registry, so a screen can treat both alike.
    expect(cciDefinitionLoader.families).toEqual(cciTextFamilies);
    expect(cciDefinitionLoader.isFamily("ac")).toBe(true);
    expect(cciDefinitionLoader.isFamily("AC-2(1)")).toBe(true);
    expect(cciDefinitionLoader.isFamily("ZZ")).toBe(false);
  });

  it("loads definitions lazily", async () => {
    expect(await loadCciDefinition("CCI-000001")).toBe(
      "The organization develops an access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.",
    );
    expect(await loadCciDefinition("CCI-999999")).toBeNull();
    const forControl = await loadCciDefinitionsForControl("AC-2");
    expect(forControl.size).toBe(cciIdsForControl("AC-2").length);
    expect(cciById.get("CCI-000001")?.family).toBe("AC");
  });
});

describe("cci-catalog joins the rest of the reference layer", () => {
  it("resolves every Rev. 5 crosswalk id in the 1196-control catalog", () => {
    const orphans = new Set<string>();
    for (const ref of cciReferences) {
      for (const id of ref.controlIds) if (!nistControlById.has(id)) orphans.add(id);
    }
    expect([...orphans]).toEqual([]);
    expect(cciCounts.catalogControls).toBe(nistControls.length);
  });

  it("keeps every control a space-separated legacy index names", () => {
    // CCI-000643/644/645/646 and CCI-000702/704 write several controls with no
    // comma between them; anchoring the parse at ^ used to drop all but the first.
    expect(legacyCciReferences("SA-5(2)", "800-53Ar1").length).toBeGreaterThan(0);
    expect(legacyCciReferences("SA-5(3)", "800-53Ar1").length).toBeGreaterThan(0);
    expect(legacyCciReferences("SA-5(4)", "800-53Ar1").length).toBeGreaterThan(0);
    expect(legacyCciReferences("SA-11(3)", "800-53Ar1").length).toBeGreaterThan(0);
    const ref = cciReferences.find((r) => r.cci === "CCI-000645" && r.revision === "800-53Ar1");
    expect(ref?.legacyControlIds).toEqual(["SA-5(1)", "SA-5(2)", "SA-5(3)", "SA-5(4)"]);
    // ...and every one of them is still Rev-5-inert.
    expect(ref?.controlIds).toEqual([]);
  });

  it("keeps reference indexes verbatim", () => {
    const byCci = (id: string, rev: string) =>
      cciReferences.find((r) => r.cci === id && r.revision === rev)?.index;
    expect(byCci("CCI-000004", "800-53Ar1")).toBe("AC-1.1 (iv  and  v)");
    expect(byCci("CCI-002266", "800-53r5")).toBe("AC-16 b  ");
  });

  it("carries provenance in the reference layer's shared shape", () => {
    expect(cciProvenance.id).toBe("DISA-CCI-2024");
    expect(cciProvenance.authoritative).toBe(false);
    expect(cciProvenance.rights).toMatch(/US Government work/);
    expect(referenceSourceOrder).toContain(cciProvenance.id);
  });
});
