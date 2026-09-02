import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  FilterChip,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  TabStrip,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
          <TabStrip
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
            <RailGroup title="Categorization">
              {objectives.map((o) => (
                <KeyValue key={o} label={o}>
                  <Badge size="xs" tone={impactTone[triad[o]]}>
                    {triad[o]}
                  </Badge>
                </KeyValue>
              ))}
              <KeyValue label="Model">CNSSI 1253</KeyValue>
            </RailGroup>
            <RailGroup title="Environment">
              <KeyValue label="Class">{scope.parameters.systemClass}</KeyValue>
              <KeyValue label="Hosting">{scope.parameters.hosting}</KeyValue>
              <KeyValue label="Classification">{scope.parameters.classification}</KeyValue>
              <KeyValue label="Connectivity">{scope.parameters.connectivity}</KeyValue>
              <KeyValue label="Owner">{scope.owner}</KeyValue>
            </RailGroup>
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
                  <Tr>
                    <Th>Objective</Th>
                    <Th>Impact</Th>
                    <Th className="text-right">Controls</Th>
                    <Th>Families it drives</Th>
                  </Tr>
                </thead>
                <tbody>
                  {objectives.map((o) => (
                    <Tr key={o}>
                      <Td>{o}</Td>
                      <Td>
                        <Badge size="xs" tone={impactTone[triad[o]]}>
                          {triad[o]}
                        </Badge>
                      </Td>
                      <Td className="tnum text-right">{set.byObjective[o]}</Td>
                      <Td className="truncate">{familiesFor(set, o).join(", ")}</Td>
                    </Tr>
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
                    <Tr>
                      <Th>Overlay</Th>
                      <Th>Authority</Th>
                      <Th>Why it fired</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {set.overlays.map((o) => (
                      <Tr key={o.id}>
                        <Td className="truncate">{o.name}</Td>
                        <Td className="truncate">{o.authority}</Td>
                        <Td className="truncate">{o.trigger}</Td>
                      </Tr>
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
                  <Tr>
                    <Th>Component</Th>
                    <Th>Name</Th>
                    <Th>Kind</Th>
                    <Th>Zone</Th>
                    <Th>Reached by</Th>
                    <Th className="text-right">Reqs</Th>
                  </Tr>
                </thead>
                <tbody>
                  {members.map((n) => {
                    const viaServes = shared.some((e) => e.component === n.id);
                    return (
                      <Tr key={n.id}>
                        <Td className="max-w-none">
                          <Link
                            to="/programs/$programId/components/$componentId"
                            params={{ programId, componentId: n.id }}
                            className="hover:underline"
                          >
                            <Mono className="text-primary">{n.id}</Mono>
                          </Link>
                        </Td>
                        <Td className="truncate">{n.name}</Td>
                        <Td className="truncate">{n.kind}</Td>
                        <Td className="truncate">{n.zone}</Td>
                        <Td>
                          <Badge size="xs" tone={viaServes ? "info" : "neutral"}>
                            {viaServes ? "Serves" : "Contains"}
                          </Badge>
                        </Td>
                        <Td className="tnum text-right">
                          {allocationsOn(n.id).length || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Td>
                      </Tr>
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
                    <Tr>
                      <Th>Component</Th>
                      <Th>Name</Th>
                      <Th>Role</Th>
                      <Th>Why it reaches this scope</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {shared.map((e) => {
                      const n = nodeById.get(e.component);
                      return (
                        <Tr key={`${e.component}-${e.scope}`}>
                          <Td className="max-w-none">
                            <Link
                              to="/programs/$programId/components/$componentId"
                              params={{ programId, componentId: e.component }}
                              className="hover:underline"
                            >
                              <Mono className="text-primary">{e.component}</Mono>
                            </Link>
                          </Td>
                          <Td className="truncate">{n?.name ?? e.component}</Td>
                          <Td className="truncate">{e.role}</Td>
                          <Td className="whitespace-normal py-2 align-top leading-[1.45]">
                            {e.rationale}
                          </Td>
                        </Tr>
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
        <Tr>
          <Th>Control</Th>
          <Th>Family</Th>
          <Th>Title</Th>
          <Th>Selected by</Th>
          <Th>{showRemoval ? "Why it was removed" : "Source"}</Th>
        </Tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={row.control.id}>
            <Td className="max-w-none">
              <Link
                to="/programs/$programId/controls/$controlId"
                params={{ programId, controlId: row.control.id }}
                search={{ tab: undefined }}
                className="hover:underline"
              >
                <Mono className="text-primary">{row.control.id}</Mono>
              </Link>
            </Td>
            <Td>{row.control.family}</Td>
            <Td className="truncate">{row.control.title}</Td>
            <Td className="truncate">
              {row.selectedBy.length ? row.selectedBy.map((o) => o.slice(0, 1)).join(" · ") : "—"}
            </Td>
            <Td
              className={
                showRemoval
                  ? "whitespace-normal py-2 align-top leading-[1.45] text-muted-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {showRemoval ? (row.tailoredOut?.rationale ?? "—") : row.source}
            </Td>
          </Tr>
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
