import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { NodeRail } from "@/components/app/composition";
import { DerivedControlTrace, ElementAllocationTable } from "@/components/app/requirements";
import { AllocateRequirementsSheet } from "@/components/app/allocate-picker";
import { RevisionStrip } from "@/components/app/control-set-revisions";
import {
  ScopeControlSetTab,
  ScopeFacts,
  ScopeRailGroups,
} from "@/components/app/scope-control-set";
import {
  Badge,
  Box,
  Button,
  Empty,
  Fact,
  Id,
  Indicator,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  Tabs,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
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
  scopesForProgram,
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
 * Not tabbed for a part: every section holds between zero and six rows, and
 * tabbing content that small only reintroduces the clicking it was meant to
 * remove. A categorized element (a system or subsystem with a scope) is the
 * exception: its record carries a Control set tab, which is where the scope
 * record (`/systems/SYS-`) went on 2026-09-02.
 */
const nodeTabs = ["Overview", "Control set"] as const;
type NodeTab = (typeof nodeTabs)[number];

export const Route = createFileRoute("/programs/$programId_/components/$componentId")({
  validateSearch: (search: Record<string, unknown>): { tab?: NodeTab | undefined } => {
    const raw = String(search["tab"] ?? "").toLowerCase();
    return { tab: nodeTabs.find((t) => t.toLowerCase() === raw) };
  },
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
  const tab = Route.useSearch().tab ?? "Overview";
  const navigate = useNavigate({ from: Route.fullPath });

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
  // The scope this element anchors, when it is categorized: its control set is a tab here.
  const anchored = useMemo(
    () => (node ? (scopesForProgram(program.id).find((s) => s.element === node.id) ?? null) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node, program.id, scopeVersion],
  );
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
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Component not found</h1>
          <p className="max-w-layout-measure font-body text-subtle">
            {componentId} is not a component of {program.id}.
          </p>
          <TextLink size="medium">
            <Link
              to="/programs/$programId/composition"
              params={{ programId }}
              search={{ tab: undefined }}
            >
              Back to system composition
            </Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const bom = bomForNode(node.id);
  const parent = node.parent ? nodeById.get(node.parent) : null;
  const anchoredSet = anchored ? controlSetFor(anchored.id) : null;
  const go = (next: NodeTab) => navigate({ search: { tab: next }, replace: true });

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            back={
              anchored ? (
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={{ tab: "Systems" }}
                />
              ) : (
                <Link to="/programs/$programId/composition" params={{ programId }} />
              )
            }
            id={node.id}
            title={node.name}
            meta={`${node.kind} · ${node.class}${node.version === "—" ? "" : ` · ${node.version}`} · ${program.acronym}`}
            actions={
              <>
                <Badge tone={node.attested ? "success" : "warning"}>
                  {node.attested ? "Attested" : "Not attested"}
                </Badge>
                {posture?.worst ? (
                  <Indicator tone={severityTone(posture.worst)}>{posture.worst} open</Indicator>
                ) : null}
                {anchored ? (
                  <Badge tone={anchored.independentlyAuthorized ? "warning" : "neutral"}>
                    {anchored.independentlyAuthorized
                      ? "Separately authorized"
                      : "Inside the program ATO"}
                  </Badge>
                ) : null}
              </>
            }
            facts={
              <>
                {anchored && anchoredSet ? <ScopeFacts scope={anchored} set={anchoredSet} /> : null}
                <Fact label="Supplier">{node.supplier}</Fact>
                {node.partNumber ? (
                  <Fact label="Part number">
                    <Id>{node.partNumber}</Id>
                  </Fact>
                ) : null}
                <Fact label="Trust zone">{node.zone}</Fact>
                <Fact label="Criticality">{node.criticality}</Fact>
                <Fact label="Scopes">{scopes.length}</Fact>
                <Fact label="Requirements">{allocations.length || "None"}</Fact>
                <Fact label="Controls reached">{trace.controls.length || "None"}</Fact>
                <Fact label="Sits in">
                  {parent ? (
                    <TextLink>
                      <Link
                        to="/programs/$programId/components/$componentId"
                        params={{ programId, componentId: parent.id }}
                      >
                        {parent.name}
                      </Link>
                    </TextLink>
                  ) : (
                    "Top of the tree"
                  )}
                </Fact>
              </>
            }
            below={anchored ? <RevisionStrip scopeId={anchored.id} /> : null}
          />
        }
        tabs={
          anchored ? (
            <Tabs>
              {nodeTabs.map((key) => (
                <Tabs.Tab
                  key={key}
                  isSelected={tab === key}
                  onClick={() => go(key)}
                  count={key === "Control set" ? (anchoredSet?.total ?? null) : null}
                >
                  {key}
                </Tabs.Tab>
              ))}
            </Tabs>
          ) : undefined
        }
        showRail={tab === "Overview"}
        rail={
          <>
            <NodeRail node={node} posture={posture} />
            {anchored ? <ScopeRailGroups scope={anchored} /> : null}
          </>
        }
      >
        {tab === "Control set" && anchored ? (
          <ScopeControlSetTab programId={program.id} scope={anchored} />
        ) : (
          <>
            {scopes.some((sc) => sc.id !== anchored?.id) ? (
              <Section
                title="Assessment scopes"
                description={
                  serves.length
                    ? "This component serves more than one scope. Its obligations are the union, and the strictest categorization governs."
                    : "The scope whose obligations reach this component."
                }
              >
                <Table className="pt-050">
                  <thead>
                    <Table.Row>
                      <Table.Header width={104}>Scope</Table.Header>
                      <Table.Header width={220}>Name</Table.Header>
                      <Table.Header width={56} title="Confidentiality">
                        C
                      </Table.Header>
                      <Table.Header width={56} title="Integrity">
                        I
                      </Table.Header>
                      <Table.Header width={56} title="Availability">
                        A
                      </Table.Header>
                      <Table.Header width={84}>Reached by</Table.Header>
                      <Table.Header>Role here</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {scopes
                      .filter((sc) => sc.id !== anchored?.id)
                      .map((sc) => {
                        const t = triadOf(sc);
                        const edge = serves.find((e) => e.scope === sc.id);
                        const set = controlSetFor(sc.id);
                        return (
                          <Table.Row key={sc.id} title={edge?.rationale ?? sc.mission}>
                            <Table.Cell className="max-w-none">
                              <TextLink>
                                <Link
                                  to="/programs/$programId/components/$componentId"
                                  params={{ programId, componentId: sc.element }}
                                  search={{ tab: "Control set" }}
                                >
                                  <Id>{sc.id}</Id>
                                </Link>
                              </TextLink>
                            </Table.Cell>
                            <Table.Cell className="truncate">{sc.name}</Table.Cell>
                            <Table.Cell>{t.Confidentiality.slice(0, 1)}</Table.Cell>
                            <Table.Cell>{t.Integrity.slice(0, 1)}</Table.Cell>
                            <Table.Cell>{t.Availability.slice(0, 1)}</Table.Cell>
                            <Table.Cell>
                              <Badge size="xsmall" tone={edge ? "information" : "neutral"}>
                                {edge ? "Serves" : "Contains"}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell className="truncate">
                              {edge ? edge.role : `${set?.total ?? 0} controls in force`}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                  </tbody>
                </Table>
              </Section>
            ) : null}

            <Section
              title="Security requirements allocated here"
              action={
                <Button size="small" variant="primary" onClick={() => setDeciding(true)}>
                  {undecided.length
                    ? `Review ${undecided.length} unanswered`
                    : "Allocate requirements"}
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
                <Table className="pt-050">
                  <thead>
                    <Table.Row>
                      <Table.Header width={104}>Component</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header width={132}>Kind</Table.Header>
                      <Table.Header width={120}>Version</Table.Header>
                      <Table.Header width={132}>Supplier</Table.Header>
                      <Table.Header width={96} className="text-right">
                        Reqs
                      </Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {children.map((child) => (
                      <Table.Row key={child.id}>
                        <Table.Cell className="max-w-none">
                          <TextLink>
                            <Link
                              to="/programs/$programId/components/$componentId"
                              params={{ programId, componentId: child.id }}
                            >
                              <Id>{child.id}</Id>
                            </Link>
                          </TextLink>
                        </Table.Cell>
                        <Table.Cell className="truncate">{child.name}</Table.Cell>
                        <Table.Cell className="truncate">{child.kind}</Table.Cell>
                        <Table.Cell className="truncate">{child.version}</Table.Cell>
                        <Table.Cell className="truncate">{child.supplier}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {allocationsOn(child.id).length || <span className="text-subtle">—</span>}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              </Section>
            ) : null}

            {out.length + inbound.length > 0 ? (
              <Section title="Connections">
                <Table className="pt-050">
                  <thead>
                    <Table.Row>
                      <Table.Header width={88}>Direction</Table.Header>
                      <Table.Header width={104}>Component</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header width={132}>Relation</Table.Header>
                      <Table.Header width={108}>Boundary</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {[
                      ...out.map((e) => ({ edge: e, dir: "Out" as const, other: e.to })),
                      ...inbound.map((e) => ({ edge: e, dir: "In" as const, other: e.from })),
                    ].map(({ edge, dir, other }, i) => {
                      const peer = nodeById.get(other);
                      return (
                        <Table.Row key={`${edge.from}-${edge.to}-${i}`} title={edge.via}>
                          <Table.Cell>{dir}</Table.Cell>
                          <Table.Cell className="max-w-none">
                            <TextLink>
                              <Link
                                to="/programs/$programId/components/$componentId"
                                params={{ programId, componentId: other }}
                              >
                                <Id>{other}</Id>
                              </Link>
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell className="truncate">{peer?.name ?? other}</Table.Cell>
                          <Table.Cell className="truncate">
                            {edge.kind} — {edge.via}
                          </Table.Cell>
                          <Table.Cell>
                            {crossesBoundary(edge) ? (
                              <Badge size="xsmall" tone="warning">
                                Crosses
                              </Badge>
                            ) : (
                              <span className="text-subtle">—</span>
                            )}
                          </Table.Cell>
                        </Table.Row>
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
                <Table className="pt-050">
                  <thead>
                    <Table.Row>
                      <Table.Header width={112}>Requirement</Table.Header>
                      <Table.Header width={320}>Shall statement</Table.Header>
                      <Table.Header>Why it does not apply here</Table.Header>
                      <Table.Header width={124}>Decided by</Table.Header>
                      <Table.Header width={108}>Decided</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {skipped.map((d) => {
                      const r = getRequirement(d.requirement);
                      return (
                        <Table.Row key={d.id}>
                          <Table.Cell className="max-w-none">
                            <TextLink>
                              <Link
                                to="/programs/$programId/requirements/$requirementId"
                                params={{ programId, requirementId: d.requirement }}
                                search={{ tab: undefined }}
                              >
                                <Id>{d.requirement}</Id>
                              </Link>
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell className="truncate" title={r?.text}>
                            {r?.text ?? "—"}
                          </Table.Cell>
                          <Table.Cell className="whitespace-normal py-100 align-top">
                            {d.rationale}
                          </Table.Cell>
                          <Table.Cell className="truncate">{d.decidedBy}</Table.Cell>
                          <Table.Cell>{d.decidedOn}</Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
              </Section>
            ) : null}

            <AllocateRequirementsSheet
              open={deciding}
              onClose={() => setDeciding(false)}
              programId={program.id}
              node={node}
            />

            <Section title="Open findings">
              {open.length ? (
                <Table className="pt-050">
                  <thead>
                    <Table.Row>
                      <Table.Header width={104}>Finding</Table.Header>
                      <Table.Header width={88}>Severity</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header width={104}>Control</Table.Header>
                      <Table.Header width={120}>Status</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {open.map((f) => (
                      <Table.Row key={f.id}>
                        <Table.Cell className="max-w-none">
                          <TextLink>
                            <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                              <Id>{f.id}</Id>
                            </Link>
                          </TextLink>
                        </Table.Cell>
                        <Table.Cell>
                          <Indicator tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Indicator>
                        </Table.Cell>
                        <Table.Cell className="truncate">{f.title}</Table.Cell>
                        <Table.Cell>
                          <TextLink>
                            <Link
                              to="/programs/$programId/controls/$controlId"
                              params={{ programId, controlId: f.control }}
                              search={{ tab: undefined }}
                            >
                              <Id>{f.control}</Id>
                            </Link>
                          </TextLink>
                        </Table.Cell>
                        <Table.Cell className="truncate">{f.lifecycle}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Box paddingBlockStart="space.150">
                  <Empty
                    title="No open findings"
                    description={
                      node.asset
                        ? `Nothing open against ${node.asset}.`
                        : "This component is not a tracked boundary asset, so findings attach to its host instead."
                    }
                  />
                </Box>
              )}
            </Section>

            <Section title="Provenance">
              <Fact.Group className="pt-150">
                <Fact label="Declared by">{node.bomSource}</Fact>
                <Fact label="BOM document">
                  {bom ? (
                    <span title={`${bom.name} · ${bom.producer} · ${bom.received}`}>
                      <Id>{bom.id}</Id>
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
              </Fact.Group>
              {node.note ? (
                <p className="max-w-layout-measure pt-100 font-body text-subtle">{node.note}</p>
              ) : null}
            </Section>
          </>
        )}
      </ShowPage>
    </Shell>
  );
}
