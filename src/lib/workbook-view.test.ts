import { describe, expect, it } from "vitest";
import { createSheet } from "@ledger/spreadsheet-core";
import {
  workbookFormulaReferences,
  workbookRangeReference,
  workbookViewSchema,
} from "./workbook-view";
describe("workbook authoring adapter", () => {
  it("uses canonical stable identities for hidden rows and columns", () => {
    const sheet = createSheet("Analysis", { rows: 4, columns: 4 });
    sheet.rows[1]!.hidden = true;
    sheet.columns[1]!.hidden = true;
    const selection = {
      anchor: { rowId: sheet.rows[2]!.id, columnId: sheet.columns[2]!.id },
      focus: { rowId: sheet.rows[3]!.id, columnId: sheet.columns[3]!.id },
    };
    expect(workbookRangeReference(sheet, selection)).toBe("C3:D4");
    expect(workbookFormulaReferences(sheet, '=SUM(C3:D4,Other!A1,"A2")')).toEqual([
      { label: "C3:D4", selection },
    ]);
  });
  it("highlights explicit same-sheet refs and omits absent coordinates", () => {
    const sheet = createSheet("My analysis", { rows: 3, columns: 3 });
    expect(workbookFormulaReferences(sheet, "='My analysis'!$A$1+Z999")).toHaveLength(1);
    expect(() =>
      workbookRangeReference(sheet, {
        anchor: { rowId: "deleted", columnId: sheet.columns[0]!.id },
        focus: { rowId: sheet.rows[0]!.id, columnId: sheet.columns[0]!.id },
      }),
    ).toThrow();
  });
  it("rejects malformed saved filters and layouts while accepting older views", () => {
    const saved = { activeSheet: "requirements", view: "grid", questions: {} };
    expect(workbookViewSchema.parse(saved).analysis).toEqual({});
    expect(
      workbookViewSchema.safeParse({ ...saved, questions: { requirements: { search: 42 } } })
        .success,
    ).toBe(false);
    expect(
      workbookViewSchema.safeParse({
        ...saved,
        layout: { columns: [], rows: [], frozenRows: 400, frozenColumns: 0 },
      }).success,
    ).toBe(false);
  });
});
