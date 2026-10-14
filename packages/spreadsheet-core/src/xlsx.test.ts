import { describe, expect, it } from "vitest";
import { applyOperation, cellAt, createSheet, createWorkbook } from "./workbook";
import { exportXlsx, importXlsx, validateXlsxArchive } from "./xlsx";

describe("XLSX interchange", () => {
  it("round trips formulas, types, styles, dimensions and frozen panes through a real XLSX file", async () => {
    const sheet = createSheet("Coverage", { rows: 20, columns: 8 });
    let workbook = createWorkbook("Coverage", [sheet]);
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: sheet.id,
      start: { row: 0, column: 0 },
      values: [
        ["Requirement", "Count", "Ready"],
        ["REQ-1", "12.5", "TRUE"],
        ["=literal text", "=SUM(B2:B2)"],
      ],
    });
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range: { start: { row: 2, column: 0 }, end: { row: 2, column: 0 } },
      style: { format: "text", bold: true, background: "#FFEEDD", align: "center" },
    });
    workbook = applyOperation(workbook, { type: "freeze", sheetId: sheet.id, rows: 1, columns: 1 });
    workbook = applyOperation(workbook, {
      type: "resize-column",
      sheetId: sheet.id,
      columnId: sheet.columns[0]!.id,
      width: 230,
    });
    const encoded = await exportXlsx(workbook);
    expect(encoded.slice(0, 2)).toEqual(new Uint8Array([80, 75]));
    const imported = await importXlsx(encoded, "Round trip.xlsx");
    const actual = imported.workbook.sheets[0]!;
    expect(actual.name).toBe("Coverage");
    expect(cellAt(actual, { row: 1, column: 1 })!.input).toBe("12.5");
    expect(cellAt(actual, { row: 1, column: 2 })!.input).toBe("TRUE");
    expect(cellAt(actual, { row: 2, column: 0 })).toMatchObject({
      input: "=literal text",
      style: { format: "text", bold: true, background: "#FFEEDD", align: "center" },
    });
    expect(cellAt(actual, { row: 2, column: 1 })!.input).toBe("=SUM(B2:B2)");
    expect(actual.frozenRows).toBe(1);
    expect(actual.frozenColumns).toBe(1);
    expect(actual.columns[0]!.width).toBe(230);
    expect(imported.warnings.join(" ")).toContain("independent analysis");
  });
  it("imports an independently authored workbook with explicit fidelity warnings", async () => {
    const { default: ExcelJS } = await import("exceljs");
    const source = new ExcelJS.Workbook();
    const sheet = source.addWorksheet("External");
    sheet.getCell("A1").value = "Header";
    sheet.mergeCells("A1:B1");
    sheet.getCell("A2").value = { text: "Evidence", hyperlink: "https://example.com/evidence" };
    sheet.getCell("B2").value = new Date("2026-10-13T00:00:00Z");
    sheet.getCell("B2").numFmt = "yyyy-mm-dd";
    sheet.getCell("C2").dataValidation = { type: "list", formulae: ['"open,closed"'] };
    sheet.getCell("C2").value = "open";
    sheet.getCell("D2").value = "TRUE";
    sheet.getCell("E2").value = { richText: [{ text: "=SUM(1,2)" }] };
    const imported = await importXlsx(new Uint8Array(await source.xlsx.writeBuffer()));
    expect(imported.warnings.join(" ")).toContain("Merged");
    expect(imported.warnings.join(" ")).toContain("Hyperlinks");
    expect(cellAt(imported.workbook.sheets[0]!, { row: 1, column: 2 })!.validation).toEqual({
      type: "list",
      options: ["open", "closed"],
      allowBlank: false,
    });
    expect(cellAt(imported.workbook.sheets[0]!, { row: 1, column: 1 })!.style!.format).toBe("date");
    expect(cellAt(imported.workbook.sheets[0]!, { row: 1, column: 3 })).toMatchObject({
      input: "TRUE",
      style: { format: "text" },
    });
    expect(cellAt(imported.workbook.sheets[0]!, { row: 1, column: 4 })).toMatchObject({
      input: "=SUM(1,2)",
      style: { format: "text" },
    });
  });
  it("rejects invalid and oversized archives before parsing", () => {
    expect(() => validateXlsxArchive(new Uint8Array(30))).toThrow();
    expect(() => validateXlsxArchive(new Uint8Array(10_000_001))).toThrow("10 MB");
  });
});

