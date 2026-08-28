import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Mono,
  PageHeader,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
      <div className="animate-slide-up space-y-7">
        <PageHeader
          title="STIG & SRG library"
          description="Benchmarks by technology and version. Every rule declares the CCIs it satisfies, which is how a scan result reaches an authorization decision."
          actions={<Button variant="secondary">Import benchmark</Button>}
        />

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
                <Th>ID</Th>
                <Th>Benchmark</Th>
                <Th>Technology</Th>
                <Th>Current</Th>
                <Th>Released</Th>
                <Th>Applied</Th>
                <Th className="text-right">Rules</Th>
                <Th className="text-right">CAT I / II / III</Th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b) => (
                <Tr key={b.id}>
                  <Td>
                    <Mono>{b.id}</Mono>
                  </Td>
                  <Td className="truncate font-medium">{b.name}</Td>
                  <Td className="truncate text-muted-foreground">{b.technology}</Td>
                  <Td>
                    <Mono>{b.version}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{b.released}</Td>
                  <Td>
                    {b.appliedVersion === b.version ? (
                      <span className="text-muted-foreground">{b.appliedVersion}</span>
                    ) : (
                      <Badge tone="warning">{b.appliedVersion} behind</Badge>
                    )}
                  </Td>
                  <Td className="tnum text-right text-muted-foreground">{b.rules}</Td>
                  <Td className="tnum text-right text-muted-foreground">
                    {b.catI} / {b.catII} / {b.catIII}
                  </Td>
                </Tr>
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
                <Th>Rule</Th>
                <Th>Title</Th>
                <Th>Technology</Th>
                <Th>Severity</Th>
                <Th>Satisfies CCI</Th>
              </tr>
            </thead>
            <tbody>
              {visibleRules.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Mono>{r.id}</Mono>
                  </Td>
                  <Td className="truncate">{r.title}</Td>
                  <Td className="truncate text-muted-foreground">
                    {benchmarkById.get(r.benchmark)?.technology}
                  </Td>
                  <Td>
                    {r.severity === "CAT III" ? (
                      <span className="text-muted-foreground">CAT III</span>
                    ) : (
                      <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    )}
                  </Td>
                  <Td className="truncate">
                    <Mono className="text-muted-foreground">{r.ccis.join(", ")}</Mono>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>
    </Shell>
  );
}
