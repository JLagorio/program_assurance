import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment } from "react";

import { Shell } from "@/components/app/shell";
import { TextBlock } from "@/components/app/control-text";
import {
  Badge,
  Button,
  EmptyState,
  KeyValue,
  Meter,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  Id,
  Indicator,
} from "@/components/app/ui";
import { assetById, bySeverity } from "@/lib/findings";
import {
  ccisForRisk,
  findingsForRisk,
  openCount,
  poamsForRisk,
  registerRisks,
} from "@/lib/register";
import { authoredComparison, bandTone, scoreRisk, type ScoreFactor } from "@/lib/risk-scoring";
import { severityTone, statusTone } from "@/lib/spine";
import { Inspector } from "@/components/app/shapes";

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

/** `+12`, `-8`, `0` — the sign is the whole point of the mitigation credit. */
function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
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
  // Computed BESIDE the authored numbers, never over them. `scoreRisk` returns
  // null when no finding is joined to the risk: scoring it from the authored
  // likelihood and impact would re-badge a judgement as a derivation.
  const computed = scoreRisk(risk.id);
  const comparison = authoredComparison(risk.id);
  const credit = computed?.factors.find((f) => f.key === "mitigation")?.contribution ?? 0;

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
            <Inspector.Group title="Exposure">
              <KeyValue label="Risk">
                <Id>{risk.id}</Id>
              </KeyValue>
              <KeyValue label="Likelihood × impact">
                {risk.likelihood} × {risk.impact}
              </KeyValue>
              <KeyValue label="Inherent">
                <span className="tnum">{risk.inherent}</span>
                <span className="ml-1.5 text-[11.5px] text-muted-foreground">authored</span>
              </KeyValue>
              <KeyValue label="Residual">
                <span className="flex items-center gap-2">
                  <Meter value={risk.residual} tone={residualTone(risk.residual)} />
                  <span className="tnum text-[12px] font-medium">{risk.residual}</span>
                  <span className="text-[11.5px] text-muted-foreground">authored</span>
                </span>
              </KeyValue>
              <KeyValue label="Computed">
                {computed ? (
                  <span className="flex items-center gap-2">
                    <span className="tnum text-[12px] font-medium">{computed.score}</span>
                    <Badge tone={bandTone[computed.band]}>{computed.band}</Badge>
                  </span>
                ) : (
                  "—"
                )}
              </KeyValue>
              <KeyValue label="Treatment">{risk.treatment}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Adjudication">
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
                  <Id className="text-primary">{risk.program}</Id>
                </Link>
              </KeyValue>
            </Inspector.Group>
            <Inspector.Group title="CCIs in scope">
              <div className="flex flex-wrap gap-1">
                {ccis.map((c) => (
                  <Id key={c} className="text-[11.5px] text-muted-foreground">
                    {c}
                  </Id>
                ))}
              </div>
            </Inspector.Group>
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
          title="Residual risk"
          description={
            computed
              ? `Computed ${computed.score} of 100 — ${computed.band} — against the assessor's authored ${risk.residual}. Neither number replaces the other.`
              : "No finding is joined to this risk, so there is nothing to compute a residual from."
          }
        >
          {computed && comparison ? (
            <>
              <div className="grid gap-3 pt-4 md:grid-cols-2">
                <div className="rounded-md border border-border p-3">
                  <p className="text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Authored — risk register
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="tnum text-[30px] font-semibold leading-none">
                      {comparison.authored.residual}
                    </span>
                    <span className="text-[12px] text-muted-foreground">residual / 100</span>
                  </div>
                  <div className="mt-3">
                    <Meter
                      value={comparison.authored.residual}
                      tone={residualTone(risk.residual)}
                    />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-[12px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Likelihood × impact</dt>
                      <dd className="tnum">
                        {comparison.authored.likelihood} × {comparison.authored.impact}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Inherent</dt>
                      <dd className="tnum">{comparison.authored.inherent}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-1.5">
                      <dt className="font-medium">Residual</dt>
                      <dd className="tnum font-medium">{comparison.authored.residual}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    {risk.owner} wrote this down on {risk.reviewed}. It is the number the AO has
                    seen, and nothing on this page overwrites it.
                  </p>
                </div>

                <div className="rounded-md border border-border p-3">
                  <p className="text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Computed — evidence trail
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="tnum text-[30px] font-semibold leading-none">
                      {computed.score}
                    </span>
                    <span className="text-[12px] text-muted-foreground">residual / 100</span>
                    <Badge tone={bandTone[computed.band]}>{computed.band}</Badge>
                  </div>
                  <div className="mt-3">
                    <Meter value={computed.score} tone={bandTone[computed.band]} />
                  </div>
                  <dl className="mt-3 space-y-1.5 text-[12px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Inherent</dt>
                      <dd className="tnum">{computed.inherent}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Mitigation credit</dt>
                      <dd className={credit < 0 ? "tnum text-success" : "tnum"}>
                        {signed(credit)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-1.5">
                      <dt className="font-medium">Residual</dt>
                      <dd className="tnum font-medium">{computed.score}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    Aggregated from the {fs.length} joined finding{fs.length === 1 ? "" : "s"} by
                    taking the worst reading on each of the six factors — a risk is no more
                    mitigated than its least-mitigated component.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <TextBlock label="Disagreement">{comparison.note}</TextBlock>
                <TextBlock label="Greatest leverage">{computed.leverage}</TextBlock>
                <TextBlock label="Caveats">
                  {computed.caveats.length === 0 ? (
                    <span className="text-muted-foreground">
                      None. Every one of the six terms was computed from live evidence, so the score
                      is not provisional.
                    </span>
                  ) : (
                    <ul className="space-y-1.5">
                      {computed.caveats.map((c) => (
                        <li key={c} className="border-l-2 border-border pl-2">
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </TextBlock>
              </div>
            </>
          ) : (
            <EmptyState
              title="Nothing to compute from"
              description={`${risk.id} has no finding joined to it, so there is no severity, exposure or mission evidence to read. Deriving a residual from the authored likelihood and impact would re-badge the assessor's judgement as a calculation, which is exactly what the score exists to prevent. The authored ${risk.residual} stands on its own.`}
            />
          )}
        </Section>

        {computed ? (
          <Section
            title="Calculation"
            description="Five weighted terms and one credit. Each row carries the input it read, the arithmetic, the ids it rests on, and one sentence an assessor can disagree with."
          >
            <FactorTrail factors={computed.factors} score={computed.score} />
          </Section>
        ) : null}

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
                  <Table.Header>POA&M</Table.Header>
                  <Table.Header>Weakness</Table.Header>
                  <Table.Header>Owner</Table.Header>
                  <Table.Header>Scheduled</Table.Header>
                  <Table.Header>Status</Table.Header>
                </tr>
              </thead>
              <tbody>
                {poams.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>
                      <Link
                        to="/register/poam/$poamId"
                        params={{ poamId: p.id }}
                        className="hover:underline"
                      >
                        <Id className="text-primary">{p.id}</Id>
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="truncate">{p.title}</Table.Cell>
                    <Table.Cell className="truncate">{p.owner}</Table.Cell>
                    <Table.Cell className="truncate">{p.scheduledCompletion}</Table.Cell>
                    <Table.Cell className="truncate">
                      <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    </Table.Cell>
                  </Table.Row>
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
                <Table.Header>Finding</Table.Header>
                <Table.Header>Title</Table.Header>
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
                  <Table.Cell className="truncate">{f.title}</Table.Cell>
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
        </Section>
      </ShowPage>
    </Shell>
  );
}

/**
 * The auditable trail. The numeric spine is a table because the arithmetic has
 * to line up column by column; the rationale gets its own full-width row
 * beneath because a truncated rationale is the same as no rationale, and the
 * rationale is the part a human is meant to disagree with. On a risk each row
 * also names the member finding that drove the factor.
 */
function FactorTrail({ factors, score }: { factors: ScoreFactor[]; score: number }) {
  const sum = factors.reduce((a, f) => a + f.contribution, 0);
  return (
    <div className="pt-3">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "152px" }} />
          <col />
          <col style={{ width: "68px" }} />
          <col style={{ width: "72px" }} />
          <col style={{ width: "108px" }} />
        </colgroup>
        <thead>
          <tr>
            <Table.Header>Factor</Table.Header>
            <Table.Header>Input</Table.Header>
            <Table.Header className="text-right">Value</Table.Header>
            <Table.Header className="text-right">Weight</Table.Header>
            <Table.Header className="text-right">Contribution</Table.Header>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <Fragment key={f.key}>
              <tr>
                <Table.Cell>{f.label}</Table.Cell>
                <Table.Cell className="truncate" title={f.input}>
                  {f.input}
                </Table.Cell>
                <Table.Cell className="tnum text-right">{f.value.toFixed(2)}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.weight.toFixed(2)}</Table.Cell>
                <Table.Cell
                  className={
                    f.contribution < 0
                      ? "tnum text-right font-medium text-success"
                      : "tnum text-right font-medium"
                  }
                >
                  {signed(f.contribution)}
                </Table.Cell>
              </tr>
              <tr className="border-b border-border-subtle">
                <td colSpan={5} className="px-3 pb-2.5 align-top">
                  <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                    {f.rationale}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-11 text-muted-foreground">Evidence</span>
                    {f.evidence.length ? (
                      f.evidence.map((id) => (
                        <Id key={id} className="text-[11.5px] text-muted-foreground">
                          {id}
                        </Id>
                      ))
                    ) : (
                      <span className="text-[11.5px] text-muted-foreground">—</span>
                    )}
                  </p>
                </td>
              </tr>
            </Fragment>
          ))}
          <tr>
            <Table.Cell colSpan={4} className="text-muted-foreground">
              Sum of the {factors.length} contributions
              {sum === score ? "" : `, clamped from ${sum} to the 0–100 range`}
            </Table.Cell>
            <Table.Cell className="tnum text-right">{score}</Table.Cell>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
