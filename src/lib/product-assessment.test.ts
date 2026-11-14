import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: vi.fn() }));
vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  ASSESSMENT_NEEDS_BASELINE,
  ASSESSMENT_NEEDS_TITLE,
  PUBLISH_NEEDS_DETERMINATIONS,
  RECORD_NEEDS_CONTROLS,
  WHOLE_PRODUCT,
  newAssessmentIssues,
  openingElement,
  publishProductAssessment,
  readProductAssessmentSheet,
  recordProductDeterminations,
  sheetRows,
  type SheetElement,
} from "./product-assessment";

const context = { tenantId: "tenant-1", token: "token" };

/** A client whose one function answers `data` and records what it was asked. */
function rpcClient(data: unknown, error: { message: string } | null = null) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const client = {
    rpc(name: string, args: Record<string, unknown>) {
      calls.push({ name, args });
      const chain = {
        setHeader: () => chain,
        abortSignal: () => chain,
        then: (resolve: (value: { data: unknown; error: unknown }) => void) =>
          resolve({ data, error }),
      };
      return chain;
    },
  };
  return { client: client as never, calls };
}

const answer = {
  assessment: {
    id: "a1",
    title: "X800 version 2 product assessment",
    description: null,
    state: "draft",
    revision: 3,
    product_revision_id: "v2",
    profile_resolution_id: "high",
    assessor_party_id: null,
    started_on: "2026-11-02",
    completed_on: null,
    published_at: null,
  },
  elements: [
    { id: "e1", code: "GS-OFP", name: "Operational Flight Program", claimed: 2, determined: 1 },
    { id: "e2", code: "PS-HMU", name: "Health Monitoring Unit", claimed: 0, determined: 0 },
  ],
  whole_determined: 1,
  controls: [
    {
      id: "c1",
      code: "AC-2",
      title: "Account Management",
      parent_id: null,
      family: "AC",
      family_title: "Access Control",
    },
    {
      id: "c2",
      code: "AC-2(1)",
      title: "Automated",
      parent_id: "c1",
      family: "AC",
      family_title: "Access Control",
    },
    {
      id: "c3",
      code: "SC-13",
      title: "Cryptographic Protection",
      parent_id: null,
      family: "SC",
      family_title: null,
    },
  ],
  claims: [
    ["e1", "c1"],
    ["e1", "c3"],
  ],
  determinations: [
    { element_id: "e1", control_id: "c1", determination: "satisfied", rationale: "Shown in test." },
    { element_id: null, control_id: "c3", determination: "partially_satisfied", rationale: null },
  ],
};

describe("readProductAssessmentSheet", () => {
  it("answers null for an assessment that is gone", async () => {
    const { client } = rpcClient(null);
    expect(await readProductAssessmentSheet(client, context, "gone")).toBeNull();
  });
  it("puts the whole product first and reads claims and determinations by element", async () => {
    const { client, calls } = rpcClient(answer);
    const read = await readProductAssessmentSheet(client, context, "a1");
    if (!read) throw new Error("The sheet was not read");
    const sheet = read;
    expect(calls).toEqual([
      {
        name: "product_assessment_sheet",
        args: { p_tenant_id: "tenant-1", p_assessment_id: "a1" },
      },
    ]);
    expect(sheet.assessment).toMatchObject({
      state: "draft",
      revision: 3,
      productRevisionId: "v2",
    });
    expect(sheet.elements.map((element) => [element.id, element.determined])).toEqual([
      [WHOLE_PRODUCT, 1],
      ["e1", 1],
      ["e2", 0],
    ]);
    expect(sheet.determined).toBe(2);
    expect(sheetRows(sheet, "e1")).toEqual([
      expect.objectContaining({
        code: "AC-2",
        claimed: true,
        determination: "satisfied",
        rationale: "Shown in test.",
      }),
      expect.objectContaining({ code: "AC-2(1)", claimed: false, determination: null }),
      expect.objectContaining({ code: "SC-13", claimed: true, determination: null }),
    ]);
    // A determination on the whole product is the product's own, not an element's.
    expect(sheetRows(sheet, WHOLE_PRODUCT).map((row) => row.determination)).toEqual([
      null,
      null,
      "partially_satisfied",
    ]);
    expect(sheetRows(sheet, "e2").every((row) => !row.claimed && !row.determination)).toBe(true);
  });
});

