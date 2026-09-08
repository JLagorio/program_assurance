import { describe, expect, it } from "vitest";
import {
  parsePlatformSeed,
  platformSeed,
  platformSeedIssues,
  validatePlatformSeed,
} from "./platform-seed";

const copy = () => structuredClone(platformSeed);
describe("WS-X90 platform seed ingestion", () => {
  it("loads the canonical entities and preserves the supplied system/component identities", () => {
    expect(platformSeed.systems[0]?.id).toBe("SYS-WSX90");
    expect(platformSeed.systems[0]?.uuid).toBe("3032be6d-ce7b-565a-841c-ace2b6b3059c");
    expect(platformSeed.subsystems).toHaveLength(6);
    expect(platformSeed.components).toHaveLength(20);
    expect(platformSeed.requirements).toHaveLength(120);
    expect(
      platformSeed.requirements.flatMap((requirement) => requirement.component_ids),
    ).toHaveLength(240);
    expect(platformSeed.profiles[0]?.effective_control_ids).toHaveLength(74);
    expect(platformSeed.control_implementations).toHaveLength(74);
    expect(platformSeed.evidence).toHaveLength(90);
    expect(platformSeed.assessment_results).toHaveLength(120);
    expect(platformSeed.findings).toHaveLength(16);
    expect(platformSeed.poam_items).toHaveLength(16);
    expect(validatePlatformSeed(platformSeed).errors).toEqual([]);
  });
  it("reports unsupported source claims without rewriting them", () => {
    expect(
      platformSeedIssues.filter((issue) => issue.code === "pass-without-evidence"),
    ).toHaveLength(23);
    expect(
      platformSeedIssues.filter((issue) => issue.code === "fail-without-evidence"),
    ).toHaveLength(6);
    expect(
      platformSeedIssues.filter((issue) => issue.code === "closure-without-passing-retest"),
    ).toHaveLength(3);
    expect(platformSeedIssues.filter((issue) => issue.code === "undated-milestone")).toHaveLength(
      48,
    );
    expect(
      platformSeed.assessment_results.filter(
        (result) => result.outcome === "pass" && !result.evidence_ids.length,
      ),
    ).toHaveLength(23);
    expect(
      platformSeed.poam_items
        .flatMap((item) => item.milestones)
        .every((milestone) => !milestone.target_date),
    ).toBe(true);
  });
  it("rejects broken allocation references and duplicate identities before applying an import", () => {
    const invalid = copy();
    invalid.requirements[0]!.component_ids.push("LRU-missing");
    expect(() => parsePlatformSeed(invalid)).toThrow("LRU-missing");
    const duplicate = copy();
    duplicate.components.push({ ...duplicate.components[0]! });
    expect(
      validatePlatformSeed(duplicate).errors.some((issue) => issue.code === "duplicate-id"),
    ).toBe(true);
    const mismatched = copy();
    mismatched.control_implementations[0]!.by_component[0]!.component_uuid =
      platformSeed.components[1]!.uuid;
    expect(
      validatePlatformSeed(mismatched).errors.some(
        (issue) => issue.code === "component-uuid-mismatch",
      ),
    ).toBe(true);
  });
  it("allows independent engineering requirements and treats stale derived views as diagnostics", () => {
    const next = copy();
    next.requirements[0] = {
      ...next.requirements[0]!,
      source: "mission hazard analysis",
      control_ids: [],
    };
    delete next.requirements[0]!.source_profile_id;
    const result = validatePlatformSeed(next);
    expect(result.valid).toBe(true);
    expect(result.data?.requirements[0]?.source).toBe("mission hazard analysis");
    expect(result.data?.requirements[0]?.control_ids).toEqual([]);
    expect(result.warnings.some((issue) => issue.code === "stale-traceability-view")).toBe(true);
  });
  it("checks ordered tailoring provenance without silently changing the supplied effective set", () => {
    const next = copy();
    next.profiles[0]!.effective_control_ids = next.profiles[0]!.effective_control_ids.filter(
      (id) => id !== "SI-7",
    );
    next.profiles[0]!.tailoring_events[0]!.sequence = 9;
    const result = validatePlatformSeed(next);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "profile-selection-mismatch")).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "tailoring-order")).toBe(true);
    expect(result.data?.profiles[0]?.effective_control_ids).not.toContain("SI-7");
  });
  it("accepts verified catalog additions without accepting unresolved control references", () => {
    const next = copy();
    next.requirements[0]!.control_ids.push("AC-1");
    expect(() => parsePlatformSeed(next)).toThrow("AC-1");
    expect(parsePlatformSeed(next, ["AC-1"]).requirements[0]!.control_ids).toContain("AC-1");
    next.requirements[0]!.control_ids.push("UNKNOWN-900");
    expect(() => parsePlatformSeed(next, ["AC-1"])).toThrow("UNKNOWN-900");
  });
  it("retains unknown provenance fields and untriaged finding gaps without inventing values", () => {
    const next = copy();
    delete next.findings[0]!.risk_id;
    delete next.findings[0]!.assessment_id;
    next.evidence[0]!.sha256 = "";
    next.evidence[0]!.valid_through = "";
    next.evidence[0]!["review_status"] = "pending";
    const result = validatePlatformSeed(next);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "finding-without-risk")).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "finding-without-assessment")).toBe(true);
    expect(result.data?.evidence[0]?.["review_status"]).toBe("pending");
    expect(result.data?.evidence[0]?.sha256).toBe("");
  });
});
