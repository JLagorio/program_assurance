import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const { ATTACK_FRAMEWORK, ATTACK_ICS_FRAMEWORK, CYBER_RESILIENCY_FRAMEWORK, LIFE_CYCLE_FRAMEWORK } =
  await import("./frameworks");
const {
  familyTotal,
  guidanceName,
  holdingsText,
  publicationName,
  readFamilyCounts,
  readFrameworkCounts,
  readFrameworkUse,
  readReferenceBaselines,
} = await import("./library-guidance");

const context = { tenantId: uuid(900), token: "token" };
const count = (n: number) => [{ count: n }];
const v2 = {
  doi: "https://doi.org/10.6028/NIST.SP.800-160v2r1",
  title: "Developing Cyber-Resilient Systems",
};
const v1 = {
  doi: "https://doi.org/10.6028/NIST.SP.800-160v1r1",
  title: "Engineering Trustworthy Secure Systems",
};

describe("names", () => {
  it("names a NIST publication by its number, volume and revision", () => {
    expect(publicationName(v2)).toBe("NIST SP 800-160 Vol. 2 Rev. 1");
    expect(publicationName(v1)).toBe("NIST SP 800-160 Vol. 1 Rev. 1");
    expect(publicationName({ url: "https://x/NIST.SP.800-53Ar5.pdf" })).toBe(
      "NIST SP 800-53A Rev. 5",
    );
    expect(publicationName({ title: "A guide" })).toBe("A guide");
    expect(publicationName({})).toBeUndefined();
  });

  it("names a framework under its publication", () => {
    const cref = {
      code: CYBER_RESILIENCY_FRAMEWORK,
      title: "NIST SP 800-160 Vol. 2 Rev. 1 cyber resiliency constructs",
      source_document: v2,
    };
    expect(guidanceName(cref)).toBe("Cyber resiliency constructs");
    expect(
      guidanceName({ ...cref, code: ATTACK_ICS_FRAMEWORK, title: "ATT&CK … Appendix G" }),
    ).toBe("ATT&CK for ICS");
    expect(guidanceName({ ...cref, code: "other", title: "Some guidance" })).toBe("Some guidance");
  });
});

