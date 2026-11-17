// A shared component's Versions tab: the versions of its set that hold it, newest first, and what
// the version shown changes. Versions is a compact collection in the versions' order, with no
// search or sort: each version's State, the day it was Published, the day an assessment judged it
// itself and by whom (Not assessed itself where everything it stands on was carried forward),
// Controls satisfied, its controls satisfied out of those it stands on beside a `Tally` of its
// standing, To review, the controls a change left to review, and Consumers, the current product
// elements and system components built from it (`componentVersionLines` in component-work, over
// `component_control_status` for each version and `component_consumers`). What version N changes
// says the change the version records against the one before (`component_control_status`'s
// `change`): its kinds, the CVEs its SBOM records as fixed and its summary, then what that does to
// the version's standing, carried forward, judged on it, to review and not assessed, over a
// `Tally`; a version that records no change says so, and the first version has none to record.
// Affected controls lists the controls the change affects with the version before's standing and
// this one's, To review where the change stopped a determination carrying forward. Publishing a
// version has no command of its own in the schema (a version's state is written directly), so the
// tab offers none.

import { useMemo } from "react";
import { GitCompare, History } from "lucide-react";
import {
  Absent,
  Badge,
  DateTime,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Inline,
  KeyValue,
  Prose,
  Section,
  Stack,
  Tally,
  Text,
  defineColumns,
  useLedgerLocale,
  type TallySegment,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import {
  useComponentConsumers,
  type ComponentControlCounts,
  type ComponentControlStatusAnswer,
  type ComponentVersionChange,
} from "@/lib/component-reuse";
import {
  affectedControlLines,
  changeOutcome,
  componentVersionLines,
  fixedCves,
  useComponentIdentity,
  useComponentStandings,
  useComponentVersionsHeld,
  useSbomCves,
  type AffectedControlLine,
  type ComponentVersionLine,
} from "@/lib/component-work";
import { useComponentSboms } from "@/lib/component-vulnerabilities";
import { ELEMENT_CHANGE_LABELS, type ElementChangeKind } from "@/lib/product-assurance";
import { controlName } from "@/lib/product-records";
import { determinations, revisionStates } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink } from "./record-preview";
import { RelationName } from "./record-tools";
import { ReportFailures, type QueryStatus } from "./work-common";

/** A standing as one bar: the determinations, the controls to review hollow, then not assessed. */
function standingSegments(
  counts: ComponentControlCounts,
  toReview: number,
  formatNumber: (value: number) => string,
): TallySegment[] {
  const segment = (
    key: string,
    value: number,
    label: string,
    tone: TallySegment["tone"],
    fill: TallySegment["fill"] = "solid",
  ): TallySegment => ({ key, value, label: `${formatNumber(value)} ${label}`, tone, fill });
  return [
    segment("satisfied", counts.satisfied, "satisfied", "success"),
    segment("partially", counts.partially_satisfied, "partially satisfied", "warning"),
    segment("other", counts.other_than_satisfied, "other than satisfied", "danger"),
    segment("review", toReview, "to review", "warning", "outline"),
    segment("not_assessed", Math.max(0, counts.not_assessed - toReview), "not assessed", "neutral"),
  ];
}

/** Controls satisfied out of those the version stands on, beside its standing as a bar. */
function SatisfiedCell({ line }: { line: ComponentVersionLine }) {
  const { formatNumber } = useLedgerLocale();
  return (
    <Inline space="space.100" alignBlock="center" className="min-w-0">
      <Text numeric>{`${formatNumber(line.satisfied)} of ${formatNumber(line.controls)}`}</Text>
      <Tally
        segments={standingSegments(line.counts, line.toReview, formatNumber)}
        total={line.controls}
        size="large"
        label={`Standing of version ${formatNumber(line.version)}, ${formatNumber(line.controls)} controls`}
      />
    </Inline>
  );
}

