import { describe, expect, it, vi } from "vitest";

vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  ASSESSMENT_NEEDS_BASELINE,
  ASSESSMENT_NEEDS_TITLE,
  COMPONENT_DETERMINATIONS,
  PUBLISH_ANSWER_UNREADABLE,
  PUBLISH_NEEDS_DETERMINATIONS,
  PUBLISH_REVISION_MISSING,
  RECORD_NEEDS_COMPONENT,
  RECORD_NEEDS_CONTROLS,
  RECORD_TOO_MANY,
  componentSheetRows,
  createComponentAssessment,
  newComponentAssessmentIssues,
  openingComponent,
  publishComponentAssessment,
  readComponentAssessmentSheet,
  recordComponentDeterminations,
  type SheetComponent,
} from "./component-assessment";
import { determinations } from "./status";

const context = { tenantId: "tenant-1", token: "token" };

/** A client whose one function answers `data` and records what it was asked. */
function rpcClient(data: unknown, error: { message: string } | null = null) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  const client = {
    rpc(name: string, args: Record<string, unknown>) {
      const call = { name, args, headers: {} as Record<string, string> };
      calls.push(call);
      const chain = {
        setHeader(key: string, value: string) {
          call.headers[key] = value;
          return chain;
        },
        abortSignal: () => chain,
        then: (resolve: (value: { data: unknown; error: unknown }) => void) =>
          resolve({ data, error }),
      };
      return chain;
    },
  };
  return { client: client as never, calls };
}

// The seeded scenario: the X800 Missile component set's version 1, its Mission Computer judged.
const answer = {
  assessment: {
    id: "a1",
    title: "X800 Missile component set version 1 component assessment",
    description: null,
    state: "draft",
    revision: 1,
    component_definition_revision_id: "r1",
    profile_resolution_id: "high",
    assessor_party_id: "elena",
    started_on: "2026-08-03",
    completed_on: null,
    published_at: null,
  },
  definition: {
    id: "d1",
    code: "x800-components",
    name: "X800 Missile component set",
    version: 1,
    owner_party_id: "priya",
    business_line_id: "ad",
  },
  components: [
    {
      id: "cry",
      name: "Cryptographic Module",
      component_type: "hardware",
      claimed: 2,
      determined: 0,
    },
    { id: "mc", name: "Mission Computer", component_type: "hardware", claimed: 2, determined: 2 },
    { id: "sep", name: "Separation Sensor", component_type: "hardware", claimed: 0, determined: 0 },
  ],
  controls: [
    {
      id: "c1",
      code: "AC-3",
      title: "Access Enforcement",
      parent_id: null,
      family: "AC",
      family_title: "Access Control",
    },
    {
      id: "c2",
      code: "SC-13",
      title: "Cryptographic Protection",
      parent_id: null,
      family: "SC",
      family_title: null,
    },
    {
      id: "c3",
      code: "SI-7",
      title: "Software, Firmware, and Information Integrity",
      parent_id: null,
      family: "SI",
      family_title: null,
    },
  ],
  claims: [
    ["mc", "c1"],
    ["mc", "c3"],
    ["cry", "c2"],
    ["cry", "c3"],
  ],
  determinations: [
    { component_id: "mc", control_id: "c1", determination: "satisfied", rationale: null },
    {
      component_id: "mc",
      control_id: "c2",
      determination: "other_than_satisfied",
      rationale: "The computer holds keys in the clear.",
    },
  ],
};

describe("what an assessor may find", () => {
  it("is the determinations a product assessment records, each a word the status badges know", () => {
    expect([...COMPONENT_DETERMINATIONS]).toEqual([
      "satisfied",
      "partially_satisfied",
      "other_than_satisfied",
    ]);
    for (const value of COMPONENT_DETERMINATIONS) expect(determinations[value]).toBeDefined();
  });
});

