import { Link } from "@tanstack/react-router";
import {
  Absent,
  Badge,
  Button,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Stack,
  TextLink,
} from "@ledger/design-system";
import { labelFor } from "@/lib/records";
import {
  baselineSource,
  type Impact,
  type ImpactDimension,
  type SystemAssuranceRow,
} from "@/lib/system-assurance";
import { RelationName } from "./record-tools";

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
  const sameImpactSource = impactDimensions.every(
    (dimension) => row.impacts[dimension].source === row.impacts.confidentiality.source,
  );
  const description = row.description?.trim();
  const hasDescription =
    description && description.toLocaleLowerCase() !== row.name.trim().toLocaleLowerCase();
  return (
    <Stack space="space.200">
      <Inspector.Group title="Details">
        <KeyValue labelWidth={124} label="Code">
          <Id>{row.code}</Id>
        </KeyValue>
        <KeyValue labelWidth={124} label="Type">
          {labelFor(row.system_type)}
        </KeyValue>
        <KeyValue labelWidth={124} label="Owner">
          {row.system_owner_party_id ? (
            <RelationName table="parties" id={row.system_owner_party_id} />
          ) : (
            <Absent />
          )}
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
        {impactDimensions.map((dimension) => {
          const impact = row.impacts[dimension];
          return (
            <KeyValue labelWidth={124} key={dimension} label={labelFor(dimension)} wrap>
              <Inline space="space.075" alignBlock="center" shouldWrap>
                <ImpactBadge value={impact.value} mixed={impact.source === "mixed"} />
                {!sameImpactSource && impact.source !== "unrecorded" && (
                  <span className="font-body-small text-subtle">
                    {impactProvenance(row, dimension)}
                  </span>
                )}
                {impact.conflict && impact.source === "system" && (
                  <span className="font-body-small text-subtle">
                    Scope: {impact.scopeValues.map(labelFor).join(", ")}
                  </span>
                )}
              </Inline>
            </KeyValue>
          );
        })}
        {sameImpactSource && row.impacts.confidentiality.source !== "unrecorded" && (
          <KeyValue labelWidth={124} label="Impact source">
            {impactProvenance(row, "confidentiality")}
          </KeyValue>
        )}
        {contained.length > 0 &&
          impactDimensions.some((dimension) => row.childImpacts[dimension]) && (
            <KeyValue labelWidth={124} label="Highest inside" wrap>
              {impactDimensions
                .filter((dimension) => row.childImpacts[dimension])
                .map(
                  (dimension) =>
                    `${labelFor(dimension)}: ${labelFor(row.childImpacts[dimension]!)}`,
                )
                .join(" · ")}
            </KeyValue>
          )}
        {hasDescription && (
          <KeyValue labelWidth={124} label="Description" wrap>
            {description}
          </KeyValue>
        )}
        {row.categorization_rationale && (
          <KeyValue labelWidth={124} label="Rationale" wrap>
            {row.categorization_rationale}
          </KeyValue>
        )}
        <KeyValue labelWidth={124} label="Baseline" wrap>
          <Inline space="space.100" alignBlock="center" shouldWrap>
            {row.effectiveBaseline?.profile_resolution_id ? (
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
            {row.baselineDraft && (
              <Badge tone="warning" variant="secondary" size="xsmall">
                Draft
              </Badge>
            )}
          </Inline>
        </KeyValue>
        {row.effectiveBaseline?.profile_resolution_id && (
          <KeyValue labelWidth={124} label="Baseline source">
            {baselineSource(row)}
          </KeyValue>
        )}
        <KeyValue labelWidth={124} label="Controls">
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={params}
                search={{ tab: "Controls" }}
              />
            }
          >
            {row.controlCount === null ? "View controls" : `${row.controlCount} controls`}
          </TextLink>
        </KeyValue>
        {row.additionalChildControlCount > 0 && (
          <KeyValue labelWidth={124} label="Additional inside">
            {row.additionalChildControlCount} controls
          </KeyValue>
        )}
        {row.unresolvedDescendantCount > 0 && (
          <KeyValue labelWidth={124} label="Missing baseline">
            {row.unresolvedDescendantCount} systems inside
          </KeyValue>
        )}
        <KeyValue labelWidth={124} label="Requirements">
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={params}
                search={{ tab: "Requirements" }}
              />
            }
          >
            {row.requirementCount} allocated
          </TextLink>
        </KeyValue>
        {row.subtreeRequirementCount !== row.requirementCount && (
          <KeyValue labelWidth={124} label="Including children">
            {row.subtreeRequirementCount} requirements
          </KeyValue>
        )}
      </Inspector.Group>
      {contained.length > 0 && (
        <Section title="Contains" count={contained.length}>
          <Stack space="space.050">
            {contained.map((child) =>
              onDrill ? (
                <Button
                  key={child.id}
                  variant="subtle"
                  size="small"
                  className="justify-start"
                  onClick={() => onDrill(child.id)}
                >
                  {child.name}
                </Button>
              ) : (
                <TextLink
                  key={child.id}
                  render={
                    <Link
                      to="/programs/$programId/systems/$scopeId"
                      params={{ programId: child.program_id, scopeId: child.id }}
                    />
                  }
                >
                  {child.name}
                </TextLink>
              ),
            )}
          </Stack>
        </Section>
      )}
    </Stack>
  );
}
