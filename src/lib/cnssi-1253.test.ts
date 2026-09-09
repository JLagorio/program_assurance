import { describe, expect, it } from "vitest";

import {
  cnssiAllocation,
  cnssiAllocations,
  cnssiBaselineDivergence,
  cnssiControlsWithoutAllocation,
  cnssiDatasetStats,
  cnssiOrganizationWideControlIds,
  cnssiProvenance,
  cnssiUnallocatedControlIds,
  cnssiUnresolvedControlIds,
  cnssiWithdrawnControlIds,
  formatCategorization,
  highWaterMark,
  resolveCnssiBaseline,
  resolveCnssiControlIds,
  selectsAtImpact,
  selectsForCategorization,
  type Impact,
  type SecurityCategorization,
} from "./cnssi-1253";
import {
  baselineControlIds,
  baselineSize,
  baselinesForControl,
  isInBaseline,
  nistBaselineIdFromName,
  nistBaselineOrder,
  nistBaselineProvenance,
  nistBaselines,
  resolveNistBaseline,
} from "./nist-baselines";

const triple = (
  confidentiality: SecurityCategorization["confidentiality"],
  integrity: SecurityCategorization["integrity"],
  availability: SecurityCategorization["availability"],
): SecurityCategorization => ({ confidentiality, integrity, availability });

describe("CNSSI 1253 allocation table", () => {
  it("carries every extracted row, resolves all of them to the catalog, and keeps the extraction unauthoritative", () => {
    expect(cnssiAllocations).toHaveLength(1189);
    expect(cnssiDatasetStats.rows).toBe(1189);
    expect(cnssiDatasetStats.resolvedAgainstCatalog).toBe(1189);
    expect(cnssiUnresolvedControlIds).toEqual([]);
    expect(cnssiWithdrawnControlIds).toHaveLength(182);
    expect(cnssiProvenance.authoritative).toBe(false);
    expect(cnssiProvenance.normativePublication).toMatch(/CNSSI_1253_2022\.pdf$/);
  });

  it("models the three security objectives independently rather than as one impact level", () => {
    // AC-2(1) is a confidentiality/integrity control at moderate and high; CNSSI allocates it
    // to neither availability column at any level.
    const ac21 = cnssiAllocation("AC-2(1)");
    expect(ac21).not.toBeNull();
    expect(ac21!.selections).toEqual({
      confidentiality: { low: false, moderate: true, high: true },
      integrity: { low: false, moderate: true, high: true },
      availability: { low: false, moderate: false, high: false },
    });
    expect(selectsAtImpact(ac21!, "confidentiality", "high")).toBe(true);
    expect(selectsAtImpact(ac21!, "availability", "high")).toBe(false);
  });

  it("separates the controls CNSSI places outside the impact-level table", () => {
    expect(cnssiOrganizationWideControlIds).toHaveLength(37);
    expect(cnssiOrganizationWideControlIds.every((id) => id.startsWith("PM-"))).toBe(true);
    expect(cnssiUnallocatedControlIds).toHaveLength(21);
    expect(cnssiUnallocatedControlIds.every((id) => id.startsWith("PT-"))).toBe(true);
    expect(cnssiAllocation("PM-1")!.allocationNote).toMatch(
      /Independent of any system impact level/,
    );
  });

  it("names the seven Rev. 5.2.0 controls the 2022 publication predates", () => {
    expect([...cnssiControlsWithoutAllocation]).toEqual([
      "IA-13",
      "IA-13(1)",
      "IA-13(2)",
      "IA-13(3)",
      "SA-15(13)",
      "SA-24",
      "SI-2(7)",
    ]);
  });
});

