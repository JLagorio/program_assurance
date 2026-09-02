import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo } from "react";

import {
  Badge,
  Button,
  KeyValue,
  Meter,
  Person,
  Table,
  Id,
  Tabs,
  Indicator,
} from "@/ds/primitives";
import { EmptyState, RecordHeader, Section, ShowPage } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { Shell } from "@/ds/shell";
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
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Finding not found</h1>
          <Link to="/findings" className="text-[13px] text-primary hover:underline">
            Back to findings
          </Link>
        </div>
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
    <Link
      to="/programs/$programId/controls/$controlId"
      params={{ programId, controlId: finding.control }}
      className="text-primary hover:underline"
    >
      <Id className="text-primary">{finding.control}</Id>
    </Link>
  ) : (
    <Id>{finding.control}</Id>
  );

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/findings"
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
                    <Button variant="secondary" size="sm">
                      Open {finding.poam}
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm">
                    Add to POA&amp;M
                  </Button>
                )}
              </>
            }
          />
        }
        tabs={
          <Tabs
            items={(
              [
                ["Finding", null],
                ["Assessment", null],
                ["Remediation", plan ? plan.total : null],
                ["Residual risk", null],
              ] as [FindingTab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key === "Remediation" ? "Remediation plan" : key,
              active: tab === key,
              onSelect: () => go(key),
              trailing:
                key === "Residual risk" ? (
                  residual ? (
                    <Badge tone={bandTone[residual.band]} size="xs" className="tnum">
                      {residual.score}
                    </Badge>
                  ) : null
                ) : count ? (
                  <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                    {count}
                  </span>
                ) : null,
            }))}
          />
        }
        showRail={tab === "Finding"}
        rail={
          <>
            <Inspector.Group title="Join keys">
              <KeyValue label="CCI">
                <Id>{finding.cci}</Id>
              </KeyValue>
              <KeyValue label="Control">{controlLink}</KeyValue>
              <KeyValue label="Asset">
                <Link
                  to="/findings/assets/$assetId"
                  params={{ assetId: finding.asset }}
                  className="text-primary hover:underline"
                >
                  {asset?.name ?? finding.asset}
                </Link>
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
                  <button
                    type="button"
                    onClick={() => go("Residual risk")}
                    className="flex items-center gap-2 text-left text-primary hover:underline"
                  >
                    <span className="tnum text-[12px] font-medium">{residual.score}</span>
                    <Badge tone={bandTone[residual.band]}>{residual.band}</Badge>
                    {!isDeficiency(finding) ? (
                      <span className="text-[11px] text-muted-foreground">not carried</span>
                    ) : null}
                  </button>
                ) : (
                  "—"
                )}
              </KeyValue>
            </Inspector.Group>

            <Inspector.Group title="Rolls up to">
              <KeyValue label="POA&M">
                {finding.poam ? (
                  <Link
                    to="/register/poam/$poamId"
                    params={{ poamId: finding.poam }}
                    className="text-primary hover:underline"
                  >
                    <Id className="text-primary">{finding.poam}</Id>
                  </Link>
                ) : (
                  "Not yet scheduled"
                )}
              </KeyValue>
              <KeyValue label="Risk">
                {finding.risk ? (
                  <Link
                    to="/register/risks/$riskId"
                    params={{ riskId: finding.risk }}
                    className="text-primary hover:underline"
                  >
                    <Id className="text-primary">{finding.risk}</Id>
                  </Link>
                ) : (
                  "Not aggregated"
                )}
              </KeyValue>
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  className="text-primary hover:underline"
                >
                  <Id className="text-primary">{programId}</Id>
                </Link>
              </KeyValue>
            </Inspector.Group>
          </>
        }
      >
        {tab === "Finding" ? (
          <>
            <Section
              title="Finding statement"
              description={`The condition, stated against ${finding.cci}.`}
            >
              <p className="max-w-3xl pt-3 text-[13px] leading-relaxed">{finding.detail}</p>
              {cci ? (
                <p className="mt-3 max-w-3xl border-l-2 border-border pl-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  <Id className="text-muted-foreground">{cci.id}</Id> — {cci.definition}
                </p>
              ) : null}
            </Section>

            <Section
              title="Requirement"
              description="Where the statement comes from, and what it knocks down."
            >
              <div className="pt-1">
                <TextBlock label="Control">
                  {controlLink}
                  {catalogTitle ? (
                    <span className="ml-2 text-muted-foreground">{catalogTitle}</span>
                  ) : null}
                </TextBlock>
                <TextBlock label="Assessment status">
                  {controlRow ? (
                    <>
                      <Badge tone={statusTone(controlRow.status)} size="xs">
                        {controlRow.status}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">
                        {controlRow.openFindings} open finding
                        {controlRow.openFindings === 1 ? "" : "s"} against this control
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Not in the tailored baseline for {programId}
                    </span>
                  )}
                </TextBlock>
                <TextBlock label="Verified by">
                  {finding.source}
                  {finding.rule ? (
                    <span className="ml-2 text-muted-foreground">rule {finding.rule}</span>
                  ) : null}
                </TextBlock>
                <TextBlock label="Asset">
                  <Link
                    to="/findings/assets/$assetId"
                    params={{ assetId: finding.asset }}
                    className="text-primary hover:underline"
                  >
                    {asset?.name ?? finding.asset}
                  </Link>
                  {asset ? (
                    <span className="ml-2 text-muted-foreground">
                      {asset.kind} · {asset.technology} · {asset.environment}
                    </span>
                  ) : null}
                </TextBlock>
              </div>
            </Section>

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
                      <Table.Header>Finding</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header>Asset</Table.Header>
                      <Table.Header>Severity</Table.Header>
                      <Table.Header>Lifecycle</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {siblings.map((f) => (
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
                <p className="pt-2 text-[13px] text-muted-foreground">
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
              <div className="pt-1">
                <TextBlock label="Method">
                  <Badge
                    tone={
                      finding.assessment.method === "Test"
                        ? "warning"
                        : finding.assessment.method === "Interview"
                          ? "info"
                          : "neutral"
                    }
                    size="xs"
                  >
                    {finding.assessment.method}
                  </Badge>
                  <span className="ml-2 text-muted-foreground">{finding.source}</span>
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
                        <Link to="/evidence" className="text-primary hover:underline">
                          <Id className="text-primary">{id}</Id>
                        </Link>
                      </span>
                    ))}
                </TextBlock>
              </div>
            </Section>

            <Section
              title="Determination"
              description="The assessor's conclusion, carried verbatim into the SAR."
            >
              <p className="max-w-3xl pt-3 text-[13px] leading-relaxed">
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
              <div className="pt-1">
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
                  {finding.mitigation ?? (
                    <span className="text-muted-foreground">None on record.</span>
                  )}
                </TextBlock>
                <TextBlock label="Occurrences">
                  {finding.occurrences} across {finding.firstSeen} — {finding.lastSeen}
                </TextBlock>
              </div>
            </Section>

            <Section
              title="Recommendation"
              description="What the assessor says should happen, whether or not it is scheduled."
            >
              <p className="max-w-3xl pt-3 text-[13px] leading-relaxed">{finding.recommendation}</p>
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
              <EmptyState
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
                <div className="grid gap-4 pt-4 md:grid-cols-[minmax(0,232px)_minmax(0,1fr)]">
                  <div className="rounded-md border border-border p-3">
                    <div className="flex items-baseline gap-2">
                      <span className="tnum text-[30px] font-semibold leading-none">
                        {residual.score}
                      </span>
                      <span className="text-[12px] text-muted-foreground">/ 100</span>
                      <Badge tone={bandTone[residual.band]}>{residual.band}</Badge>
                    </div>
                    <div className="mt-3">
                      <Meter value={residual.score} tone={bandTone[residual.band]} />
                    </div>
                    <dl className="mt-3 space-y-1.5 text-[12px]">
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Inherent</dt>
                        <dd className="tnum">{residual.inherent}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Mitigation credit</dt>
                        <dd className={credit < 0 ? "tnum text-success" : "tnum"}>
                          {signed(credit)}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 border-t border-border-subtle pt-1.5">
                        <dt className="font-medium">Residual</dt>
                        <dd className="tnum font-medium">{residual.score}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <TextBlock label="Band">
                      <Badge tone={bandTone[residual.band]} size="xs">
                        {residual.band}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">{bandScale}</span>
                    </TextBlock>
                    <TextBlock label="Greatest leverage">{residual.leverage}</TextBlock>
                    <TextBlock label="Credit">
                      {credit < 0
                        ? `${finding.mitigation ? "The recorded compensating control" : "The gap between the raw and adjudicated grade"} buys ${Math.abs(credit)} point${Math.abs(credit) === 1 ? "" : "s"} off the inherent ${residual.inherent}. It is shown as its own negative term so it can be argued with rather than absorbed.`
                        : "No credit is claimed — nothing on record reduces this weakness below the grade it was given."}
                    </TextBlock>
                    <TextBlock label="Caveats">
                      {residual.caveats.length === 0 ? (
                        <span className="text-muted-foreground">
                          None. Every one of the six terms was computed from live evidence, so the
                          score is not provisional.
                        </span>
                      ) : (
                        <ul className="space-y-1.5">
                          {residual.caveats.map((c) => (
                            <li key={c} className="border-l-2 border-border pl-2">
                              {c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TextBlock>
                  </div>
                </div>
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
              <EmptyState
                title="No residual score"
                description={`${finding.id} carries no scored factors. A residual is only published where severity, exposure, mission impact and evidence currency can all be read from the record; scoring it without them would launder judgement as arithmetic.`}
              />
            </Section>
          )
        ) : null}
      </ShowPage>
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
                    f.contribution < 0 ? "tnum text-right text-success" : "tnum text-right"
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
            <Table.Cell colSpan={4}>
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
