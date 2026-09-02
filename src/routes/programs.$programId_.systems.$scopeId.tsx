import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Badge, FilterChip, KeyValue, Table, Id, Tabs } from "@/ds/primitives";
import { RecordHeader, Section, ShowPage } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { Shell } from "@/ds/shell";
import { ancestorsOf, nodeById, nodesForProgram } from "@/lib/composition";
import { programs } from "@/lib/grc-data";
import { allocationsOn } from "@/lib/requirements";
import {
  componentsServing,
  controlSetFor,
  objectives,
  rollupControlSet,
  scopeById,
  scopesServedBy,
  triadOf,
  useScopesVersion,
  type Objective,
} from "@/lib/scopes";

const scopeTabs = ["Overview", "Control set", "Components"] as const;
type ScopeTab = (typeof scopeTabs)[number];

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

export const Route = createFileRoute("/programs/$programId_/systems/$scopeId")({
  validateSearch: (search: Record<string, unknown>): { tab?: ScopeTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    return { tab: scopeTabs.find((t) => t.toLowerCase() === raw.toLowerCase()) };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.scopeId} — Equinox` },
      {
        name: "description",
        content: `Assessment scope ${params.scopeId} in program ${params.programId}: CNSSI 1253 objective-specific categorization, applicable overlays, the control set it selects, and the components it covers.`,
      },
      { property: "og:title", content: `${params.scopeId} — Equinox` },
      { property: "og:description", content: `Assessment scope ${params.scopeId}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScopeRecord,
});

