import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  Badge,
  Box,
  Breadcrumb,
  Button,
  Empty,
  Id,
  Inline,
  Inspector,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  Tabs,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  BomSummary,
  BomTree,
  NodeRail,
  PostureStrip,
  ReconciliationTable,
  SupplyChainTable,
  type BomTreeNode,
} from "@/components/app/composition";
import {
  bomDocuments,
  childrenOf,
  compositionEdges,
  crossesBoundary,
  pathOf,
  useCompositionGraph,
  type CompositionNode,
} from "@/lib/composition";
import { assetById } from "@/lib/findings";
import { DerivedControlTrace, ElementAllocationTable } from "@/components/app/requirements";
import { allocationsOn, derivedControlTrace, requirementById } from "@/lib/requirements";
import { bomStats, inventoryReconciliation, postureOf } from "@/lib/graph-posture";
import { programs } from "@/lib/grc-data";
import { parseGateDate } from "@/lib/program-stage";

const compositionTabs = ["Tree", "Supply chain", "Reconciliation", "BOM documents"] as const;
type CompositionTab = (typeof compositionTabs)[number];

/** The dataset clock. A render path never calls `new Date()`. */
const asOf = "Aug 30, 2026";
const asOfDate = parseGateDate(asOf);

/** A delivered BOM this old no longer describes what is deployed. */
const staleAfterDays = 90;

function ageInDays(received: string): number | null {
  const when = parseGateDate(received);
  if (!when || !asOfDate) return null;
  return Math.round((asOfDate.getTime() - when.getTime()) / 86_400_000);
}

