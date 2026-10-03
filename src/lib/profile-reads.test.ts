import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { readResolutionCounts } = await import("./profile-reads");

const context = { tenantId: uuid(900), token: "token" };

describe("resolution counts", () => {
  it("asks Postgres to count each resolution's selections instead of reading them", async () => {
    const { client, calls } = fakeClient(() => ({
      data: [
        {
          id: uuid(1),
          profile_revision_id: uuid(11),
          resolved_at: "2026-09-01T00:00:00Z",
          selected_controls: [{ count: 287 }],
        },
        {
          id: uuid(2),
          profile_revision_id: uuid(12),
          resolved_at: "2026-09-02T00:00:00Z",
          selected_controls: [],
        },
      ],
      error: null,
      count: 2,
    }));
    const rows = await readResolutionCounts(client, context);
    expect(rows).toEqual([
      {
        id: uuid(1),
        profile_revision_id: uuid(11),
        resolved_at: "2026-09-01T00:00:00Z",
        selections: 287,
      },
      {
        id: uuid(2),
        profile_revision_id: uuid(12),
        resolved_at: "2026-09-02T00:00:00Z",
        selections: 0,
      },
    ]);
    // One read of the resolutions; selected_controls is never read as rows.
    expect(calls.map((call) => call.table)).toEqual(["profile_resolutions"]);
    expect(args(calls[0], "select")[0]?.[0]).toBe(
      "id,profile_revision_id,resolved_at,selected_controls(count)",
    );
  });
});
