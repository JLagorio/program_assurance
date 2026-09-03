import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ReactNode } from "react";

import {
  AuthoredComparisonTable,
  BandChip,
  BandDistribution,
  BandLadder,
  FactorModel,
  FactorTable,
  MoversTable,
  ScoreCard,
  TopRisksTable,
  type ComparisonRow,
  type ScoredSubject,
} from "@/components/app/risk-scoring";
import {
  Badge,
  Box,
  Empty,
  Grid,
  Id,
  Inline,
  NativeSelect,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Tabs,
  TextLink,
  Toolbar,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { assetById, findings, isDeficiency } from "@/lib/findings";
import { programs } from "@/lib/grc-data";
import { registerRisks } from "@/lib/register";
import {
  authoredComparison,
  bandFor,
  programRiskPosture,
  scoreFinding,
  type ResidualScore,
} from "@/lib/risk-scoring";
import { cn } from "@ledger/design-system/cn";

const riskTabs = ["Posture", "Scored findings", "Calculation"] as const;
type RiskTab = (typeof riskTabs)[number];

export const Route = createFileRoute("/programs/$programId_/risk")({
  // The router MERGES the validated object over the raw parsed search rather
  // than replacing it, so omitting `tab` on a miss would leave `?tab=Bogus`
  // intact and the `?? "Posture"` fallback below would never fire — the page
  // would render with no active tab and an empty body. Emitting the key
  // explicitly, as `undefined`, is what deletes it, and `encode()` drops
  // undefined values so nothing leaks back into the URL. The `| undefined` in
  // the return type is load-bearing: `exactOptionalPropertyTypes` is on, so a
  // bare `tab?: RiskTab` rejects the explicit undefined (TS2375). It stays
  // OPTIONAL rather than widening to a required `tab:` so that linking to this
  // route does not demand a `search`.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: RiskTab | undefined; subject?: string } => {
    const raw = String(search["tab"] ?? "");
    const match = riskTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    const subject = search["subject"];
    const selected = typeof subject === "string" && /^FND-\d+$/.test(subject) ? subject : null;
    return { tab: match, ...(selected ? { subject: selected } : {}) };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} residual risk — Equinox` },
      {
        name: "description",
        content: `Residual risk scoring for ${loaderData?.id ?? "the program"}: severity, mitigation credit, exploitability, exposure, mission impact and evidence currency, each with the input it read, the points it bought and the sentence it rests on.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} residual risk — Equinox` },
      {
        property: "og:description",
        content:
          "CAT I is a severity, not a risk. Every score here carries the arithmetic that produced it, line by line, beside the number the assessor wrote in the register.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramRisk,
});

function ProgramRisk() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Posture";
  const navigate = useNavigate({ from: Route.fullPath });

  const posture = programRiskPosture(program.id);

  // Every finding in the boundary, scored, worst first — not just the worst ten
  // the posture summary carries. A page that shows only the top of the list
  // cannot be used to argue that something LOW is mis-scored, and the argument
  // is the point of publishing the trail at all.
  const scored = useMemo(() => {
    const rows: ScoredSubject[] = [];
    for (const f of findings) {
      if (assetById.get(f.asset)?.program !== program.id) continue;
      const score = scoreFinding(f.id);
      if (!score) continue;
      const asset = assetById.get(f.asset);
      rows.push({
        score,
        title: f.title,
        context: `${f.control} · ${asset?.name ?? f.asset} · ${f.lifecycle}`,
        excluded: !isDeficiency(f),
      });
    }
    return rows.sort((a, b) =>
      b.score.score !== a.score.score
        ? b.score.score - a.score.score
        : a.score.subject.localeCompare(b.score.subject),
    );
  }, [program.id]);

  const carried = scored.filter((r) => !r.excluded);
  const excluded = scored.length - carried.length;

  const comparisons = useMemo(() => {
    const rows: ComparisonRow[] = [];
    for (const risk of registerRisks) {
      if (risk.program !== program.id) continue;
      const comparison = authoredComparison(risk.id);
      if (!comparison) continue;
      rows.push({ comparison, title: risk.title, treatment: risk.treatment });
    }
    return rows.sort((a, b) => Math.abs(b.comparison.delta) - Math.abs(a.comparison.delta));
  }, [program.id]);

  // Register risks this model refuses to score. Deriving a residual from the
  // authored likelihood and impact would be exactly the laundering the module
  // exists to prevent, so the gap is printed rather than filled.
  const unjoined = registerRisks.filter(
    (r) => r.program === program.id && !comparisons.some((c) => c.comparison.risk === r.id),
  );

  const fallbackSubject = scored[0]?.score.subject ?? null;
  const requested = search.subject ?? null;
  const subjectId =
    requested && scored.some((r) => r.score.subject === requested) ? requested : fallbackSubject;
  const selected = subjectId ? (scored.find((r) => r.score.subject === subjectId) ?? null) : null;

  /**
   * The worked example for the Calculation tab. It is chosen, not authored: the
   * worst finding that actually claims a mitigation credit, so the reader sees a
   * negative line and a positive one in the same table. Falling back to the
   * worst finding overall keeps the tab populated for a program where nobody has
   * claimed a credit yet.
   */
  const worked: ScoredSubject | null =
    scored.find(
      (r) =>
        !r.excluded && (r.score.factors.find((f) => f.key === "mitigation")?.contribution ?? 0) < 0,
    ) ??
    scored.find((r) => !r.excluded) ??
    scored[0] ??
    null;

  // An aggregate of 0 over an empty population is not "Very low" — it is an
  // absence of data, and banding it green would be the single most misleading
  // thing this page could do. Every band read-out below is gated on there being
  // something to band.
  const hasScores = posture.scored > 0;
  const aggregateBand = bandFor(posture.aggregate);

  const go = (next: RiskTab) => navigate({ search: { ...search, tab: next }, replace: true });
  const selectSubject = (next: string) =>
    navigate({ search: { ...search, subject: next, tab: "Scored findings" }, replace: true });

  const counts: Record<RiskTab, number | null> = {
    Posture: posture.scored,
    "Scored findings": scored.length,
    Calculation: null,
  };

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            back={<Link to="/programs/$programId" params={{ programId: program.id }} />}
            id={program.id}
            title={`${program.name} — residual risk`}
            meta={
              hasScores
                ? `${posture.scored} scored · aggregate ${posture.aggregate} · ${posture.movers.length} moved on live evidence · ${posture.disagreements.length} disagree with the register`
                : "Nothing scored — this program carries no finding the model can read"
            }
            actions={
              <>
                {hasScores ? (
                  <>
                    <Badge tone="neutral">Aggregate {posture.aggregate}</Badge>
                    <BandChip band={aggregateBand} />
                  </>
                ) : (
                  <Badge tone="neutral">Nothing scored</Badge>
                )}
                <TextLink size="small">
                  <Link to="/programs/$programId/baseline" params={{ programId: program.id }}>
                    Baseline
                  </Link>
                </TextLink>
                <TextLink size="small">
                  <Link to="/register">Register</Link>
                </TextLink>
              </>
            }
          />
        }
        tabs={
          <Tabs>
            {riskTabs.map((key) => (
              <Tabs.Tab
                key={key}
                isSelected={tab === key}
                onClick={() => go(key)}
                count={counts[key] || null}
              >
                {key}
              </Tabs.Tab>
            ))}
          </Tabs>
        }
      >
        {tab === "Posture" ? (
          <>
            <Section
              title="Where the program sits"
              description={
                posture.scored === 0
                  ? `${program.id} carries no finding that resolves to a scorable record, so there is no residual to publish. That is an absence of data, not a low risk, and it should not be read as one.`
                  : `A severity says how badly a requirement is missed. It says nothing about whether the weakness can be reached, whether anyone has exploited it, what it costs the mission, or whether the evidence that lowered it is still true. The aggregate below is the residual of the ${carried.length} deficienc${carried.length === 1 ? "y" : "ies"} this program is carrying, weighted by the mission criticality of the component each one sits on.`
              }
            >
              <Grid
                className="pt-200"
                gap="space.150"
                templateColumns={{ sm: "repeat(4, minmax(0, 1fr))" }}
              >
                <RiskTile
                  label="Aggregate residual"
                  value={posture.aggregate}
                  trailing={hasScores ? <BandChip band={aggregateBand} size="xsmall" /> : null}
                  note={
                    hasScores
                      ? "Weighted by the criticality of the component each deficiency sits on, so a CAT II on a mission-critical part outweighs a CAT I on something nothing depends on."
                      : "Nothing was scored, so this zero is an absence of data and carries no band. It is not a low residual and must not be read as one."
                  }
                />
                <RiskTile
                  label="Scored"
                  value={posture.scored}
                  note={
                    (!hasScores
                      ? "No finding in this boundary resolves to a record the model can read."
                      : excluded > 0
                        ? `${carried.length} carried today; ${excluded} closed or withdrawn, still scored so the trail survives closure but excluded from the aggregate.`
                        : "Every scored finding is a deficiency the program is carrying today.") +
                    (posture.unscored > 0 ? ` ${posture.unscored} could not be scored at all.` : "")
                  }
                />
                <RiskTile
                  label="Moved on live evidence"
                  value={posture.movers.length}
                  alarming
                  note="Scores that differ from what the finding alone would carry, because a KEV listing or an unacknowledged significant change moved the input."
                />
                <RiskTile
                  label="Disagree with the register"
                  value={posture.disagreements.length}
                  alarming
                  note="Register risks whose authored residual and computed residual are more than five points apart. Neither number is overwritten by the other."
                />
              </Grid>
            </Section>

            <Section
              title="Band distribution"
              description="Where the scored population falls. A band is a verdict rather than a property, which is why it is the part of this page that carries colour — and why Moderate is deliberately left neutral: the amber has to mean something."
            >
              <BandDistribution byBand={posture.byBand} />
            </Section>

            <Section
              title="Authored against computed"
              description={`The residual the assessor wrote in the register, beside the one this model derives from the same evidence. Neither is corrected by the other: the authored numbers are what somebody signed for, and where the two disagree that disagreement is information rather than an error to be tidied away.`}
              action={
                <span className="tabular-nums font-body-small text-subtle">
                  {comparisons.length} comparable · {unjoined.length} unscorable
                </span>
              }
            >
              <AuthoredComparisonTable rows={comparisons} />
              {unjoined.length > 0 ? (
                <p className="pt-150 font-body-small text-subtle">
                  {unjoined.length} register risk{unjoined.length === 1 ? " has" : "s have"} no
                  finding joined to {unjoined.length === 1 ? "it" : "them"} (
                  {unjoined.map((r) => r.id).join(", ")}), so{" "}
                  {unjoined.length === 1 ? "it is" : "they are"} not scored here. Deriving a
                  residual from the authored likelihood and impact would re-badge the assessor's
                  judgement as a computation, which is the one thing this model must not do.
                </p>
              ) : null}
            </Section>

            <Section
              title="What moved, and why"
              description="The counterfactual: what each finding would score if nothing had invalidated the evidence behind it and no KEV listing sat above its component. This is the loop between configuration management and risk — a determination is only ever true of a configuration, and when the configuration moves the residual goes up rather than staying where the last assessor left it."
            >
              <MoversTable movers={posture.movers} />
            </Section>
          </>
        ) : null}

        {tab === "Scored findings" ? (
          <>
            <Section
              title="Every scored finding"
              description={`${scored.length} finding${scored.length === 1 ? "" : "s"} in the boundary, worst first, with the inherent score, the mitigation credit taken off it and the residual that remains. Select a row to read the calculation that produced it.`}
              action={
                <span className="tabular-nums font-body-small text-subtle">
                  {carried.length} carried · {excluded} closed or withdrawn
                </span>
              }
            >
              <Box paddingBlockStart="space.200">
                <TopRisksTable rows={scored} selected={subjectId} onSelect={selectSubject} />
              </Box>
            </Section>

            {selected ? (
              <Section
                title={`${selected.score.subject} — ${selected.title}`}
                description={selected.context}
                action={
                  <TextLink size="small">
                    <Link to="/findings/$findingId" params={{ findingId: selected.score.subject }}>
                      Open finding
                    </Link>
                  </TextLink>
                }
              >
                <Toolbar>
                  <span className="font-body-small text-subtle">Finding</span>
                  <NativeSelect
                    value={selected.score.subject}
                    onChange={(e) => selectSubject(e.target.value)}
                    aria-label="Scored finding"
                    className="h-control-small font-body"
                    style={{ width: 460 }}
                  >
                    {scored.map((r) => (
                      <option key={r.score.subject} value={r.score.subject}>
                        {r.score.subject} — {r.score.score} {r.score.band} — {r.title}
                      </option>
                    ))}
                  </NativeSelect>
                </Toolbar>
                <Stack space="space.200">
                  <ScoreCard score={selected.score} subject={selected.title} />
                  <FactorTable score={selected.score} />
                </Stack>
              </Section>
            ) : (
              <Section
                title="Calculation trail"
                description="Select a finding above to read the arithmetic behind its residual."
              >
                <Box paddingBlockStart="space.200">
                  <Empty
                    title="Nothing selected"
                    description={`${program.id} has no scored finding to open, so there is no factor table to read.`}
                  />
                </Box>
              </Section>
            )}
          </>
        ) : null}

        {tab === "Calculation" ? (
          <>
            <Section
              title="The model"
              description="Six factors, each computed from a record somewhere else in this system and none of them a constant. A scoring model a program cannot inspect will not be trusted by an authorizing official, and it should not be — so the weights, the inputs and the normalisation ladders are published here rather than buried in the code that applies them."
            >
              <FactorModel />
            </Section>

            <Section
              title="Bands"
              description="Where the cuts fall, and what each one is meant to provoke. The band is derived from the score and nothing else; it adds no judgement the factor table has not already shown."
            >
              <BandLadder byBand={posture.byBand} />
            </Section>

            {worked ? (
              <Section
                title={`Worked example — ${worked.score.subject}`}
                description={`${worked.title}. ${worked.context}. Nothing below is illustrative: this is the live calculation for a real finding in ${program.id}, read the same way it is read on the finding's own page.`}
                action={
                  <TextLink size="small">
                    <Link to="/findings/$findingId" params={{ findingId: worked.score.subject }}>
                      Open {worked.score.subject}
                    </Link>
                  </TextLink>
                }
              >
                <Stack className="pt-200" space="space.200">
                  <ScoreCard score={worked.score} subject={worked.title} />
                  <FactorTable score={worked.score} />
                  <p className="font-body-small text-subtle">
                    Read as one line: <Id className="text-default">{sumLine(worked.score)}</Id>.
                    Every term above is a number this platform already holds somewhere else — the
                    severity from the finding register, the mission term from the confirmed effect
                    record, the exposure from the composition graph, the currency from the change
                    log. The model invents nothing; it weighs what is already written down, and it
                    shows its working so an authorizing official can disagree with a line rather
                    than with the idea of scoring.
                  </p>
                </Stack>
              </Section>
            ) : (
              <Section
                title="Worked example"
                description="A worked example has to be worked on a real finding, and this program has none."
              >
                <Box paddingBlockStart="space.200">
                  <Empty
                    title="No finding to work through"
                    description={`${program.id} carries no scorable finding, so any example on this page would be a fabrication.`}
                  />
                </Box>
              </Section>
            )}
          </>
        ) : null}
      </ShowPage>
    </Shell>
  );
}

