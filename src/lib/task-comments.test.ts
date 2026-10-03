import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { NO_AUTHOR, postTaskComment } = await import("./task-comments");

const tenantId = uuid(900);
const userId = uuid(901);
const context = { tenantId, userId, token: "token" };
const author = uuid(2);
const comment = { id: uuid(1), taskId: uuid(3), body: "Evidence uploaded for review." };

/** The answers in order: the author lookup, the comment lookup, then the insert. */
function client(...answers: FakeResult[]) {
  let next = 0;
  return fakeClient(() => answers[next++] ?? { data: null, error: null });
}

describe("posting a comment on a task", () => {
  it("posts the trimmed words as the reader's own person, under the id the draft chose", async () => {
    const { client: db, calls } = client(
      { data: { id: author }, error: null },
      { data: null, error: null },
      { data: { id: comment.id }, error: null },
    );
    await postTaskComment(db, context, { ...comment, body: `  ${comment.body}\n` });
    expect(calls[0]?.table).toBe("parties");
    expect(filter(calls[0], "eq", "tenant_id")).toBe(tenantId);
    expect(filter(calls[0], "eq", "auth_user_id")).toBe(userId);
    expect(calls[2]?.table).toBe("comments");
    expect(args(calls[2], "insert")[0]?.[0]).toEqual({
      task_id: comment.taskId,
      author_party_id: author,
      body: comment.body,
      id: comment.id,
      tenant_id: tenantId,
    });
  });

  it("finds a first try that landed instead of posting it twice", async () => {
    const { client: db, calls } = client(
      { data: { id: author }, error: null },
      {
        data: {
          id: comment.id,
          revision: 1,
          task_id: comment.taskId,
          author_party_id: author,
          body: comment.body,
        },
        error: null,
      },
    );
    await postTaskComment(db, context, comment);
    expect(calls.map((call) => call.table)).toEqual(["parties", "comments"]);
    expect(args(calls[1], "insert")).toHaveLength(0);
  });

  it("refuses an empty draft without a request", async () => {
    const { client: db, calls } = client();
    await expect(postTaskComment(db, context, { ...comment, body: "   " })).rejects.toThrow(
      "Write a comment before sending it.",
    );
    expect(calls).toHaveLength(0);
  });

  it("says so when the account has no person to author it", async () => {
    const { client: db, calls } = client({ data: null, error: null });
    await expect(postTaskComment(db, context, comment)).rejects.toThrow(NO_AUTHOR);
    expect(calls).toHaveLength(1);
  });

  it("says what the server refused", async () => {
    const { client: db } = client(
      { data: { id: author }, error: null },
      { data: null, error: null },
      { data: null, error: { message: "permission denied for table comments" } },
    );
    await expect(postTaskComment(db, context, comment)).rejects.toThrow(
      "permission denied for table comments",
    );
  });
});