describe("readFrameworkCounts", () => {
  it("counts each revision's items, links and kinds in one request", async () => {
    const { client, calls } = fakeClient(() => ({
      data: [
        {
          id: uuid(1),
          items: count(106),
          links: count(421),
          k0: count(4),
          k1: count(8),
          k2: count(14),
          k3: count(50),
          k4: count(0),
          k5: count(0),
          k6: count(0),
        },
        {
          id: uuid(2),
          items: count(362),
          links: count(1920),
          k0: count(0),
          k1: count(0),
          k2: count(0),
          k3: count(0),
          k4: count(14),
          k5: count(184),
          k6: count(144),
        },
      ],
      error: null,
    }));
    const counts = await readFrameworkCounts(client, context, [
      { code: CYBER_RESILIENCY_FRAMEWORK, framework_revision_id: uuid(1) },
      { code: ATTACK_FRAMEWORK, framework_revision_id: uuid(2) },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("framework_revisions");
    expect(String(args(calls[0], "select")[0]![0])).toContain("k6:framework_items(count)");
    expect(filter(calls[0], "in", "id")).toEqual([uuid(1), uuid(2)]);
    expect(filter(calls[0], "in", "k6.kind")).toEqual(["mitigation", "candidate-mitigation"]);
    expect(counts.get(CYBER_RESILIENCY_FRAMEWORK)).toEqual({
      items: 106,
      controlLinks: 421,
      holdings: [4, 8, 14, 50],
    });
    const attack = counts.get(ATTACK_FRAMEWORK)!;
    expect(attack.holdings).toEqual([14, 184, 144]);
    expect(holdingsText(ATTACK_FRAMEWORK, attack, String)).toBe(
      "14 tactics › 184 techniques › 144 mitigations",
    );
  });

  it("asks nothing for no frameworks", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null }));
    expect((await readFrameworkCounts(client, context, [])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe("readFamilyCounts", () => {
  it("counts every series a family in one request, the edition named beside it", async () => {
    const { client, calls } = fakeClient((call) =>
      call.table === "catalog_groups"
        ? {
            data: [
              {
                id: uuid(10),
                source_id: "ac",
                title: "Access Control",
                ordinal: 1,
                s0: count(131),
                s1: count(30),
                s2: count(46),
              },
              {
                id: uuid(11),
                source_id: "at",
                title: "Awareness and Training",
                ordinal: 2,
                s0: count(15),
                s1: count(4),
                s2: count(6),
              },
            ],
            error: null,
          }
        : {
            data: [{ id: uuid(5), version: "5.2.0", catalogs: { title: "NIST SP 800-53 Rev 5" } }],
            error: null,
          },
    );
    const counts = await readFamilyCounts(client, context, uuid(5), [
      { key: "catalog", kind: "catalog" },
      { key: "cref", kind: "tied", frameworkRevisionIds: [uuid(1)] },
      { key: "high", kind: "selected", profileResolutionId: uuid(7) },
    ]);
    const groups = calls.find((call) => call.table === "catalog_groups");
    expect(String(args(groups, "select")[0]![0])).toBe(
      "id,source_id,title,ordinal,s0:controls(count),s1:controls(count,framework_control_links!inner()),s2:controls(count,selected_controls!inner())",
    );
    expect(filter(groups, "eq", "s0.status")).toBe("active");
    expect(filter(groups, "in", "s1.framework_control_links.framework_revision_id")).toEqual([
      uuid(1),
    ]);
    expect(filter(groups, "eq", "s2.selected_controls.profile_resolution_id")).toBe(uuid(7));
    expect(counts.catalog).toEqual({ title: "NIST SP 800-53 Rev 5", version: "5.2.0" });
    expect(counts.families.map((family) => family.code)).toEqual(["AC", "AT"]);
    expect(familyTotal(counts, "catalog")).toBe(146);
    expect(familyTotal(counts, "high")).toBe(52);
  });
});

describe("readFrameworkUse", () => {
  it("sums each program's records and counts the programs that hold any", async () => {
    const { client, calls } = fakeClient(() => ({
      data: [
        {
          id: uuid(20),
          u0: count(3),
          u1: [{ gate_criteria: count(2) }, { gate_criteria: count(1) }],
        },
        { id: uuid(21), u0: count(0), u1: [] },
        { id: uuid(22), u0: count(5), u1: [{ gate_criteria: count(0) }] },
      ],
      error: null,
    }));
    const use = await readFrameworkUse(client, context, [
      { id: uuid(30), code: ATTACK_FRAMEWORK },
      { id: uuid(31), code: LIFE_CYCLE_FRAMEWORK },
      { id: uuid(32), code: CYBER_RESILIENCY_FRAMEWORK },
    ]);
    expect(calls[0]!.table).toBe("programs");
    expect(
      filter(
        calls[0],
        "eq",
        "u0.risk_attack_techniques.framework_items.framework_revisions.framework_id",
      ),
    ).toBe(uuid(30));
    expect(
      filter(calls[0], "eq", "u1.gate_criteria.framework_items.framework_revisions.framework_id"),
    ).toBe(uuid(31));
    expect(use.get(ATTACK_FRAMEWORK)).toEqual({ records: 8, programs: 2 });
    expect(use.get(LIFE_CYCLE_FRAMEWORK)).toEqual({ records: 3, programs: 1 });
    // A program's SA-24 choice is read one program at a time: the constructs are not counted.
    expect(use.has(CYBER_RESILIENCY_FRAMEWORK)).toBe(false);
  });
});

describe("readReferenceBaselines", () => {
  it("puts each program under the reference baseline its stack starts from", async () => {
    const [high, low, tailoring, draft] = [uuid(40), uuid(41), uuid(42), uuid(43)];
    const revision = (id: string, title: string) => ({
      id: `${id}-r`,
      title,
      profile_id: `${id}-p`,
      profiles: { title },
    });
    const { client, calls } = fakeClient((call) => {
      if (call.table === "program_reference_choices")
        return {
          data: [
            {
              program_id: uuid(50),
              profile_resolution_id: tailoring,
              programs: { code: "PRG-2", name: "WS-X90" },
            },
            {
              program_id: uuid(51),
              profile_resolution_id: high,
              programs: { code: "PRG-1", name: "Customer B" },
            },
          ],
          error: null,
        };
      if (call.table === "profile_resolution_catalogs")
        return {
          data: [
            { profile_resolution_id: high, root_profile_resolution_id: high, depth: 0 },
            { profile_resolution_id: low, root_profile_resolution_id: low, depth: 0 },
            { profile_resolution_id: draft, root_profile_resolution_id: draft, depth: 0 },
            { profile_resolution_id: tailoring, root_profile_resolution_id: high, depth: 5 },
          ],
          error: null,
        };
      // The draft is not published, so the read leaves it out.
      return {
        data: [
          {
            id: high,
            selected_controls: count(370),
            profile_revisions: revision(high, "NIST SP 800-53 Rev 5 High baseline"),
          },
          {
            id: low,
            selected_controls: count(149),
            profile_revisions: revision(low, "NIST SP 800-53 Rev 5 Low baseline"),
          },
          {
            id: tailoring,
            selected_controls: count(560),
            profile_revisions: revision(tailoring, "WS-X90 program tailoring"),
          },
        ],
        error: null,
      };
    });
    const baselines = await readReferenceBaselines(client, context, uuid(5));
    const places = calls.find((call) => call.table === "profile_resolution_catalogs");
    expect(args(places, "or").at(-1)).toEqual([
      `depth.eq.0,profile_resolution_id.in.(${high},${tailoring})`,
    ]);
    const resolutions = calls.find((call) => call.table === "profile_resolutions");
    expect(filter(resolutions, "eq", "state")).toBe("published");
    expect(baselines.map((baseline) => [baseline.title, baseline.controls])).toEqual([
      ["NIST SP 800-53 Rev 5 High baseline", 370],
      ["NIST SP 800-53 Rev 5 Low baseline", 149],
    ]);
    expect(baselines[0]!.programs.map((program) => [program.code, program.controls])).toEqual([
      ["PRG-1", 370],
      ["PRG-2", 560],
    ]);
    expect(baselines[0]!.programs[1]!.revisionId).toBe(`${tailoring}-r`);
    expect(baselines[1]!.programs).toEqual([]);
  });
});
