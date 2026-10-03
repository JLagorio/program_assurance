import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { BASELINE_CHANGED_ELSEWHERE, adoptSystemBaseline } = await import("./system-baseline");

type Answer = { data: unknown; error: { code?: string; message: string } | null };

/** A client whose one `rpc` call is recorded and answers with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: unknown; headers: Record<string, string> }[] = [];
  return {
    calls,
    client: {
      rpc(name: string, args: unknown) {
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
const request = {
  systemId: "system",
  expectedRevision: 4,
  requestId: "request",
  selection: {
    mode: "adopt" as const,
    catalogRevisionId: "catalog",
    profileResolutionId: "resolution",
    controlIds: ["a", "b"],
    rationale: "Moderate baseline",
  },
};

describe("changing an element's control baseline", () => {
  it("sends the command as the reader, at the revision they saw, once per request id", async () => {
    const { client: db, calls } = client({ data: null, error: null });
    await adoptSystemBaseline(db, context, request);
    expect(calls).toEqual([
      {
        name: "adopt_system_baseline",
        args: {
          p_tenant_id: "tenant",
          p_system_id: "system",
          p_expected_revision: 4,
          p_request_id: "request",
          p_selection: request.selection,
        },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("says the system changed elsewhere when its revision moved on", async () => {
    const { client: db } = client({ data: null, error: { code: "PT409", message: "conflict" } });
    await expect(adoptSystemBaseline(db, context, request)).rejects.toThrow(
      BASELINE_CHANGED_ELSEWHERE,
    );
  });

  it("passes on the command's own refusal", async () => {
    const { client: db } = client({
      data: null,
      error: { code: "23514", message: "Choose a published profile" },
    });
    await expect(adoptSystemBaseline(db, context, request)).rejects.toThrow(
      "Choose a published profile",
    );
  });
});
