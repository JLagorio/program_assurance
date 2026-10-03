import type { TableName } from "./models";
import { productRecordNoun } from "./product-records";
import { displayValue, type DataRecord, type RecordValue } from "./records";

/**
 * A record's name as the words of its link in a register: the stored name, or "Unnamed risk" when
 * it has none, so the link always says which record it opens and never reads "Not recorded".
 */
export function linkedName(
  table: TableName,
  record: DataRecord,
  value: RecordValue | undefined,
): string {
  return value === null || value === undefined || (typeof value === "string" && !value.trim())
    ? `Unnamed ${productRecordNoun(table, record)}`
    : displayValue(value);
}
