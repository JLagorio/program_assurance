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
import { assetById, findings, findingsByCci, isOpen } from "@/lib/findings";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/findings/$findingId")({
  head: ({ params }) => {
    const f = findings.find((x) => x.id === params.findingId);
    const title = f ? `${f.id} ${f.title} — Equinox` : "Finding — Equinox";
    const description = f
      ? `${f.mitigatedSeverity} finding on ${f.cci} (${f.control}), verified by ${f.source}.`
      : "Technical finding joined to a CCI and an asset.";
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
  component: FindingRecord,
});

function FindingRecord() {
  const { findingId } = Route.useParams();
  const finding = findings.find((f) => f.id === findingId);

  if (!finding) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Finding not found</h1>
          <Link to="/findings" className="text-[13px] text-primary hover:underline">
            Back to findings
          </Link>
        </div>
      </Shell>
    );
  }

  const asset = assetById.get(finding.asset);
  const siblings = findingsByCci(finding.cci).filter((f) => f.id !== finding.id);

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/findings"
            id={finding.id}
            title={finding.title}
            meta={`${finding.control} · ${finding.source} · ${finding.owner}`}
            actions={
              <>
                <Badge tone={statusTone(finding.lifecycle)}>{finding.lifecycle}</Badge>
                <Button variant="secondary">Add to POA&amp;M</Button>
              </>
            }
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <RailGroup title="Join keys">
              <KeyValue label="CCI">
                <Mono>{finding.cci}</Mono>
              </KeyValue>
              <KeyValue label="Control">
                <Mono>{finding.control}</Mono>
              </KeyValue>
              <KeyValue label="Asset">
                <Link
                  to="/findings/assets/$assetId"
                  params={{ assetId: finding.asset }}
                  className="text-primary hover:underline"
                >
                  {asset?.name ?? finding.asset}
                </Link>
              </KeyValue>
              <KeyValue label="Rule">{finding.rule ? <Mono>{finding.rule}</Mono> : "—"}</KeyValue>
            </RailGroup>

            <RailGroup title="Provenance">
              <KeyValue label="Source">{finding.source}</KeyValue>
              <KeyValue label="Artifact">
                <Mono>{finding.sourceArtifact}</Mono>
              </KeyValue>
              <KeyValue label="First seen">{finding.firstSeen}</KeyValue>
              <KeyValue label="Last seen">{finding.lastSeen}</KeyValue>
              <KeyValue label="Occurrences">{finding.occurrences}</KeyValue>
            </RailGroup>

            <RailGroup title="Severity">
              <KeyValue label="Raw">{finding.rawSeverity}</KeyValue>
              <KeyValue label="Mitigated">
                <Badge tone={severityTone(finding.mitigatedSeverity)}>
                  {finding.mitigatedSeverity}
                </Badge>
              </KeyValue>
              <KeyValue label="Open">{isOpen(finding) ? "Yes" : "No"}</KeyValue>
            </RailGroup>

            <RailGroup title="Rolls up to">
              <KeyValue label="POA&M">
                {finding.poam ? <Mono>{finding.poam}</Mono> : "Not yet scheduled"}
              </KeyValue>
              <KeyValue label="Risk">
                {finding.risk ? <Mono>{finding.risk}</Mono> : "Not aggregated"}
              </KeyValue>
            </RailGroup>
          </>
        }
      >
            <p className="max-w-3xl text-[13px] leading-relaxed">{finding.detail}</p>

            {finding.mitigation ? (
              <Section
                title="Mitigation on record"
                description={`Raw ${finding.rawSeverity} reduced to ${finding.mitigatedSeverity}.`}
              >
                <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                  {finding.mitigation}
                </p>
              </Section>
            ) : null}

            <Section
              title="Same CCI"
              description={`${siblings.length} other finding${siblings.length === 1 ? "" : "s"} verify the same requirement.`}
            >
              {siblings.length ? (
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "112px" }} />
                    <col />
                    <col style={{ width: "160px" }} />
                    <col style={{ width: "78px" }} />
                    <col style={{ width: "112px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>Finding</Th>
                      <Th>Title</Th>
                      <Th>Asset</Th>
                      <Th>Severity</Th>
                      <Th>Lifecycle</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {siblings.map((f) => (
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
                        <Td className="truncate text-muted-foreground">
                          {assetById.get(f.asset)?.name ?? f.asset}
                        </Td>
                        <Td>
                          <Badge tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Badge>
                        </Td>
                        <Td className="truncate">
                          <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  This finding is the only evidence against {finding.cci}.
                </p>
              )}
            </Section>
      </ShowPage>
    </Shell>
  );
}
