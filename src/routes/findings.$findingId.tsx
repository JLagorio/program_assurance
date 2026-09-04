import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo } from "react";

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
  Person,
  Progress,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  Tabs,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { RemediationPlanSection } from "@/components/app/remediation";
import { TextBlock } from "@/components/app/control-text";
import { ccis } from "@/lib/catalog";
import { useControlMatrix } from "@/lib/control-matrix";
import { assetById, findings, findingsByCci, isDeficiency, isOpen } from "@/lib/findings";
import { controlTitle, nistControlById } from "@/lib/nist-catalog";
import { planForFinding } from "@/lib/remediation";
import { poamById } from "@/lib/register";
import { bandTone, scoreFinding, type ScoreFactor } from "@/lib/risk-scoring";
import { severityTone, statusTone } from "@/lib/spine";

const findingTabs = ["Finding", "Assessment", "Remediation", "Residual risk"] as const;
type FindingTab = (typeof findingTabs)[number];

/** `+12`, `-8`, `0` — the sign is the whole point of the mitigation credit. */
function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export const Route = createFileRoute("/findings/$findingId")({
  validateSearch: (search: Record<string, unknown>): { tab?: FindingTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    const match = findingTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    // ALWAYS emit the key. Returning `{}` for an unrecognised value makes the
    // server answer `?tab=bogus` with an empty 200 body instead of redirecting
    // to the canonical URL; emitting `tab: undefined` makes it a 307 onto
    // `/findings/$findingId` and the page renders. The declared type keeps the
    // key optional so the Links to this route elsewhere need no `search` prop.
    return { tab: match };
  },
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
  const tab = Route.useSearch().tab ?? "Finding";
  const navigate = useNavigate({ from: Route.fullPath });
  const finding = findings.find((f) => f.id === findingId);

  const asset = finding ? assetById.get(finding.asset) : undefined;
  const programId = asset?.program ?? "PRG-1041";
  const rows = useControlMatrix(programId);
  const plan = useMemo(() => (finding ? planForFinding(finding, rows) : null), [finding, rows]);
  const residual = useMemo(() => (finding ? scoreFinding(finding.id) : null), [finding]);

  if (!finding) {
    return (
      <Shell>
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Finding not found</h1>
          <TextLink size="medium">
            <Link to="/findings">Back to findings</Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const cci = ccis.find((c) => c.id === finding.cci);
  const catalogEntry = nistControlById.get(finding.control);
  const catalogTitle = catalogEntry ? controlTitle(catalogEntry) : null;
  const siblings = findingsByCci(finding.cci).filter((f) => f.id !== finding.id);
  const poam = finding.poam ? poamById.get(finding.poam) : undefined;
  const controlRow = rows.find((r) => r.id === finding.control);
  const go = (next: FindingTab) => navigate({ search: { tab: next }, replace: true });

  const credit = residual?.factors.find((f) => f.key === "mitigation")?.contribution ?? 0;
  const bandScale = "80+ Very high · 60–79 High · 40–59 Moderate · 20–39 Low · under 20 Very low.";

  const controlLink = controlRow ? (
    <TextLink>
      <Link
        to="/programs/$programId/controls/$controlId"
        params={{ programId, controlId: finding.control }}
      >
        <Id>{finding.control}</Id>
      </Link>
    </TextLink>
  ) : (
    <Id>{finding.control}</Id>
  );

  return (
    <Shell>
      <>
        <ShowPage
          rail={
            tab === "Finding" ? (
              <>
                <Inspector.Group title="Join keys">
                  <KeyValue label="CCI">
                    <Id>{finding.cci}</Id>
                  </KeyValue>
                  <KeyValue label="Control">{controlLink}</KeyValue>
                  <KeyValue label="Asset">
                    <TextLink>
                      <Link to="/findings/assets/$assetId" params={{ assetId: finding.asset }}>
                        {asset?.name ?? finding.asset}
                      </Link>
                    </TextLink>
                  </KeyValue>
                  <KeyValue label="Rule">{finding.rule ? <Id>{finding.rule}</Id> : "—"}</KeyValue>
                </Inspector.Group>

                <Inspector.Group title="Provenance">
                  <KeyValue label="Source">{finding.source}</KeyValue>
                  <KeyValue label="Artifact">
                    <Id>{finding.sourceArtifact}</Id>
                  </KeyValue>
                  <KeyValue label="First seen">{finding.firstSeen}</KeyValue>
                  <KeyValue label="Last seen">{finding.lastSeen}</KeyValue>
                  <KeyValue label="Occurrences">{finding.occurrences}</KeyValue>
                </Inspector.Group>

                <Inspector.Group title="Severity">
                  <KeyValue label="Raw">{finding.rawSeverity}</KeyValue>
                  <KeyValue label="Mitigated">
                    <Indicator tone={severityTone(finding.mitigatedSeverity)}>
                      {finding.mitigatedSeverity}
                    </Indicator>
                  </KeyValue>
                  <KeyValue label="Open">{isOpen(finding) ? "Yes" : "No"}</KeyValue>
                  <KeyValue label="Residual risk">
                    {residual ? (
                      <Button onClick={() => go("Residual risk")} variant="link" className="flex">
                        <span className="tabular-nums font-body-small font-medium">
                          {residual.score}
                        </span>
                        <Badge tone={bandTone[residual.band]}>{residual.band}</Badge>
                        {!isDeficiency(finding) ? (
                          <span className="font-body-xsmall text-subtle">not carried</span>
                        ) : null}
                      </Button>
                    ) : (
                      "—"
                    )}
                  </KeyValue>
                </Inspector.Group>

                <Inspector.Group title="Rolls up to">
                  <KeyValue label="POA&M">
                    {finding.poam ? (
                      <TextLink>
                        <Link to="/register/poam/$poamId" params={{ poamId: finding.poam }}>
                          <Id>{finding.poam}</Id>
                        </Link>
                      </TextLink>
                    ) : (
                      "Not yet scheduled"
                    )}
                  </KeyValue>
                  <KeyValue label="Risk">
                    {finding.risk ? (
                      <TextLink>
                        <Link to="/register/risks/$riskId" params={{ riskId: finding.risk }}>
                          <Id>{finding.risk}</Id>
                        </Link>
                      </TextLink>
                    ) : (
                      "Not aggregated"
                    )}
                  </KeyValue>
                  <KeyValue label="Program">
                    <TextLink>
                      <Link to="/programs/$programId" params={{ programId }}>
                        <Id>{programId}</Id>
                      </Link>
                    </TextLink>
                  </KeyValue>
                </Inspector.Group>
              </>
            ) : null
          }
          header={
            <RecordHeader
              back={<Link to="/findings" />}
              id={finding.id}
              title={finding.title}
              meta={`${finding.control}${catalogTitle ? ` ${catalogTitle}` : ""} · ${finding.source} · ${finding.owner}`}
              actions={
                <>
                  <Indicator tone={severityTone(finding.mitigatedSeverity)}>
                    {finding.mitigatedSeverity}
                  </Indicator>
                  <Badge tone={statusTone(finding.lifecycle)}>{finding.lifecycle}</Badge>
                  {finding.poam ? (
                    <Link to="/register/poam/$poamId" params={{ poamId: finding.poam }}>
                      <Button variant="secondary" size="small">
                        Open {finding.poam}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="small">
                      Add to POA&amp;M
                    </Button>
                  )}
                </>
              }
            />
          }
          tabs={
            <Tabs>
              {(
                [
                  ["Finding", null],
                  ["Assessment", null],
                  ["Remediation", plan ? plan.total : null],
                  ["Residual risk", null],
                ] as [FindingTab, number | null][]
              ).map(([key, count]) => (
                <Tabs.Tab
                  key={key}
                  isSelected={tab === key}
                  onClick={() => go(key)}
                  trailing={
                    key === "Residual risk" ? (
                      residual ? (
                        <Badge
                          tone={bandTone[residual.band]}
                          size="xsmall"
                          className="tabular-nums"
                        >
                          {residual.score}
                        </Badge>
                      ) : null
                    ) : count ? (
                      <Box
                        className="tabular-nums rounded-small bg-neutral font-body-xsmall font-medium text-subtle"
                        as="span"
                        paddingInline="space.050"
                      >
                        {count}
                      </Box>
                    ) : null
                  }
                >
                  {key === "Remediation" ? "Remediation plan" : key}
                </Tabs.Tab>
              ))}
            </Tabs>
          }
        >
          {tab === "Finding" ? (
            <>
              <Section
                title="Finding statement"
                description={`The condition, stated against ${finding.cci}.`}
              >
                <p className="max-w-layout-measure pt-150 font-body">{finding.detail}</p>
                {cci ? (
                  <p className="pt-150 max-w-layout-measure border-s border-default ps-150 font-body-small text-subtle">
                    <Id className="text-subtle">{cci.id}</Id> — {cci.definition}
                  </p>
                ) : null}
              </Section>

              <Section
                title="Requirement"
                description="Where the statement comes from, and what it knocks down."
              >
                <Box paddingBlockStart="space.050">
                  <TextBlock label="Control">
                    {controlLink}
                    {catalogTitle ? (
                      <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                        {catalogTitle}
                      </Box>
                    ) : null}
                  </TextBlock>
                  <TextBlock label="Assessment status">
                    {controlRow ? (
                      <>
                        <Badge tone={statusTone(controlRow.status)} size="xsmall">
                          {controlRow.status}
                        </Badge>
                        <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                          {controlRow.openFindings} open finding
                          {controlRow.openFindings === 1 ? "" : "s"} against this control
                        </Box>
                      </>
                    ) : (
                      <span className="text-subtle">
                        Not in the tailored baseline for {programId}
                      </span>
                    )}
                  </TextBlock>
                  <TextBlock label="Verified by">
                    {finding.source}
                    {finding.rule ? (
                      <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                        rule {finding.rule}
                      </Box>
                    ) : null}
                  </TextBlock>
                  <TextBlock label="Asset">
                    <TextLink>
                      <Link to="/findings/assets/$assetId" params={{ assetId: finding.asset }}>
                        {asset?.name ?? finding.asset}
                      </Link>
                    </TextLink>
                    {asset ? (
                      <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                        {asset.kind} · {asset.technology} · {asset.environment}
                      </Box>
                    ) : null}
                  </TextBlock>
                </Box>
              </Section>

              <Section
                title="Same CCI"
                description={`${siblings.length} other finding${siblings.length === 1 ? "" : "s"} verify the same requirement.`}
              >
                {siblings.length ? (
                  <Table className="table-fixed">
                    <thead>
                      <tr>
                        <Table.Header width={112}>Finding</Table.Header>
                        <Table.Header>Title</Table.Header>
                        <Table.Header width={160}>Asset</Table.Header>
                        <Table.Header width={78}>Severity</Table.Header>
                        <Table.Header width={112}>Lifecycle</Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {siblings.map((f) => (
                        <Table.Row key={f.id}>
                          <Table.Cell>
                            <TextLink>
                              <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                                <Id>{f.id}</Id>
                              </Link>
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell className="truncate">{f.title}</Table.Cell>
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
                  <p className="pt-100 font-body text-subtle">
                    This finding is the only evidence against {finding.cci}.
                  </p>
                )}
              </Section>
            </>
          ) : null}

          {tab === "Assessment" ? (
            <>
              <Section
                title="Assessment"
                description={`${finding.assessment.method} · ${finding.assessment.assessedBy} · ${finding.assessment.assessedOn}`}
              >
                <Box paddingBlockStart="space.050">
                  <TextBlock label="Method">
                    <Badge
                      tone={
                        finding.assessment.method === "Test"
                          ? "warning"
                          : finding.assessment.method === "Interview"
                            ? "information"
                            : "neutral"
                      }
                      size="xsmall"
                    >
                      {finding.assessment.method}
                    </Badge>
                    <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                      {finding.source}
                    </Box>
                  </TextBlock>
                  <TextBlock label="Procedure">{finding.assessment.procedure}</TextBlock>
                  <TextBlock label="Assessor">
                    <Person name={finding.assessment.assessedBy} />
                  </TextBlock>
                  <TextBlock label="Assessed on">{finding.assessment.assessedOn}</TextBlock>
                  <TextBlock label="Evidence">
                    {[finding.sourceArtifact, ...finding.assessment.evidence]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((id, i) => (
                        <span key={id}>
                          {i > 0 && " · "}
                          <TextLink>
                            <Link to="/evidence">
                              <Id>{id}</Id>
                            </Link>
                          </TextLink>
                        </span>
                      ))}
                  </TextBlock>
                </Box>
              </Section>

              <Section
                title="Determination"
                description="The assessor's conclusion, carried verbatim into the SAR."
              >
                <p className="max-w-layout-measure pt-150 font-body">
                  {finding.assessment.determination}
                </p>
              </Section>

              <Section
                title="Severity"
                description={
                  finding.rawSeverity === finding.mitigatedSeverity
                    ? `Raw and mitigated severity agree at ${finding.mitigatedSeverity} — nothing reduces the exposure.`
                    : `Raw ${finding.rawSeverity} reduced to ${finding.mitigatedSeverity} on the strength of a mitigation.`
                }
              >
                <Box paddingBlockStart="space.050">
                  <TextBlock label="Raw">
                    <Indicator tone={severityTone(finding.rawSeverity)}>
                      {finding.rawSeverity}
                    </Indicator>
                  </TextBlock>
                  <TextBlock label="Mitigated">
                    <Indicator tone={severityTone(finding.mitigatedSeverity)}>
                      {finding.mitigatedSeverity}
                    </Indicator>
                  </TextBlock>
                  <TextBlock label="Mitigation">
                    {finding.mitigation ?? <span className="text-subtle">None on record.</span>}
                  </TextBlock>
                  <TextBlock label="Occurrences">
                    {finding.occurrences} across {finding.firstSeen} — {finding.lastSeen}
                  </TextBlock>
                </Box>
              </Section>

              <Section
                title="Recommendation"
                description="What the assessor says should happen, whether or not it is scheduled."
              >
                <p className="max-w-layout-measure pt-150 font-body">{finding.recommendation}</p>
              </Section>
            </>
          ) : null}

          {tab === "Remediation" ? (
            plan ? (
              <RemediationPlanSection
                plan={plan}
                programId={programId}
                description={`The plan for ${finding.control}, which ${finding.id} closes on re-test. ${plan.complete} of ${plan.total} steps complete · ${plan.start} → ${plan.due}.`}
              />
            ) : (
              <Section title="Remediation plan">
                <Empty
                  title={
                    controlRow
                      ? "Nothing scheduled against this finding"
                      : "No plan behind this finding"
                  }
                  description={
                    !controlRow
                      ? `${finding.control} is not in the tailored baseline for ${programId}${poam ? `, so ${poam.id} carries the commitment on its own` : ""}. Tailor the control in, or work the item from the register.`
                      : isOpen(finding)
                        ? `${finding.control} carries no POA&M section and no open remediation. Add ${finding.id} to a POA&M item to put a dated plan behind it.`
                        : `${finding.id} is ${finding.lifecycle.toLowerCase()} and ${finding.control} is ${controlRow.status.toLowerCase()}, so no plan is running. ${finding.risk ? `The residual sits on ${finding.risk}.` : ""}`
                  }
                />
              </Section>
            )
          ) : null}

          {tab === "Residual risk" ? (
            residual ? (
              <>
                <Section
                  title="Residual risk"
                  description={
                    isDeficiency(finding)
                      ? `${residual.score} of 100 — ${residual.band}. CAT I/II/III grades how badly the requirement is missed; this grades what ${finding.id} is costing the program once reachability, demonstrated exploitation, mission effect and the currency of the evidence are read off the record.`
                      : `${residual.score} of 100 — ${residual.band}. CAT I/II/III grades how badly the requirement is missed; this grades what the reported condition WOULD have cost the program once reachability, demonstrated exploitation, mission effect and the currency of the evidence are read off the record. ${finding.id} is ${finding.lifecycle.toLowerCase()}, so it is scored so the trail survives closure, not carried in the aggregate.`
                  }
                >
                  <Grid
                    className="pt-200"
                    gap="space.200"
                    templateColumns={{ md: "minmax(0,232px) minmax(0,1fr)" }}
                  >
                    <Box className="rounded-medium border border-default" padding="space.150">
                      <Inline space="space.100" alignBlock="baseline">
                        <span className="tabular-nums font-heading-large font-semibold">
                          {residual.score}
                        </span>
                        <span className="font-body-small text-subtle">/ 100</span>
                        <Badge tone={bandTone[residual.band]}>{residual.band}</Badge>
                      </Inline>
                      <Box paddingBlockStart="space.150">
                        <Progress value={residual.score} tone={bandTone[residual.band]} />
                      </Box>
                      <dl className="pt-150 space-y-075 font-body-small">
                        <Inline space="space.150" alignBlock="baseline" spread="space-between">
                          <dt className="text-subtle">Inherent</dt>
                          <dd className="tabular-nums">{residual.inherent}</dd>
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
                          <dd className="tabular-nums font-medium">{residual.score}</dd>
                        </Inline>
                      </dl>
                    </Box>
                    <div>
                      <TextBlock label="Band">
                        <Badge tone={bandTone[residual.band]} size="xsmall">
                          {residual.band}
                        </Badge>
                        <Box className="text-subtle" as="span" paddingInlineStart="space.100">
                          {bandScale}
                        </Box>
                      </TextBlock>
                      <TextBlock label="Greatest leverage">{residual.leverage}</TextBlock>
                      <TextBlock label="Credit">
                        {credit < 0
                          ? `${finding.mitigation ? "The recorded compensating control" : "The gap between the raw and adjudicated grade"} buys ${Math.abs(credit)} point${Math.abs(credit) === 1 ? "" : "s"} off the inherent ${residual.inherent}. It is shown as its own negative term so it can be argued with rather than absorbed.`
                          : "No credit is claimed — nothing on record reduces this weakness below the grade it was given."}
                      </TextBlock>
                      <TextBlock label="Caveats">
                        {residual.caveats.length === 0 ? (
                          <span className="text-subtle">
                            None. Every one of the six terms was computed from live evidence, so the
                            score is not provisional.
                          </span>
                        ) : (
                          <Stack as="ul" space="space.075">
                            {residual.caveats.map((c) => (
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
                    </div>
                  </Grid>
                </Section>

                <Section
                  title="Calculation"
                  description="Five weighted terms and one credit. Each row carries the input it read, the arithmetic, the ids it rests on, and one sentence an assessor can disagree with."
                >
                  <FactorTrail factors={residual.factors} score={residual.score} />
                </Section>
              </>
            ) : (
              <Section title="Residual risk">
                <Empty
                  title="No residual score"
                  description={`${finding.id} carries no scored factors. A residual is only published where severity, exposure, mission impact and evidence currency can all be read from the record; scoring it without them would launder judgement as arithmetic.`}
                />
              </Section>
            )
          ) : null}
        </ShowPage>
      </>
    </Shell>
  );
}

/**
 * The auditable trail. The numeric spine is a table because the arithmetic has
 * to line up column by column; the rationale gets its own full-width row
 * beneath because a truncated rationale is the same as no rationale, and the
 * rationale is the part a human is meant to disagree with.
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
