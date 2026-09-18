import { Link } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Id,
  Indicator,
  Inline,
  Inspector,
  Item,
  KeyValue,
  Person,
  Related,
  Section,
  Stack,
  TextLink,
  type Tone,
} from "@ledger/design-system";
import { labelFor } from "@/lib/records";
import { useRow } from "@/lib/models";
import { QueryState } from "./work-common";
import {
  baselineSource,
  type Impact,
  type ImpactDimension,
  type SystemAssuranceRow,
  type SystemImpact,
} from "@/lib/system-assurance";

export const impactDimensions = ["confidentiality", "integrity", "availability"] as const;

export function ImpactBadge({ value, mixed = false }: { value: Impact | null; mixed?: boolean }) {
  if (!value && !mixed)
    return (
      <span className="text-subtle" aria-label="Not recorded">
        —
      </span>
    );
  return (
    <Badge
      size="xsmall"
      variant="secondary"
      tone={
        value === "high"
          ? "danger"
          : value === "moderate"
            ? "warning"
            : value === "low"
              ? "success"
              : "neutral"
      }
    >
      {mixed ? "Mixed" : labelFor(value!)}
    </Badge>
  );
}

export function impactDescription(row: SystemAssuranceRow, dimension: ImpactDimension) {
  const impact = row.impacts[dimension];
  return `${labelFor(dimension)}: ${impact.value ? labelFor(impact.value) : impact.source === "mixed" ? "Mixed scope values" : "Not recorded"}${impact.source === "scope" ? " (assessment scope)" : impact.source === "system" ? " (system)" : ""}${impact.conflict ? "; scope values differ" : ""}`;
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

/** The level's tone: the same scale everywhere a level is shown, never a pill. */
function impactTone(value: Impact | null, source?: SystemImpact["source"]): Tone {
  if (value === "high") return "danger";
  if (value === "moderate") return "warning";
  if (value === "low") return "success";
  return source === "mixed" ? "warning" : "neutral";
}

function OwnerValue({ id }: { id: string | null }) {
  const query = useRow("parties", id);
  if (!id) return <Absent />;
  const name = query.data?.name;
  return <QueryState queries={[query]}>{name ? <Person name={name} /> : <Absent />}</QueryState>;
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
        row.controlCount === null ? null : `${row.controlCount} controls`,
        row.additionalChildControlCount > 0
          ? `${row.additionalChildControlCount} more inside children`
          : null,
        row.unresolvedDescendantCount > 0
          ? `${row.unresolvedDescendantCount} systems inside without a baseline`
          : null,
      ].filter((fact): fact is string => Boolean(fact))
    : [];
  return (
    <Stack space="space.300">
      <Inspector.Group title="Details">
        <KeyValue labelWidth={124} label="Code">
          <Id>{row.code}</Id>
        </KeyValue>
        <KeyValue labelWidth={124} label="Type">
          {labelFor(row.system_type)}
        </KeyValue>
        <KeyValue labelWidth={124} label="Owner">
          <OwnerValue id={row.system_owner_party_id} />
        </KeyValue>
        {path.length > 0 && (
          <KeyValue
            labelWidth={124}
            label={parentIsBoundary ? "Parent / boundary" : "Part of"}
            wrap
          >
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
          <KeyValue labelWidth={124} label="Boundary">
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
              <Absent />
            )}
          </KeyValue>
        )}
        <KeyValue labelWidth={124} label="Impact" wrap>
          <Stack space="space.050">
            <Inline space="space.200" alignBlock="center" shouldWrap>
              {impactDimensions.map((dimension) => {
                const impact = row.impacts[dimension];
                return (
                  <Indicator
                    key={dimension}
                    tone={impactTone(impact.value, impact.source)}
                    aria-label={impactDescription(row, dimension)}
                  >
                    {labelFor(dimension)}{" "}
                    {impact.value
                      ? labelFor(impact.value)
                      : impact.source === "mixed"
                        ? "mixed"
                        : "not recorded"}
                  </Indicator>
                );
              })}
            </Inline>
            {provenance && <span className="font-body-small text-subtle">{provenance}</span>}
            {conflicts.length > 0 && (
              <span className="font-body-small text-subtle">
                Scope values differ:{" "}
                {conflicts
                  .map(
                    (dimension) =>
                      `${labelFor(dimension)} ${row.impacts[dimension].scopeValues.map(labelFor).join(", ")}`,
                  )
                  .join(" · ")}
              </span>
            )}
            {higherInside.length > 0 && (
              <span className="font-body-small text-subtle">
                Highest inside:{" "}
                {higherInside
                  .map(
                    (dimension) =>
                      `${labelFor(dimension)} ${labelFor(row.childImpacts[dimension]!)}`,
                  )
                  .join(" · ")}
              </span>
            )}
          </Stack>
        </KeyValue>
        <KeyValue labelWidth={124} label="Baseline" wrap>
          <Stack space="space.050">
            <Inline space="space.075" alignBlock="baseline" shouldWrap>
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
                <Absent />
              )}
              {row.baselineDraft && <span className="font-body-small text-subtle">Draft</span>}
            </Inline>
            {baselineFacts.length > 0 && (
              <span className="font-body-small text-subtle">{baselineFacts.join(" · ")}</span>
            )}
          </Stack>
        </KeyValue>
        <KeyValue labelWidth={124} label="Requirements" wrap>
          {row.requirementCount} allocated
          {row.subtreeRequirementCount !== row.requirementCount
            ? ` · ${row.subtreeRequirementCount} including children`
            : ""}
        </KeyValue>
      </Inspector.Group>
      {hasDescription && (
        <Section title="Description">
          <p className="whitespace-pre-wrap text-default">{description}</p>
        </Section>
      )}
      {row.categorization_rationale && (
        <Section title="Categorization rationale">
          <p className="whitespace-pre-wrap text-default">{row.categorization_rationale}</p>
        </Section>
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
              trailing={child.controlCount === null ? undefined : `${child.controlCount} controls`}
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