describe("the element a sheet opens on", () => {
  const element = (id: string, claimed: number, determined: number): SheetElement => ({
    id,
    code: id === WHOLE_PRODUCT ? null : id.toUpperCase(),
    name: id,
    claimed,
    determined,
  });

  it("opens on the first element in the select's order that holds a determination", () => {
    // The seeded G40 draft: the shelter power unit claims controls and holds none; the relay, the
    // workstation and the terminal as a whole hold its 9.
    const g40 = [
      element(WHOLE_PRODUCT, 0, 3),
      element("pwr", 12, 0),
      element("rly", 8, 1),
      element("sw", 20, 0),
      element("ws", 30, 5),
    ];
    expect(openingElement(g40)?.id).toBe(WHOLE_PRODUCT);
    expect(openingElement([element(WHOLE_PRODUCT, 0, 0), ...g40.slice(1)])?.id).toBe("rly");
  });

  it("opens on the first that claims a control where nothing is determined, else the whole product", () => {
    expect(
      openingElement([element(WHOLE_PRODUCT, 0, 0), element("hmu", 0, 0), element("ofp", 2, 0)])
        ?.id,
    ).toBe("ofp");
    expect(openingElement([element(WHOLE_PRODUCT, 0, 0), element("hmu", 0, 0)])?.id).toBe(
      WHOLE_PRODUCT,
    );
    expect(openingElement([])).toBeUndefined();
  });
});

describe("recordProductDeterminations", () => {
  const recorded = { assessmentId: "a1", recorded: 2, cleared: 0, unchanged: 0 };

  it("sends each control once, and no element for the whole product", async () => {
    const { client, calls } = rpcClient(recorded);
    await recordProductDeterminations(client, context, {
      assessmentId: "a1",
      elementId: WHOLE_PRODUCT,
      controlIds: ["c1", "c2", "c1"],
      determination: "satisfied",
      rationale: "  Inspected.  ",
    });
    expect(calls[0]).toEqual({
      name: "record_product_determinations",
      args: {
        p_tenant_id: "tenant-1",
        p_assessment_id: "a1",
        p_element_id: null,
        p_control_ids: ["c1", "c2"],
        p_determination: "satisfied",
        p_rationale: "Inspected.",
      },
    });
  });

  it("clears with no determination and no rationale", async () => {
    const { client, calls } = rpcClient({ ...recorded, recorded: 0, cleared: 1 });
    await recordProductDeterminations(client, context, {
      assessmentId: "a1",
      elementId: "e1",
      controlIds: ["c1"],
      determination: null,
      rationale: "left over",
    });
    expect(calls[0]?.args).toMatchObject({
      p_element_id: "e1",
      p_determination: null,
      p_rationale: null,
    });
  });

  it("sends nothing with no control chosen, and passes a refusal on as it is", async () => {
    const none = rpcClient(recorded);
    await expect(
      recordProductDeterminations(none.client, context, {
        assessmentId: "a1",
        elementId: "e1",
        controlIds: [],
        determination: "satisfied",
      }),
    ).rejects.toThrow(RECORD_NEEDS_CONTROLS);
    expect(none.calls).toEqual([]);
    const refused = rpcClient(null, { message: "A published product assessment cannot change" });
    await expect(
      recordProductDeterminations(refused.client, context, {
        assessmentId: "a1",
        elementId: "e1",
        controlIds: ["c1"],
        determination: "satisfied",
      }),
    ).rejects.toThrow("A published product assessment cannot change");
  });
});

describe("a new assessment and its publication", () => {
  it("needs a title and a control baseline", () => {
    expect(newAssessmentIssues({ title: " ", profileResolutionId: null })).toEqual([
      { field: "title", message: ASSESSMENT_NEEDS_TITLE },
      { field: "baseline", message: ASSESSMENT_NEEDS_BASELINE },
    ]);
    expect(newAssessmentIssues({ title: "X800 v2", profileResolutionId: "high" })).toEqual([]);
  });

  it("does not publish an assessment that determined nothing", async () => {
    await expect(
      publishProductAssessment({ from: vi.fn() } as never, context, {
        id: "a1",
        revision: 3,
        determined: 0,
      }),
    ).rejects.toThrow(PUBLISH_NEEDS_DETERMINATIONS);
  });
});
