import { describe, expect, it } from "vitest";
import { cciById, cciIdsForControl } from "./cci-catalog";
import { resolveCnssiControlIds } from "./cnssi-1253";
import { nistControlById } from "./nist-catalog";
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
    expect(platformSeed.profiles[0]?.effective_control_ids).toHaveLength(546);
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
    expect(result.warnings.some((issue) => issue.code === "derivation-orphan")).toBe(true);
    expect(result.data?.profiles[0]?.effective_control_ids).not.toContain("SI-7");
  });
  it("accepts verified catalog additions without accepting unresolved control references", () => {
    // PM controls sit in no SP 800-53B baseline and in no CNSSI selection for this
    // categorization, so PM-1 is a real control the resolved profile does not carry.
    const next = copy();
    next.requirements[0]!.control_ids.push("PM-1");
    expect(() => parsePlatformSeed(next)).toThrow("PM-1");
    expect(parsePlatformSeed(next, ["PM-1"]).requirements[0]!.control_ids).toContain("PM-1");
    next.requirements[0]!.control_ids.push("UNKNOWN-900");
    expect(() => parsePlatformSeed(next, ["PM-1"])).toThrow("UNKNOWN-900");
  });
  it("resolves the control set through the documented pipeline and says why each control is in it", () => {
    const profile = platformSeed.profiles[0]!;
    const derivation = profile.derivation!;
    const derivations = profile.control_derivations!;
    expect(derivation.order).toEqual([
      "catalog",
      "starting_baseline",
      "cnssi_cia_allocations",
      "named_overlays",
      "program_tailoring",
      "parameter_values",
      "effective_control_set",
    ]);
    // The starting baseline follows from the categorization, not from a hand list.
    expect(derivation.high_water_mark).toBe("High");
    expect(derivation.categorization).toMatchObject(
      platformSeed.systems[0]!.security_categorization,
    );
    expect(profile.starting_selection).toHaveLength(derivation.counts["starting_baseline"]!);
    expect(Object.keys(derivations).sort()).toEqual([...profile.effective_control_ids].sort());
    for (const controlId of profile.effective_control_ids) {
      const row = derivations[controlId]!;
      expect(row.selection_trail.length).toBeGreaterThan(0);
      expect(row.selection_origin).not.toBeNull();
      // No synthetic correlation identifiers survive anywhere in the shipped seed.
      for (const cci of row.cci_ids) expect(cci).toMatch(/^CCI-\d{6}$/);
    }
    // "Why is SC-7(21) in my baseline?" is answerable from the file alone.
    expect(derivations["SC-7(21)"]!.selection_trail.map((step) => step.stage)).toEqual([
      "starting_baseline",
      "cnssi_cia_allocations",
    ]);
    // PE-18 is the load-bearing case: SP 800-53B selects it, CNSSI withdraws it at
    // A=moderate, and the deployed-platform overlay puts it back.
    expect(derivations["PE-18"]!.selection_trail.map((step) => step.action)).toEqual([
      "selected",
      "withdrawn",
      "added",
    ]);
    expect(derivations["PE-18"]!.selection_origin).toBe("OVL-DEPLOYED-PLATFORM");
    expect(derivation.reinstated).toEqual(["PE-18"]);
    // Every provenance pointer resolves, and nothing claims authority it does not have.
    const sources = new Map(profile.reference_sources!.map((source) => [source.id, source]));
    expect(sources.get("CNSSI-1253-2022-EXTRACT")?.authoritative).toBe(false);
    // The CCI CONTENT is DISA's, but these bytes are a public mirror; src/lib/cci-catalog.ts
    // records the same standing and the two must not disagree.
    expect(sources.get("DISA-CCI-2024")?.authoritative).toBe(false);
    expect(sources.get("NIST-800-53B-R5")?.authoritative).toBe(true);
    for (const row of Object.values(derivations))
      for (const step of row.selection_trail) expect(sources.has(step.source_id)).toBe(true);
    for (const row of profile.odp_starting_values!)
      expect(profile.effective_control_ids).toContain(row.control_id);
  });
  it("counts the authoring gap instead of inventing narrative for the controls it added", () => {
    const profile = platformSeed.profiles[0]!;
    const derivations = Object.values(profile.control_derivations!);
    const authored = derivations.filter((row) => row.authoring_status === "authored");
    expect(authored).toHaveLength(platformSeed.control_implementations.length);
    const unauthored = derivations.filter((row) => row.authoring_status === "unauthored");
    expect(profile.derivation!.authoring_gap.controls_without_authored_content).toBe(
      unauthored.length,
    );
    for (const row of unauthored) {
      expect(row.implementation_id).toBeNull();
      expect(row.implementation_status).toBe("not-implemented");
      expect(row.requirement_ids).toEqual([]);
    }
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

/**
 * The seed and the reference layer are generated by different scripts against
 * the same corpus. These are the joins that would silently rot if one moved.
 */
describe("the WS-X90 seed joins the reference layer with no dangling ids", () => {
  const profile = platformSeed.profiles[0]!;
  const derivations = Object.values(profile.control_derivations ?? {});

  it("names only controls the 1196-control catalog carries, and no withdrawn one", () => {
    expect(derivations).toHaveLength(546);
    for (const id of profile.effective_control_ids) {
      const control = nistControlById.get(id);
      expect(control, id).toBeDefined();
      expect(control!.withdrawn, id).toBeUndefined();
    }
    for (const row of derivations) {
      expect(nistControlById.get(row.control_id)?.title, row.control_id).toBe(row.title);
    }
  });

  it("cites SP 800-53A objective ids that resolve to real objective prose", async () => {
    const { loadControlFamily } = await import("./nist-control-text/registry");
    const shipped = new Set<string>();
    const walk = (list: { id: string; items?: unknown[] }[]): void => {
      for (const o of list) {
        shipped.add(o.id);
        if (o.items) walk(o.items as { id: string; items?: unknown[] }[]);
      }
    };
    for (const family of new Set(derivations.map((r) => r.family))) {
      const chunk = await loadControlFamily(family);
      for (const text of Object.values(chunk)) walk(text.objectives);
    }
    let cited = 0;
    for (const row of derivations) {
      for (const id of row.assessment_objective_ids) {
        cited += 1;
        expect(shipped.has(id), `${row.control_id} -> ${id}`).toBe(true);
      }
    }
    expect(cited).toBe(2093);
  });

  it("cites DISA CCIs that exist and that the crosswalk agrees with", () => {
    let links = 0;
    for (const row of derivations) {
      for (const id of row.cci_ids) {
        links += 1;
        expect(cciById.has(id), `${row.control_id} -> ${id}`).toBe(true);
      }
      expect([...row.cci_ids].sort()).toEqual([...cciIdsForControl(row.control_id)].sort());
    }
    expect(links).toBe(2442);
  });

  it("agrees with cnssi-1253 about the allocation it recorded", () => {
    const triad = { confidentiality: "high", integrity: "high", availability: "moderate" } as const;
    const cnssi = new Set(resolveCnssiControlIds(triad));
    for (const row of derivations) {
      if (!row.cnssi_1253) continue;
      expect(row.cnssi_1253.selected, row.control_id).toBe(cnssi.has(row.control_id));
    }
  });

  it("points every provenance pointer at a declared source", () => {
    const sources = new Set((profile.reference_sources ?? []).map((s) => s.id));
    for (const row of derivations) {
      for (const step of row.selection_trail)
        expect(sources.has(step.source_id), step.source_id).toBe(true);
    }
    for (const odp of profile.odp_starting_values ?? []) {
      expect(sources.has(odp.source_id), odp.source_id).toBe(true);
    }
  });
});