describe("readComponentAssessmentSheet", () => {
  it("answers null for an assessment that is gone or not the reader's", async () => {
    const { client } = rpcClient(null);
    expect(await readComponentAssessmentSheet(client, context, "gone")).toBeNull();
  });

  it("asks for the assessment alone and reads claims and determinations by component", async () => {
    const { client, calls } = rpcClient(answer);
    const sheet = await readComponentAssessmentSheet(client, context, "a1");
    if (!sheet) throw new Error("The sheet was not read");
    expect(calls).toEqual([
      {
        name: "component_assessment_sheet",
        args: { p_assessment_id: "a1" },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(sheet.assessment).toMatchObject({
      state: "draft",
      revision: 1,
      componentDefinitionRevisionId: "r1",
      assessorPartyId: "elena",
    });
    expect(sheet.definition).toEqual({
      id: "d1",
      code: "x800-components",
      name: "X800 Missile component set",
      version: 1,
      ownerPartyId: "priya",
      businessLineId: "ad",
    });
    expect(sheet.components.map((component) => [component.id, component.determined])).toEqual([
      ["cry", 0],
      ["mc", 2],
      ["sep", 0],
    ]);
    // What a publication is told the assessment holds.
    expect(sheet.determined).toBe(2);
    expect(componentSheetRows(sheet, "mc")).toEqual([
      expect.objectContaining({ code: "AC-3", claimed: true, determination: "satisfied" }),
      // Judged on a control it does not claim.
      expect.objectContaining({
        code: "SC-13",
        claimed: false,
        determination: "other_than_satisfied",
        rationale: "The computer holds keys in the clear.",
      }),
      expect.objectContaining({ code: "SI-7", claimed: true, determination: null }),
    ]);
    expect(componentSheetRows(sheet, "cry").map((row) => [row.claimed, row.determination])).toEqual(
      [
        [false, null],
        [true, null],
        [true, null],
      ],
    );
    expect(
      componentSheetRows(sheet, "sep").every((row) => !row.claimed && !row.determination),
    ).toBe(true);
  });

  it("refuses an answer it cannot read, and passes a failure on as it is", async () => {
    const malformed = rpcClient({ ...answer, determinations: [{ component_id: "mc" }] });
    await expect(readComponentAssessmentSheet(malformed.client, context, "a1")).rejects.toThrow();
    const failed = rpcClient(null, { message: "Workspace access is required" });
    await expect(readComponentAssessmentSheet(failed.client, context, "a1")).rejects.toThrow(
      "Workspace access is required",
    );
  });
});

describe("the component a sheet opens on", () => {
  const component = (id: string, claimed: number, determined: number): SheetComponent => ({
    id,
    name: id,
    componentType: "hardware",
    claimed,
    determined,
  });

  it("opens on the first by name that holds a determination", () => {
    expect(
      openingComponent([component("cry", 27, 0), component("mc", 61, 54), component("ofp", 51, 3)])
        ?.id,
    ).toBe("mc");
  });

  it("opens on the first that claims a control where nothing is determined, else the first", () => {
    expect(openingComponent([component("sep", 0, 0), component("cry", 27, 0)])?.id).toBe("cry");
    expect(openingComponent([component("sep", 0, 0), component("tel", 0, 0)])?.id).toBe("sep");
    expect(openingComponent([])).toBeUndefined();
  });
});

describe("recordComponentDeterminations", () => {
  const recorded = { assessmentId: "a1", recorded: 2, cleared: 0, unchanged: 0 };

  it("sends each control once for the component, with its rationale trimmed", async () => {
    const { client, calls } = rpcClient(recorded);
    await expect(
      recordComponentDeterminations(client, context, {
        assessmentId: "a1",
        componentId: "mc",
        controlIds: ["c1", "c2", "c1"],
        determination: "partially_satisfied",
        rationale: "  Inspected.  ",
      }),
    ).resolves.toEqual(recorded);
    expect(calls).toEqual([
      {
        name: "record_component_determinations",
        args: {
          p_tenant_id: "tenant-1",
          p_assessment_id: "a1",
          p_defined_component_id: "mc",
          p_control_ids: ["c1", "c2"],
          p_determination: "partially_satisfied",
          p_rationale: "Inspected.",
        },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("clears with no determination and no rationale", async () => {
    const { client, calls } = rpcClient({ ...recorded, recorded: 0, cleared: 1 });
    await recordComponentDeterminations(client, context, {
      assessmentId: "a1",
      componentId: "mc",
      controlIds: ["c1"],
      determination: null,
      rationale: "left over",
    });
    expect(calls[0]?.args).toMatchObject({ p_determination: null, p_rationale: null });
  });

  it("sends nothing with no component, no control or too many, and passes a refusal on as it is", async () => {
    const none = rpcClient(recorded);
    const record = {
      assessmentId: "a1",
      componentId: "mc",
      controlIds: ["c1"],
      determination: "satisfied" as const,
    };
    await expect(
      recordComponentDeterminations(none.client, context, { ...record, componentId: "" }),
    ).rejects.toThrow(RECORD_NEEDS_COMPONENT);
    await expect(
      recordComponentDeterminations(none.client, context, { ...record, controlIds: [] }),
    ).rejects.toThrow(RECORD_NEEDS_CONTROLS);
    await expect(
      recordComponentDeterminations(none.client, context, {
        ...record,
        controlIds: Array.from({ length: 2001 }, (_, index) => `c${index}`),
      }),
    ).rejects.toThrow(RECORD_TOO_MANY);
    expect(none.calls).toEqual([]);
    const refused = rpcClient(null, { message: "A published component assessment cannot change" });
    await expect(recordComponentDeterminations(refused.client, context, record)).rejects.toThrow(
      "A published component assessment cannot change",
    );
  });
});

describe("a new component assessment", () => {
  it("needs a title and a control baseline", () => {
    expect(newComponentAssessmentIssues({ title: " ", profileResolutionId: null })).toEqual([
      { field: "title", message: ASSESSMENT_NEEDS_TITLE },
      { field: "baseline", message: ASSESSMENT_NEEDS_BASELINE },
    ]);
    expect(
      newComponentAssessmentIssues({ title: "X800 components", profileResolutionId: "high" }),
    ).toEqual([]);
  });

  it("is not sent without a title", async () => {
    const from = vi.fn();
    await expect(
      createComponentAssessment({ from } as never, context, {
        componentDefinitionRevisionId: "r1",
        profileResolutionId: "high",
        title: "  ",
      }),
    ).rejects.toThrow(ASSESSMENT_NEEDS_TITLE);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("publishing a component assessment", () => {
  const request = { id: "a1", revision: 1, determined: 54, requestId: "request-1" };
  const answered = {
    assessmentId: "a1",
    componentDefinitionRevisionId: "r1",
    determinations: 54,
    components: 1,
    publishedAt: "2026-09-30T16:00:00+00:00",
    completedOn: "2026-09-30",
  };

  it("sends one request at the revision and with the determinations the reader saw", async () => {
    const { client, calls } = rpcClient(answered);
    await expect(
      publishComponentAssessment(client, context, { ...request, completedOn: "2026-09-30" }),
    ).resolves.toEqual(answered);
    expect(calls).toEqual([
      {
        name: "publish_component_assessment",
        args: {
          p_tenant_id: "tenant-1",
          p_assessment_id: "a1",
          p_expected_revision: 1,
          p_expected_determinations: 54,
          p_request_id: "request-1",
          p_completed_on: "2026-09-30",
        },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("names no completion day where the reader gives none, and sends the same request again as it is", async () => {
    const { client, calls } = rpcClient({ ...answered, completedOn: null });
    await publishComponentAssessment(client, context, request);
    await publishComponentAssessment(client, context, request);
    expect(calls[0]?.args).not.toHaveProperty("p_completed_on");
    expect(calls[1]?.args).toEqual(calls[0]?.args);
  });

  it("says each refusal in the command's own words, ending a sentence", async () => {
    for (const [message, said] of [
      [
        "This component assessment was already published. Reload to see it.",
        "This component assessment was already published. Reload to see it.",
      ],
      [
        "This component assessment now holds 55 determinations. Reload it before publishing.",
        "This component assessment now holds 55 determinations. Reload it before publishing.",
      ],
      [
        "An editor, admin, or owner can publish a component assessment",
        "An editor, admin, or owner can publish a component assessment.",
      ],
    ] as const) {
      const { client } = rpcClient(null, { message });
      await expect(publishComponentAssessment(client, context, request)).rejects.toThrow(said);
    }
  });

  it("sends nothing for an assessment that determined nothing, or without the revision the reader saw", async () => {
    const { client, calls } = rpcClient(answered);
    await expect(
      publishComponentAssessment(client, context, { ...request, determined: 0 }),
    ).rejects.toThrow(PUBLISH_NEEDS_DETERMINATIONS);
    await expect(
      publishComponentAssessment(client, context, { ...request, revision: Number.NaN }),
    ).rejects.toThrow(PUBLISH_REVISION_MISSING);
    expect(calls).toEqual([]);
  });

  it("says when the answer cannot be read, since the assessment may have been published", async () => {
    const { client } = rpcClient({ determinations: "fifty-four" });
    await expect(publishComponentAssessment(client, context, request)).rejects.toThrow(
      PUBLISH_ANSWER_UNREADABLE,
    );
  });
});
