import { createFileRoute, Link } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { assetById, bySeverity, isOpen } from "@/lib/findings";
import { findingsForPoam, openCount, poamItems, riskById } from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/register/poam/$poamId")({
  head: ({ params }) => {
    const p = poamItems.find((x) => x.id === params.poamId);
    const title = p ? `${p.id} ${p.title} — POA&M` : "POA&M item — Equinox";
    const description = p
      ? `${p.status} POA&M item owned by ${p.owner}, scheduled ${p.scheduledCompletion}.`
      : "Dated commitment to close a set of findings.";
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
  component: PoamRecord,
});

function PoamRecord() {
  const { poamId } = Route.useParams();
  const item = poamItems.find((p) => p.id === poamId);

  if (!item) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">POA&M item not found</h1>
          <Link to="/register" className="text-[13px] text-primary hover:underline">
            Back to the register
          </Link>
        </div>
      </Shell>
    );
  }

  const fs = findingsForPoam(item.id).slice().sort(bySeverity);
  const risk = item.risk ? riskById.get(item.risk) : undefined;
  const slipped = item.scheduledCompletion !== item.originalCompletion;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/register"
            id={item.id}
            title={item.title}
            meta={`${item.owner} · scheduled ${item.scheduledCompletion}`}
            actions={
              <>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                <Button variant="secondary">Update milestone</Button>
              </>
            }
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <RailGroup title="Commitment">
              <KeyValue label="POA&M">
                <Mono>{item.id}</Mono>
              </KeyValue>
              <KeyValue label="Status">
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </KeyValue>
              <KeyValue label="Owner">{item.owner}</KeyValue>
              <KeyValue label="Resources">{item.resources}</KeyValue>
              <KeyValue label="Scheduled">{item.scheduledCompletion}</KeyValue>
              <KeyValue label="Original">{item.originalCompletion}</KeyValue>
            </RailGroup>
            <RailGroup title="Joins">
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: item.program }}
                  className="text-primary hover:underline"
                >
                  <Mono className="text-primary">{item.program}</Mono>
                </Link>
              </KeyValue>
              <KeyValue label="Risk">
                {risk ? (
                  <Link
                    to="/register/risks/$riskId"
                    params={{ riskId: risk.id }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{risk.id}</Mono>
                  </Link>
                ) : (
                  "Not aggregated"
                )}
              </KeyValue>
              <KeyValue label="Open findings">{fs.filter(isOpen).length}</KeyValue>
            </RailGroup>
          </>
        }
      >
            <Section title="Planned remediation">
              <p className="max-w-3xl text-[13px] leading-relaxed">{item.remediation}</p>
            </Section>

            <Section
              title="Latest milestone"
              description={
                slipped
                  ? `Slipped from ${item.originalCompletion} to ${item.scheduledCompletion}.`
                  : "On the original schedule."
              }
            >
              <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                {item.milestoneNote}
              </p>
            </Section>

            <Section
              title="Findings this item closes"
              description={`${openCount(fs)} still open of ${fs.length}. The item cannot complete while any row remains open.`}
            >
              {fs.length ? (
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "112px" }} />
                    <col />
                    <col style={{ width: "104px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "78px" }} />
                    <col style={{ width: "112px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>Finding</Th>
                      <Th>Title</Th>
                      <Th>CCI</Th>
                      <Th>Asset</Th>
                      <Th>Severity</Th>
                      <Th>Lifecycle</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {fs.map((f) => (
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
                  No findings are attached — this commitment has nothing to close.
                </p>
              )}
            </Section>
      </ShowPage>
    </Shell>
  );
}
