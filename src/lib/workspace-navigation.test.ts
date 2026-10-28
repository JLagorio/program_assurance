import { describe, expect, it } from "vitest";
import {
  navigationTargetFromLocation,
  navigationTargetKey,
  navigationTargetSchema,
  safeWorkspaceHref,
} from "./workspace-navigation";
const id = "11111111-1111-4111-8111-111111111111";
describe("workspace navigation identities", () => {
  it("accepts local destinations and rejects external, protocol relative, slash escapes and control text", () => {
    expect(safeWorkspaceHref(`/programs/${id}?tab=Requirements`)).toBe(
      `/programs/${id}?tab=Requirements`,
    );
    for (const input of [
      "https://example.test",
      "//example.test",
      "/\\example.test",
      "/programs\nignored",
    ])
      expect(() => safeWorkspaceHref(input)).toThrow();
  });
  it("identifies actually open records without inventing labels", () => {
    expect(navigationTargetFromLocation(`/programs/${id}`, {})).toEqual({
      kind: "program",
      recordId: id,
    });
    expect(navigationTargetFromLocation(`/programs/${id}/sctm`, {})).toEqual({
      kind: "workbook-sheet",
      recordId: id,
      sheetId: "mappings",
    });
    expect(navigationTargetFromLocation("/evidence", { artifact: id })).toEqual({
      kind: "evidence",
      recordId: id,
    });
    expect(navigationTargetFromLocation("/programs/not-a-uuid", {})).toBeNull();
    expect(navigationTargetFromLocation("/programs", {})).toBeNull();
  });
  it("records saved views through successful application, not their landing route", () => {
    expect(navigationTargetFromLocation(`/programs/${id}`, { savedView: id })).toBeNull();
  });
  it("keys sheets independently and rejects extra destination authority", () => {
    expect(navigationTargetKey({ kind: "workbook-sheet", recordId: id, sheetId: "mappings" })).toBe(
      `workbook-sheet:${id}:mappings`,
    );
    expect(
      navigationTargetSchema.safeParse({ kind: "program", recordId: id, href: "//evil" }).success,
    ).toBe(false);
    expect(
      navigationTargetSchema.safeParse({ kind: "workbook-sheet", recordId: id, sheetId: "../evil" })
        .success,
    ).toBe(false);
  });
});