describe("the CNSSI union rule", () => {
  it("selects a control when any one objective selects it at that objective's own level", () => {
    // SC-7(21) is allocated only at C:high and I:high. A system that is high for
    // confidentiality picks it up even though integrity and availability are moderate.
    const sc721 = cnssiAllocation("SC-7(21)")!;
    expect(selectsForCategorization(sc721, triple("high", "moderate", "moderate"))).toBe(true);
    expect(selectsForCategorization(sc721, triple("moderate", "high", "moderate"))).toBe(true);
    expect(selectsForCategorization(sc721, triple("moderate", "moderate", "high"))).toBe(false);
  });

  it("resolves a known triple to a known control set", () => {
    // WS-X90's categorization: C:high I:high A:moderate.
    const resolved = resolveCnssiControlIds(triple("high", "high", "moderate"));
    expect(resolved).toHaveLength(554);
    expect(resolved).toContain("AC-2(1)");
    expect(resolved).toContain("SC-7(21)");
    // Availability-only at high, so an all-moderate system does not reach it.
    expect(resolveCnssiControlIds(triple("moderate", "moderate", "moderate"))).not.toContain(
      "SC-7(21)",
    );
    // Withdrawn and organization-wide controls stay out unless asked for.
    expect(resolved).not.toContain("AC-2(10)");
    // includeWithdrawn is a forward guard, not a filter over live content: every
    // withdrawn row in this extraction has all nine selection bits false, so the
    // option cannot change the answer. Pin that, so it cannot start mattering
    // unnoticed on a future extraction.
    const withdrawnRows = cnssiAllocations.filter((a) => a.withdrawn);
    expect(withdrawnRows).toHaveLength(182);
    expect(
      withdrawnRows.filter((a) =>
        (["confidentiality", "integrity", "availability"] as const).some((objective) =>
          (["low", "moderate", "high"] as const).some((impact) => a.selections[objective][impact]),
        ),
      ),
    ).toHaveLength(0);
    expect(
      resolveCnssiControlIds(triple("high", "high", "moderate"), { includeWithdrawn: true }),
    ).toHaveLength(554);
    expect(resolved).not.toContain("PM-1");
    expect(
      resolveCnssiControlIds(triple("high", "high", "moderate"), { includeOrganizationWide: true }),
    ).toContain("PM-1");
  });

  it("grows monotonically: one objective at low selects fewer controls than the same objective at high", () => {
    const low = resolveCnssiControlIds(triple("low", "low", "low"));
    const availabilityHigh = resolveCnssiControlIds(triple("low", "low", "high"));
    const all = resolveCnssiControlIds(triple("high", "high", "high"));

    expect(low.length).toBeLessThan(availabilityHigh.length);
    expect(availabilityHigh.length).toBeLessThan(all.length);
    // The union only ever adds: raising one objective never drops a control.
    expect(low.every((id) => availabilityHigh.includes(id))).toBe(true);
    expect(availabilityHigh.every((id) => all.includes(id))).toBe(true);
    expect(low).toHaveLength(357);
    expect(all).toHaveLength(573);
  });

  it("is a union, not a high-water mark", () => {
    const mixed = triple("high", "moderate", "low");
    // The FIPS 199 collapse would run this system at high across the board.
    expect(highWaterMark(mixed)).toBe("high");
    expect(resolveCnssiControlIds(mixed).length).toBeLessThan(
      resolveCnssiControlIds(triple("high", "high", "high")).length,
    );
    expect(formatCategorization(mixed)).toBe("H-M-L");
  });

  it("reports what each objective contributed before the union", () => {
    const resolution = resolveCnssiBaseline(triple("high", "high", "moderate"));
    const union = new Set([
      ...resolution.byObjective.confidentiality,
      ...resolution.byObjective.integrity,
      ...resolution.byObjective.availability,
    ]);
    expect([...union].sort()).toEqual([...resolution.controlIds].sort());
    expect(resolution.byObjective.availability.length).toBeLessThan(
      resolution.byObjective.confidentiality.length,
    );
  });
});

