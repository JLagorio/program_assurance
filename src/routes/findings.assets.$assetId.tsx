import { createFileRoute, Link } from "@tanstack/react-router";

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
} from "@/components/app/ui";
import { assets, bySeverity, findingsByAsset, isOpen } from "@/lib/findings";
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

function AssetRecord() {
  const { assetId } = Route.useParams();
  const asset = assets.find((a) => a.id === assetId);

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
              <KeyValue label="Open CAT I">{asset.openCatI}</KeyValue>
              <KeyValue label="Open CAT II">{asset.openCatII}</KeyValue>
              <KeyValue label="Open CAT III">{asset.openCatIII}</KeyValue>
            </RailGroup>
          </>
        }
      >
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
                        <Badge tone={severityTone(f.mitigatedSeverity)}>{f.mitigatedSeverity}</Badge>
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
