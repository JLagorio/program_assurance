import { Link } from "@tanstack/react-router";
import {
  Absent,
  Id,
  Indicator,
  Inline,
  Inspector,
  Item,
  KeyValue,
  Person,
  Prose,
  Related,
  Skeleton,
  Stack,
  Text,
  TextLink,
  VisuallyHidden,
  useLedgerLocale,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import { labelFor } from "@/lib/records";
import { useRow } from "@/lib/models";
import { impactLevels, revisionStates, statusLabel, statusTone } from "@/lib/status";
import {
  baselineSource,
  type Impact,
  type ImpactDimension,
  type SystemAssuranceRow,
  type SystemImpact,
} from "@/lib/system-assurance";

export const impactDimensions = ["confidentiality", "integrity", "availability"] as const;

/** A recorded impact's tone: the level's, or warning where the assessment scopes disagree. */
function impactTone(impact: Pick<SystemImpact, "value" | "source">) {
  return impact.value
    ? statusTone(impactLevels, impact.value)
    : impact.source === "mixed"
      ? "warning"
      : "neutral";
}

/**
 * One FIPS 199 impact on a system: the level as an Indicator from the status layer (a Dot and a
 * word, never a pill), "Mixed" where the assessment scopes disagree, and Absent when nothing is
 * recorded. `dimension` names it for a screen reader where no label or column header does.
 */
export function ImpactLevel({
  value,
  mixed = false,
  dimension,
}: {
  value: Impact | null;
  mixed?: boolean | undefined;
  dimension?: ImpactDimension | undefined;
}) {
  const name = dimension ? (
    <VisuallyHidden>{`${labelFor(dimension)} impact: `}</VisuallyHidden>
  ) : null;
  if (!value && !mixed)
    return (
      <Absent label={dimension ? `${labelFor(dimension)} impact not recorded` : "Not recorded"} />
    );
  return (
    <Indicator tone={mixed ? "warning" : impactTone({ value, source: "system" })}>
      {name}
      {mixed ? "Mixed" : statusLabel(impactLevels, value)}
    </Indicator>
  );
}

/** @deprecated An impact is a level, drawn as an Indicator: use `ImpactLevel`. */
export const ImpactBadge = ImpactLevel;

export function impactDescription(row: SystemAssuranceRow, dimension: ImpactDimension) {
  const impact = row.impacts[dimension];
  return `${labelFor(dimension)}: ${impact.value ? statusLabel(impactLevels, impact.value) : impact.source === "mixed" ? "Mixed scope values" : "Not recorded"}${impact.source === "scope" ? " (assessment scope)" : impact.source === "system" ? " (system)" : ""}${impact.conflict ? "; scope values differ" : ""}`;
}

/** Where a recorded impact came from, in the reader's words. */
export function impactProvenance(row: SystemAssuranceRow, dimension: ImpactDimension) {
  const impact = row.impacts[dimension];
  if (impact.source === "system") return "Recorded on this element";
  if (impact.source === "scope") return "From an assessment scope";
  if (impact.source === "mixed") return "Assessment scopes disagree";
  return "Not recorded";
}

const byCode = (a: SystemAssuranceRow, b: SystemAssuranceRow) =>
  a.code.localeCompare(b.code, undefined, { numeric: true });

/** Direct children inside the same authorization boundary. */
export function containedElements(row: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  return rows
    .filter(
      (element) =>
        element.parent_system_id === row.id &&
        element.boundary_system_id === row.boundary_system_id &&
        element.tenant_id === row.tenant_id,
    )
    .sort(byCode);
}

/** Ancestors from the outermost down, following recorded parents and stopping on a cycle. */
export function ancestorElements(row: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const byId = new Map(rows.map((element) => [element.id, element]));
  const path: SystemAssuranceRow[] = [];
  const seen = new Set([row.id]);
  let current = row.parent_system_id ? byId.get(row.parent_system_id) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parent_system_id ? byId.get(current.parent_system_id) : undefined;
  }
  return path;
}

