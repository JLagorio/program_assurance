import { describe, expect, it } from "vitest";
import { lifecycleGateDate, lifecycleGateTone, programTimeline } from "./program-timeline";

const gate = (
  id: string,
  fields: { sequence_number?: number; due_on?: string; decided_at?: string } = {},
) => ({
  id,
  title: id,
  sequence_number: fields.sequence_number ?? null,
  due_on: fields.due_on ?? null,
  decided_at: fields.decided_at ?? null,
});

describe("program lifecycle timeline", () => {
  it("restores chronological order independently of record ids or completion state", () => {
    const records = [gate("a", { due_on: "2026-09-15" }), gate("z", { due_on: "2026-06-01" })];
    expect(programTimeline(records).scheduled.map((row) => row.id)).toEqual(["z", "a"]);
    expect(records.map((row) => row.id)).toEqual(["a", "z"]);
  });

  it("honors explicit steps without inventing positions for unsequenced or undated gates", () => {
    const result = programTimeline([
      gate("step two", { sequence_number: 2, due_on: "2026-01-01" }),
      gate("undated"),
      gate("scheduled", { due_on: "2026-03-01" }),
      gate("step one", { sequence_number: 1, due_on: "2026-05-01" }),
    ]);
    expect(result.sequenced.map((row) => row.id)).toEqual(["step one", "step two"]);
    expect(result.scheduled.map((row) => row.id)).toEqual(["scheduled"]);
    expect(result.unscheduled.map((row) => row.id)).toEqual(["undated"]);
  });

  it("uses the planned date when present and distinguishes a recorded decision date", () => {
    expect(
      lifecycleGateDate(
        gate("planned", { due_on: "2026-06-01", decided_at: "2026-07-01T00:00:00Z" }),
      ),
    ).toEqual({ value: "2026-06-01", label: "Due" });
    expect(lifecycleGateDate(gate("decision", { decided_at: "2026-07-01T00:00:00Z" }))).toEqual({
      value: "2026-07-01T00:00:00Z",
      label: "Decided",
    });
    expect(lifecycleGateDate(gate("missing"))).toBeNull();
  });

  it("keeps waived, at risk, and failed states distinct from successful completion", () => {
    expect(lifecycleGateTone("completed")).toBe("success");
    expect(lifecycleGateTone("passed")).toBe("success");
    expect(lifecycleGateTone("waived")).toBe("neutral");
    expect(lifecycleGateTone("at_risk")).toBe("warning");
    expect(lifecycleGateTone("failed")).toBe("danger");
    expect(lifecycleGateTone("in_review")).toBe("information");
  });
});
