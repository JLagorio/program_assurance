/**
 * The control-id contract. Four generators and the whole app depend on it, so
 * the cases below are the ones that actually appear in the corpora, not
 * invented ones: OSCAL dotted ids, zero-padded OSCAL labels, DISA's spaced
 * enhancements, and the two-letter pre-Rev-5 privacy families.
 */
import { describe, expect, it } from "vitest";

import {
  baseControlId,
  compareControlIds,
  controlFamily,
  controlIdFromOscalId,
  isControlEnhancement,
  normalizeControlId,
  oscalIdFromControlId,
  paddedControlId,
  parseControlId,
} from "@/lib/control-id";
import { nistControls } from "@/lib/nist-catalog";

describe("control-id", () => {
  it("normalizes all three conventions onto the app's key", () => {
    for (const raw of ["AC-2(1)", "AC-02(01)", "ac-2.1", "AC-2 (1)", "ac-02.01"]) {
      expect(normalizeControlId(raw), raw).toBe("AC-2(1)");
    }
    expect(normalizeControlId("AC-2")).toBe("AC-2");
    expect(normalizeControlId("SC-07(21)")).toBe("SC-7(21)");
    expect(normalizeControlId("sc-7.21")).toBe("SC-7(21)");
  });

  it("refuses to guess", () => {
    for (const raw of ["", "  ", "CCI-000001", "AC", "AC-", "SC013 (2(.1", "CM- 7(3)"]) {
      expect(normalizeControlId(raw), raw).toBeNull();
    }
    expect(parseControlId("nope")).toBeNull();
    expect(controlFamily("nope")).toBeNull();
    expect(baseControlId("nope")).toBeNull();
    expect(isControlEnhancement("nope")).toBe(false);
  });

  it("round-trips to OSCAL and to the zero-padded label", () => {
    expect(oscalIdFromControlId("AC-2(1)")).toBe("ac-2.1");
    expect(oscalIdFromControlId("AC-2")).toBe("ac-2");
    expect(paddedControlId("AC-2(1)")).toBe("AC-02(01)");
    expect(paddedControlId("SC-7(21)")).toBe("SC-07(21)");
    expect(controlIdFromOscalId("pt-3.1")).toBe("PT-3(1)");
    expect(controlIdFromOscalId("not-an-id")).toBeNull();
  });

  it("splits family and base control", () => {
    expect(controlFamily("SC-7(21)")).toBe("SC");
    expect(baseControlId("SC-7(21)")).toBe("SC-7");
    expect(baseControlId("SC-7")).toBe("SC-7");
    expect(isControlEnhancement("SC-7(21)")).toBe(true);
    expect(isControlEnhancement("SC-7")).toBe(false);
    // The pre-Rev-5 privacy families the DISA list still cites parse the same way.
    expect(controlFamily("AR-2")).toBe("AR");
  });

  it("sorts in catalog order, base ahead of its enhancements", () => {
    const shuffled = ["SC-7(21)", "AC-2(10)", "AC-2", "AC-2(1)", "AC-10", "SC-7"];
    expect([...shuffled].sort(compareControlIds)).toEqual([
      "AC-2",
      "AC-2(1)",
      "AC-2(10)",
      "AC-10",
      "SC-7",
      "SC-7(21)",
    ]);
  });

  it("is a no-op on every id the shipped catalog carries", () => {
    // The generators normalize with this module, so round-tripping the whole
    // catalog through it must change nothing. 1196 rows.
    for (const control of nistControls) {
      expect(normalizeControlId(control.id), control.id).toBe(control.id);
      expect(controlIdFromOscalId(oscalIdFromControlId(control.id)!)).toBe(control.id);
      expect(normalizeControlId(paddedControlId(control.id)!)).toBe(control.id);
    }
  });
});
