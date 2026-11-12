import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  OVERLAY_CHANGED_ELSEWHERE,
  OVERLAY_CODE_TAKEN,
  RESILIENCY_TABLE,
  publishControlOverlay,
  resiliencyDecisions,
  resiliencyRationale,
  saveControlOverlay,
  setOverlayDecisions,
} = await import("./control-overlays");

type Answer = { data: unknown; error: { code?: string; message: string } | null };

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call = { name, args, headers: {} as Record<string, string> };
        calls.push(call);
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          then: (resolve: (value: Answer) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const context = { tenantId: "tenant", token: "token" };
const overlay = { id: "overlay", revision: 2, state: "draft" };

describe("control overlay commands", () => {
  it("creates an overlay with trimmed details at no expected revision", async () => {
    const { client: rpc, calls } = client({ data: overlay, error: null });
    const saved = await saveControlOverlay(rpc, context, {
      id: "overlay",
      expectedRevision: null,
      details: {
        code: " OVL-1 ",
        title: " Mission assurance ",
        description: "  ",
        catalogRevisionId: "catalog",
      },
    });
    expect(saved).toBe(overlay);
    expect(calls[0]).toMatchObject({
      name: "save_control_overlay",
      headers: { Authorization: "Bearer token" },
      args: {
        p_tenant_id: "tenant",
        p_id: "overlay",
        p_expected_revision: null,
        p_overlay: {
          code: "OVL-1",
          title: "Mission assurance",
          description: "",
          catalogRevisionId: "catalog",
        },
      },
    });
  });

  it("sends decisions and removals in one request at the revision the reader saw", async () => {
    const { client: rpc, calls } = client({ data: overlay, error: null });
    await setOverlayDecisions(rpc, context, {
      overlayId: "overlay",
      expectedRevision: 2,
      decisions: [{ controlId: "ac-18", action: "exclude", rationale: " No wireless " }],
      removedControlIds: ["ac-2"],
    });
    expect(calls[0]?.args).toEqual({
      p_tenant_id: "tenant",
      p_overlay_id: "overlay",
      p_expected_revision: 2,
      p_decisions: [{ controlId: "ac-18", action: "exclude", rationale: "No wireless" }],
      p_removed: ["ac-2"],
    });
  });

  it("publishes at the revision the reader saw", async () => {
    const { client: rpc, calls } = client({ data: overlay, error: null });
    await publishControlOverlay(rpc, context, { overlayId: "overlay", expectedRevision: 2 });
    expect(calls[0]).toMatchObject({
      name: "publish_control_overlay",
      args: { p_overlay_id: "overlay", p_expected_revision: 2 },
    });
  });

  it("says which conflict stopped a save", async () => {
    const stale = client({ data: null, error: { code: "PT409", message: "changed" } });
    await expect(
      publishControlOverlay(stale.client, context, { overlayId: "overlay", expectedRevision: 1 }),
    ).rejects.toThrow(OVERLAY_CHANGED_ELSEWHERE);
    const taken = client({ data: null, error: { code: "23505", message: "duplicate" } });
    await expect(
      saveControlOverlay(taken.client, context, {
        id: "overlay",
        expectedRevision: null,
        details: { code: "OVL-1", title: "T", description: "", catalogRevisionId: "catalog" },
      }),
    ).rejects.toThrow(OVERLAY_CODE_TAKEN);
    const refused = client({ data: null, error: { code: "23514", message: "AC-1 is withdrawn" } });
    await expect(
      setOverlayDecisions(refused.client, context, {
        overlayId: "overlay",
        expectedRevision: 2,
        decisions: [],
      }),
    ).rejects.toThrow("AC-1 is withdrawn");
  });
});

/** A technique a control supports, as `resiliencyByControl` gives it. */
function supports(title: string, approaches: string[], ordinal: number | null) {
  const code = (kind: string, name: string) => `${kind}.${name.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    technique: { code: code("technique", title), title },
    approaches: approaches.map((approach) => ({
      code: code("approach", approach),
      title: approach,
    })),
    ordinal,
  };
}

describe("a rationale from Table E-1", () => {
  it("names the technique a control supports, its approach and the table", () => {
    // AC-4(2).
    expect(resiliencyRationale([supports("Segmentation", ["Predefined Segmentation"], 1)])).toBe(
      "Supports Segmentation [Predefined Segmentation] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
    );
    expect(RESILIENCY_TABLE).toBe("NIST SP 800-160 Vol. 2 Rev. 1, Table E-1");
  });

  it("lists every approach the table prints with a technique, in the table's order", () => {
    // AC-2(8).
    expect(
      resiliencyRationale([
        supports(
          "Adaptive Response",
          ["Dynamic Resource Allocation", "Dynamic Reconfiguration", "Adaptive Management"],
          1,
        ),
        supports("Privilege Restriction", ["Dynamic Privileges"], 2),
      ]),
    ).toBe(
      "Supports Adaptive Response [Dynamic Resource Allocation, Dynamic Reconfiguration, Adaptive Management] and Privilege Restriction [Dynamic Privileges] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
    );
  });

  it("writes the techniques strongest first, however they are given", () => {
    // SC-7(15), given backwards.
    expect(
      resiliencyRationale([
        supports("Privilege Restriction", ["Trust-Based Privilege Management"], 3),
        supports("Segmentation", ["Predefined Segmentation"], 2),
        supports("Realignment", ["Offloading"], 1),
      ]),
    ).toBe(
      "Supports Realignment [Offloading], Segmentation [Predefined Segmentation] and Privilege Restriction [Trust-Based Privilege Management] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
    );
  });

  it("keeps the order given among techniques the table gives no place, after those it orders", () => {
    expect(
      resiliencyRationale([
        supports("Redundancy", ["Replication"], null),
        supports("Diversity", ["Design Diversity"], null),
        supports("Deception", ["Obfuscation"], 1),
      ]),
    ).toBe(
      "Supports Deception [Obfuscation], Redundancy [Replication] and Diversity [Design Diversity] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
    );
  });

  it("names a technique alone when the table prints no approach with it", () => {
    expect(resiliencyRationale([supports("Deception", [], 1)])).toBe(
      "Supports Deception (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
    );
  });

  it("gives none for a control the table does not name", () => {
    expect(resiliencyRationale([])).toBeNull();
    expect(resiliencyRationale(undefined)).toBeNull();
  });

  it("adds each chosen control with its own rationale and sets aside those the table does not name", () => {
    const supported = new Map([
      ["ac-4-2", [supports("Segmentation", ["Predefined Segmentation"], 1)]],
      [
        "cp-9-1",
        [
          supports("Coordinated Protection", ["Self-Challenge"], 1),
          supports("Redundancy", ["Protected Backup and Restore"], 2),
          supports("Substantiated Integrity", ["Integrity Checks"], 3),
        ],
      ],
    ]);
    expect(resiliencyDecisions(["cp-9-1", "ac-1", "ac-4-2", "ac-2"], supported)).toEqual({
      decisions: [
        {
          controlId: "cp-9-1",
          action: "include",
          rationale:
            "Supports Coordinated Protection [Self-Challenge], Redundancy [Protected Backup and Restore] and Substantiated Integrity [Integrity Checks] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
        },
        {
          controlId: "ac-4-2",
          action: "include",
          rationale:
            "Supports Segmentation [Predefined Segmentation] (NIST SP 800-160 Vol. 2 Rev. 1, Table E-1).",
        },
      ],
      unnamed: ["ac-1", "ac-2"],
    });
    expect(resiliencyDecisions([], supported)).toEqual({ decisions: [], unnamed: [] });
  });
});
