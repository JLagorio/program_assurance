import { describe, expect, it, vi } from "vitest";

vi.mock("./database", () => ({ database: vi.fn(), requireIdentity: vi.fn() }));

import {
  ANSWER_CONFLICTS,
  ANSWER_NEEDS_STATEMENT,
  ANSWER_NEEDS_STATUS,
  answerNeedsStatement,
  answerRequirement,
  requirementAnswerIssues,
} from "./requirement-compliance";
import { SaveOnceConflict } from "./save-once";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

const context = { tenantId: "tenant-1", token: "token" };
const requirementId = "0a0a0a0a-0000-4000-8000-000000000001";

/** A client that answers each request in turn: the lookup by id first, then the write. */
function answering(...answers: FakeResult[]) {
  let next = 0;
  return fakeClient(() => answers[next++] ?? { data: null, error: null });
}

const answerId = uuid(51);
const recorded = {
  id: answerId,
  tenant_id: "tenant-1",
  engineering_requirement_id: requirementId,
  revision: 1,
  status: "compliant",
  verification_method: "test",
  statement: "Shown in the arming test.",
};
const firstAnswer = {
  requirementId,
  id: answerId,
  status: "compliant" as const,
  verificationMethod: "test" as const,
  statement: "  Shown in the arming test.  ",
};

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
  it("records a first answer in the workspace, against its requirement, under the id its form chose", async () => {
    const { client, calls } = answering(
      { data: null, error: null },
      { data: recorded, error: null },
    );
    const result = await answerRequirement(client, context, firstAnswer);
    expect(result).toEqual({ outcome: "created", record: recorded });
    expect(filter(calls[0], "eq", "tenant_id")).toBe("tenant-1");
    expect(filter(calls[0], "eq", "id")).toBe(answerId);
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({
      id: answerId,
      tenant_id: "tenant-1",
      engineering_requirement_id: requirementId,
      status: "compliant",
      verification_method: "test",
      statement: "Shown in the arming test.",
    });
  });

  it("finds a first answer whose answer was lost, and records no second one", async () => {
    const { client, calls } = answering({ data: recorded, error: null });
    const result = await answerRequirement(client, context, firstAnswer);
    expect(result).toEqual({ outcome: "unchanged", record: recorded });
    expect(calls).toHaveLength(1);
    expect(args(calls[0], "insert")).toEqual([]);
  });

  it("refuses, in words, a first answer whose id was saved with another answer", async () => {
    const { client, calls } = answering({
      data: { ...recorded, status: "non_compliant", statement: "Not yet shown." },
      error: null,
    });
    const saving = answerRequirement(client, context, firstAnswer);
    await expect(saving).rejects.toBeInstanceOf(SaveOnceConflict);
    await expect(saving).rejects.toMatchObject({
      reason: "different",
      message: ANSWER_CONFLICTS.different,
    });
    expect(calls).toHaveLength(1);
  });

  it("says another session answered the requirement first, when its one answer is taken", async () => {
    const { client } = answering(
      { data: null, error: null },
      { data: null, error: { code: "23505", message: "duplicate key value" } },
      { data: null, error: null },
    );
    await expect(answerRequirement(client, context, firstAnswer)).rejects.toMatchObject({
      reason: "changed",
      message: ANSWER_CONFLICTS.answered,
    });
  });

  it("changes an answer at the revision the reader saw, and stores an empty reason as none", async () => {
    const { client, calls } = answering(
      { data: { ...recorded, revision: 4 }, error: null },
      {
        data: { ...recorded, revision: 5, verification_method: null, statement: null },
        error: null,
      },
    );
    const result = await answerRequirement(client, context, {
      requirementId,
      id: answerId,
      revision: 4,
      status: "compliant",
      verificationMethod: null,
      statement: "   ",
    });
    expect(result.outcome).toBe("updated");
    expect(args(calls[1], "update")[0]?.[0]).toEqual({
      status: "compliant",
      verification_method: null,
      statement: null,
      revision: 5,
    });
    expect(filter(calls[1], "eq", "id")).toBe(answerId);
    expect(filter(calls[1], "eq", "revision")).toBe(4);
  });

  it("sends nothing while the answer is missing its status or its reason", async () => {
    const { client, calls } = answering();
    await expect(
      answerRequirement(client, context, {
        requirementId,
        id: answerId,
        status: "partially_compliant",
        verificationMethod: null,
        statement: null,
      }),
    ).rejects.toThrow(ANSWER_NEEDS_STATEMENT);
    expect(calls).toEqual([]);
  });

  it("refuses an edit at a stale revision as another session's change, and writes nothing", async () => {
    const { client, calls } = answering({
      data: { ...recorded, revision: 2, statement: "Their words." },
      error: null,
    });
    await expect(
      answerRequirement(client, context, {
        requirementId,
        id: answerId,
        revision: 1,
        status: "compliant",
        verificationMethod: null,
        statement: null,
      }),
    ).rejects.toMatchObject({ reason: "changed", message: ANSWER_CONFLICTS.changed });
    expect(calls).toHaveLength(1);
  });

  it("refuses an edit of an answer that is gone", async () => {
    const { client } = answering({ data: null, error: null });
    await expect(
      answerRequirement(client, context, { ...firstAnswer, revision: 1 }),
    ).rejects.toMatchObject({ reason: "missing", message: ANSWER_CONFLICTS.missing });
  });
});