describe("XLSX analysis metadata", () => {
  it("round trips empty notes, dropdowns, fonts, borders and hidden row/column dimensions", async () => {
    const sheet = createSheet("Review", { rows: 20, columns: 8 });
    sheet.rows[3]!.hidden = true;
    sheet.rows[3]!.height = 72;
    sheet.columns[2]!.hidden = true;
    sheet.cells[sheet.rows[0]!.id] = {
      [sheet.columns[0]!.id]: {
        input: "Open",
        comment: "Review with system owner\nEvidence pending",
        validation: { type: "list", options: ["Open", "Closed"], allowBlank: false },
        style: {
          fontFamily: "Georgia",
          fontSize: 18,
          wrap: true,
          align: "center",
          verticalAlign: "bottom",
          strikethrough: true,
          borderBottom: { style: "solid", width: 2, color: "#123456" },
        },
      },
    };
    sheet.cells[sheet.rows[1]!.id] = {
      [sheet.columns[0]!.id]: {
        input: "",
        comment: "An empty cell can carry a note",
        validation: { type: "list", options: ["Open", "Closed"], allowBlank: true },
      },
    };
    const imported = await importXlsx(await exportXlsx(createWorkbook("Metadata", [sheet])));
    const actual = imported.workbook.sheets[0]!;
    expect(cellAt(actual, { row: 0, column: 0 })).toMatchObject(
      sheet.cells[sheet.rows[0]!.id]![sheet.columns[0]!.id]!,
    );
    expect(cellAt(actual, { row: 1, column: 0 })).toMatchObject(
      sheet.cells[sheet.rows[1]!.id]![sheet.columns[0]!.id]!,
    );
    expect(actual.rows[3]).toMatchObject({ hidden: true, height: 72 });
    expect(actual.columns[2]!.hidden).toBe(true);
  });
});

describe("XLSX range borders", () => {
  it.each(["outside", "inside", "none"] as const)(
    "preserves %s borders over hidden-axis selections",
    async (preset) => {
      const sheet = createSheet("Borders", { rows: 5, columns: 5 });
      sheet.rows[0]!.hidden = true;
      sheet.rows[2]!.hidden = true;
      sheet.columns[0]!.hidden = true;
      sheet.columns[2]!.hidden = true;
      const range = { start: { row: 0, column: 0 }, end: { row: 4, column: 4 } };
      const border = { style: "solid", color: "#456789", width: 3 } as const;
      let workbook = applyOperation(createWorkbook("Borders", [sheet]), {
        type: "format",
        sheetId: sheet.id,
        range,
        style: { bold: true, background: "#FFEEDD" },
      });
      workbook = applyOperation(workbook, {
        type: "borders",
        sheetId: sheet.id,
        range,
        preset: "all",
        border,
      });
      workbook = applyOperation(workbook, {
        type: "borders",
        sheetId: sheet.id,
        range,
        preset,
        ...(preset === "none" ? {} : { border }),
        visibleOnly: true,
      });
      const imported = await importXlsx(await exportXlsx(workbook));
      const actual = imported.workbook.sheets[0]!;
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 5; column++) {
          const before = cellAt(workbook.sheets[0]!, { row, column })!;
          const after = cellAt(actual, { row, column })!;
          expect(after.style).toMatchObject({ bold: true, background: "#FFEEDD" });
          for (const key of ["borderTop", "borderRight", "borderBottom", "borderLeft"] as const)
            expect(after.style![key]).toEqual(before.style![key]);
        }
      }
      for (const index of [0, 2]) {
        expect(actual.rows[index]!.hidden).toBe(true);
        expect(actual.columns[index]!.hidden).toBe(true);
      }
    },
  );
});
