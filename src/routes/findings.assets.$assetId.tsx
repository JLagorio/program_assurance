import { createFileRoute, Link } from "@tanstack/react-router";

import { BomTree, type BomTreeNode } from "@/components/app/composition";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  ShowPage,
  Section,
  Table,
  Td,
  Th,
  Tr,
  Severity,
} from "@/components/app/ui";
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
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Asset not found</h1>
          <Link to="/findings" className="text-[13px] text-primary hover:underline">
            Back to findings
          </Link>
        </div>
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
      <ShowPage
        header={
          <RecordHeader
            backTo="/findings"
            id={asset.id}
            title={asset.name}
            meta={`${asset.kind} · ${asset.technology} · ${asset.environment}`}
            actions={<Button variant="secondary">Re-scan asset</Button>}
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <RailGroup title="Inventory">
              <KeyValue label="Asset">
                <Mono>{asset.id}</Mono>
              </KeyValue>
              <KeyValue label="Kind">{asset.kind}</KeyValue>
              <KeyValue label="Technology">{asset.technology}</KeyValue>
              <KeyValue label="Environment">{asset.environment}</KeyValue>
              <KeyValue label="Owner">{asset.owner}</KeyValue>
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: asset.program }}
                  className="text-primary hover:underline"
                >
                  <Mono className="text-primary">{asset.program}</Mono>
                </Link>
              </KeyValue>
            </RailGroup>
            <RailGroup title="Posture">
              <KeyValue label="Last scan">{asset.lastScan}</KeyValue>
              <KeyValue label="CCIs covered">{asset.ccisCovered}</KeyValue>
            </RailGroup>
            <RailGroup title="Open findings">
              <KeyValue label="Scanner declared">
                <span className="tnum">
                  <span className={asset.openCatI ? "font-medium text-danger" : ""}>
                    {asset.openCatI}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    / {asset.openCatII} / {asset.openCatIII}
                  </span>
                </span>
              </KeyValue>
              <KeyValue label="As of">{asset.lastScan}</KeyValue>
              <KeyValue label="Register tracked">
                {tracked ? (
                  <span className="tnum">
                    <span className={tracked.catI ? "font-medium text-danger" : ""}>
                      {tracked.catI}
                    </span>
                    <span className="text-muted-foreground">
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
                  <span className={delta === 0 ? "tnum" : "tnum text-warning"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </KeyValue>
            </RailGroup>
          </>
        }
      >
        {anchor && tree ? (
          <Section
            title="Composition"
            description={`${asset.name} is anchored at ${anchor.id}. Findings resolve to the exact hardware, firmware or software part beneath it, not to the host.`}
          >
            <div className="flex flex-wrap items-center gap-1 pb-3 pt-3 text-[12.5px]">
              {trail.map((n, i) => {
                const last = i === trail.length - 1;
                return (
                  <span key={n.id} className="inline-flex items-center gap-1">
                    {i > 0 ? <span className="text-muted-foreground">/</span> : null}
                    <span className={last ? "font-medium" : "text-muted-foreground"}>{n.name}</span>
                  </span>
                );
              })}
            </div>
            <BomTree root={tree} defaultExpandedDepth={2} />
          </Section>
        ) : null}

        <Section
          title="Findings on this asset"
          description={`${open} open of ${rows.length} raised. Every row joins to a CCI through its rule or procedure.`}
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "112px" }} />
              <col />
              <col style={{ width: "104px" }} />
              <col style={{ width: "124px" }} />
              <col style={{ width: "78px" }} />
              <col style={{ width: "112px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Finding</Th>
                <Th>Title</Th>
                <Th>CCI</Th>
                <Th>Source</Th>
                <Th>Severity</Th>
                <Th>Lifecycle</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <Tr key={f.id}>
                  <Td>
                    <Link
                      to="/findings/$findingId"
                      params={{ findingId: f.id }}
                      className="hover:underline"
                    >
                      <Mono className="text-primary">{f.id}</Mono>
                    </Link>
                  </Td>
                  <Td className="truncate">{f.title}</Td>
                  <Td>
                    <Mono className="text-muted-foreground">{f.cci}</Mono>
                  </Td>
                  <Td className="truncate text-muted-foreground">{f.source}</Td>
                  <Td>
                    <Severity tone={severityTone(f.mitigatedSeverity)}>
                      {f.mitigatedSeverity}
                    </Severity>
                  </Td>
                  <Td className="truncate">
                    <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </ShowPage>
    </Shell>
  );
}
