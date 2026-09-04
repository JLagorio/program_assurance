import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Badge,
  Button,
  Empty,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
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
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">POA&M item not found</h1>
          <TextLink size="medium">
            <Link to="/register">Back to the register</Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const fs = findingsForPoam(item.id).slice().sort(bySeverity);
  const risk = item.risk ? riskById.get(item.risk) : undefined;
  const slipped = item.scheduledCompletion !== item.originalCompletion;
  const controls = [...new Set(fs.map((f) => f.control))];

  return (
    <Shell>
      <>
        <ShowPage
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
                  <TextLink>
                    <Link to="/programs/$programId" params={{ programId: item.program }}>
                      <Id>{item.program}</Id>
                    </Link>
                  </TextLink>
                </KeyValue>
                <KeyValue label="Risk">
                  {risk ? (
                    <TextLink>
                      <Link to="/register/risks/$riskId" params={{ riskId: risk.id }}>
                        <Id>{risk.id}</Id>
                      </Link>
                    </TextLink>
                  ) : (
                    "Not aggregated"
                  )}
                </KeyValue>
                <KeyValue label="Open findings">{fs.filter(isOpen).length}</KeyValue>
              </Inspector.Group>
            </>
          }
          header={
            <RecordHeader
              back={<Link to="/register" />}
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
          tabs={<div className="border-b border-default" />}
        >
          <Section
            title="Planned remediation"
            description="The commitment. The dated task plan behind it lives on the control."
            action={
              controls.length ? (
                <Inline className="font-body-small" as="span" space="space.100" alignBlock="center">
                  {controls.map((c) => (
                    <TextLink key={c}>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId: item.program, controlId: c }}
                        search={{ tab: "Assessment" as const }}
                      >
                        {c} plan
                      </Link>
                    </TextLink>
                  ))}
                </Inline>
              ) : null
            }
          >
            <p className="max-w-layout-measure pt-150 font-body">{item.remediation}</p>
          </Section>

          <Section
            title="Latest milestone"
            description={
              slipped
                ? `Slipped from ${item.originalCompletion} to ${item.scheduledCompletion}.`
                : "On the original schedule."
            }
          >
            <p className="max-w-layout-measure font-body text-subtle">{item.milestoneNote}</p>
          </Section>

          <Section
            title="Findings this item closes"
            description={`${openCount(fs)} still open of ${fs.length}. The item cannot complete while any row remains open.`}
          >
            {fs.length ? (
              <Table className="table-fixed">
                <thead>
                  <tr>
                    <Table.Header width={112}>Finding</Table.Header>
                    <Table.Header>Title</Table.Header>
                    <Table.Header width={96}>Control</Table.Header>
                    <Table.Header width={104}>CCI</Table.Header>
                    <Table.Header width={132}>Asset</Table.Header>
                    <Table.Header width={78}>Severity</Table.Header>
                    <Table.Header width={112}>Lifecycle</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {fs.map((f) => (
                    <Table.Row key={f.id}>
                      <Table.Cell>
                        <TextLink>
                          <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                            <Id>{f.id}</Id>
                          </Link>
                        </TextLink>
                      </Table.Cell>
                      <Table.Cell className="truncate">
                        <TextLink>
                          <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                            {f.title}
                          </Link>
                        </TextLink>
                      </Table.Cell>
                      <Table.Cell>
                        <TextLink>
                          <Link
                            to="/programs/$programId/controls/$controlId"
                            params={{ programId: item.program, controlId: f.control }}
                            search={{ tab: "Assessment" as const }}
                            title={`Remediation plan for ${f.control}`}
                          >
                            <Id>{f.control}</Id>
                          </Link>
                        </TextLink>
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
              <Empty
                title="No findings attached"
                description="This commitment has nothing to close."
              />
            )}
          </Section>
        </ShowPage>
      </>
    </Shell>
  );
}
