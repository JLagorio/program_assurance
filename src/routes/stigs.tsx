import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge, Button, Table, Id, Indicator } from "@/ds/primitives";
import { PageHeader, Section, IndexPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import { benchmarkById, benchmarks, rules } from "@/lib/catalog";
import { severityTone } from "@/lib/spine";

export const Route = createFileRoute("/stigs")({
  head: () => ({
    meta: [
      { title: "STIG & SRG library — benchmarks and rule-to-CCI mapping | Equinox" },
      {
        name: "description",
        content:
          "DISA STIG and SRG benchmarks by technology and version, with rule-to-CCI mappings and a version-drift view showing which benchmarks the estate still lags.",
      },
      { property: "og:title", content: "STIG & SRG library — Equinox" },
      {
        property: "og:description",
        content:
          "Benchmarks by technology and version, rule-to-CCI mappings, and benchmark version drift across the estate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StigLibrary,
});

function StigLibrary() {
  const [benchmark, setBenchmark] = useState<string>("All");

  const visibleRules = useMemo(
    () => (benchmark === "All" ? rules : rules.filter((r) => r.benchmark === benchmark)),
    [benchmark],
  );

  const drifted = benchmarks.filter((b) => b.appliedVersion !== b.version);

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="STIG & SRG library"
            description="Benchmarks by technology and version. Every rule declares the CCIs it satisfies, which is how a scan result reaches an authorization decision."
            actions={<Button variant="secondary">Import benchmark</Button>}
          />
        }
      >
        <Section
          title="Benchmarks"
          description={
            drifted.length
              ? `${drifted.length} of ${benchmarks.length} benchmarks are behind the current DISA release.`
              : "Every benchmark is at the current DISA release."
          }
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "96px" }} />
              <col />
              <col style={{ width: "168px" }} />
              <col style={{ width: "76px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "132px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "148px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>ID</Table.Header>
                <Table.Header>Benchmark</Table.Header>
                <Table.Header>Technology</Table.Header>
                <Table.Header>Current</Table.Header>
                <Table.Header>Released</Table.Header>
                <Table.Header>Applied</Table.Header>
                <Table.Header className="text-right">Rules</Table.Header>
                <Table.Header className="text-right">CAT I / II / III</Table.Header>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b) => (
                <Table.Row key={b.id}>
                  <Table.Cell>
                    <Id>{b.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="truncate">{b.name}</Table.Cell>
                  <Table.Cell className="truncate">{b.technology}</Table.Cell>
                  <Table.Cell>
                    <Id>{b.version}</Id>
                  </Table.Cell>
                  <Table.Cell>{b.released}</Table.Cell>
                  <Table.Cell>
                    {b.appliedVersion === b.version ? (
                      <span className="text-muted-foreground">{b.appliedVersion}</span>
                    ) : (
                      <Badge tone="warning">{b.appliedVersion} behind</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="tnum text-right">{b.rules}</Table.Cell>
                  <Table.Cell className="tnum text-right">
                    {b.catI} / {b.catII} / {b.catIII}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Rule to CCI mapping"
          description="The join. A failed rule becomes a finding against the CCI it maps to, and the parent control's assessment recalculates from there."
          action={
            <select
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              className="h-7 w-[224px] rounded-md border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/40"
            >
              <option value="All">All benchmarks</option>
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.technology} · {b.version}
                </option>
              ))}
            </select>
          }
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "104px" }} />
              <col />
              <col style={{ width: "160px" }} />
              <col style={{ width: "72px" }} />
              <col style={{ width: "200px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>Rule</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header>Technology</Table.Header>
                <Table.Header>Severity</Table.Header>
                <Table.Header>Satisfies CCI</Table.Header>
              </tr>
            </thead>
            <tbody>
              {visibleRules.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <Id>{r.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="truncate">{r.title}</Table.Cell>
                  <Table.Cell className="truncate">
                    {benchmarkById.get(r.benchmark)?.technology}
                  </Table.Cell>
                  <Table.Cell>
                    {r.severity === "CAT III" ? (
                      <span className="text-muted-foreground">CAT III</span>
                    ) : (
                      <Indicator tone={severityTone(r.severity)}>{r.severity}</Indicator>
                    )}
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    <Id>{r.ccis.join(", ")}</Id>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </IndexPage>
    </Shell>
  );
}
