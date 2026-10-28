import type { Cell as ExcelCell, CellValue, FillPattern, Workbook as ExcelWorkbook } from "exceljs";
import {
  LIMITS,
  type CalculationResult,
  type CellStyle,
  type CellValidation,
  type Workbook,
} from "./types";
import {
  conditionalDimensions,
  exportConditionalFormats,
  importConditionalFormats,
} from "./xlsx-conditional";
import type { ConditionalFormattingOptions } from "exceljs";
import { createSheet, createWorkbook, validateWorkbook, validateCellValidation } from "./workbook";

export type WorkbookImport = { workbook: Workbook; warnings: string[] };

/** Bound decompression before ExcelJS allocates its document model. */
export function validateXlsxArchive(bytes: Uint8Array): void {
  if (bytes.length > LIMITS.xlsxBytes || bytes.length < 22)
    throw new Error("Choose an unencrypted XLSX file up to 10 MB.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65_557) && view.getUint32(end, true) !== 0x06054b50)
    end--;
  if (
    end < 0 ||
    view.getUint32(end, true) !== 0x06054b50 ||
    end + 22 + view.getUint16(end + 20, true) !== bytes.length
  )
    throw new Error("Invalid Excel ZIP directory.");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  if (
    count > 2000 ||
    !count ||
    view.getUint32(end + 4, true) !== 0 ||
    view.getUint16(end + 8, true) !== count ||
    offset + view.getUint32(end + 12, true) !== end
  )
    throw new Error("This XLSX archive exceeds the supported directory bounds.");
  let expanded = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (
      offset + 46 > end ||
      view.getUint32(offset, true) !== 0x02014b50 ||
      view.getUint16(offset + 8, true) & 1
    )
      throw new Error("Encrypted or invalid Excel entries are not supported.");
    expanded += view.getUint32(offset + 24, true);
    if (expanded > 80_000_000) throw new Error("Expanded XLSX data exceeds 80 MB.");
    const nameLength = view.getUint16(offset + 28, true);
    const next =
      offset +
      46 +
      nameLength +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
    if (next > end) throw new Error("Invalid Excel entry length.");
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").includes("..") ||
      names.has(name)
    )
      throw new Error("Invalid Excel entry path.");
    names.add(name);
    offset = next;
  }
}

