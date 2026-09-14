import { z } from "zod";

export type RecordValue = string | number | boolean | null | Record<string, unknown> | unknown[];
export type DataRecord = Record<string, RecordValue> & { id: string; revision?: number };
export const columnSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  default: z.string().nullable(),
  description: z.string().nullable(),
  choices: z.array(z.string()),
});
export const relationSchema = z.object({
  columns: z.array(z.string()),
  target_table: z.string(),
  target_columns: z.array(z.string()),
  target_schema: z.string(),
});
export const collectionSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  columns: z.array(columnSchema),
  relations: z.array(relationSchema),
  can_insert: z.boolean(),
  can_update: z.boolean(),
  can_delete: z.boolean(),
});
export type Column = z.infer<typeof columnSchema>;
export type Collection = z.infer<typeof collectionSchema>;

export const systemColumns = new Set([
  "id",
  "tenant_id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "revision",
  "user_id",
  "auth_user_id",
  "owner_user_id",
]);
export function labelFor(value: string) {
  const labels: Record<string, string> = {
    ssp: "SSP",
    poam: "POA&M",
    cci: "CCI",
    oscal: "OSCAL",
    uuid: "UUID",
    uri: "URI",
    url: "URL",
    id: "ID",
  };
  return value
    .split("_")
    .map(
      (word, index) =>
        labels[word] ?? (index === 0 ? word[0]?.toUpperCase() + word.slice(1) : word),
    )
    .join(" ");
}
export function titleColumn(collection: Collection): string {
  return (
    [
      "name",
      "title",
      "display_name",
      "code",
      "source_id",
      "email",
      "label",
      "description",
      "id",
    ].find((name) => collection.columns.some((column) => column.name === name)) ?? "id"
  );
}
export function recordTitle(record: DataRecord, collection: Collection): string {
  const value = record[titleColumn(collection)];
  return typeof value === "string" && value.trim() ? value : record.id;
}
export function displayValue(value: RecordValue | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
export function defaultValue(column: Column): string {
  if (column.type.endsWith("[]")) return column.default?.startsWith("'{}'") ? "[]" : "";
  const match = column.default?.match(/^'((?:[^']|'')*)'(?:::|$)/);
  if (match) return match[1]!.replaceAll("''", "'");
  return column.default && /^(?:true|false|\d+(?:\.\d+)?)$/.test(column.default)
    ? column.default
    : "";
}

/** Empty optional values remain NULL; missing values with defaults are left to Postgres. */
export function recordPayload(
  collection: Collection,
  fields: Record<string, string>,
  existing?: DataRecord,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const column of collection.columns) {
    if (systemColumns.has(column.name) || !(column.name in fields)) continue;
    const raw = fields[column.name] ?? "";
    if (!raw.trim()) {
      if (column.required && (existing || !column.default))
        throw new Error(`${labelFor(column.name)} is required.`);
      if (existing || !column.default) output[column.name] = null;
      continue;
    }
    if (column.choices.length && !column.choices.includes(raw))
      throw new Error(`Choose a valid ${labelFor(column.name).toLowerCase()}.`);
    if (column.type === "boolean") {
      if (raw !== "true" && raw !== "false")
        throw new Error(`Choose Yes or No for ${labelFor(column.name).toLowerCase()}.`);
      output[column.name] = raw === "true";
    } else if (/^(numeric|decimal)/.test(column.type)) {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()))
        throw new Error(`${labelFor(column.name)} must be a valid decimal.`);
      output[column.name] = raw.trim();
    } else if (/^(smallint|integer|bigint|real|double precision)/.test(column.type)) {
      const value = Number(raw);
      if (!Number.isFinite(value) || (/int/.test(column.type) && !Number.isSafeInteger(value)))
        throw new Error(`${labelFor(column.name)} must be a valid number.`);
      output[column.name] = value;
    } else if (column.type === "jsonb" || column.type === "json" || column.type.endsWith("[]")) {
      try {
        const value: unknown = JSON.parse(raw);
        if (column.type.endsWith("[]") && !Array.isArray(value))
          throw new Error("Expected an array");
        output[column.name] = value;
      } catch {
        throw new Error(`${labelFor(column.name)} must contain valid structured data.`);
      }
    } else if (column.type === "uuid") {
      output[column.name] = z
        .string()
        .uuid(`${labelFor(column.name)} must reference a record.`)
        .parse(raw);
    } else if (column.type === "date") {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
        !Number.isFinite(Date.parse(raw)) ||
        new Date(raw).toISOString().slice(0, 10) !== raw
      )
        throw new Error(`${labelFor(column.name)} must be a valid date.`);
      output[column.name] = raw;
    } else if (column.type.startsWith("timestamp")) {
      if (!Number.isFinite(Date.parse(raw)))
        throw new Error(`${labelFor(column.name)} must be a valid date and time.`);
      output[column.name] = new Date(raw).toISOString();
    } else output[column.name] = raw;
  }
  return output;
}

export const domains = [
  {
    label: "Programs",
    tables: [
      "programs",
      "systems",
      "scopes",
      "composition_nodes",
      "system_components",
      "inventory_items",
      "configuration_baselines",
      "parties",
    ],
  },
  {
    label: "Implementation",
    tables: [
      "engineering_requirements",
      "requirement_revisions",
      "requirement_allocations",
      "ssp_revisions",
      "implemented_requirements",
      "implementation_statements",
      "component_contributions",
      "inheritance_acceptances",
    ],
  },
  {
    label: "Assessment",
    tables: [
      "assessment_campaigns",
      "assessment_plan_revisions",
      "assessment_events",
      "assessment_objectives",
      "procedure_revisions",
      "test_runs",
      "observations",
      "assessment_findings",
      "evidence_artifacts",
    ],
  },
  {
    label: "Remediation",
    tables: [
      "operational_issues",
      "risks",
      "risk_revisions",
      "poam_documents",
      "poam_items",
      "poam_milestones",
    ],
  },
  {
    label: "Workflow",
    tables: [
      "tasks",
      "workstreams",
      "lifecycle_gates",
      "review_decisions",
      "change_requests",
      "authorization_packages",
      "authorization_decisions",
    ],
  },
  {
    label: "Reference library",
    tables: [
      "catalogs",
      "catalog_revisions",
      "controls",
      "control_parts",
      "profiles",
      "profile_revisions",
      "profile_resolutions",
      "component_definitions",
      "mapping_collections",
      "cci_items",
    ],
  },
] as const;

/** Preserve the actual instant when displaying a timestamp in a local date/time input. */
export function timestampInput(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 23);
}
