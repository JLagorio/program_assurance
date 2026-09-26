import { Absent, Badge, Indicator, VisuallyHidden } from "@ledger/design-system";
import {
  neutralVocabulary,
  statusEntry,
  statusLabel,
  vocabularyFor,
  vocabularyKind,
  type StatusVocabulary,
} from "@/lib/status";

/**
 * The product's status components: one visual representation per concept, bound to the one map in
 * `@/lib/status`. A record's status, state or decision is a StatusBadge; a severity, impact,
 * likelihood or priority is a LevelIndicator (a Dot and a word, never a pill). In a DataTable pass
 * the same map to the column, `c.status("status", { statuses: taskStatuses })`, which draws the
 * same badge, sorts by rank and filters by label: a vocabulary is a kit `StatusMap` as it stands.
 */

const isNothing = (value: unknown) => value === null || value === undefined || value === "";

export type StatusBadgeProps = {
  /** The concept's map from `@/lib/status`: taskStatuses, revisionStates, determinations… */
  statuses: StatusVocabulary;
  /** The stored value. Nothing shows Absent; a value the map lacks reads in words, neutral. */
  value: string | null | undefined;
  /** `small` (the default) beside a title, in a rail or a header; `xsmall` in a dense list. */
  size?: "small" | "xsmall" | undefined;
  /** What a screen reader hears where there is no value. */
  absentLabel?: string | undefined;
};

/** A record's status, state or decision: the map's label in the map's tone. */
export function StatusBadge({
  statuses,
  value,
  size,
  absentLabel = "Not recorded",
}: StatusBadgeProps) {
  if (isNothing(value)) return <Absent label={absentLabel} />;
  const entry = statusEntry(statuses, value);
  return (
    <Badge variant="secondary" tone={entry?.tone ?? "neutral"} {...(size ? { size } : {})}>
      {statusLabel(statuses, value)}
    </Badge>
  );
}

export type LevelIndicatorProps = {
  /** The level's map from `@/lib/status`: severityLevels, impactLevels, riskLevels, taskPriorities. */
  levels: StatusVocabulary;
  value: string | null | undefined;
  absentLabel?: string | undefined;
  /** What the level measures, heard before it and not drawn, where no header or label says it:
   * "Confidentiality impact". */
  name?: string | undefined;
  /** The sources disagree (assessment scopes that set different impacts): a warning "Mixed". */
  mixed?: boolean | undefined;
};

/** A severity, impact, likelihood or priority: a Dot in the level's tone and its word. */
export function LevelIndicator({
  levels,
  value,
  absentLabel,
  name,
  mixed = false,
}: LevelIndicatorProps) {
  if (isNothing(value) && !mixed)
    return <Absent label={absentLabel ?? (name ? `${name} not recorded` : "Not recorded")} />;
  return (
    <Indicator tone={mixed ? "warning" : (statusEntry(levels, value)?.tone ?? "neutral")}>
      {name && <VisuallyHidden>{`${name}: `}</VisuallyHidden>}
      {mixed ? "Mixed" : statusLabel(levels, value)}
    </Indicator>
  );
}

/** A value in its vocabulary's shape: a LevelIndicator for a level, a StatusBadge otherwise. */
export function VocabularyValue({
  values,
  value,
  size,
  absentLabel,
}: {
  values: StatusVocabulary;
  value: string | null | undefined;
  size?: "small" | "xsmall" | undefined;
  absentLabel?: string | undefined;
}) {
  return vocabularyKind(values) === "level" ? (
    <LevelIndicator levels={values} value={value} absentLabel={absentLabel} />
  ) : (
    <StatusBadge statuses={values} value={value} size={size} absentLabel={absentLabel} />
  );
}

/**
 * A stored field's value by table and column, for adapters that render any model (the record
 * browser, ModelFacts, ModelTable): the field's vocabulary decides badge or indicator, and a
 * status-like field the product has not mapped reads in words, neutral.
 */
export function FieldStatus({
  table,
  field,
  value,
  size,
  absentLabel,
}: {
  table: string;
  field: string;
  value: unknown;
  size?: "small" | "xsmall" | undefined;
  absentLabel?: string | undefined;
}) {
  const text = isNothing(value) ? null : String(value);
  const values = vocabularyFor(table, field)?.values ?? neutralVocabulary([text]);
  return <VocabularyValue values={values} value={text} size={size} absentLabel={absentLabel} />;
}
