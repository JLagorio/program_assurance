import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { Shell } from "@/components/app/shell";
import { RemediationPlanSection } from "@/components/app/remediation";
import { TextBlock } from "@/components/app/control-text";
import {
  Badge,
  Button,
  EmptyState,
  KeyValue,
  Mono,
  Person,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  TabStrip,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { ccis } from "@/lib/catalog";
import { useControlMatrix } from "@/lib/control-matrix";
import { assetById, findings, findingsByCci, isOpen } from "@/lib/findings";
import { titleOf } from "@/lib/nist-catalog";
import { planForFinding } from "@/lib/remediation";
import { poamById } from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";

const findingTabs = ["Finding", "Assessment", "Remediation"] as const;
type FindingTab = (typeof findingTabs)[number];

export const Route = createFileRoute("/findings/$findingId")({
  validateSearch: (search: Record<string, unknown>): { tab?: FindingTab } => {
    const raw = String(search["tab"] ?? "");
    const match = findingTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    return match ? { tab: match } : {};
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
  const siblings = findingsByCci(finding.cci).filter((f) => f.id !== finding.id);
  const poam = finding.poam ? poamById.get(finding.poam) : undefined;
  const controlRow = rows.find((r) => r.id === finding.control);
  const go = (next: FindingTab) => navigate({ search: { tab: next }, replace: true });

  const controlLink = controlRow ? (
    <Link
      to="/programs/$programId/controls/$controlId"
      params={{ programId, controlId: finding.control }}
      className="text-primary hover:underline"
    >
      <Mono className="text-primary">{finding.control}</Mono>
    </Link>
  ) : (
    <Mono>{finding.control}</Mono>
  );

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/findings"
            id={finding.id}
            title={finding.title}
            meta={`${finding.control} ${titleOf(finding.control)} · ${finding.source} · ${finding.owner}`}
            actions={
              <>
                <Badge tone={severityTone(finding.mitigatedSeverity)}>
                  {finding.mitigatedSeverity}
                </Badge>
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
          <TabStrip
            items={(
              [
                ["Finding", null],
                ["Assessment", null],
                ["Remediation", plan ? plan.total : null],
              ] as [FindingTab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key === "Remediation" ? "Remediation plan" : key,
              active: tab === key,
              onSelect: () => go(key),
              trailing: count ? (
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
            <RailGroup title="Join keys">
              <KeyValue label="CCI">
                <Mono>{finding.cci}</Mono>
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
                {finding.poam ? (
                  <Link
                    to="/register/poam/$poamId"
                    params={{ poamId: finding.poam }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{finding.poam}</Mono>
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
                    <Mono className="text-primary">{finding.risk}</Mono>
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
                  <Mono className="text-primary">{programId}</Mono>
                </Link>
              </KeyValue>
            </RailGroup>
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
                  <Mono className="text-muted-foreground">{cci.id}</Mono> — {cci.definition}
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
                  <span className="ml-2 text-muted-foreground">{titleOf(finding.control)}</span>
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
                          <Mono className="text-primary">{id}</Mono>
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
                  <Badge tone={severityTone(finding.rawSeverity)} size="xs">
                    {finding.rawSeverity}
                  </Badge>
                </TextBlock>
                <TextBlock label="Mitigated">
                  <Badge tone={severityTone(finding.mitigatedSeverity)} size="xs">
                    {finding.mitigatedSeverity}
                  </Badge>
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
              description={`${finding.id} closes with step ${plan.tasks.findIndex((t) => t.finding === finding.id && t.id.endsWith("-5")) + 1 || plan.total} of the plan for ${finding.control}. ${plan.complete} of ${plan.total} steps complete.`}
            />
          ) : (
            <Section title="Remediation plan">
              <EmptyState
                title="No plan behind this finding"
                description={
                  poam
                    ? `${poam.id} carries the commitment, but ${finding.control} is not in the tailored baseline for ${programId}, so there is no control plan to show.`
                    : `${finding.control} is not in the tailored baseline for ${programId}. Add the control or attach the finding to a POA&M section to open a plan.`
                }
              />
            </Section>
          )
        ) : null}
      </ShowPage>
    </Shell>
  );
}