const versionColumns = defineColumns<ComponentVersionLine>((c) => [
  c.text("version", {
    header: "Version",
    minWidth: 120,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (line) => `Version ${line.version}`,
  }),
  c.status("state", {
    header: "State",
    statuses: revisionStates,
    width: 120,
    priority: 2,
    sortable: false,
  }),
  c.date("publishedAt", { header: "Published", priority: 3, sortable: false }),
  c.custom("assessed", {
    header: "Assessed",
    width: 150,
    priority: 4,
    cell: (line) =>
      line.assessment ? (
        <DateTime value={line.assessment.on} format="date" />
      ) : (
        <Absent label="Not assessed itself" />
      ),
  }),
  c.custom("assessor", {
    header: "Assessor",
    width: 170,
    priority: 6,
    cell: (line) =>
      line.assessment ? (
        <RelationName table="parties" id={line.assessment.assessorPartyId} />
      ) : (
        <Absent label="Not assessed itself" />
      ),
  }),
  c.custom("satisfied", {
    header: "Controls satisfied",
    width: 220,
    priority: 1,
    cell: (line) => <SatisfiedCell line={line} />,
  }),
  c.number("toReview", { header: "To review", width: 110, priority: 5, sortable: false }),
  c.number("consumers", { header: "Consumers", width: 120, priority: 3, sortable: false }),
]);

/** The versions of the component, the newest first: the order is the history's meaning. */
function VersionLines({
  lines,
  queries,
}: {
  lines: ComponentVersionLine[];
  queries: QueryStatus[];
}) {
  const table = useCollectionTable({
    columns: versionColumns,
    data: lines,
    getRowId: (line) => line.id,
    label: "Versions of this component",
    pinnable: false,
    hideable: false,
  });
  return (
    <ProductCollection
      table={table}
      queries={queries}
      compact
      search={false}
      sort={false}
      keepQuestion={false}
      noun={{ one: "version", other: "versions" }}
      empty={{
        icon: <History />,
        title: "No versions",
        description: "Versions of its set that hold it appear here.",
      }}
    />
  );
}

/** Where a version stands on an affected control, in the determinations' words. */
function StandingOn({ status, toReview }: { status: string | null; toReview: boolean }) {
  if (toReview)
    return (
      <Badge variant="outline" tone="warning">
        To review
      </Badge>
    );
  return status ? (
    <StatusBadge statuses={determinations} value={status} />
  ) : (
    <Absent label="Not claimed" />
  );
}

/** The controls a version's change affects, with the version before's standing and this one's. */
function AffectedControls({
  lines,
  before,
  version,
}: {
  lines: AffectedControlLine[];
  before: number | null;
  version: number;
}) {
  const columns = useMemo(
    () =>
      defineColumns<AffectedControlLine>((c) => [
        c.text("code", {
          header: "Control",
          minWidth: 180,
          priority: 0,
          hideable: false,
          sortable: false,
          cell: (line) => (
            <RecordLink table="controls" record={{ id: line.id }}>
              {controlName(line)}
            </RecordLink>
          ),
        }),
        ...(before === null
          ? []
          : [
              c.custom("before", {
                header: `On version ${before}`,
                width: 150,
                priority: 2,
                cell: (line: AffectedControlLine) => (
                  <StandingOn status={line.before} toReview={false} />
                ),
              }),
            ]),
        c.custom("after", {
          header: `On version ${version}`,
          width: 150,
          priority: 1,
          cell: (line) => <StandingOn status={line.after} toReview={line.toReview} />,
        }),
      ]),
    [before, version],
  );
  const table = useCollectionTable({
    columns,
    data: lines,
    getRowId: (line) => line.id,
    label: "Affected controls",
    pinnable: false,
    hideable: false,
  });
  return (
    <Section title="Affected controls" count={lines.length} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        noun={{ one: "affected control", other: "affected controls" }}
        empty={{
          icon: <GitCompare />,
          title: "No affected control",
          description: "Every determination carries forward.",
        }}
      />
    </Section>
  );
}

/**
 * The versions of the component's set that hold it, with where each stands, and what the version
 * shown changes. `componentId` is the component version the record shows.
 */
