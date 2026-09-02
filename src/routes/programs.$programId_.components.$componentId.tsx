import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { NodeRail } from "@/components/app/composition";
import { DerivedControlTrace, ElementAllocationTable } from "@/components/app/requirements";
import { ApplicabilityModal } from "@/components/app/requirement-forms";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  EmptyState,
  Mono,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  Td,
  Th,
  Tr,
  Severity,
} from "@/components/app/ui";
import {
  ancestorsOf,
  bomForNode,
  childrenOf,
  crossesBoundary,
  edgesFrom,
  edgesTo,
  nodeById,
  pathOf,
} from "@/lib/composition";
import { assetById, findings, isOpen } from "@/lib/findings";
import {
  controlSetFor,
  scopesServedBy,
  servesEdgesFor,
  triadOf,
  useScopesVersion,
} from "@/lib/scopes";
import { postureOf } from "@/lib/graph-posture";
import { programs } from "@/lib/grc-data";
import {
  allocationsOn,
  derivedControlTrace,
  getRequirement,
  requirementById,
  skippedOn,
  undecidedFor,
  useRequirementsVersion,
} from "@/lib/requirements";
import { severityTone } from "@/lib/spine";

/**
 * The component record — `§20`'s "LRU / component view".
 *
 * This page exists because every link in the app used to land on a browse
 * surface with the object merely selected: an allocation pointing at the
 * forwarding ASIC opened the whole composition tree, five sections deep, and
 * the reader had to hunt for the part they had just clicked. A record page
 * ends the question instead of continuing it — everything about one part, and
 * a lateral link to any peer record rather than a descent into another table.
 *
 * Deliberately not tabbed. Every section here holds between zero and six rows;
 * tabbing content that small only reintroduces the clicking it was meant to
 * remove.
 */
export const Route = createFileRoute("/programs/$programId_/components/$componentId")({
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.componentId} — Equinox` },
      {
        name: "description",
        content: `Component ${params.componentId} in program ${params.programId}: identity and supply chain, allocated security requirements, controls reached by derived trace, composition, connections and open findings.`,
      },
      { property: "og:title", content: `${params.componentId} — Equinox` },
      {
        property: "og:description",
        content: `Component ${params.componentId} in ${params.programId}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComponentRecord,
});