function ScopeRecord() {
  const { programId, scopeId } = Route.useParams();
  const tab = Route.useSearch().tab ?? "Overview";
  const program = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const version = useScopesVersion();
  const [family, setFamily] = useState("All");

  const scope = scopeById.get(scopeId) ?? null;
  const set = useMemo(() => controlSetFor(scopeId), [scopeId, version]);
  const rollup = useMemo(() => rollupControlSet(program.id), [program.id, version]);

  const members = useMemo(() => {
    if (!scope) return [];
    return nodesForProgram(program.id).filter((n) => {
      const ancestry = ancestorsOf(n.id).map((a) => a.id);
      return scopesServedBy(n.id, ancestry).some((s) => s.id === scope.id);
    });
  }, [scope, program.id, version]);

  const shared = useMemo(() => (scope ? componentsServing(scope.id) : []), [scope]);

  if (!scope || !set || scope.program !== program.id) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Assessment scope not found</h1>
          <Link
            to="/programs/$programId"
            params={{ programId }}
            search={{ tab: "Systems" }}
            className="text-[13px] text-primary hover:underline"
          >
            Back to systems
          </Link>
        </div>
      </Shell>
    );
  }

  const triad = triadOf(scope);
  const element = nodeById.get(scope.element);
  const go = (next: ScopeTab) => navigate({ search: { tab: next }, replace: true });

  // Controls no other scope in the program requires — the obligations a single
  // program-wide control set would have hidden inside a union.
  const unique = set.controls.filter((c) => {
    const hit = rollup.controls.find((r) => r.control.id === c.control.id);
    return hit?.scopes.length === 1;
  });

  const families = ["All", ...[...new Set(set.controls.map((c) => c.control.family))].sort()];
  const rows =
    family === "All" ? set.controls : set.controls.filter((c) => c.control.family === family);

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId }}
            id={scope.id}
            title={scope.name}
            meta={`${program.acronym} · ${scope.parameters.systemClass} · ${scope.parameters.classification} · ${scope.parameters.connectivity}`}
            actions={
              <Badge tone={scope.independentlyAuthorized ? "warning" : "neutral"}>
                {scope.independentlyAuthorized ? "Separately authorized" : "Inside the program ATO"}
              </Badge>
            }
            below={
              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t border-border pt-2.5">
                {objectives.map((o) => (
                  <Fact key={o} label={o.slice(0, 1)}>
                    <Badge size="xs" tone={impactTone[triad[o]]}>
                      {triad[o]}
                    </Badge>
                  </Fact>
                ))}
                <Fact label="Controls">{set.total}</Fact>
                <Fact label="Overlays">{set.overlays.length}</Fact>
                <Fact label="Only here">{unique.length}</Fact>
                <Fact label="Components">{members.length}</Fact>
                <Fact label="Anchored to">
                  {element ? (
                    <Link
                      to="/programs/$programId/components/$componentId"
                      params={{ programId, componentId: element.id }}
                      className="hover:underline"
                    >
                      {element.name}
                    </Link>
                  ) : (
                    scope.element
                  )}
                </Fact>
              </dl>
            }
          />
        }
        tabs={
          <Tabs
            items={(
              [
                ["Overview", null],
                ["Control set", set.total],
                ["Components", members.length],
              ] as [ScopeTab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key,
              active: tab === key,
              onSelect: () => go(key),
              trailing: count ? (
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {count}
                </span>
              ) : null,
            }))}
          />
        }
        showRail={tab === "Overview"}
        rail={
          <>
            <Inspector.Group title="Categorization">
              {objectives.map((o) => (
                <KeyValue key={o} label={o}>
                  <Badge size="xs" tone={impactTone[triad[o]]}>
                    {triad[o]}
                  </Badge>
                </KeyValue>
              ))}
              <KeyValue label="Model">CNSSI 1253</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Environment">
              <KeyValue label="Class">{scope.parameters.systemClass}</KeyValue>
              <KeyValue label="Hosting">{scope.parameters.hosting}</KeyValue>
              <KeyValue label="Classification">{scope.parameters.classification}</KeyValue>
              <KeyValue label="Connectivity">{scope.parameters.connectivity}</KeyValue>
              <KeyValue label="Owner">{scope.owner}</KeyValue>
            </Inspector.Group>
          </>
        }
      >
        {tab === "Overview" ? (
          <>
            <Section
              title="What each objective selects"
              description="CNSSI 1253 selects per objective and takes the union — the triad is never collapsed to its highest value."
            >
              <Table className="mt-1">
                <colgroup>
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "120px" }} />
                  <col />
                </colgroup>
                <thead>
                  <Table.Row>
                    <Table.Header>Objective</Table.Header>
                    <Table.Header>Impact</Table.Header>
                    <Table.Header className="text-right">Controls</Table.Header>
                    <Table.Header>Families it drives</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {objectives.map((o) => (
                    <Table.Row key={o}>
                      <Table.Cell>{o}</Table.Cell>
                      <Table.Cell>
                        <Badge size="xs" tone={impactTone[triad[o]]}>
                          {triad[o]}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="tnum text-right">{set.byObjective[o]}</Table.Cell>
                      <Table.Cell className="truncate">{familiesFor(set, o).join(", ")}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section
              title="Separation basis"
              description="Why this scope may categorize below its siblings."
            >
              <p className="max-w-3xl pt-3 text-[13px] leading-[1.5]">{scope.separationBasis}</p>
            </Section>

            <Section title="Overlays applied">
              {set.overlays.length ? (
                <Table className="mt-1">
                  <colgroup>
                    <col style={{ width: "240px" }} />
                    <col style={{ width: "220px" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <Table.Row>
                      <Table.Header>Overlay</Table.Header>
                      <Table.Header>Authority</Table.Header>
                      <Table.Header>Why it fired</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {set.overlays.map((o) => (
                      <Table.Row key={o.id}>
                        <Table.Cell className="truncate">{o.name}</Table.Cell>
                        <Table.Cell className="truncate">{o.authority}</Table.Cell>
                        <Table.Cell className="truncate">{o.trigger}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="pt-3 text-[13px] text-muted-foreground">
                  No overlay applies to this scope&apos;s parameters.
                </p>
              )}
            </Section>

            {unique.length > 0 ? (
              <Section
                title="Required only by this scope"
                description="A single program-wide control set would fold these into the union and lose the reason they are there."
              >
                <ControlTable rows={unique} programId={programId} />
              </Section>
            ) : null}

            {set.removed.length > 0 ? (
              <Section
                title="Tailored out by overlay"
                description="Selected by categorization, then removed. Recorded rather than absent."
              >
                <ControlTable rows={set.removed} programId={programId} showRemoval />
              </Section>
            ) : null}
          </>
        ) : null}

        {tab === "Control set" ? (
          <Section
            title="Control set"
            action={
              <div className="flex flex-wrap gap-1.5">
                {families.slice(0, 12).map((f) => (
                  <FilterChip
                    key={f}
                    label={f}
                    active={family === f}
                    onClick={() => setFamily(f)}
                  />
                ))}
              </div>
            }
          >
            <ControlTable rows={rows} programId={programId} />
          </Section>
        ) : null}

        {tab === "Components" ? (
          <>
            <Section
              title="Components in this scope"
              description="Everything that inherits this scope's obligations, whether by containment or by an explicit serves relation."
            >
              <Table className="mt-1">
                <colgroup>
                  <col style={{ width: "104px" }} />
                  <col />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "90px" }} />
                  <col style={{ width: "80px" }} />
                </colgroup>
                <thead>
                  <Table.Row>
                    <Table.Header>Component</Table.Header>
                    <Table.Header>Name</Table.Header>
                    <Table.Header>Kind</Table.Header>
                    <Table.Header>Zone</Table.Header>
                    <Table.Header>Reached by</Table.Header>
                    <Table.Header className="text-right">Reqs</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {members.map((n) => {
                    const viaServes = shared.some((e) => e.component === n.id);
                    return (
                      <Table.Row key={n.id}>
                        <Table.Cell className="max-w-none">
                          <Link
                            to="/programs/$programId/components/$componentId"
                            params={{ programId, componentId: n.id }}
                            className="hover:underline"
                          >
                            <Id className="text-primary">{n.id}</Id>
                          </Link>
                        </Table.Cell>
                        <Table.Cell className="truncate">{n.name}</Table.Cell>
                        <Table.Cell className="truncate">{n.kind}</Table.Cell>
                        <Table.Cell className="truncate">{n.zone}</Table.Cell>
                        <Table.Cell>
                          <Badge size="xs" tone={viaServes ? "info" : "neutral"}>
                            {viaServes ? "Serves" : "Contains"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="tnum text-right">
                          {allocationsOn(n.id).length || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            </Section>

            {shared.length > 0 ? (
              <Section
                title="Serves this scope from elsewhere"
                description="Components that sit under a different subsystem in the build tree but carry this scope's obligations."
              >
                <Table className="mt-1">
                  <colgroup>
                    <col style={{ width: "104px" }} />
                    <col style={{ width: "220px" }} />
                    <col style={{ width: "180px" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <Table.Row>
                      <Table.Header>Component</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header>Role</Table.Header>
                      <Table.Header>Why it reaches this scope</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {shared.map((e) => {
                      const n = nodeById.get(e.component);
                      return (
                        <Table.Row key={`${e.component}-${e.scope}`}>
                          <Table.Cell className="max-w-none">
                            <Link
                              to="/programs/$programId/components/$componentId"
                              params={{ programId, componentId: e.component }}
                              className="hover:underline"
                            >
                              <Id className="text-primary">{e.component}</Id>
                            </Link>
                          </Table.Cell>
                          <Table.Cell className="truncate">{n?.name ?? e.component}</Table.Cell>
                          <Table.Cell className="truncate">{e.role}</Table.Cell>
                          <Table.Cell className="whitespace-normal py-2 align-top leading-[1.45]">
                            {e.rationale}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
              </Section>
            ) : null}
          </>
        ) : null}
      </ShowPage>
    </Shell>
  );
}

function familiesFor(
  set: NonNullable<ReturnType<typeof controlSetFor>>,
  objective: Objective,
): string[] {
  const fams = new Set<string>();
  for (const c of set.controls) if (c.selectedBy.includes(objective)) fams.add(c.control.family);
  return [...fams].sort();
}

function ControlTable({
  rows,
  programId,
  showRemoval = false,
}: {
  rows: NonNullable<ReturnType<typeof controlSetFor>>["controls"];
  programId: string;
  showRemoval?: boolean;
}) {
  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "104px" }} />
        <col style={{ width: "64px" }} />
        <col />
        <col style={{ width: "180px" }} />
        <col style={{ width: showRemoval ? "300px" : "150px" }} />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Control</Table.Header>
          <Table.Header>Family</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header>Selected by</Table.Header>
          <Table.Header>{showRemoval ? "Why it was removed" : "Source"}</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Table.Row key={row.control.id}>
            <Table.Cell className="max-w-none">
              <Link
                to="/programs/$programId/controls/$controlId"
                params={{ programId, controlId: row.control.id }}
                search={{ tab: undefined }}
                className="hover:underline"
              >
                <Id className="text-primary">{row.control.id}</Id>
              </Link>
            </Table.Cell>
            <Table.Cell>{row.control.family}</Table.Cell>
            <Table.Cell className="truncate">{row.control.title}</Table.Cell>
            <Table.Cell className="truncate">
              {row.selectedBy.length ? row.selectedBy.map((o) => o.slice(0, 1)).join(" · ") : "—"}
            </Table.Cell>
            <Table.Cell
              className={
                showRemoval
                  ? "whitespace-normal py-2 align-top leading-[1.45] text-muted-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {showRemoval ? (row.tailoredOut?.rationale ?? "—") : row.source}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] font-medium">{children}</dd>
    </div>
  );
}