export function ComponentVersionsPanel({ componentId }: { componentId: string }) {
  const { formatNumber } = useLedgerLocale();
  const { identity, queries: identityQueries } = useComponentIdentity(componentId);
  const held = useComponentVersionsHeld(identity);
  const ids = useMemo(
    () => (held.versions ?? []).map((version) => version.definedComponentId),
    [held.versions],
  );
  const standings = useComponentStandings(ids);
  const consumers = useComponentConsumers(componentId);
  const { sboms, query: sbomsQuery } = useComponentSboms(componentId);
  const standingSbom = sboms?.find((sbom) => sbom.standing) ?? null;
  const fixed = useSbomCves(standingSbom ? { sbomId: standingSbom.id, state: "fixed" } : null);
  const lines = useMemo(
    () =>
      held.versions && standings.standings
        ? componentVersionLines(held.versions, standings.standings, consumers.data)
        : [],
    [held.versions, standings.standings, consumers.data],
  );
  const shown = standings.standings?.get(componentId);
  const index = held.versions?.findIndex((version) => version.definedComponentId === componentId);
  const previous = index === undefined || index < 0 ? undefined : held.versions?.[index + 1];
  const before = previous ? standings.standings?.get(previous.definedComponentId) : undefined;
  const version = identity?.version;
  const queries = [...identityQueries, ...held.queries, ...standings.queries, consumers];
  return (
    <Stack space="space.300">
      <VersionLines lines={lines} queries={queries} />
      {version !== undefined && shown ? (
        <>
          <Section title={`What version ${formatNumber(version)} changes`}>
            {shown.change ? (
              <ChangeFacts
                change={shown.change}
                publishedAt={identity?.publishedAt ?? null}
                fixes={
                  fixed.byComponent
                    ? fixedCves(fixed.byComponent).map((cve) => cve.cveId)
                    : undefined
                }
                standing={shown}
                version={version}
              />
            ) : (
              <Empty size="compact">
                <EmptyHeader>
                  <EmptyTitle>{previous ? "No change recorded" : "The first version"}</EmptyTitle>
                  <EmptyDescription>
                    {previous
                      ? "Every determination of the version before carries forward."
                      : "There is no version before it to change from."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Section>
          {shown.change ? (
            <AffectedControls
              lines={affectedControlLines(shown.change, shown, before ?? null)}
              before={previous ? previous.version : null}
              version={version}
            />
          ) : null}
        </>
      ) : null}
      <ReportFailures queries={[sbomsQuery, ...fixed.queries]} />
    </Stack>
  );
}

/** A version's change as facts, then what it does to the version's standing. */
function ChangeFacts({
  change,
  publishedAt,
  fixes,
  standing,
  version,
}: {
  change: ComponentVersionChange;
  publishedAt: string | null;
  /** The CVEs the version's SBOM records as fixed; none while they are read. */
  fixes: string[] | undefined;
  standing: ComponentControlStatusAnswer;
  version: number;
}) {
  const { formatNumber } = useLedgerLocale();
  const outcome = changeOutcome(standing);
  const counts: [string, number][] = [
    ["Carried forward", outcome.carried],
    [`Judged on version ${formatNumber(version)}`, outcome.judged],
    ["To review", outcome.toReview],
    ["Not assessed", outcome.notAssessed],
  ];
  return (
    <Stack space="space.200">
      <KeyValue.Group labelWidth="wide">
        <KeyValue label="Kind">
          {change.kinds
            .map((kind) => ELEMENT_CHANGE_LABELS[kind as ElementChangeKind] ?? kind)
            .join(", ")}
        </KeyValue>
        {fixes === undefined ? null : (
          <KeyValue label="Fixes" wrap>
            {fixes.length ? fixes.join(", ") : <Absent label="No CVE recorded as fixed" />}
          </KeyValue>
        )}
        <KeyValue label="Published">
          <DateTime value={publishedAt} format="date" absentLabel="Not published" />
        </KeyValue>
        {counts
          .filter(([, value]) => value > 0)
          .map(([label, value]) => (
            <KeyValue key={label} label={label}>
              {formatNumber(value)}
            </KeyValue>
          ))}
      </KeyValue.Group>
      <Tally
        segments={standingSegments(standing.counts, outcome.toReview, formatNumber)}
        total={outcome.controls}
        size="xlarge"
        label={`Standing of version ${formatNumber(version)}, ${formatNumber(outcome.controls)} controls`}
      />
      <Prose label="Change">{change.summary}</Prose>
    </Stack>
  );
}
