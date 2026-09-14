import { describe, expect, it } from "vitest";
import {
  defaultValue,
  displayValue,
  recordPayload,
  timestampInput,
  type Collection,
  type Column,
} from "./records";

const column = (name: string, type: string, extra: Partial<Column> = {}): Column => ({
  name,
  type,
  required: false,
  default: null,
  description: null,
  choices: [],
  ...extra,
});
const collection = (columns: Column[]): Collection => ({
  name: "test_records",
  description: null,
  columns,
  relations: [],
  can_insert: true,
  can_update: true,
  can_delete: true,
});

describe("database form values", () => {
  it("preserves unknown, false, and zero as different values", () => {
    const schema = collection([
      column("score", "integer"),
      column("accepted", "boolean"),
      column("due_date", "date"),
    ]);
    expect(recordPayload(schema, { score: "0", accepted: "false", due_date: "" })).toEqual({
      score: 0,
      accepted: false,
      due_date: null,
    });
    expect(displayValue(null)).toBe("Not recorded");
    expect(displayValue(0)).toBe("0");
    expect(displayValue(false)).toBe("No");
  });
  it("uses only database-defined controlled choices and preserves server defaults", () => {
    const status = column("status", "text", {
      required: true,
      default: "'planned'::text",
      choices: ["planned", "active"],
    });
    const schema = collection([status]);
    expect(defaultValue(status)).toBe("planned");
    expect(recordPayload(schema, { status: "" })).toEqual({});
    expect(() => recordPayload(schema, { status: "approved" })).toThrow("Choose a valid status");
    expect(() => recordPayload(schema, { status: "" }, { id: "existing", revision: 1 })).toThrow(
      "Status is required",
    );
  });
  it("never lets forms supply identities, audit actors, or revision counters", () => {
    const schema = collection([
      column("id", "uuid"),
      column("tenant_id", "uuid"),
      column("created_by", "uuid"),
      column("revision", "bigint"),
      column("title", "text", { required: true }),
    ]);
    expect(
      recordPayload(schema, {
        id: "forged",
        tenant_id: "other",
        created_by: "other",
        revision: "999",
        title: "Recorded title",
      }),
    ).toEqual({ title: "Recorded title" });
  });
  it("rejects impossible dates, fractional integer counts, invalid relations, and non-array lists", () => {
    for (const [field, type, value] of [
      ["due_date", "date", "2026-02-30"],
      ["version_number", "integer", "1.5"],
      ["system_id", "uuid", "system-1"],
      ["tags", "text[]", "{}"],
      ["collected_at", "timestamp with time zone", "yesterday"],
    ]) {
      expect(() =>
        recordPayload(collection([column(field!, type!)]), { [field!]: value! }),
      ).toThrow();
    }
    expect(recordPayload(collection([column("tags", "text[]")]), { tags: '["actual"]' })).toEqual({
      tags: ["actual"],
    });
    expect(defaultValue(column("tags", "text[]", { default: "'{}'::text[]" }))).toBe("[]");
  });
  it("round-trips recorded timestamp instants through the local datetime input", () => {
    const value = "2026-09-11T19:42:03.123Z";
    const schema = collection([column("collected_at", "timestamp with time zone")]);
    expect(recordPayload(schema, { collected_at: timestampInput(value) })).toEqual({
      collected_at: value,
    });
    expect(
      defaultValue(column("created_at", "timestamp with time zone", { default: "now()" })),
    ).toBe("");
  });
});