/** The contribution column, restated as the one-line sum it actually is. */
function sumLine(score: ResidualScore): string {
  const terms = score.factors
    .map((f, i) =>
      i === 0
        ? String(f.contribution)
        : f.contribution < 0
          ? `− ${Math.abs(f.contribution)}`
          : `+ ${f.contribution}`,
    )
    .join(" ");
  return `${terms} = ${score.score}`;
}

/**
 * One headline number with the sentence that stops it being read wrong. The
 * `alarming` tiles go amber only when the count is non-zero: nothing moved and
 * nothing disagrees are both good outcomes, and colouring a zero would make the
 * page look busy where it is actually quiet.
 */
function RiskTile({
  label,
  value,
  note,
  trailing,
  alarming = false,
}: {
  label: string;
  value: number;
  note: string;
  trailing?: ReactNode;
  alarming?: boolean;
}) {
  return (
    <Box
      className="rounded-large border border-default bg-surface-sunken"
      paddingInline="space.200"
      paddingBlock="space.150"
    >
      <div className="font-body-small text-subtle">{label}</div>
      <Inline className="pt-050" space="space.100" alignBlock="baseline">
        <span
          className={cn(
            "tabular-nums font-heading-medium font-semibold",
            alarming && value > 0 ? "text-warning" : null,
            alarming && value === 0 ? "text-subtle" : null,
          )}
        >
          {value}
        </span>
        {trailing}
      </Inline>
      <Box className="font-body-small text-subtle" paddingBlockStart="space.075">
        {note}
      </Box>
    </Box>
  );
}
