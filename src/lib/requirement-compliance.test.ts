import { describe, expect, it, vi } from "vitest";

vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  ANSWER_NEEDS_STATEMENT,
  ANSWER_NEEDS_STATUS,
  answerNeedsStatement,
  answerRequirement,
  requirementAnswerIssues,
} from "./requirement-compliance";

const context = { tenantId: "tenant-1", token: "token" };
const requirementId = "0a0a0a0a-0000-4000-8000-000000000001";

/** A client that records each write and answers the row it would store. */
function recordingClient(answer: { data?: unknown; error?: { code?: string; message: string } }) {
  const calls: {
    table: string;
    verb: "insert" | "update";
    values: Record<string, unknown>;
    filters: [string, unknown][];
  }[] = [];
  const client = {
    from(table: string) {
      const build = (verb: "insert" | "update", values: Record<string, unknown>) => {
        const call = { table, verb, values, filters: [] as [string, unknown][] };
        calls.push(call);
        const chain = {
          eq(column: string, value: unknown) {
            call.filters.push([column, value]);
            return chain;
          },
          select: () => chain,
          setHeader: () => chain,
          single: async () => ({
            data: answer.data ?? { id: "answer-1" },
            error: answer.error ?? null,
          }),
        };
        return chain;
      };
      return {
        insert: (values: Record<string, unknown>) => build("insert", values),
        update: (values: Record<string, unknown>) => build("update", values),
      };
    },
  };
  return { client: client as never, calls };
}

describe("requirementAnswerIssues", () => {
  it("asks for a status first, then for a reason where the answer is short of compliant", () => {
    expect(requirementAnswerIssues({ status: null, statement: "" })).toEqual([
      { field: "status", message: ANSWER_NEEDS_STATUS },
    ]);
    expect(requirementAnswerIssues({ status: "non_compliant", statement: "  " })).toEqual([
      { field: "statement", message: ANSWER_NEEDS_STATEMENT },
    ]);
    expect(requirementAnswerIssues({ status: "compliant", statement: "" })).toEqual([]);
    expect(
      requirementAnswerIssues({ status: "not_applicable", statement: "No radio fitted." }),
    ).toEqual([]);
  });

  it("needs a reason for every answer but compliant", () => {
    expect(answerNeedsStatement("compliant")).toBe(false);
    expect(answerNeedsStatement("partially_compliant")).toBe(true);
    expect(answerNeedsStatement("non_compliant")).toBe(true);
    expect(answerNeedsStatement("not_applicable")).toBe(true);
    expect(answerNeedsStatement(null)).toBe(false);
  });
});

describe("answerRequirement", () => {
  it("records a first answer in the workspace, against its requirement", async () => {
    const { client, calls } = recordingClient({});
    await answerRequirement(client, context, {
      requirementId,
      status: "compliant",
      verificationMethod: "test",
      statement: "  Shown in the arming test.  ",
    });
    expect(calls).toEqual([
      {
        table: "requirement_compliance",
        verb: "insert",
        values: {
          status: "compliant",
          verification_method: "test",
          statement: "Shown in the arming test.",
          engineering_requirement_id: requirementId,
          tenant_id: "tenant-1",
        },
        filters: [],
      },
    ]);
  });

  it("changes an answer at the revision the reader saw, and stores an empty reason as none", async () => {
    const { client, calls } = recordingClient({});
    await answerRequirement(client, context, {
      requirementId,
      existing: { id: "answer-1", revision: 4 },
      status: "compliant",
      verificationMethod: null,
      statement: "   ",
    });
    expect(calls[0]).toMatchObject({
      verb: "update",
      values: { status: "compliant", verification_method: null, statement: null, revision: 5 },
      filters: [
        ["id", "answer-1"],
        ["revision", 4],
      ],
    });
  });

  it("sends nothing while the answer is missing its status or its reason", async () => {
    const { client, calls } = recordingClient({});
    await expect(
      answerRequirement(client, context, {
        requirementId,
        status: "partially_compliant",
        verificationMethod: null,
        statement: null,
      }),
    ).rejects.toThrow(ANSWER_NEEDS_STATEMENT);
    expect(calls).toEqual([]);
  });

  it("says another session changed the answer when the revision is stale", async () => {
    const { client } = recordingClient({ error: { code: "PT409", message: "conflict" } });
    await expect(
      answerRequirement(client, context, {
        requirementId,
        existing: { id: "answer-1", revision: 1 },
        status: "compliant",
        verificationMethod: null,
        statement: null,
      }),
    ).rejects.toThrow(/changed/i);
  });
});