function ComponentRecord() {
  const { programId, componentId } = Route.useParams();
  const program = Route.useLoaderData();

  const node = nodeById.get(componentId) ?? null;
  const storeVersion = useRequirementsVersion();
  const scopeVersion = useScopesVersion();
  // Every scope this component answers to: the one it sits under in the build
  // tree, plus any it serves from elsewhere. A shared component inherits
  // obligations from all of them.
  const scopes = useMemo(
    () =>
      node
        ? scopesServedBy(
            node.id,
            ancestorsOf(node.id).map((a) => a.id),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node, scopeVersion],
  );
  const serves = useMemo(() => (node ? servesEdgesFor(node.id) : []), [node]);
  const [deciding, setDeciding] = useState(false);
  const posture = useMemo(() => (node ? postureOf(node.id) : null), [node]);
  const allocations = useMemo(() => (node ? allocationsOn(node.id) : []), [node, storeVersion]);
  const trace = useMemo(() => derivedControlTrace(node?.id ?? ""), [node, storeVersion]);
  const skipped = useMemo(() => (node ? skippedOn(node.id) : []), [node, storeVersion]);
  const undecided = useMemo(
    () => (node ? undecidedFor(node.id, program.id) : []),
    [node, program.id, storeVersion],
  );
  const children = useMemo(() => (node ? childrenOf(node.id) : []), [node]);
  const out = useMemo(() => (node ? edgesFrom(node.id) : []), [node]);
  const inbound = useMemo(() => (node ? edgesTo(node.id) : []), [node]);
  // A finding names the exact part when the scanner could resolve one; when it
  // could not, it lands on the host asset. Both belong on this record.
  const open = useMemo(
    () =>
      node
        ? findings.filter(
            (f) => isOpen(f) && (f.node === node.id || (!!node.asset && f.asset === node.asset)),
          )
        : [],
    [node],
  );

  if (!node || node.program !== program.id) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Component not found</h1>
          <p className="max-w-lg text-[13px] text-muted-foreground">
            {componentId} is not a component of {program.id}.
          </p>
          <Link
            to="/programs/$programId/composition"
            params={{ programId }}
            search={{ tab: undefined }}
            className="text-[13px] text-primary hover:underline"
          >
            Back to system composition
          </Link>
        </div>
      </Shell>
    );
  }

  const bom = bomForNode(node.id);
  const parent = node.parent ? nodeById.get(node.parent) : null;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId/composition"
            backParams={{ programId }}
            id={node.id}
            title={node.name}
            meta={`${node.kind} · ${node.class}${node.version === "—" ? "" : ` · ${node.version}`} · ${program.acronym}`}
            actions={
              <>
                <Badge tone={node.attested ? "success" : "warning"}>
                  {node.attested ? "Attested" : "Not attested"}
                </Badge>
                {posture?.worst ? (
                  <Severity tone={severityTone(posture.worst)}>{posture.worst} open</Severity>
                ) : null}
              </>
            }
            below={
              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t border-border pt-2.5">
                <Fact label="Supplier">{node.supplier}</Fact>
                {node.partNumber ? (
                  <Fact label="Part number">
                    <Mono>{node.partNumber}</Mono>
                  </Fact>
                ) : null}
                <Fact label="Trust zone">{node.zone}</Fact>
                <Fact label="Criticality">{node.criticality}</Fact>
                <Fact label="Scopes">{scopes.length}</Fact>
                <Fact label="Requirements">{allocations.length || "None"}</Fact>
                <Fact label="Controls reached">{trace.controls.length || "None"}</Fact>
                <Fact label="Sits in">
                  {parent ? (
                    <Link
                      to="/programs/$programId/components/$componentId"
                      params={{ programId, componentId: parent.id }}
                      className="hover:underline"
                    >
                      {parent.name}
                    </Link>
                  ) : (
                    "Top of the tree"
                  )}
                </Fact>
              </dl>
            }
          />
        }
        showRail
        rail={<NodeRail node={node} posture={posture} />}
      >
        <Section
          title="Assessment scopes"
          description={
            serves.length
              ? "This component serves more than one scope. Its obligations are the union, and the strictest categorization governs."
              : "The scope whose obligations reach this component."
          }
        >
          <Table className="mt-1">
            <colgroup>
              <col style={{ width: "104px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "84px" }} />
              <col />
            </colgroup>
            <thead>
              <Tr>
                <Th>Scope</Th>
                <Th>Name</Th>
                <Th title="Confidentiality">C</Th>
                <Th title="Integrity">I</Th>
                <Th title="Availability">A</Th>
                <Th>Reached by</Th>
                <Th>Role here</Th>
              </Tr>
            </thead>
            <tbody>
              {scopes.map((sc) => {
                const t = triadOf(sc);
                const edge = serves.find((e) => e.scope === sc.id);
                const set = controlSetFor(sc.id);
                return (
                  <Tr key={sc.id} title={edge?.rationale ?? sc.mission}>
                    <Td className="max-w-none">
                      <Link
                        to="/programs/$programId/systems/$scopeId"
                        params={{ programId, scopeId: sc.id }}
                        search={{ tab: undefined }}
                        className="hover:underline"
                      >
                        <Mono className="text-primary">{sc.id}</Mono>
                      </Link>
                    </Td>
                    <Td className="truncate">{sc.name}</Td>
                    <Td>{t.Confidentiality.slice(0, 1)}</Td>
                    <Td>{t.Integrity.slice(0, 1)}</Td>
                    <Td>{t.Availability.slice(0, 1)}</Td>
                    <Td>
                      <Badge size="xs" tone={edge ? "info" : "neutral"}>
                        {edge ? "Serves" : "Contains"}
                      </Badge>
                    </Td>
                    <Td className="truncate">
                      {edge ? edge.role : `${set?.total ?? 0} controls in force`}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Security requirements allocated here"
          action={
            <Button size="sm" variant="primary" onClick={() => setDeciding(true)}>
              {undecided.length ? `Review ${undecided.length} unanswered` : "Review applicability"}
            </Button>
          }
        >
          <ElementAllocationTable
            allocations={allocations}
            programId={programId}
            requirementFor={(id) => requirementById.get(id)}
          />
        </Section>

        <Section
          title="Controls reached"
          description="Derived from the allocations above — never stored against this component"
        >
          <DerivedControlTrace trace={trace} programId={programId} />
        </Section>

        {children.length > 0 ? (
          <Section title="Contains">
            <Table className="mt-1">
              <colgroup>
                <col style={{ width: "104px" }} />
                <col />
                <col style={{ width: "132px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "132px" }} />
                <col style={{ width: "96px" }} />
              </colgroup>
              <thead>
                <Tr>
                  <Th>Component</Th>
                  <Th>Name</Th>
                  <Th>Kind</Th>
                  <Th>Version</Th>
                  <Th>Supplier</Th>
                  <Th className="text-right">Reqs</Th>
                </Tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <Tr key={child.id}>
                    <Td className="max-w-none">
                      <Link
                        to="/programs/$programId/components/$componentId"
                        params={{ programId, componentId: child.id }}
                        className="hover:underline"
                      >
                        <Mono className="text-primary">{child.id}</Mono>
                      </Link>
                    </Td>
                    <Td className="truncate">{child.name}</Td>
                    <Td className="truncate">{child.kind}</Td>
                    <Td className="truncate">{child.version}</Td>
                    <Td className="truncate">{child.supplier}</Td>
                    <Td className="tnum text-right">
                      {allocationsOn(child.id).length || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Section>
        ) : null}

        {out.length + inbound.length > 0 ? (
          <Section title="Connections">
            <Table className="mt-1">
              <colgroup>
                <col style={{ width: "88px" }} />
                <col style={{ width: "104px" }} />
                <col />
                <col style={{ width: "132px" }} />
                <col style={{ width: "108px" }} />
              </colgroup>
              <thead>
                <Tr>
                  <Th>Direction</Th>
                  <Th>Component</Th>
                  <Th>Name</Th>
                  <Th>Relation</Th>
                  <Th>Boundary</Th>
                </Tr>
              </thead>
              <tbody>
                {[
                  ...out.map((e) => ({ edge: e, dir: "Out" as const, other: e.to })),
                  ...inbound.map((e) => ({ edge: e, dir: "In" as const, other: e.from })),
                ].map(({ edge, dir, other }, i) => {
                  const peer = nodeById.get(other);
                  return (
                    <Tr key={`${edge.from}-${edge.to}-${i}`} title={edge.via}>
                      <Td>{dir}</Td>
                      <Td className="max-w-none">
                        <Link
                          to="/programs/$programId/components/$componentId"
                          params={{ programId, componentId: other }}
                          className="hover:underline"
                        >
                          <Mono className="text-primary">{other}</Mono>
                        </Link>
                      </Td>
                      <Td className="truncate">{peer?.name ?? other}</Td>
                      <Td className="truncate">
                        {edge.kind} — {edge.via}
                      </Td>
                      <Td>
                        {crossesBoundary(edge) ? (
                          <Badge size="xs" tone="warning">
                            Crosses
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </Section>
        ) : null}

        {skipped.length > 0 ? (
          <Section
            title="Ruled out here"
            description="Considered for this component and excluded. An absence would be indistinguishable from nobody having looked."
          >
            <Table className="mt-1">
              <colgroup>
                <col style={{ width: "112px" }} />
                <col style={{ width: "320px" }} />
                <col />
                <col style={{ width: "124px" }} />
                <col style={{ width: "108px" }} />
              </colgroup>
              <thead>
                <Tr>
                  <Th>Requirement</Th>
                  <Th>Shall statement</Th>
                  <Th>Why it does not apply here</Th>
                  <Th>Decided by</Th>
                  <Th>Decided</Th>
                </Tr>
              </thead>
              <tbody>
                {skipped.map((d) => {
                  const r = getRequirement(d.requirement);
                  return (
                    <Tr key={d.id}>
                      <Td className="max-w-none">
                        <Link
                          to="/programs/$programId/requirements/$requirementId"
                          params={{ programId, requirementId: d.requirement }}
                          search={{ tab: undefined }}
                          className="hover:underline"
                        >
                          <Mono className="text-primary">{d.requirement}</Mono>
                        </Link>
                      </Td>
                      <Td className="truncate" title={r?.text}>
                        {r?.text ?? "—"}
                      </Td>
                      <Td className="whitespace-normal py-2 align-top leading-[1.45]">
                        {d.rationale}
                      </Td>
                      <Td className="truncate">{d.decidedBy}</Td>
                      <Td>{d.decidedOn}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </Section>
        ) : null}

        <ApplicabilityModal
          open={deciding}
          onClose={() => setDeciding(false)}
          programId={program.id}
          targetId={node.id}
          targetName={node.name}
          targetKind="node"
          decidedBy={program.owner}
        />

        <Section title="Open findings">
          {open.length ? (
            <Table className="mt-1">
              <colgroup>
                <col style={{ width: "104px" }} />
                <col style={{ width: "88px" }} />
                <col />
                <col style={{ width: "104px" }} />
                <col style={{ width: "120px" }} />
              </colgroup>
              <thead>
                <Tr>
                  <Th>Finding</Th>
                  <Th>Severity</Th>
                  <Th>Title</Th>
                  <Th>Control</Th>
                  <Th>Status</Th>
                </Tr>
              </thead>
              <tbody>
                {open.map((f) => (
                  <Tr key={f.id}>
                    <Td className="max-w-none">
                      <Link
                        to="/findings/$findingId"
                        params={{ findingId: f.id }}
                        className="hover:underline"
                      >
                        <Mono className="text-primary">{f.id}</Mono>
                      </Link>
                    </Td>
                    <Td>
                      <Severity tone={severityTone(f.mitigatedSeverity)}>
                        {f.mitigatedSeverity}
                      </Severity>
                    </Td>
                    <Td className="truncate">{f.title}</Td>
                    <Td>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: f.control }}
                        search={{ tab: undefined }}
                        className="hover:underline"
                      >
                        <Mono className="text-primary">{f.control}</Mono>
                      </Link>
                    </Td>
                    <Td className="truncate">{f.lifecycle}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="pt-3">
              <EmptyState
                title="No open findings"
                description={
                  node.asset
                    ? `Nothing open against ${node.asset}.`
                    : "This component is not a tracked boundary asset, so findings attach to its host instead."
                }
              />
            </div>
          )}
        </Section>

        <Section title="Provenance">
          <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 pt-3">
            <Fact label="Declared by">{node.bomSource}</Fact>
            <Fact label="BOM document">
              {bom ? (
                <span title={`${bom.name} · ${bom.producer} · ${bom.received}`}>
                  <Mono>{bom.id}</Mono>
                </span>
              ) : (
                "Hand-declared"
              )}
            </Fact>
            <Fact label="Path">
              {pathOf(node.id)
                .map((n) => n.name)
                .join(" / ")}
            </Fact>
          </dl>
          {node.note ? (
            <p className="max-w-3xl pt-2 text-[13px] leading-[1.5] text-muted-foreground">
              {node.note}
            </p>
          ) : null}
        </Section>
      </ShowPage>
    </Shell>
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