const impactRank: Record<Impact, number> = { low: 1, moderate: 2, high: 3 };

/** The owner in a rail value: the person, or what stands in for them while loading or missing. */
function OwnerValue({ id }: { id: string | null }) {
  const query = useRow("parties", id);
  if (!id) return <Absent label="No owner recorded" />;
  if (query.data === undefined && query.isError)
    return <Text color="color.text.subtle">Could not load</Text>;
  if (query.data === undefined)
    return (
      <>
        <Skeleton shape="line" width={96} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  if (!query.data) return <Text color="color.text.subtle">Not available</Text>;
  return <Person name={query.data.name} />;
}

/** The preview's properties; its containing header owns identity and record actions. */
export function SystemAssuranceDetails({
  row,
  rows,
  onDrill,
}: {
  row: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  onDrill?: ((id: string) => void) | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const count = (value: number, one: string, many: string) =>
    `${formatNumber(value)} ${value === 1 ? one : many}`;
  const path = ancestorElements(row, rows);
  const contained = containedElements(row, rows);
  const boundary = rows.find((element) => element.id === row.boundary_system_id);
  const parentIsBoundary = path.length === 1 && path[0]?.id === boundary?.id;
  const params = { programId: row.program_id, scopeId: row.id };
  const recorded = impactDimensions.filter(
    (dimension) => row.impacts[dimension].source !== "unrecorded",
  );
  const sameImpactSource = impactDimensions.every(
    (dimension) => row.impacts[dimension].source === row.impacts.confidentiality.source,
  );
  const provenance =
    recorded.length === 0
      ? null
      : sameImpactSource
        ? impactProvenance(row, "confidentiality")
        : recorded
            .map(
              (dimension) =>
                `${labelFor(dimension)} ${impactProvenance(row, dimension).toLocaleLowerCase()}`,
            )
            .join(" · ");
  const conflicts = impactDimensions.filter(
    (dimension) => row.impacts[dimension].conflict && row.impacts[dimension].source === "system",
  );
  const higherInside =
    contained.length > 0
      ? impactDimensions.filter((dimension) => {
          const inside = row.childImpacts[dimension];
          const own = row.impacts[dimension].value;
          return inside && impactRank[inside] > (own ? impactRank[own] : 0);
        })
      : [];
  const description = row.description?.trim();
  const hasDescription =
    description && description.toLocaleLowerCase() !== row.name.trim().toLocaleLowerCase();
  const hasBaseline = Boolean(row.effectiveBaseline?.profile_resolution_id);
  const baselineFacts = hasBaseline
    ? [
        baselineSource(row),
        row.controlCount === null ? null : count(row.controlCount, "control", "controls"),
        row.additionalChildControlCount > 0
          ? `${formatNumber(row.additionalChildControlCount)} more inside children`
          : null,
        row.unresolvedDescendantCount > 0
          ? `${count(row.unresolvedDescendantCount, "system", "systems")} inside without a baseline`
          : null,
      ].filter((fact): fact is string => Boolean(fact))
    : [];
  const subtle = (text: string) => (
    <Text as="p" size="small" color="color.text.subtle">
      {text}
    </Text>
  );
  return (
    <Stack space="space.300">
      <Inspector.Group title="Details">
        <KeyValue.Group labelWidth={124}>
          <KeyValue label="Code">
            <Id>{row.code}</Id>
          </KeyValue>
          <KeyValue label="Type">{labelFor(row.system_type)}</KeyValue>
          <KeyValue label="Owner">
            <OwnerValue id={row.system_owner_party_id} />
          </KeyValue>
          {path.length > 0 && (
            <KeyValue label={parentIsBoundary ? "Parent / boundary" : "Part of"} wrap>
              <Inline space="space.050" shouldWrap>
                {path.map((element, index) => (
                  <Inline key={element.id} space="space.050">
                    {index > 0 && <span aria-hidden>/</span>}
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId/systems/$scopeId"
                          params={{ programId: element.program_id, scopeId: element.id }}
                        />
                      }
                    >
                      {element.name}
                    </TextLink>
                  </Inline>
                ))}
              </Inline>
            </KeyValue>
          )}
          {!parentIsBoundary && (
            <KeyValue label="Boundary">
              {row.is_authorization_boundary ? (
                "This system"
              ) : boundary ? (
                <TextLink
                  render={
                    <Link
                      to="/programs/$programId/systems/$scopeId"
                      params={{ programId: boundary.program_id, scopeId: boundary.id }}
                    />
                  }
                >
                  {boundary.name}
                </TextLink>
              ) : (
                <Absent label="No boundary recorded" />
              )}
            </KeyValue>
          )}
          <KeyValue label="Impact" wrap>
            <Stack space="space.050">
              <Inline space="space.200" alignBlock="center" shouldWrap>
                {impactDimensions.map((dimension) => {
                  const impact = row.impacts[dimension];
                  return (
                    <Indicator key={dimension} tone={impactTone(impact)}>
                      {labelFor(dimension)}{" "}
                      {impact.value
                        ? statusLabel(impactLevels, impact.value)
                        : impact.source === "mixed"
                          ? "mixed"
                          : "not recorded"}
                    </Indicator>
                  );
                })}
              </Inline>
              {provenance && subtle(provenance)}
              {conflicts.length > 0 &&
                subtle(
                  `Scope values differ: ${conflicts
                    .map(
                      (dimension) =>
                        `${labelFor(dimension)} ${row.impacts[dimension].scopeValues
                          .map((value) => statusLabel(impactLevels, value))
                          .join(", ")}`,
                    )
                    .join(" · ")}`,
                )}
              {higherInside.length > 0 &&
                subtle(
                  `Highest inside: ${higherInside
                    .map(
                      (dimension) =>
                        `${labelFor(dimension)} ${statusLabel(impactLevels, row.childImpacts[dimension])}`,
                    )
                    .join(" · ")}`,
                )}
            </Stack>
          </KeyValue>
          <KeyValue label="Baseline" wrap>
            <Stack space="space.050">
              <Inline space="space.075" alignBlock="center" shouldWrap>
                {hasBaseline ? (
                  <TextLink
                    render={
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={params}
                        search={{ tab: "Controls" }}
                      />
                    }
                  >
                    {row.baselineTitle ?? "Baseline"}
                  </TextLink>
                ) : (
                  <Absent label="No baseline" />
                )}
                {row.baselineDraft && (
                  <StatusBadge statuses={revisionStates} value="draft" size="xsmall" />
                )}
              </Inline>
              {baselineFacts.length > 0 && subtle(baselineFacts.join(" · "))}
            </Stack>
          </KeyValue>
          <KeyValue label="Requirements" wrap>
            {formatNumber(row.requirementCount)} allocated
            {row.subtreeRequirementCount !== row.requirementCount
              ? ` · ${formatNumber(row.subtreeRequirementCount)} including children`
              : ""}
          </KeyValue>
        </KeyValue.Group>
      </Inspector.Group>
      {/* Authored text is a labelled property, not a heading of the preview's outline. */}
      {hasDescription && <Prose label="Description">{description}</Prose>}
      {row.categorization_rationale && (
        <Prose label="Categorization rationale">{row.categorization_rationale}</Prose>
      )}
      {contained.length > 0 && (
        <Related title="Contains" count={contained.length} layout="list" size="compact">
          {contained.map((child) => (
            <Item
              key={child.id}
              id={<Id>{child.code}</Id>}
              idWidth={104}
              title={child.name}
              meta={labelFor(child.system_type)}
              trailing={
                child.controlCount === null
                  ? undefined
                  : count(child.controlCount, "control", "controls")
              }
              {...(onDrill
                ? { onSelect: () => onDrill(child.id) }
                : {
                    link: (
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={{ programId: child.program_id, scopeId: child.id }}
                      />
                    ),
                  })}
            />
          ))}
        </Related>
      )}
    </Stack>
  );
}
