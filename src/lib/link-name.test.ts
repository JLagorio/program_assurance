import { describe, expect, it } from "vitest";
import { linkedName } from "./link-name";

const record = { id: "r1" };

describe("a register's record link words", () => {
  it("say the stored name", () => {
    expect(linkedName("risks", record, "Supplier outage")).toBe("Supplier outage");
    expect(linkedName("risks", record, 7)).toBe("7");
  });

  it("name an unnamed record by its kind, never as a missing value", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(linkedName("risks", record, value)).toBe("Unnamed risk");
    }
  });

  it("use the record's own noun where its kind depends on it", () => {
    expect(linkedName("parties", { id: "p1", party_type: "organization" }, null)).toBe(
      "Unnamed organization",
    );
  });
});
