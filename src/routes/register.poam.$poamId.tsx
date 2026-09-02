import { createFileRoute, Link } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  Id,
  Indicator,
} from "@/components/app/ui";
import { assetById, bySeverity, isOpen } from "@/lib/findings";
import { findingsForPoam, openCount, poamItems, riskById } from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";
import { Inspector } from "@/components/app/shapes";

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
  const controls = [...new Set(fs.map((f) => f.control))];

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
            <Inspector.Group title="Commitment">
              <KeyValue label="POA&M">
                <Id>{item.id}</Id>
              </KeyValue>
              <KeyValue label="Status">
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </KeyValue>
              <KeyValue label="Owner">{item.owner}</KeyValue>
              <KeyValue label="Resources">{item.resources}</KeyValue>
              <KeyValue label="Scheduled">{item.scheduledCompletion}</KeyValue>
              <KeyValue label="Original">{item.originalCompletion}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Joins">
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: item.program }}
                  className="text-primary hover:underline"
                >
                  <Id className="text-primary">{item.program}</Id>
                </Link>
              </KeyValue>
              <KeyValue label="Risk">
                {risk ? (
                  <Link
                    to="/register/risks/$riskId"
                    params={{ riskId: risk.id }}
                    className="text-primary hover:underline"
                  >
                    <Id className="text-primary">{risk.id}</Id>
                  </Link>
                ) : (
                  "Not aggregated"
                )}
              </KeyValue>
              <KeyValue label="Open findings">{fs.filter(isOpen).length}</KeyValue>
            </Inspector.Group>
          </>
        }
      >
        <Section
          title="Planned remediation"
          description="The commitment. The dated task plan behind it lives on the control."
          action={
            controls.length ? (
              <span className="flex items-center gap-2 text-12">
                {controls.map((c) => (
                  <Link
                    key={c}
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId: item.program, controlId: c }}
                    search={{ tab: "Assessment" as const }}
                    className="text-primary hover:underline"
                  >
                    {c} plan
                  </Link>
                ))}
              </span>
            ) : null
          }
        >
          <p className="max-w-3xl pt-3 text-[13px] leading-relaxed">{item.remediation}</p>
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
                <col style={{ width: "96px" }} />
                <col style={{ width: "104px" }} />
                <col style={{ width: "132px" }} />
                <col style={{ width: "78px" }} />
                <col style={{ width: "112px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Table.Header>Finding</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header>Control</Table.Header>
                  <Table.Header>CCI</Table.Header>
                  <Table.Header>Asset</Table.Header>
                  <Table.Header>Severity</Table.Header>
                  <Table.Header>Lifecycle</Table.Header>
                </tr>
              </thead>
              <tbody>
                {fs.map((f) => (
                  <Table.Row key={f.id}>
                    <Table.Cell>
                      <Link
                        to="/findings/$findingId"
                        params={{ findingId: f.id }}
                        className="hover:underline"
                      >
                        <Id className="text-primary">{f.id}</Id>
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="truncate">
                      <Link
                        to="/findings/$findingId"
                        params={{ findingId: f.id }}
                        className="hover:underline"
                      >
                        {f.title}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId: item.program, controlId: f.control }}
                        search={{ tab: "Assessment" as const }}
                        className="hover:underline"
                        title={`Remediation plan for ${f.control}`}
                      >
                        <Id className="text-primary">{f.control}</Id>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Id>{f.cci}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate">
                      {assetById.get(f.asset)?.name ?? f.asset}
                    </Table.Cell>
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
