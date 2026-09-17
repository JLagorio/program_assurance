import { Link } from "@tanstack/react-router";
import { Badge, Inline, KeyValue, Section, Stack, TextLink } from "@ledger/design-system";
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

/**
 * The element's first screen: the record's sections in the record's order, one line each.
 * No tabs of its own; the record has those. `onDrill` swaps the surface to a child in place.
 */
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
  const params = { programId: row.program_id, scopeId: row.id };
  return (
    <Stack space="space.250">
      <Stack space="space.050">
        <h2 className="font-heading-small">{row.name}</h2>
        {path.length > 0 && (
          <p className="font-body-small text-subtle">
            {path.map((element) => element.name).join(" / ")}
          </p>
        )}
      </Stack>
      <Stack space="space.050">
        <KeyValue label="Type" labelWidth={124}>
          {labelFor(row.system_type)}
        </KeyValue>
        <KeyValue label="Owner" labelWidth={124}>
          {row.system_owner_party_id ? (
            <RelationName table="parties" id={row.system_owner_party_id} />
          ) : (
            "Unassigned"
          )}
        </KeyValue>
        {impactDimensions.map((dimension) => {
          const impact = row.impacts[dimension];
          const highestBelow = row.childImpacts[dimension];
          return (
            <KeyValue key={dimension} label={labelFor(dimension)} labelWidth={124} wrap>
              <Inline space="space.075" alignBlock="center" shouldWrap>
                <ImpactBadge value={impact.value} mixed={impact.source === "mixed"} />
                <span className="font-body-small text-subtle">
                  {impactProvenance(row, dimension)}
                </span>
                {impact.conflict && impact.source === "system" && (
                  <span className="font-body-small text-subtle">
                    Scope: {impact.scopeValues.map(labelFor).join(", ")}
                  </span>
                )}
                {contained.length > 0 && highestBelow && (
                  <span className="font-body-small text-subtle">
                    Highest inside: {labelFor(highestBelow)}
                  </span>
                )}
              </Inline>
            </KeyValue>
          );
        })}
        <KeyValue label="Boundary" labelWidth={124}>
          {row.is_authorization_boundary
            ? "This element is the authorization boundary"
            : (boundary?.name ?? "Boundary unavailable")}
        </KeyValue>
      </Stack>
      {row.description && <p className="whitespace-pre-wrap font-body-small">{row.description}</p>}
      {row.categorization_rationale && (
        <p className="whitespace-pre-wrap font-body-small text-subtle">
          {row.categorization_rationale}
        </p>
      )}
      <Section
        title="Baseline"
        action={
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={params}
                search={{ tab: "Controls" }}
              />
            }
          >
            Open controls
          </TextLink>
        }
      >
        <Stack space="space.075">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <span className="font-body-small font-medium">
              {row.baselineTitle ??
                (row.effectiveBaseline?.source_label ? "Baseline" : "No baseline")}
            </span>
            <span className="font-body-small text-subtle">{baselineSource(row)}</span>
            {row.controlCount !== null && (
              <Badge variant="secondary" size="xsmall">
                {row.controlCount} controls
              </Badge>
            )}
            {row.baselineDraft && (
              <Badge tone="warning" variant="secondary" size="xsmall">
                Draft tailored profile
              </Badge>
            )}
          </Inline>
          {row.additionalChildControlCount > 0 && (
            <p className="font-body-small text-subtle">
              {row.additionalChildControlCount} more controls are selected by elements inside.
            </p>
          )}
          {row.unresolvedDescendantCount > 0 && (
            <p className="font-body-small text-subtle">
              {row.unresolvedDescendantCount} elements inside have no baseline.
            </p>
          )}
        </Stack>
      </Section>
      <Section
        title="Requirements"
        action={
          <TextLink
            render={
              <Link
                to="/programs/$programId/systems/$scopeId"
                params={params}
                search={{ tab: "Requirements" }}
              />
            }
          >
            Open requirements
          </TextLink>
        }
      >
        <p className="font-body-small">
          {row.requirementCount} allocated here
          {contained.length > 0 && ` · ${row.subtreeRequirementCount} including everything inside`}
        </p>
      </Section>
      <Section title="Contains" count={contained.length}>
        {contained.length ? (
          <ul className="flex flex-col gap-050">
            {contained.map((child) => (
              <li key={child.id} className="font-body-small">
                {onDrill ? (
                  <button
                    type="button"
                    onClick={() => onDrill(child.id)}
                    className="text-left font-medium hover:underline focus-visible:outline-focused"
                  >
                    {child.name}
                  </button>
                ) : (
                  <TextLink
                    render={
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={{ programId: child.program_id, scopeId: child.id }}
                      />
                    }
                  >
                    {child.name}
                  </TextLink>
                )}
                <span className="text-subtle">
                  {" "}
                  · {child.code} · {labelFor(child.system_type)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-small text-subtle">Nothing inside this element.</p>
        )}
      </Section>
      <TextLink render={<Link to="/programs/$programId/systems/$scopeId" params={params} />}>
        Open record
      </TextLink>
    </Stack>
  );
}