function styleFromExcel(cell: ExcelCell): CellStyle | undefined {
  const style: CellStyle = {};
  if (cell.font?.bold !== undefined) style.bold = cell.font.bold;
  if (cell.font?.italic !== undefined) style.italic = cell.font.italic;
  if (cell.font?.underline !== undefined) style.underline = !!cell.font.underline;
  if (cell.font?.strike !== undefined) style.strikethrough = cell.font.strike;
  if (cell.font?.name && /^[\p{L}\p{N} ,_-]{1,80}$/u.test(cell.font.name))
    style.fontFamily = cell.font.name;
  if (cell.font?.size) style.fontSize = Math.max(8, Math.min(72, cell.font.size));
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const border = cell.border?.[side];
    if (border?.style)
      style[`border${side[0]!.toUpperCase()}${side.slice(1)}` as "borderTop"] = {
        style:
          border.style === "dotted" ? "dotted" : /dash/i.test(border.style) ? "dashed" : "solid",
        width: border.style === "thick" ? 3 : /medium/i.test(border.style) ? 2 : 1,
        color: border.color?.argb ? `#${border.color.argb.slice(-6)}` : "#000000",
      };
  }
  if (cell.font?.color?.argb) style.color = `#${cell.font.color.argb.slice(-6)}`;
  const fill = cell.fill as FillPattern | undefined;
  if (fill?.type === "pattern" && fill.pattern === "solid" && fill.fgColor?.argb)
    style.background = `#${fill.fgColor.argb.slice(-6)}`;
  if (cell.alignment?.wrapText !== undefined) style.wrap = cell.alignment.wrapText;
  if (["left", "center", "right"].includes(cell.alignment?.horizontal ?? ""))
    style.align = cell.alignment.horizontal as CellStyle["align"] & string;
  if (["top", "middle", "bottom"].includes(cell.alignment?.vertical ?? ""))
    style.verticalAlign = cell.alignment.vertical as NonNullable<CellStyle["verticalAlign"]>;
  if (cell.numFmt === "@") style.format = "text";
  else if (cell.numFmt?.includes("%")) style.format = "percent";
  else if (/[$€£]/.test(cell.numFmt ?? "")) style.format = "currency";
  else if (/[ymd]/i.test((cell.numFmt ?? "").replace(/"[^"]*"/g, ""))) style.format = "date";
  else if (/0|#/.test(cell.numFmt ?? "")) style.format = "number";
  if (style.format === "number" || style.format === "currency" || style.format === "percent")
    style.decimals = Math.min(10, /\.([0#]+)/.exec(cell.numFmt ?? "")?.[1]?.length ?? 0);
  return Object.keys(style).length ? style : undefined;
}

function sourceFromExcel(value: CellValue, date1904: boolean): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return String((value.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value !== "object") return String(value);
  if ("formula" in value) return `=${value.formula}`;
  if ("richText" in value) return value.richText.map((run) => run.text).join("");
  if ("text" in value) return value.text;
  if ("error" in value) return value.error;
  void date1904;
  return "";
}

export async function importXlsx(
  input: ArrayBuffer | Uint8Array,
  name = "Imported workbook",
): Promise<WorkbookImport> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  validateXlsxArchive(bytes);
  const { default: ExcelJS } = await import("exceljs");
  const source = new ExcelJS.Workbook();
  await source.xlsx.load(bytes as unknown as Parameters<ExcelWorkbook["xlsx"]["load"]>[0]);
  if (!source.worksheets.length || source.worksheets.length > LIMITS.sheets)
    throw new Error("Import a workbook with 1–32 sheets.");
  const warnings = new Set<string>([
    "XLSX imports are independent analysis copies. Record identities, links, and approval history are kept only in native workbook snapshots.",
  ]);
  let total = 0;
  const sheets = source.worksheets.map((worksheet) => {
    const conditionals =
      (
        worksheet.model as typeof worksheet.model & {
          conditionalFormattings?: ConditionalFormattingOptions[];
        }
      ).conditionalFormattings ?? [];
    const dimensions = conditionalDimensions(conditionals);
    const rows = Math.max(20, worksheet.rowCount, dimensions.rows);
    const columns = Math.max(8, worksheet.columnCount, dimensions.columns);
    const sheet = createSheet(worksheet.name, { rows, columns });
    if (worksheet.state !== "visible") warnings.add("Hidden sheets are shown in this workbook.");
    if (worksheet.model.merges?.length)
      warnings.add(
        "Merged ranges are imported as separate cells; merge geometry is not preserved.",
      );
    if (worksheet.getImages().length) warnings.add("Embedded images and charts are not imported.");
    if (worksheet.autoFilter)
      warnings.add("Excel filter criteria are not imported. Use the workbench filters.");
    if (conditionals.length)
      importConditionalFormats(
        conditionals,
        sheet,
        (style) => styleFromExcel(style as ExcelCell),
        warnings,
      );
    for (const view of worksheet.views ?? [])
      if (view.state === "frozen") {
        sheet.frozenRows = Math.min(rows, view.ySplit ?? 0);
        sheet.frozenColumns = Math.min(columns, view.xSplit ?? 0);
      }
    worksheet.columns.forEach((column, index) => {
      if (sheet.columns[index] && column.width)
        sheet.columns[index]!.width = Math.max(48, Math.min(640, Math.round(column.width * 7 + 5)));
      if (column.hidden && sheet.columns[index]) sheet.columns[index]!.hidden = true;
    });
    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (row.hidden) sheet.rows[rowNumber - 1]!.hidden = true;
      if (row.height)
        sheet.rows[rowNumber - 1]!.height = Math.max(24, Math.min(240, (row.height * 4) / 3));
      row.eachCell({ includeEmpty: false }, (excel, columnNumber) => {
        if (++total > LIMITS.cells) throw new Error("Import at most 200,000 populated cells.");
        if (excel.isMerged && excel.master.address !== excel.address) return;
        let value = sourceFromExcel(excel.value, !!source.properties.date1904);
        if (excel.type === ExcelJS.ValueType.Formula) value = `=${excel.formula}`;
        if (value.length > LIMITS.inputLength)
          throw new Error(`Cell ${worksheet.name}!${excel.address} exceeds 10,000 characters.`);
        const style = styleFromExcel(excel);
        // Excel stores text independently from its number format. Preserve that
        // type, including "TRUE", date-shaped strings and formula-shaped rich text.
        const literal =
          typeof excel.value === "string" ||
          (typeof excel.value === "object" &&
            excel.value !== null &&
            ("richText" in excel.value || "text" in excel.value));
        const cellStyle = literal ? { ...style, format: "text" as const } : style;
        const rowId = sheet.rows[rowNumber - 1]!.id;
        const columnId = sheet.columns[columnNumber - 1]!.id;
        (sheet.cells[rowId] ??= {})[columnId] = {
          input: value,
          ...(cellStyle ? { style: cellStyle } : {}),
        };
        const target = sheet.cells[rowId]![columnId]!;
        if (excel.note) {
          target.comment =
            typeof excel.note === "string"
              ? excel.note
              : (excel.note.texts ?? []).map((part) => part.text).join("");
          if (target.comment.length > LIMITS.inputLength)
            throw new Error("Imported notes support up to 10,000 characters.");
        }
        if (excel.dataValidation?.type) {
          const formula = excel.dataValidation.formulae?.[0];
          if (
            excel.dataValidation.type === "list" &&
            typeof formula === "string" &&
            /^".*"$/.test(formula)
          ) {
            const validation: CellValidation = {
              type: "list",
              options: formula.slice(1, -1).split(","),
              allowBlank: excel.dataValidation.allowBlank ?? false,
            };
            try {
              validateCellValidation(validation);
              if (!validation.options.includes(value) && !(value === "" && validation.allowBlank))
                throw new Error("Value outside list");
              target.validation = validation;
            } catch {
              warnings.add(
                "An Excel dropdown validation rule was omitted because its list or current value is unsupported.",
              );
            }
          } else
            warnings.add("Formula-based and non-list Excel validation rules are not imported.");
        }
        if (typeof excel.value === "object" && excel.value && "hyperlink" in excel.value)
          warnings.add("Hyperlinks are imported as display text without their targets.");
        if (value.startsWith("=") && /\[|_xlfn\.|_xlws\./.test(value))
          warnings.add(
            "External or extension formulas may not calculate. Their source is preserved and engine errors are shown.",
          );
        if (
          excel.border?.diagonal ||
          ["top", "right", "bottom", "left"].some((side) =>
            (excel.border?.[side as "top"]?.style ?? "").match(/double|hair|dashDot|slant/i),
          )
        )
          warnings.add("Complex Excel borders are simplified to solid, dashed or dotted edges.");
        if (
          excel.numFmt &&
          ![
            "General",
            "@",
            "0",
            "0.00",
            "#,##0",
            "#,##0.00",
            "0%",
            "0.0%",
            "0.00%",
            "yyyy-mm-dd",
            "mm-dd-yy",
            "$#,##0.00",
          ].includes(excel.numFmt)
        )
          warnings.add("Custom Excel number formats are simplified to supported display formats.");
      });
    }
    if (sheet.rows.every((row) => row.hidden)) {
      delete sheet.rows[0]!.hidden;
      warnings.add("One row was revealed to keep the sheet accessible.");
    }
    if (sheet.columns.every((column) => column.hidden)) {
      delete sheet.columns[0]!.hidden;
      warnings.add("One column was revealed to keep the sheet accessible.");
    }
    return sheet;
  });
  if (source.definedNames.model.length)
    warnings.add(
      "Defined names are not imported. Formulas using them may show #NAME?; replace them with cell references.",
    );
  warnings.add(
    "XLSX interchange supports cells, formulas, common formatting, notes, literal dropdowns, row heights, row/column visibility, frozen panes and supported conditional formatting. Charts, pivots, macros and advanced Excel features are not preserved.",
  );
  return {
    workbook: createWorkbook(name.replace(/\.xlsx$/i, "").slice(0, 200), sheets),
    warnings: [...warnings],
  };
}

export async function exportXlsx(
  workbook: Workbook,
  results?: CalculationResult,
): Promise<Uint8Array> {
  validateWorkbook(workbook);
  if (results && results.revision !== workbook.revision)
    throw new Error("Wait for current formula results before exporting cached values.");
  const { default: ExcelJS } = await import("exceljs");
  const output = new ExcelJS.Workbook();
  output.creator = "Program Assurance";
  output.calcProperties.fullCalcOnLoad = true;
  for (const sheet of workbook.sheets) {
    const worksheet = output.addWorksheet(sheet.name);
    for (const conditional of exportConditionalFormats(sheet))
      worksheet.addConditionalFormatting(conditional);
    worksheet.views = [{ state: "frozen", xSplit: sheet.frozenColumns, ySplit: sheet.frozenRows }];
    worksheet.columns = sheet.columns.map((column) => ({
      width: ((column.width ?? 140) - 5) / 7,
      hidden: column.hidden ?? false,
    }));
    sheet.rows.forEach((row, index) => {
      const target = worksheet.getRow(index + 1);
      if (row.hidden) target.hidden = true;
      if (row.height !== undefined) target.height = (row.height * 3) / 4;
    });
    const rows = new Map(sheet.rows.map((row, index) => [row.id, index + 1]));
    const columns = new Map(sheet.columns.map((column, index) => [column.id, index + 1]));
    for (const [rowId, cells] of Object.entries(sheet.cells))
      for (const [columnId, cell] of Object.entries(cells)) {
        const target = worksheet.getCell(rows.get(rowId)!, columns.get(columnId)!);
        const calculated = results?.sheets[sheet.id]?.[rowId]?.[columnId];
        const column = sheet.columns[columns.get(columnId)! - 1]!;
        if (
          cell.input.startsWith("=") &&
          cell.style?.format !== "text" &&
          sheet.mode !== "records"
        ) {
          target.value = {
            formula: cell.input.slice(1),
            ...(calculated && calculated.type !== "error" && calculated.value !== null
              ? { result: calculated.value }
              : {}),
          };
        } else if (
          cell.style?.format !== "text" &&
          (sheet.mode === "freeform" || column.type === "number") &&
          /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(cell.input) &&
          Number.isFinite(Number(cell.input))
        )
          target.value = Number(cell.input);
        else if (
          cell.style?.format !== "text" &&
          (sheet.mode === "freeform" || column.type === "boolean") &&
          /^(true|false)$/i.test(cell.input)
        )
          target.value = cell.input.toUpperCase() === "TRUE";
        else target.value = cell.input;
        const style = cell.style;
        if (style) {
          target.font = {
            ...(style.bold ? { bold: true } : {}),
            ...(style.italic ? { italic: true } : {}),
            ...(style.underline ? { underline: true } : {}),
            ...(style.strikethrough ? { strike: true } : {}),
            ...(style.fontFamily ? { name: style.fontFamily } : {}),
            ...(style.fontSize ? { size: style.fontSize } : {}),
            ...(style.color ? { color: { argb: `FF${style.color.slice(1)}` } } : {}),
          };
          for (const side of ["top", "right", "bottom", "left"] as const) {
            const border = style[`border${side[0]!.toUpperCase()}${side.slice(1)}` as "borderTop"];
            if (border)
              target.border = {
                ...target.border,
                [side]: {
                  style:
                    border.style === "dotted"
                      ? "dotted"
                      : border.style === "dashed"
                        ? border.width > 1
                          ? "mediumDashed"
                          : "dashed"
                        : border.width === 3
                          ? "thick"
                          : border.width === 2
                            ? "medium"
                            : "thin",
                  color: { argb: `FF${border.color.slice(1)}` },
                },
              };
          }
          target.alignment = {
            ...(style.align ? { horizontal: style.align } : {}),
            ...(style.verticalAlign ? { vertical: style.verticalAlign } : {}),
            ...(style.wrap !== undefined ? { wrapText: style.wrap } : {}),
          };
          if (style.background)
            target.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: `FF${style.background.slice(1)}` },
            };
          const decimal =
            (style.decimals ?? (style.format === "percent" ? 1 : 2)) > 0
              ? `.${"0".repeat(style.decimals ?? (style.format === "percent" ? 1 : 2))}`
              : "";
          target.numFmt =
            style.format === "text"
              ? "@"
              : style.format === "date"
                ? "yyyy-mm-dd"
                : style.format === "percent"
                  ? `0${decimal}%`
                  : style.format === "currency"
                    ? `$#,##0${decimal}`
                    : style.format === "number"
                      ? `#,##0${decimal}`
                      : "General";
        }
        if (cell.comment) target.note = cell.comment;
        if (cell.validation)
          target.dataValidation = {
            type: "list",
            allowBlank: cell.validation.allowBlank !== false,
            formulae: [`"${cell.validation.options.join(",")}"`],
            showErrorMessage: true,
            errorStyle: "stop",
            error: "Choose a listed value.",
          };
        else if (
          column.type === "select" &&
          column.options?.length &&
          column.options.join(",").length <= 250 &&
          !column.options.some((value) => value.includes(",") || value.includes('"'))
        )
          target.dataValidation = {
            type: "list",
            allowBlank: !column.required,
            formulae: [`"${column.options.join(",")}"`],
            showErrorMessage: true,
            errorStyle: "stop",
            error: "Choose a listed value.",
          };
      }
  }
  return new Uint8Array(await output.xlsx.writeBuffer());
}
