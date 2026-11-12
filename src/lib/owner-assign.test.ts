import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  OWNED_COLLECTIONS,
  OWNER_ANSWER_UNREADABLE,
  OWNER_NOTHING_CHOSEN,
  assignOwner,
  ownerAssignedText,
} = await import("./owner-assign");
const { productRecordNoun } = await import("./product-records");

const context = { token: "token" };
const owner = uuid(700);

describe("assignOwner", () => {
  it("sends the whole choice in one request, each record once", async () => {
    const { client, calls } = fakeClient(() => ({
      data: { assigned: 2, unchanged: 1 },
      error: null,
    }));
    const answer = await assignOwner(client, context, {
      collection: "risks",
      recordIds: [uuid(3), uuid(1), uuid(2), uuid(1)],
      ownerPartyId: owner,
    });
    expect(answer).toEqual({ assigned: 2, unchanged: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:assign_record_owner");
    const [sent] = args(calls[0], "rpc")[0] as [
      { p_collection: string; p_record_ids: string[]; p_owner_party_id: string },
    ];
    expect(sent.p_collection).toBe("risks");
    expect(sent.p_owner_party_id).toBe(owner);
    expect([...sent.p_record_ids].sort()).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer token"]);
  });

  it("asks nothing of the server when nothing is chosen", async () => {
    const { client, calls } = fakeClient(() => ({ data: null, error: null }));
    await expect(
      assignOwner(client, context, { collection: "risks", recordIds: [], ownerPartyId: owner }),
    ).rejects.toThrow(OWNER_NOTHING_CHOSEN);
    expect(calls).toHaveLength(0);
  });

  it("passes the command's refusals on in its words", async () => {
    const gone = fakeClient(() => ({
      data: null,
      error: {
        code: "P0002",
        message: "Some of these records are no longer available; reload and choose again",
      },
    }));
    await expect(
      assignOwner(gone.client, context, {
        collection: "operational_issues",
        recordIds: [uuid(1)],
        ownerPartyId: owner,
      }),
    ).rejects.toThrow("Some of these records are no longer available; reload and choose again");
    const viewer = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "An editor, admin, or owner can assign an owner" },
    }));
    await expect(
      assignOwner(viewer.client, context, {
        collection: "risks",
        recordIds: [uuid(1)],
        ownerPartyId: owner,
      }),
    ).rejects.toThrow("An editor, admin, or owner can assign an owner");
  });

  it("says an answer it cannot read, since the owner may be assigned", async () => {
    const { client } = fakeClient(() => ({ data: { assigned: "two" }, error: null }));
    await expect(
      assignOwner(client, context, {
        collection: "risks",
        recordIds: [uuid(1)],
        ownerPartyId: owner,
      }),
    ).rejects.toThrow(OWNER_ANSWER_UNREADABLE);
  });
});

describe("ownerAssignedText", () => {
  const risks = { one: "risk", other: "risks" };

  it("counts the records that took the owner", () => {
    expect(ownerAssignedText({ assigned: 1, unchanged: 0 }, risks)).toBe(
      "1 risk now has this owner.",
    );
    expect(ownerAssignedText({ assigned: 12, unchanged: 0 }, risks)).toBe(
      "12 risks now have this owner.",
    );
  });

  it("says how many already held the owner", () => {
    expect(ownerAssignedText({ assigned: 10, unchanged: 2 }, risks)).toBe(
      "10 risks now have this owner. 2 already had it.",
    );
    expect(ownerAssignedText({ assigned: 0, unchanged: 1 }, risks)).toBe(
      "The risk already has this owner.",
    );
    expect(ownerAssignedText({ assigned: 0, unchanged: 3 }, risks)).toBe(
      "All 3 risks already have this owner.",
    );
  });

  it("writes its counts as the reader's locale does", () => {
    const format = (value: number) => value.toLocaleString("en-US");
    expect(ownerAssignedText({ assigned: 1200, unchanged: 1100 }, risks, format)).toBe(
      "1,200 risks now have this owner. 1,100 already had it.",
    );
  });
});

describe("the collections that assign an owner", () => {
  it("each has a product noun", () => {
    for (const collection of OWNED_COLLECTIONS)
      expect(productRecordNoun(collection), collection).toBeTruthy();
  });
});
