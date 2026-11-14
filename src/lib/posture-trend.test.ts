import { describe, expect, it } from "vitest";

const { calendarDay, postureDay, postureDaysBefore, postureSeries, readPostureTrend } =
  await import("./posture-trend");
type PostureSnapshot = import("./posture-trend").PostureSnapshot;

type Answer = { data: unknown; error: { message: string } | null };

/** A client whose `rpc` calls are recorded and answered, in order, from `answers`. */
function client(answers: Answer[]) {
  const calls: {
    name: string;
    args: Record<string, unknown>;
    headers: Record<string, string>;
    signal?: AbortSignal;
  }[] = [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call: (typeof calls)[number] = { name, args, headers: {} };
        calls.push(call);
        const answer = answers[calls.length - 1] ?? {
          data: null,
          error: { message: "Unexpected" },
        };
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          abortSignal(signal: AbortSignal) {
            call.signal = signal;
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

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const ensured = { data: { taken_on: "2026-11-13", taken: [A] }, error: null };

const row = (program: string, day: string, satisfied: number, controls = 10) => ({
  id: `${program}-${day}`,
  tenant_id: "tenant",
  program_id: program,
  taken_on: day,
  taken_at: `${day}T23:55:00+00:00`,
  controls,
  no_requirement: controls - satisfied,
  no_evidence: 0,
  not_assessed: 0,
  other_than_satisfied: 0,
  partially_satisfied: 0,
  satisfied,
});

const snapshot = (day: string, satisfied: number, total = 10): PostureSnapshot => ({
  programId: A,
  day,
  takenAt: `${day}T23:55:00+00:00`,
  total,
  counts: {
    no_requirement: total - satisfied,
    no_evidence: 0,
    not_assessed: 0,
    other_than_satisfied: 0,
    partially_satisfied: 0,
    satisfied,
  },
});

describe("readPostureTrend", () => {
  it("asks for today's snapshots first, then reads every named program's in one request", async () => {
    const { calls, client: fake } = client([
      ensured,
      {
        data: [row(A, "2026-11-12", 3), row(A, "2026-11-13", 4), row(B, "2026-11-13", 1)],
        error: null,
      },
    ]);
    const signal = new AbortController().signal;
    const trend = await readPostureTrend(fake, { token: "token" }, [A, B, A], {
      since: "2026-11-02",
      signal,
    });
    expect(calls.map((call) => call.name)).toEqual([
      "ensure_program_posture_snapshots",
      "program_posture_trend",
    ]);
    expect(calls[0]!.args).toEqual({ p_program_ids: [A, B] });
    expect(calls[1]!.args).toEqual({ p_program_ids: [A, B], p_since: "2026-11-02" });
    expect(calls.every((call) => call.headers["Authorization"] === "Bearer token")).toBe(true);
    expect(calls.every((call) => call.signal === signal)).toBe(true);
    expect(trend.get(A)!.map((day) => [day.day, day.counts.satisfied, day.total])).toEqual([
      ["2026-11-12", 3, 10],
      ["2026-11-13", 4, 10],
    ]);
    expect(trend.get(B)).toHaveLength(1);
  });

  it("keeps every named program, one with no snapshot as an empty list, in date order", async () => {
    const { calls, client: fake } = client([
      ensured,
      { data: [row(A, "2026-11-13", 4), row(A, "2026-11-11", 2)], error: null },
    ]);
    const trend = await readPostureTrend(fake, { token: "token" }, [A, B]);
    expect(calls[1]!.args).toEqual({ p_program_ids: [A, B] });
    expect(trend.get(A)!.map((day) => day.day)).toEqual(["2026-11-11", "2026-11-13"]);
    expect(trend.get(B)).toEqual([]);
  });

  it("asks nothing for no program", async () => {
    const { calls, client: fake } = client([]);
    expect((await readPostureTrend(fake, { token: "token" }, [])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("passes on a refusal of the command, and reads nothing after it", async () => {
    const { calls, client: fake } = client([
      { data: null, error: { message: "Program access is required" } },
    ]);
    await expect(readPostureTrend(fake, { token: "token" }, [A])).rejects.toThrow(
      "Program access is required",
    );
    expect(calls).toHaveLength(1);
  });

  it("passes on a failed read, and refuses an answer it cannot read", async () => {
    const failed = client([ensured, { data: null, error: { message: "The read failed" } }]);
    await expect(readPostureTrend(failed.client, { token: "token" }, [A])).rejects.toThrow(
      "The read failed",
    );
    const garbled = client([
      ensured,
      { data: [{ program_id: A, taken_on: "today" }], error: null },
    ]);
    await expect(readPostureTrend(garbled.client, { token: "token" }, [A])).rejects.toThrow();
  });
});

describe("postureSeries", () => {
  const live = {
    baseline: true,
    total: 10,
    counts: {
      no_requirement: 4,
      no_evidence: 0,
      not_assessed: 0,
      other_than_satisfied: 0,
      partially_satisfied: 0,
      satisfied: 6,
    },
  };

  it("draws each day's share of the baseline satisfied, in date order", () => {
    expect(
      postureSeries(
        [snapshot("2026-11-12", 4), snapshot("2026-11-11", 2)],
        undefined,
        "2026-11-13",
      ),
    ).toEqual([
      { day: "2026-11-11", share: 0.2, satisfied: 2, total: 10 },
      { day: "2026-11-12", share: 0.4, satisfied: 4, total: 10 },
    ]);
  });

  it("takes today's point from the live standing, so the line ends at the number beside it", () => {
    const points = postureSeries(
      [snapshot("2026-11-12", 4), snapshot("2026-11-13", 5)],
      live,
      "2026-11-13",
    );
    expect(points.at(-1)).toEqual({ day: "2026-11-13", share: 0.6, satisfied: 6, total: 10 });
    expect(points[0]).toEqual({ day: "2026-11-12", share: 0.4, satisfied: 4, total: 10 });
  });

  it("never makes up a day: with no snapshot today, the live standing adds no point", () => {
    expect(postureSeries([snapshot("2026-11-12", 4)], live, "2026-11-13")).toEqual([
      { day: "2026-11-12", share: 0.4, satisfied: 4, total: 10 },
    ]);
    expect(postureSeries([], live, "2026-11-13")).toEqual([]);
  });

  it("keeps the snapshot where the live answer has no baseline", () => {
    const points = postureSeries(
      [snapshot("2026-11-13", 5)],
      { ...live, baseline: false },
      "2026-11-13",
    );
    expect(points).toEqual([{ day: "2026-11-13", share: 0.5, satisfied: 5, total: 10 }]);
  });

  it("has no share for a baseline of no controls", () => {
    expect(postureSeries([snapshot("2026-11-13", 0, 0)], undefined, "2026-11-14")[0]!.share).toBe(
      null,
    );
  });
});

describe("days", () => {
  it("reads a moment's UTC calendar day, and the days before it", () => {
    const late = new Date("2026-11-13T23:59:00-08:00");
    expect(postureDay(late)).toBe("2026-11-14");
    expect(postureDaysBefore(11, new Date("2026-11-13T12:00:00Z"))).toBe("2026-11-02");
    expect(postureDaysBefore(1, new Date("2026-03-01T00:30:00Z"))).toBe("2026-02-28");
  });

  it("parts a calendar day for a formatter, the month from 1", () => {
    expect(calendarDay("2026-11-03")).toEqual({ year: 2026, month: 11, day: 3 });
  });
});