describe("NIST SP 800-53B baselines", () => {
  it("carries the published membership counts", () => {
    expect(baselineSize("low")).toBe(149);
    expect(baselineSize("moderate")).toBe(287);
    expect(baselineSize("high")).toBe(370);
    expect(baselineSize("privacy")).toBe(96);
    expect(nistBaselineOrder).toEqual(["low", "moderate", "high", "privacy"]);
  });

  it("nests the three impact baselines and keeps privacy separate", () => {
    const moderate = new Set(baselineControlIds("moderate"));
    const high = new Set(baselineControlIds("high"));
    expect(baselineControlIds("low").every((id) => moderate.has(id))).toBe(true);
    expect(baselineControlIds("moderate").every((id) => high.has(id))).toBe(true);
    expect(baselinesForControl("AC-1")).toEqual(["low", "moderate", "high", "privacy"]);
    expect(baselinesForControl("SC-7(21)")).toEqual(["high"]);
    // AC-2(7) is in no 800-53B baseline, yet CNSSI selects it for national security systems.
    expect(baselinesForControl("AC-2(7)")).toEqual([]);
    expect(resolveCnssiControlIds(triple("moderate", "moderate", "moderate"))).toContain("AC-2(7)");
    expect(isInBaseline("PT-3", "privacy")).toBe(true);
    expect(isInBaseline("PT-3", "high")).toBe(false);
  });

  it("stays authoritative NIST content and resolves by a single impact level", () => {
    expect(nistBaselineProvenance.high.authoritative).toBe(true);
    expect(nistBaselineProvenance.high.authority).toBe(
      "National Institute of Standards and Technology",
    );
    expect(nistBaselineProvenance.high.id).toBe("NIST-800-53B-R5");
    expect(nistBaselines.privacy.name).toBe("Privacy");
    expect(resolveNistBaseline("moderate")).toBe(baselineControlIds("moderate"));
    expect(nistBaselineIdFromName("Moderate")).toBe("moderate");
    expect(nistBaselineIdFromName("Catastrophic")).toBeNull();
  });

  it("shows CNSSI as an NSS overlay on top of 800-53B, with one divergence to confirm", () => {
    // CNSSI selects everything 800-53B does at low, plus 208 more for national security systems.
    expect(cnssiBaselineDivergence.low).toEqual([]);
    // IA-12(5) is the single control 800-53B selects at moderate/high that the 2022 extraction
    // does not. Flagged rather than reconciled away — confirm against the CNSSI PDF.
    expect(cnssiBaselineDivergence.moderate).toEqual(["IA-12(5)"]);
    expect(cnssiBaselineDivergence.high).toEqual(["IA-12(5)"]);
  });
});

describe("the WS-X90 categorization conflict, quantified", () => {
  /**
   * systems[0] says H-H-M; the stale platform/security-configuration-example.json
   * says H-M-M. The system record wins (see src/data/README.md). The size of the
   * disagreement is 19 controls, not 35 — an earlier handoff quoted 519 for
   * H-M-M, which no configuration of the resolver produces.
   */
  const triad = (c: Impact, i: Impact, a: Impact): SecurityCategorization => ({
    confidentiality: c,
    integrity: i,
    availability: a,
  });

  it("resolves H-H-M to 554 and H-M-M to 535", () => {
    const hhm = resolveCnssiControlIds(triad("high", "high", "moderate"));
    const hmm = resolveCnssiControlIds(triad("high", "moderate", "moderate"));
    expect(hhm).toHaveLength(554);
    expect(hmm).toHaveLength(535);
    expect(hhm.length - hmm.length).toBe(19);
    // H-M-M is a strict subset: lowering an objective can only remove controls.
    const inHhm = new Set(hhm);
    expect(hmm.filter((id) => !inHhm.has(id))).toEqual([]);
  });

  it("formats the categorization the same way the seed displays it", () => {
    expect(formatCategorization(triad("high", "high", "moderate"))).toBe("H-H-M");
    expect(highWaterMark(triad("high", "high", "moderate"))).toBe("high");
  });
});