export const Route = createFileRoute("/programs/$programId_/composition")({
  // `tab` is emitted unconditionally — the validated object is merged over the
  // raw search, so returning it only on a match leaves `?tab=Bogus` in the URL
  // and renders a tab strip over an empty body. `node` keeps the conditional
  // spread: it is validated independently and an invalid node should just drop.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: CompositionTab | undefined; node?: string } => {
    const raw = String(search["tab"] ?? "");
    const match = compositionTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    const node = search["node"];
    const selected = typeof node === "string" && /^CN-\d+$/.test(node) ? node : null;
    return { tab: match, ...(selected ? { node: selected } : {}) };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} composition — Equinox` },
      {
        name: "description",
        content: `System composition for ${loaderData?.id ?? "the program"}: the hardware, firmware and software bill of materials, supplier provenance, scanner-to-register reconciliation and the delivered BOM documents.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} composition — Equinox` },
      {
        property: "og:description",
        content: "HBOM, FBOM and SBOM for the system, with posture rolled up the component tree.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramComposition,
});

/**
 * Builds the render tree from the store's parent-pointer graph. Cycle-safe: a
 * node already placed is never followed a second time, so a malformed parent
 * chain yields a truncated branch rather than a hang.
 */
function buildTree(root: CompositionNode): BomTreeNode {
  const seen = new Set<string>();
  const walk = (node: CompositionNode): BomTreeNode => {
    seen.add(node.id);
    const kids = childrenOf(node.id).filter((c) => !seen.has(c.id));
    return { node, posture: postureOf(node.id), children: kids.map(walk) };
  };
  return walk(root);
}

function ProgramComposition() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Tree";
  const navigate = useNavigate({ from: Route.fullPath });

  const nodes = useCompositionGraph(program.id);

  const root = useMemo(() => nodes.find((n) => n.parent === null) ?? null, [nodes]);
  const tree = useMemo(() => (root ? buildTree(root) : null), [root]);
  const rootPosture = useMemo(() => (root ? postureOf(root.id) : null), [root]);

  const selectedId = search.node ?? root?.id ?? null;
  const selected = useMemo(
    () => (selectedId ? (nodes.find((n) => n.id === selectedId) ?? null) : null),
    [nodes, selectedId],
  );
  const selectedPosture = useMemo(() => (selected ? postureOf(selected.id) : null), [selected]);
  // Requirement allocations landing on this part, and the control obligations
  // they reach. Neither is stored on the node — see `derivedControlTrace`.
  const selectedAllocations = useMemo(
    () => (selected ? allocationsOn(selected.id) : []),
    [selected],
  );
  const selectedTrace = useMemo(() => derivedControlTrace(selected?.id ?? ""), [selected]);

  // Both read the store's own version-keyed memos, so they are recomputed on
  // every render deliberately: a `useMemo` here would have to be keyed on the
  // graph version anyway, and would go stale the moment a node is reclassified.
  const stats = bomStats(program.id);
  const reconciliation = inventoryReconciliation(program.id);

  const docs = useMemo(() => bomDocuments.filter((d) => d.program === program.id), [program.id]);

  const edges = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    return compositionEdges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }, [nodes]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const zoneOf = (id: string) => byId.get(id)?.zone ?? "—";

  const go = (next: CompositionTab) =>
    navigate({ search: { ...search, tab: next }, replace: true });

  const select = (nodeId: string) =>
    navigate({ search: { ...search, node: nodeId }, replace: true });

  /** One navigation, so the tab and the selection never race each other. */
  const openInTree = (nodeId: string) =>
    navigate({ search: { ...search, tab: "Tree", node: nodeId }, replace: true });

  const crossings = edges.filter(crossesBoundary).length;
  const unsigned = docs.filter((d) => !d.signed).length;
  const stale = docs.filter((d) => {
    const age = ageInDays(d.received);
    return age !== null && age > staleAfterDays;
  }).length;

  const counts: Record<CompositionTab, number | null> = {
    Tree: stats.nodes || null,
    "Supply chain": stats.suppliers || null,
    Reconciliation: reconciliation.filter((r) => !r.agrees).length || null,
    "BOM documents": docs.length || null,
  };

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            back={<Link to="/programs/$programId" params={{ programId: program.id }} />}
            breadcrumb={
              <Breadcrumb>
                <Breadcrumb.Item asChild>
                  <Link to={"/programs"}>{"Programs"}</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item asChild>
                  <Link to={"/programs/$programId"} params={{ programId: program.id }}>
                    {program.name}
                  </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item isCurrent>{"System composition"}</Breadcrumb.Item>
              </Breadcrumb>
            }
            id={program.id}
            title={`${program.name} — system composition`}
            meta={`${program.system} · ${program.environment} · ${stats.nodes} components · ${stats.suppliers} suppliers`}
            actions={
              <>
                <Badge tone={stats.unattested > 0 ? "warning" : "success"}>
                  {stats.unattested} unattested
                </Badge>
                <TextLink size="small">
                  <Link to="/programs/$programId" params={{ programId: program.id }}>
                    Program record
                  </Link>
                </TextLink>
              </>
            }
          />
        }
        tabs={
          <Tabs>
            {compositionTabs.map((key) => (
              <Tabs.Tab
                key={key}
                isSelected={tab === key}
                onClick={() => go(key)}
                count={counts[key] || null}
              >
                {key}
              </Tabs.Tab>
            ))}
          </Tabs>
        }
        showRail={tab === "Tree" && selected !== null}
        rail={
          selected ? (
            <>
              <NodeRail node={selected} posture={selectedPosture} />
              <Inspector.Group title="Record">
                <KeyValue label="Open">
                  <TextLink>
                    <Link
                      to="/programs/$programId/components/$componentId"
                      params={{ programId: program.id, componentId: selected.id }}
                    >
                      {selected.name}
                    </Link>
                  </TextLink>
                </KeyValue>
                <KeyValue label="Requirements">{selectedAllocations.length || "None"}</KeyValue>
                <KeyValue label="Controls reached">
                  {selectedTrace.controls.length || "None"}
                </KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Joins">
                <KeyValue label="Path">
                  <span className="font-body-small">
                    {pathOf(selected.id)
                      .map((n) => n.name)
                      .join(" / ")}
                  </span>
                </KeyValue>
                <KeyValue label="Asset">
                  {selected.asset && assetById.has(selected.asset) ? (
                    <TextLink>
                      <Link to="/findings/assets/$assetId" params={{ assetId: selected.asset }}>
                        <Id>{selected.asset}</Id>
                      </Link>
                    </TextLink>
                  ) : (
                    "Not a boundary asset"
                  )}
                </KeyValue>
                <KeyValue label="Worst part">
                  {selectedPosture?.worstNode ? (
                    <Button
                      onClick={() => select(selectedPosture.worstNode ?? selected.id)}
                      variant="link"
                    >
                      <Id className="text-brand">{nameOf(selectedPosture.worstNode)}</Id>
                    </Button>
                  ) : (
                    "—"
                  )}
                </KeyValue>
                <KeyValue label="Program">
                  <TextLink>
                    <Link to="/programs/$programId" params={{ programId: program.id }}>
                      <Id>{program.id}</Id>
                    </Link>
                  </TextLink>
                </KeyValue>
              </Inspector.Group>
            </>
          ) : null
        }
      >
        {!root || !tree || !rootPosture ? (
          <Section
            title="System composition"
            description="No hardware, firmware or software items have been declared for this program."
          >
            <Box paddingBlockStart="space.200">
              <Empty
                title="Nothing in the composition"
                description={`${program.id} carries no BOM. A CycloneDX, SPDX, hardware part list or firmware manifest delivery populates this page.`}
              />
            </Box>
          </Section>
        ) : null}

        {root && tree && rootPosture && tab === "Tree" ? (
          <>
            <Section
              title="Rollup"
              description="Every finding in the subtree, counted once at the part it names and once at each ancestor above it."
            >
              <Box paddingBlockStart="space.200">
                <PostureStrip posture={rootPosture} />
              </Box>
            </Section>

            <Section
              title="Bill of materials"
              description="Hardware, firmware and software as one strict containment tree. Select a part to load it into the rail."
            >
              <BomTree root={tree} selected={selectedId} onSelect={select} />
            </Section>

            <Section
              title="Reachability"
              description={`${edges.length} declared connections, ${crossings} of which cross a trust boundary. Containment says what a thing is made of; these say what can reach it.`}
            >
              <Table className="table-fixed">
                <thead>
                  <tr>
                    <Table.Header width={180}>From</Table.Header>
                    <Table.Header width={132}>Relation</Table.Header>
                    <Table.Header width={180}>To</Table.Header>
                    <Table.Header>Via</Table.Header>
                    <Table.Header width={108}>Redundancy</Table.Header>
                    <Table.Header width={132}>Boundary</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {edges.map((e) => (
                    <Table.Row key={`${e.from}-${e.kind}-${e.to}`}>
                      <Table.Cell className="truncate">
                        <button
                          type="button"
                          onClick={() => select(e.from)}
                          className="truncate text-left hover:underline"
                        >
                          {nameOf(e.from)}
                        </button>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge size="xsmall">{e.kind}</Badge>
                      </Table.Cell>
                      <Table.Cell className="truncate">
                        <button
                          type="button"
                          onClick={() => select(e.to)}
                          className="truncate text-left hover:underline"
                        >
                          {nameOf(e.to)}
                        </button>
                      </Table.Cell>
                      <Table.Cell className="truncate" title={e.via}>
                        {e.via}
                      </Table.Cell>
                      <Table.Cell>{e.critical ? "No redundancy" : "Redundant"}</Table.Cell>
                      <Table.Cell>
                        {crossesBoundary(e) ? (
                          <Badge size="xsmall" tone="warning">
                            {zoneOf(e.from)} → {zoneOf(e.to)}
                          </Badge>
                        ) : (
                          <span className="text-subtle">Same zone</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>
          </>
        ) : null}

        {root && tab === "Supply chain" ? (
          <>
            <Section
              title="Composition profile"
              description="What the system is made of, where it came from, and how much of it arrived with an attestation."
            >
              <Box paddingBlockStart="space.200">
                <BomSummary stats={stats} />
              </Box>
            </Section>

            <Section
              title="Suppliers"
              description={`Provenance by supplier as of ${asOf}. A part with no attestation on file cannot be cleared under SR-4.`}
            >
              <SupplyChainTable nodes={nodes} asOf={asOf} />
            </Section>
          </>
        ) : null}

        {root && tab === "Reconciliation" ? (
          <Section
            title="Scanner declared against register tracked"
            description="The asset row carries what the last full scan declared; the register carries what is currently open against it. The delta is the number the package has to explain."
          >
            <ReconciliationTable
              rows={reconciliation}
              onSelect={(assetId) =>
                navigate({ to: "/findings/assets/$assetId", params: { assetId } })
              }
            />
          </Section>
        ) : null}

        {root && tab === "BOM documents" ? (
          <Section
            title="Delivered BOM documents"
            description={`${docs.length} deliveries assert this composition. ${unsigned} unsigned · ${stale} older than ${staleAfterDays} days as of ${asOf}.`}
          >
            {docs.length ? (
              <Table className="table-fixed">
                <thead>
                  <tr>
                    <Table.Header width={104}>Document</Table.Header>
                    <Table.Header>Name</Table.Header>
                    <Table.Header width={152}>Format</Table.Header>
                    <Table.Header width={168}>Producer</Table.Header>
                    <Table.Header width={104} className="text-right">
                      Received
                    </Table.Header>
                    <Table.Header width={88} className="text-right">
                      Parts
                    </Table.Header>
                    <Table.Header width={116}>Subject</Table.Header>
                    <Table.Header width={128}>Integrity</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => {
                    const age = ageInDays(d.received);
                    const isStale = age !== null && age > staleAfterDays;
                    return (
                      <Table.Row key={d.id}>
                        <Table.Cell>
                          <Id>{d.id}</Id>
                        </Table.Cell>
                        <Table.Cell className="truncate" title={d.name}>
                          {d.name}
                        </Table.Cell>
                        <Table.Cell>
                          {d.format} {d.specVersion}
                        </Table.Cell>
                        <Table.Cell className="truncate" title={d.producer}>
                          {d.producer}
                        </Table.Cell>
                        <Table.Cell
                          className={
                            isStale
                              ? "tabular-nums text-right text-warning"
                              : "tabular-nums text-right"
                          }
                          title={age === null ? d.received : `${age} days old`}
                        >
                          {d.received}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{d.components}</Table.Cell>
                        <Table.Cell className="truncate">
                          <button
                            type="button"
                            onClick={() => openInTree(d.subject)}
                            className="truncate text-left hover:underline"
                            title={nameOf(d.subject)}
                          >
                            {nameOf(d.subject)}
                          </button>
                        </Table.Cell>
                        <Table.Cell>
                          <Inline as="span" space="space.075" alignBlock="center">
                            <Badge size="xsmall" tone={d.signed ? "success" : "warning"}>
                              {d.signed ? "Signed" : "Unsigned"}
                            </Badge>
                            <span title={`sha256:${d.sha256}`}>
                              <Id className="text-subtle">{d.sha256.slice(0, 8)}…</Id>
                            </span>
                          </Inline>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : (
              <Box paddingBlockStart="space.200">
                <Empty
                  title="No BOM deliveries on file"
                  description="Every component below was hand-declared. A signed CycloneDX or SPDX delivery replaces the declaration with an assertion."
                />
              </Box>
            )}
          </Section>
        ) : null}
      </ShowPage>
    </Shell>
  );
}
