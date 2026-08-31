import { createFileRoute, Link } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Meter,
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
import { assetById, bySeverity } from "@/lib/findings";
import {
  ccisForRisk,
  findingsForRisk,
  openCount,
  poamsForRisk,
  registerRisks,
} from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/register/risks/$riskId")({
  head: ({ params }) => {
    const r = registerRisks.find((x) => x.id === params.riskId);
    const title = r ? `${r.id} ${r.title} — risk register` : "Risk — Equinox";
    const description = r
      ? `${r.disposition} risk owned by ${r.owner}: residual ${r.residual} of inherent ${r.inherent}.`
      : "Aggregated residual risk the AO adjudicates.";
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
  component: RiskRecord,
});

function residualTone(v: number) {
  return v > 60 ? "danger" : v > 30 ? "warning" : "success";
}

function RiskRecord() {
  const { riskId } = Route.useParams();
  const risk = registerRisks.find((r) => r.id === riskId);

  if (!risk) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Risk not found</h1>
          <Link to="/register" className="text-[13px] text-primary hover:underline">
            Back to the register
          </Link>
        </div>
      </Shell>
    );
  }

  const fs = findingsForRisk(risk.id).slice().sort(bySeverity);
  const poams = poamsForRisk(risk.id);
  const ccis = ccisForRisk(risk.id);

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/register"
            id={risk.id}
            title={risk.title}
            meta={`${risk.owner} · reviewed ${risk.reviewed}`}
            actions={
              <>
                <Badge tone={statusTone(risk.disposition)}>{risk.disposition}</Badge>
                <Button variant="primary">Record AO decision</Button>
              </>
            }
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <RailGroup title="Exposure">
              <KeyValue label="Risk">
                <Mono>{risk.id}</Mono>
              </KeyValue>
              <KeyValue label="Likelihood × impact">
                {risk.likelihood} × {risk.impact}
              </KeyValue>
              <KeyValue label="Inherent">{risk.inherent}</KeyValue>
              <KeyValue label="Residual">
                <span className="flex items-center gap-2">
                  <Meter value={risk.residual} tone={residualTone(risk.residual)} />
                  <span className="tnum text-[12px] font-medium">{risk.residual}</span>
                </span>
              </KeyValue>
              <KeyValue label="Treatment">{risk.treatment}</KeyValue>
            </RailGroup>
            <RailGroup title="Adjudication">
              <KeyValue label="Disposition">
                <Badge tone={statusTone(risk.disposition)}>{risk.disposition}</Badge>
              </KeyValue>
              <KeyValue label="Owner">{risk.owner}</KeyValue>
              <KeyValue label="Reviewed">{risk.reviewed}</KeyValue>
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: risk.program }}
                  className="text-primary hover:underline"
                >
                  <Mono className="text-primary">{risk.program}</Mono>
                </Link>
              </KeyValue>
            </RailGroup>
            <RailGroup title="CCIs in scope">
              <div className="flex flex-wrap gap-1">
                {ccis.map((c) => (
                  <Mono key={c} className="text-[11.5px] text-muted-foreground">
                    {c}
                  </Mono>
                ))}
              </div>
            </RailGroup>
          </>
        }
      >
            <Section title="Risk statement">
              <p className="max-w-3xl text-[13px] leading-relaxed">{risk.statement}</p>
              {risk.aoNote ? (
                <p className="mt-3 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                  AO note — {risk.aoNote}
                </p>
              ) : null}
            </Section>

            <Section
              title="Reducing POA&M items"
              description={
                poams.length
                  ? "Each commitment below lowers the residual score when it completes."
                  : "Nothing is scheduled against this risk — the residual is untreated."
              }
            >
              {poams.length ? (
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "112px" }} />
                    <col />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "116px" }} />
                    <col style={{ width: "104px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>POA&M</Th>
                      <Th>Weakness</Th>
                      <Th>Owner</Th>
                      <Th>Scheduled</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {poams.map((p) => (
                      <Tr key={p.id}>
                        <Td>
                          <Link
                            to="/register/poam/$poamId"
                            params={{ poamId: p.id }}
                            className="hover:underline"
                          >
                            <Mono className="text-primary">{p.id}</Mono>
                          </Link>
                        </Td>
                        <Td className="truncate">{p.title}</Td>
                        <Td className="truncate text-muted-foreground">{p.owner}</Td>
                        <Td className="truncate text-[12px] text-muted-foreground">
                          {p.scheduledCompletion}
                        </Td>
                        <Td className="truncate">
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              ) : null}
            </Section>

            <Section
              title="Aggregated findings"
              description={`${openCount(fs)} open of ${fs.length}, across ${ccis.length} CCI${ccis.length === 1 ? "" : "s"}.`}
            >
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
