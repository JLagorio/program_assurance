import { useMemo, useState } from "react";
import {
  Chart,
  Field,
  FieldLabel,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@ledger/design-system";
import type { CalculationResult, Sheet } from "@ledger/spreadsheet-core";

/** A pivot over the visible record set, using the same calculated values as the grid. */
export function WorkbookAnalysis({
  sheet,
  rowIds,
  results,
}: {
  sheet: Sheet;
  rowIds: string[];
  results?: CalculationResult | undefined;
}) {
  const [group, setGroup] = useState(sheet.columns[0]?.id ?? "");
  const [measure, setMeasure] = useState("count");
  const groupLabel = sheet.columns.find((column) => column.id === group)?.name ?? "Column";
  const measureLabel =
    measure === "count"
      ? "Count rows"
      : `Sum ${sheet.columns.find((column) => column.id === measure)?.name ?? "column"}`;
  const data = useMemo(() => {
    const groups = new Map<string, number>();
    for (const rowId of rowIds) {
      if (rowId === "headers") continue;
      const label =
        results?.sheets[sheet.id]?.[rowId]?.[group]?.display ??
        sheet.cells[rowId]?.[group]?.input ??
        "";
      if (!label) continue;
      const raw =
        results?.sheets[sheet.id]?.[rowId]?.[measure]?.value ??
        sheet.cells[rowId]?.[measure]?.input;
      const amount =
        measure === "count"
          ? 1
          : raw !== "" && raw !== null && raw !== undefined && Number.isFinite(Number(raw))
            ? Number(raw)
            : 0;
      groups.set(label, (groups.get(label) ?? 0) + amount);
    }
    return Array.from(groups, ([category, amount]) => ({ category, amount })).sort(
      (a, b) => b.amount - a.amount || a.category.localeCompare(b.category),
    );
  }, [sheet, rowIds, results, group, measure]);
  return (
    <Stack space="space.200">
      <Inline space="space.200" shouldWrap>
        <Field>
          <FieldLabel>Group by</FieldLabel>
          <Select value={group} onValueChange={(value) => value && setGroup(value)}>
            <SelectTrigger>
              <SelectValue>{groupLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sheet.columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Measure</FieldLabel>
          <Select value={measure} onValueChange={(value) => value && setMeasure(value)}>
            <SelectTrigger>
              <SelectValue>{measureLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Count rows</SelectItem>
              {sheet.columns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  Sum {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Inline>
      <Text size="small" color="color.text.subtle">
        Uses every row matching this sheet’s filter. Blank categories are omitted; sums include
        numeric values. Mapping counts describe traceability links.
      </Text>
      <Chart.Frame
        title={`${sheet.name} · ${measure === "count" ? "Count" : "Sum"} by ${groupLabel}`}
        data={data}
        x="category"
        xLabel={groupLabel}
        series={[{ key: "amount", label: measure === "count" ? "Rows" : "Total" }]}
      >
        <Chart.Bar horizontal labels="end" />
      </Chart.Frame>
    </Stack>
  );
}
