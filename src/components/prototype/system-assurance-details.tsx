import { Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Inline,
  KeyValue,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import type { Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import type { Impact, ImpactDimension, SystemAssuranceRow } from "@/lib/system-assurance";
import { RelationName } from "./record-tools";
import { SystemBaseline } from "./system-baseline";

export const impactDimensions = ["confidentiality", "integrity", "availability"] as const;
export type SystemAssuranceTab = "Overview" | "Scopes" | "Controls";

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

function containedRows(row: SystemAssuranceRow, rows: SystemAssuranceRow[]) {
  const found: SystemAssuranceRow[] = [];
  const seen = new Set([row.id]);
  const queue = [row.id];
  while (queue.length) {
    const parentId = queue.shift();
    for (const child of rows) {
      if (
        child.parent_system_id !== parentId ||
        child.boundary_system_id !== row.boundary_system_id ||
        seen.has(child.id)
      )
        continue;
      seen.add(child.id);
      found.push(child);
      queue.push(child.id);
    }
  }
  return found;
}

export function SystemAssuranceDetails({
  row,
  rows,
  tab,
  onTabChange,
  readOnly,
  canCreateScope,
  onOpenScope,
  onAddScope,
}: {
  row: SystemAssuranceRow;
  rows: SystemAssuranceRow[];
  tab: SystemAssuranceTab;
  onTabChange: (tab: SystemAssuranceTab) => void;
  readOnly: boolean;
  canCreateScope: boolean;
  onOpenScope: (scope: Row<"scopes">) => void;
  onAddScope: () => void;
}) {
  const descendants = containedRows(row, rows);
  const scopeOwners = [row, ...descendants].filter((element) => element.directScopes.length);
  return (
    <Stack space="space.200">
      <h2 className="font-heading-small">{row.name}</h2>
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as SystemAssuranceTab)}>
        <TabsList variant="line" aria-label="System sections">
          {(["Overview", "Scopes", "Controls"] as const).map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab}>
          <Stack space="space.250">
            {tab === "Overview" && (
              <>
                <Stack space="space.100">
                  <KeyValue label="Type">{labelFor(row.system_type)}</KeyValue>
                  <KeyValue label="Owner">
                    {row.system_owner_party_id ? (
                      <RelationName table="parties" id={row.system_owner_party_id} />
                    ) : (
                      "Unassigned"
                    )}
                  </KeyValue>
                  <KeyValue label="Boundary">
                    {row.is_authorization_boundary
                      ? "Authorization boundary"
                      : (rows.find((element) => element.id === row.boundary_system_id)?.name ??
                        "Boundary unavailable")}
                  </KeyValue>
                  {row.parent_system_id && (
                    <KeyValue label="Parent">
                      {rows.find((element) => element.id === row.parent_system_id)?.name ??
                        "Parent unavailable"}
                    </KeyValue>
                  )}
                  {row.description && (
                    <p className="whitespace-pre-wrap font-body-small">{row.description}</p>
                  )}
                </Stack>
                <Section title="CIA impact">
                  <Stack space="space.100">
                    {impactDimensions.map((dimension) => {
                      const impact = row.impacts[dimension];
                      return (
                        <KeyValue key={dimension} label={labelFor(dimension)}>
                          <Inline space="space.075" shouldWrap>
                            <ImpactBadge value={impact.value} mixed={impact.source === "mixed"} />
                            <span className="font-body-small text-subtle">
                              {impact.source === "system"
                                ? "Recorded on system"
                                : impact.source === "scope"
                                  ? "From assessment scope"
                                  : impact.source === "mixed"
                                    ? "Scope values differ"
                                    : "Not recorded"}
                            </span>
                            {impact.conflict && impact.source === "system" && (
                              <span className="font-body-small text-subtle">
                                Scope: {impact.scopeValues.map(labelFor).join(", ")}
                              </span>
                            )}
                          </Inline>
                        </KeyValue>
                      );
                    })}
                    {row.categorization_rationale && (
                      <p className="whitespace-pre-wrap font-body-small text-subtle">
                        {row.categorization_rationale}
                      </p>
                    )}
                  </Stack>
                </Section>
                {descendants.length > 0 && (
                  <Section title="Contained systems">
                    <Stack space="space.100">
                      <p className="font-body-small text-subtle">
                        Highest recorded impact below this system, within the same authorization
                        boundary. The system's own categorization is shown above.
                      </p>
                      {impactDimensions.map((dimension) => (
                        <KeyValue key={dimension} label={labelFor(dimension)}>
                          <ImpactBadge value={row.childImpacts[dimension]} />
                        </KeyValue>
                      ))}
                      <KeyValue label="Scopes below">
                        {row.subtreeScopeCount - row.directScopes.length}
                      </KeyValue>
                    </Stack>
                  </Section>
                )}
              </>
            )}
            {tab === "Scopes" && (
              <>
                <Inline spread="space-between" alignBlock="center">
                  <p className="font-body-small text-subtle">
                    {row.directScopes.length} on this system ·{" "}
                    {row.subtreeScopeCount - row.directScopes.length} below
                  </p>
                  {canCreateScope && (
                    <Button
                      size="small"
                      variant="primary"
                      iconBefore={<Plus />}
                      onClick={onAddScope}
                    >
                      Add scope
                    </Button>
                  )}
                </Inline>
                {scopeOwners.length === 0 && (
                  <p className="text-subtle">
                    No assessment scopes recorded for this system or its contained systems.
                  </p>
                )}
                {scopeOwners.map((owner) => (
                  <Section
                    key={owner.id}
                    title={owner.id === row.id ? "On this system" : `${owner.code} · ${owner.name}`}
                  >
                    <Stack space="space.200">
                      {owner.scopeSelections.map((selection) => (
                        <Stack key={selection.scope.id} space="space.100">
                          <button
                            type="button"
                            className="text-left font-body-small font-medium hover:underline focus-visible:outline-focused"
                            onClick={() => onOpenScope(selection.scope)}
                          >
                            {selection.scope.code} · {selection.scope.name}
                          </button>
                          <Inline shouldWrap space="space.150">
                            {impactDimensions.map((dimension) => (
                              <Inline
                                key={dimension}
                                space="space.050"
                                aria-label={`${labelFor(dimension)} impact`}
                              >
                                <span className="font-body-small text-subtle">
                                  {dimension[0]!.toUpperCase()}
                                </span>
                                <ImpactBadge
                                  value={selection.scope[`${dimension}_impact`] as Impact | null}
                                />
                              </Inline>
                            ))}
                          </Inline>
                          <p className="font-body-small text-subtle">
                            {selection.conflicting
                              ? "Conflicting scope baseline adoptions"
                              : selection.controlCount === null
                                ? "No scope baseline recorded"
                                : `${selection.controlCount} controls in scope baseline${selection.differs ? ` · separate from the system's ${owner.controlCount} applicable controls` : ""}`}
                          </p>
                          {selection.scope.description && (
                            <p className="font-body-small whitespace-pre-wrap">
                              {selection.scope.description}
                            </p>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  </Section>
                ))}
              </>
            )}
            {tab === "Controls" && (
              <>
                {descendants.length > 0 && (
                  <Stack space="space.075">
                    <KeyValue label="Applicable here">
                      {row.controlCount ?? "No baseline recorded"}
                    </KeyValue>
                    <KeyValue label="Unique controls in subtree">
                      {row.subtreeControlCount ?? "No baseline recorded"}
                    </KeyValue>
                    {row.additionalChildControlCount > 0 && (
                      <p className="font-body-small text-subtle">
                        {row.additionalChildControlCount} additional controls selected by contained
                        systems.
                      </p>
                    )}
                    {row.unresolvedDescendantCount > 0 && (
                      <p className="font-body-small text-subtle">
                        {row.unresolvedDescendantCount} contained systems have no resolved baseline.
                      </p>
                    )}
                  </Stack>
                )}
                <SystemBaseline systemId={row.id} readOnly={readOnly} />
              </>
            )}
          </Stack>
        </TabsContent>
      </Tabs>
      <TextLink
        render={
          <Link
            to="/programs/$programId/systems/$scopeId"
            params={{ programId: row.program_id, scopeId: row.id }}
          />
        }
      >
        Open system
      </TextLink>
    </Stack>
  );
}
