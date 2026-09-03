import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  Badge,
  Box,
  Button,
  Empty,
  Grid,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  Progress,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { TextBlock } from "@/components/app/control-text";
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
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Risk not found</h1>
          <TextLink size="medium">
            <Link to="/register">Back to the register</Link>
          </TextLink>
        </Stack>
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
            back={<Link to="/register" />}
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
        tabs={<div className="border-b border-default" />}
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
                <span className="tabular-nums">{risk.inherent}</span>
                <Box
                  className="font-body-xsmall text-subtle"
                  as="span"
                  paddingInlineStart="space.075"
                >
                  authored
                </Box>
              </KeyValue>
              <KeyValue label="Residual">
                <Inline as="span" space="space.100" alignBlock="center">
                  <Progress value={risk.residual} tone={residualTone(risk.residual)} />
                  <span className="tabular-nums font-body-small font-medium">{risk.residual}</span>
                  <span className="font-body-xsmall text-subtle">authored</span>
                </Inline>
              </KeyValue>
              <KeyValue label="Computed">
                {computed ? (
                  <Inline as="span" space="space.100" alignBlock="center">
                    <span className="tabular-nums font-body-small font-medium">
                      {computed.score}
                    </span>
                    <Badge tone={bandTone[computed.band]}>{computed.band}</Badge>
                  </Inline>
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
                <TextLink>
                  <Link to="/programs/$programId" params={{ programId: risk.program }}>
                    <Id>{risk.program}</Id>
                  </Link>
                </TextLink>
              </KeyValue>
            </Inspector.Group>
            <Inspector.Group title="CCIs in scope">
              <Inline space="space.050" shouldWrap>
                {ccis.map((c) => (
                  <Id key={c} className="font-body-xsmall text-subtle">
                    {c}
                  </Id>
                ))}
              </Inline>
            </Inspector.Group>
          </>
        }
      >
        <Section title="Risk statement">
          <p className="max-w-layout-measure font-body">{risk.statement}</p>
          {risk.aoNote ? (
            <p className="pt-150 max-w-layout-measure font-body-small text-subtle">
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
              <Grid
                className="pt-200"
                gap="space.150"
                templateColumns={{ md: "repeat(2, minmax(0, 1fr))" }}
              >
                <Box className="rounded-medium border border-default" padding="space.150">
                  <p className="font-heading-xxsmall uppercase text-subtle">
                    Authored — risk register
                  </p>
                  <Inline className="pt-100" space="space.100" alignBlock="baseline">
                    <span className="tabular-nums font-heading-large font-semibold">
                      {comparison.authored.residual}
                    </span>
                    <span className="font-body-small text-subtle">residual / 100</span>
                  </Inline>
                  <Box paddingBlockStart="space.150">
                    <Progress
                      value={comparison.authored.residual}
                      tone={residualTone(risk.residual)}
                    />
                  </Box>
                  <dl className="pt-150 space-y-075 font-body-small">
                    <Inline space="space.150" alignBlock="baseline" spread="space-between">
                      <dt className="text-subtle">Likelihood × impact</dt>
                      <dd className="tabular-nums">
                        {comparison.authored.likelihood} × {comparison.authored.impact}
                      </dd>
                    </Inline>
                    <Inline space="space.150" alignBlock="baseline" spread="space-between">
                      <dt className="text-subtle">Inherent</dt>
                      <dd className="tabular-nums">{comparison.authored.inherent}</dd>
                    </Inline>
                    <Inline
                      className="border-t border-default pt-075"
                      space="space.150"
                      alignBlock="baseline"
                      spread="space-between"
                    >
                      <dt className="font-medium">Residual</dt>
                      <dd className="tabular-nums font-medium">{comparison.authored.residual}</dd>
                    </Inline>
                  </dl>
                  <p className="pt-100 font-body-xsmall text-subtle">
                    {risk.owner} wrote this down on {risk.reviewed}. It is the number the AO has
                    seen, and nothing on this page overwrites it.
                  </p>
                </Box>

                <Box className="rounded-medium border border-default" padding="space.150">
                  <p className="font-heading-xxsmall uppercase text-subtle">
                    Computed — evidence trail
                  </p>
                  <Inline className="pt-100" space="space.100" alignBlock="baseline">
                    <span className="tabular-nums font-heading-large font-semibold">
                      {computed.score}
                    </span>
                    <span className="font-body-small text-subtle">residual / 100</span>
                    <Badge tone={bandTone[computed.band]}>{computed.band}</Badge>
                  </Inline>
                  <Box paddingBlockStart="space.150">
                    <Progress value={computed.score} tone={bandTone[computed.band]} />
                  </Box>
                  <dl className="pt-150 space-y-075 font-body-small">
                    <Inline space="space.150" alignBlock="baseline" spread="space-between">
                      <dt className="text-subtle">Inherent</dt>
                      <dd className="tabular-nums">{computed.inherent}</dd>
                    </Inline>
                    <Inline space="space.150" alignBlock="baseline" spread="space-between">
                      <dt className="text-subtle">Mitigation credit</dt>
                      <dd className={credit < 0 ? "tabular-nums text-success" : "tabular-nums"}>
                        {signed(credit)}
                      </dd>
                    </Inline>
                    <Inline
                      className="border-t border-default pt-075"
                      space="space.150"
                      alignBlock="baseline"
                      spread="space-between"
                    >
                      <dt className="font-medium">Residual</dt>
                      <dd className="tabular-nums font-medium">{computed.score}</dd>
                    </Inline>
                  </dl>
                  <p className="pt-100 font-body-xsmall text-subtle">
                    Aggregated from the {fs.length} joined finding{fs.length === 1 ? "" : "s"} by
                    taking the worst reading on each of the six factors — a risk is no more
                    mitigated than its least-mitigated component.
                  </p>
                </Box>
              </Grid>

              <Box paddingBlockStart="space.200">
                <TextBlock label="Disagreement">{comparison.note}</TextBlock>
                <TextBlock label="Greatest leverage">{computed.leverage}</TextBlock>
                <TextBlock label="Caveats">
                  {computed.caveats.length === 0 ? (
                    <span className="text-subtle">
                      None. Every one of the six terms was computed from live evidence, so the score
                      is not provisional.
                    </span>
                  ) : (
                    <Stack as="ul" space="space.075">
                      {computed.caveats.map((c) => (
                        <Box
                          key={c}
                          className="border-s border-default"
                          as="li"
                          paddingInlineStart="space.100"
                        >
                          {c}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </TextBlock>
              </Box>
            </>
          ) : (
            <Empty
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
              <thead>
                <tr>
                  <Table.Header width={112}>POA&M</Table.Header>
                  <Table.Header>Weakness</Table.Header>
                  <Table.Header width={140}>Owner</Table.Header>
                  <Table.Header width={116}>Scheduled</Table.Header>
                  <Table.Header width={104}>Status</Table.Header>
                </tr>
              </thead>
              <tbody>
                {poams.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>
                      <TextLink>
                        <Link to="/register/poam/$poamId" params={{ poamId: p.id }}>
                          <Id>{p.id}</Id>
                        </Link>
                      </TextLink>
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
            <thead>
              <tr>
                <Table.Header width={112}>Finding</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header width={104}>CCI</Table.Header>
                <Table.Header width={140}>Asset</Table.Header>
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
    <Box paddingBlockStart="space.150">
      <Table className="table-fixed">
        <thead>
          <tr>
            <Table.Header width={152}>Factor</Table.Header>
            <Table.Header>Input</Table.Header>
            <Table.Header width={68} className="text-right">
              Value
            </Table.Header>
            <Table.Header width={72} className="text-right">
              Weight
            </Table.Header>
            <Table.Header width={108} className="text-right">
              Contribution
            </Table.Header>
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
                <Table.Cell className="tabular-nums text-right">{f.value.toFixed(2)}</Table.Cell>
                <Table.Cell className="tabular-nums text-right">{f.weight.toFixed(2)}</Table.Cell>
                <Table.Cell
                  className={
                    f.contribution < 0
                      ? "tabular-nums text-right text-success"
                      : "tabular-nums text-right"
                  }
                >
                  {signed(f.contribution)}
                </Table.Cell>
              </tr>
              <tr className="border-b border-default">
                <td colSpan={5} className="px-150 pb-100 align-top">
                  <p className="max-w-layout-measure font-body-small text-subtle">{f.rationale}</p>
                  <p className="pt-050 flex flex-wrap items-center gap-x-100 gap-y-025">
                    <span className="font-body-xsmall text-subtle">Evidence</span>
                    {f.evidence.length ? (
                      f.evidence.map((id) => (
                        <Id key={id} className="font-body-xsmall text-subtle">
                          {id}
                        </Id>
                      ))
                    ) : (
                      <span className="font-body-xsmall text-subtle">—</span>
                    )}
                  </p>
                </td>
              </tr>
            </Fragment>
          ))}
          <tr>
            <Table.Cell colSpan={4}>
              Sum of the {factors.length} contributions
              {sum === score ? "" : `, clamped from ${sum} to the 0–100 range`}
            </Table.Cell>
            <Table.Cell className="tabular-nums text-right">{score}</Table.Cell>
          </tr>
        </tbody>
      </Table>
    </Box>
  );
}
