import { useMemo } from "react";

import type { ControlStatus } from "@/lib/control-matrix";
import type { Coverage } from "@/lib/program-coverage";
import {
  Chart,
  KeyValue,
  Section,
  Stack,
  TextLink,
  type ChartSelection,
  type ChartSeries,
} from "@ledger/design-system";

/** The four determinations, in the status tones the rest of the record uses. */
const coverageSeries: ChartSeries[] = [
  { key: "satisfied", label: "Satisfied", tone: "success" },
  { key: "partial", label: "Partial", tone: "warning" },
  { key: "other", label: "Other than satisfied", tone: "danger" },
  { key: "notAssessed", label: "Not assessed", tone: "neutral" },
];

const statusOf: Record<string, ControlStatus> = {
  satisfied: "Satisfied",
  partial: "Partial",
  other: "Other than satisfied",
  notAssessed: "Not assessed",
};

export function FamilyCoverageChart({
  coverage,
  baseline,
  onSelect,
}: {
  coverage: Coverage;
  baseline: string;
  /** A column or a segment was chosen: the family, and the status when it was a segment. */
  onSelect: (family: string, status: ControlStatus | "All") => void;
}) {
  const rows = useMemo(
    () =>
      coverage.families.map((f) => ({
        family: f.id,
        name: f.name,
        owner: f.owner,
        total: f.total,
        inherited: f.inherited,
        pct: f.pct,
        satisfied: f.satisfied,
        partial: f.partial,
        other: f.other,
        notAssessed: f.notAssessed,
      })),
    [coverage],
  );
  const least = coverage.families[0];
  const most = coverage.families[coverage.families.length - 1];
  const summary = [
    `${coverage.satisfied} of ${coverage.total} controls are satisfied, ${coverage.pct}%.`,
    least && most && least !== most
      ? `${least.id} ${least.name} is the least satisfied family at ${least.pct}%, ${most.id} ${most.name} the most at ${most.pct}%.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Section
      title="Control coverage"
      action={<span className="font-body-small text-subtle">{baseline}</span>}
    >
      <Chart.Frame
        title="Determinations by control family"
        description={`${coverage.satisfied} of ${coverage.total} satisfied · ${coverage.inherited} inherited · ${coverage.systemImplemented} system-implemented · least satisfied first`}
        summary={summary}
        series={coverageSeries}
        data={rows}
        x="family"
        xLabel="Family"
        columns={[
          { key: "name", label: "Name", place: "before" },
          { key: "total", label: "Total" },
          { key: "inherited", label: "Inherited" },
          { key: "pct", label: "Share", format: (v) => `${String(v)}%` },
          { key: "owner", label: "Owner" },
        ]}
        download={["csv", "png"]}
        expandable
        size="large"
        className="pt-150"
      >
        <Chart.Bar
          data={rows}
          x="family"
          series={coverageSeries}
          stacked
          size="large"
          yLabel="Controls"
          onSelect={(s) =>
            onSelect(
              String(s.datum["family"]),
              s.series ? (statusOf[s.series.key] ?? "All") : "All",
            )
          }
          details={(s) => <FamilyCard selection={s} />}
        />
      </Chart.Frame>
    </Section>
  );
}

function FamilyCard({ selection }: { selection: ChartSelection }) {
  const d = selection.datum;
  return (
    <Stack space="space.150">
      <p className="font-body font-medium text-default">{String(d["name"] ?? "")}</p>
      <div>
        <KeyValue label="Owner" labelWidth={88}>
          {String(d["owner"] ?? "")}
        </KeyValue>
        <KeyValue label="Controls" labelWidth={88}>
          {`${String(d["total"])} · ${String(d["inherited"])} inherited`}
        </KeyValue>
        <KeyValue label="Satisfied" labelWidth={88}>
          {`${String(d["pct"])}%`}
        </KeyValue>
      </div>
      <TextLink size="small" render={<a href="#control-matrix" />}>
        Show in the matrix
      </TextLink>
    </Stack>
  );
}
