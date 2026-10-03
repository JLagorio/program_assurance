import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Constants } from "./database.types";
import {
  compareStatus,
  fieldVocabularies,
  impactLevels,
  neutralVocabulary,
  programStatuses,
  recordLifecycleStates,
  revisionStates,
  riskStatuses,
  severityLevels,
  statusEntry,
  statusLabel,
  statusTone,
  taskStatuses,
  vocabularyFor,
  vocabularyKind,
  type StatusVocabulary,
} from "./status";

const migrations = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
const STATUS_LIKE = /(status|state|severity|impact|priority|determination|decision|likelihood)$/;
const TONES = new Set(["neutral", "information", "success", "warning", "danger"]);

/** Each status-like column's allowed values, as the last migration that constrains it leaves them. */
function constrainedFields() {
  const fields = new Map<string, string[]>();
  for (const file of readdirSync(migrations)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(`${migrations}/${file}`, "utf8").replace(/--[^\n]*/g, "");
    const tables = [
      ...sql.matchAll(
        /(?:create table (?:if not exists )?|alter table (?:only )?(?:if exists )?)(?:public\.)?([a-z_0-9]+)/gi,
      ),
    ].map((match) => [match.index, match[1]!] as const);
    for (const match of sql.matchAll(
      /check\s*\(\s*(?:[a-z_]+ is null or\s+)?\(?\s*([a-z_]+)\s+in\s*\(([^)]*)\)/gi,
    )) {
      const column = match[1]!;
      if (!STATUS_LIKE.test(column)) continue;
      const table = tables.filter(([index]) => index < match.index).at(-1)?.[1];
      if (!table) continue;
      fields.set(
        `${table}.${column}`,
        [...match[2]!.matchAll(/'([^']*)'/g)].map((value) => value[1]!),
      );
    }
  }
  return fields;
}

/** Columns typed by a Postgres enum, whose values database.types.ts carries. */
const enumFields: Record<string, keyof typeof Constants.public.Enums> = {
  "catalog_revisions.state": "reference_revision_state",
  "cci_revisions.state": "reference_revision_state",
  "mapping_collections.state": "reference_revision_state",
  "oscal_document_revisions.state": "reference_revision_state",
  "profile_resolutions.state": "reference_revision_state",
  "profile_revisions.state": "reference_revision_state",
  "cci_items.status": "cci_status",
  "controls.status": "control_publication_status",
  "cci_references.resolution_status": "reference_resolution_status",
  "oscal_document_imports.resolution_status": "reference_resolution_status",
};

const registered = Object.entries(fieldVocabularies).flatMap(([table, fields]) =>
  Object.entries(fields).map(([field, values]) => [`${table}.${field}`, values] as const),
);

describe("status vocabulary", () => {
  it("maps every value of every constrained status, state, decision and level", () => {
    const constrained = constrainedFields();
    expect(constrained.size).toBeGreaterThan(40);
    const allowedByVocabulary = new Map<StatusVocabulary, Set<string>>();
    const allowed = [
      ...constrained,
      ...Object.entries(enumFields).map(
        ([field, name]) => [field, [...Constants.public.Enums[name]]] as const,
      ),
    ];
    for (const [field, values] of allowed) {
      const [table, column] = field.split(".") as [string, string];
      const found = vocabularyFor(table, column);
      expect(found, `${field} has no vocabulary in src/lib/status.ts`).toBeDefined();
      for (const value of values)
        expect(statusEntry(found!.values, value), `${field} = ${value}`).toBeDefined();
      const seen = allowedByVocabulary.get(found!.values) ?? new Set<string>();
      for (const value of values) seen.add(value);
      allowedByVocabulary.set(found!.values, seen);
    }
    // No entry the schema cannot store: each vocabulary is exactly the values its fields allow.
    for (const [values, seen] of allowedByVocabulary)
      expect(Object.keys(values).sort()).toEqual([...seen].sort());
  });

  it("registers no field the schema does not constrain", () => {
    const known = new Set([...constrainedFields().keys(), ...Object.keys(enumFields)]);
    for (const [field] of registered) expect(known.has(field), field).toBe(true);
  });

  it("gives every value one label, a tone and a distinct rank", () => {
    const vocabularies = new Set<StatusVocabulary>(registered.map(([, values]) => values));
    for (const values of vocabularies) {
      const entries = Object.values(values);
      expect(new Set(entries.map((entry) => entry.rank)).size).toBe(entries.length);
      expect(new Set(entries.map((entry) => entry.label)).size).toBe(entries.length);
      for (const entry of entries) {
        expect(TONES.has(entry.tone)).toBe(true);
        // Sentence case: the first letter capital, the rest as the product writes them.
        expect(entry.label).toMatch(/^[A-Z][a-z]/);
      }
    }
  });

  it("tells a level from a status", () => {
    expect(vocabularyKind(severityLevels)).toBe("level");
    expect(vocabularyKind(impactLevels)).toBe("level");
    expect(vocabularyKind(taskStatuses)).toBe("status");
    expect(vocabularyFor("systems", "confidentiality_impact")?.kind).toBe("level");
    expect(vocabularyFor("tasks", "status")?.kind).toBe("status");
    expect(vocabularyFor("tasks", "title")).toBeUndefined();
    expect(vocabularyFor("constructor", "status")).toBeUndefined();
  });

  it("reads one value the same way wherever it appears", () => {
    expect(statusEntry(taskStatuses, "blocked")).toEqual({
      label: "Blocked",
      tone: "danger",
      rank: 3,
    });
    expect(statusLabel(taskStatuses, "in_progress")).toBe("In progress");
    expect(statusLabel(taskStatuses, "someday_maybe")).toBe("Someday maybe");
    expect(statusLabel(taskStatuses, null)).toBe("");
    expect(statusTone(taskStatuses, "someday_maybe")).toBe("neutral");
    expect(statusTone(revisionStates, "published")).toBe("success");
    expect(statusEntry(taskStatuses, "toString")).toBeUndefined();
  });

  it("keeps the tone decisions: one map decides", () => {
    // Active is success for a program as for a product or a configuration.
    expect(statusTone(programStatuses, "active")).toBe("success");
    expect(statusTone(programStatuses, "active")).toBe(statusTone(recordLifecycleStates, "active"));
    // A risk's Accepted records a decision to live with it: neutral, not success.
    expect(statusTone(riskStatuses, "accepted")).toBe("neutral");
    // Every Low (and Very low) on an Indicator is neutral.
    const levels = new Set(
      registered.map(([, values]) => values).filter((values) => vocabularyKind(values) === "level"),
    );
    expect(levels.size).toBeGreaterThan(3);
    for (const values of levels)
      for (const low of ["low", "very_low"])
        if (statusEntry(values, low)) expect(statusTone(values, low), low).toBe("neutral");
  });

  it("sorts by rank with unknown values last", () => {
    expect(["done", "unknown", "open", "blocked"].sort(compareStatus(taskStatuses))).toEqual([
      "open",
      "blocked",
      "done",
      "unknown",
    ]);
    expect(["high", "low", "critical", "moderate"].sort(compareStatus(severityLevels))).toEqual([
      "low",
      "moderate",
      "high",
      "critical",
    ]);
  });

  it("words an unmapped field neutrally, in first-seen order", () => {
    const values = neutralVocabulary(["under_review", null, "", "open", "under_review"]);
    expect(values).toEqual({
      under_review: { label: "Under review", tone: "neutral", rank: 0 },
      open: { label: "Open", tone: "neutral", rank: 1 },
    });
  });
});
