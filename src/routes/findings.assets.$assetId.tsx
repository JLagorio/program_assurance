import { createFileRoute, Link } from "@tanstack/react-router";

import { BomTree, type BomTreeNode } from "@/components/app/composition";
import {
  Badge,
  Button,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  Panel,
  RecordHeader,
  Section,
  Shell as DsShell,
  ShowPage,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import type { CompositionNode } from "@/lib/composition";
import { childrenOf, nodeForAsset, pathOf, useCompositionGraph } from "@/lib/composition";
import { assets, bySeverity, findingsByAsset, isOpen } from "@/lib/findings";
import { assetPosture, postureOf } from "@/lib/graph-posture";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/findings/assets/$assetId")({
  head: ({ params }) => {
    const a = assets.find((x) => x.id === params.assetId);
    const title = a ? `${a.name} — asset ${a.id}` : "Asset — Equinox";
    const description = a
      ? `${a.kind} running ${a.technology} in ${a.environment}, with every finding raised against it.`
      : "Boundary asset and the findings raised against it.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: AssetRecord,
});

/**
 * The asset's own subtree, built straight off the graph. Cycle-safe: a repeated
 * id is dropped rather than followed, so a malformed parent chain truncates.
 */
function subtree(node: CompositionNode, seen: Set<string>): BomTreeNode | null {
  if (seen.has(node.id)) return null;
  seen.add(node.id);
  const children: BomTreeNode[] = [];
  for (const child of childrenOf(node.id)) {
    const built = subtree(child, seen);
    if (built) children.push(built);
  }
  return { node, posture: postureOf(node.id), children };
}

function AssetRecord() {
  const { assetId } = Route.useParams();
  const asset = assets.find((a) => a.id === assetId);
  // Subscribes the page to the composition store so a node override re-renders
  // the tree. Called before the guard below so hook order never varies.
  useCompositionGraph(asset?.program ?? "");

  if (!asset) {
    return (
      <Shell>
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Asset not found</h1>
          <TextLink size="medium">
            <Link to="/findings">Back to findings</Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const rows = findingsByAsset(asset.id).slice().sort(bySeverity);
  const open = rows.filter(isOpen).length;

  const anchor = nodeForAsset(asset.id);
  const trail = anchor ? pathOf(anchor.id) : [];
  const tree = anchor ? subtree(anchor, new Set<string>()) : null;
  const tracked = assetPosture(asset.id)?.rolled ?? null;
  const declaredTotal = asset.openCatI + asset.openCatII + asset.openCatIII;
  const delta = tracked ? declaredTotal - tracked.open : null;

  return (
    <Shell>
      <>
        <ShowPage
          header={
            <RecordHeader
              back={<Link to="/findings" />}
              id={asset.id}
              title={asset.name}
              meta={`${asset.kind} · ${asset.technology} · ${asset.environment}`}
              actions={<Button variant="secondary">Re-scan asset</Button>}
            />
          }
          tabs={<div className="border-b border-default" />}
        >
          {anchor && tree ? (
            <Section
              title="Composition"
              description={`${asset.name} is anchored at ${anchor.id}. Findings resolve to the exact hardware, firmware or software part beneath it, not to the host.`}
            >
              <Inline
                className="pb-150 pt-150 font-body-small"
                space="space.050"
                alignBlock="center"
                shouldWrap
              >
                {trail.map((n, i) => {
                  const last = i === trail.length - 1;
                  return (
                    <Inline
                      key={n.id}
                      as="span"
                      display="inline-flex"
                      space="space.050"
                      alignBlock="center"
                    >
                      {i > 0 ? <span className="text-subtle">/</span> : null}
                      <span className={last ? "font-medium" : "text-subtle"}>{n.name}</span>
                    </Inline>
                  );
                })}
              </Inline>
              <BomTree root={tree} defaultExpandedDepth={2} />
            </Section>
          ) : null}

          <Section
            title="Findings on this asset"
            description={`${open} open of ${rows.length} raised. Every row joins to a CCI through its rule or procedure.`}
          >
            <Table className="table-fixed">
              <thead>
                <tr>
                  <Table.Header width={112}>Finding</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={104}>CCI</Table.Header>
                  <Table.Header width={124}>Source</Table.Header>
                  <Table.Header width={78}>Severity</Table.Header>
                  <Table.Header width={112}>Lifecycle</Table.Header>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <Table.Row key={f.id}>
                    <Table.Cell>
                      <TextLink>
                        <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                          <Id>{f.id}</Id>
                        </Link>
                      </TextLink>
                    </Table.Cell>
                    <Table.Cell className="truncate">{f.title}</Table.Cell>
                    <Table.Cell>
                      <Id>{f.cci}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate">{f.source}</Table.Cell>
                    <Table.Cell>
                      <Indicator tone={severityTone(f.mitigatedSeverity)}>
                        {f.mitigatedSeverity}
                      </Indicator>
                    </Table.Cell>
                    <Table.Cell className="truncate">
                      <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          </Section>
        </ShowPage>
        <DsShell.Panel label="Details">
          <DsShell.Panel.Splitter label="Resize details" />
          <Panel flush>
            <Inspector.Group title="Inventory">
              <KeyValue label="Asset">
                <Id>{asset.id}</Id>
              </KeyValue>
              <KeyValue label="Kind">{asset.kind}</KeyValue>
              <KeyValue label="Technology">{asset.technology}</KeyValue>
              <KeyValue label="Environment">{asset.environment}</KeyValue>
              <KeyValue label="Owner">{asset.owner}</KeyValue>
              <KeyValue label="Program">
                <TextLink>
                  <Link to="/programs/$programId" params={{ programId: asset.program }}>
                    <Id>{asset.program}</Id>
                  </Link>
                </TextLink>
              </KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Posture">
              <KeyValue label="Last scan">{asset.lastScan}</KeyValue>
              <KeyValue label="CCIs covered">{asset.ccisCovered}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Open findings">
              <KeyValue label="Scanner declared">
                <span className="tabular-nums">
                  <span className={asset.openCatI ? "font-medium text-danger" : ""}>
                    {asset.openCatI}
                  </span>
                  <span className="text-subtle">
                    {" "}
                    / {asset.openCatII} / {asset.openCatIII}
                  </span>
                </span>
              </KeyValue>
              <KeyValue label="As of">{asset.lastScan}</KeyValue>
              <KeyValue label="Register tracked">
                {tracked ? (
                  <span className="tabular-nums">
                    <span className={tracked.catI ? "font-medium text-danger" : ""}>
                      {tracked.catI}
                    </span>
                    <span className="text-subtle">
                      {" "}
                      / {tracked.catII} / {tracked.catIII}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </KeyValue>
              <KeyValue label="Delta">
                {delta === null ? (
                  "—"
                ) : (
                  <span className={delta === 0 ? "tabular-nums" : "tabular-nums text-warning"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </KeyValue>
            </Inspector.Group>
          </Panel>
        </DsShell.Panel>
      </>
    </Shell>
  );
}
