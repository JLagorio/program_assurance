import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

const { publishSspRevision } = await import("./ssp-publish");
const { CHANGED_ELSEWHERE } = await import("./models");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const ssp = uuid(3);

function client(answer: FakeResult = { data: { id: ssp, revision: 8 }, error: null }) {
  return fakeClient(() => answer);
}

describe("publishing an SSP revision", () => {
  it("publishes it as revision + 1 of the revision the reader saw", async () => {
    const { client: db, calls } = client();
    await publishSspRevision(db, context, { id: ssp, revision: 7 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("ssp_revisions");
    expect(args(calls[0], "update")[0]?.[0]).toEqual({ state: "published", revision: 8 });
    expect(filter(calls[0], "eq", "id")).toBe(ssp);
    expect(filter(calls[0], "eq", "revision")).toBe(7);
  });

  it("says the SSP changed elsewhere when its revision moved on or it is published", async () => {
    const { client: db } = client({ data: null, error: { code: "PGRST116", message: "0 rows" } });
    await expect(publishSspRevision(db, context, { id: ssp, revision: 7 })).rejects.toThrow(
      CHANGED_ELSEWHERE,
    );
  });

  it("refuses an SSP it cannot name without a request", async () => {
    const { client: db, calls } = client();
    await expect(publishSspRevision(db, context, { id: "SSP 3", revision: 7 })).rejects.toThrow(
      "Reload the SSP before publishing it.",
    );
    expect(calls).toHaveLength(0);
  });
});
