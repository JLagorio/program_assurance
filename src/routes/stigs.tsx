import { UnavailableAction } from "@/components/app/unavailable-action";
import { benchmarkById, benchmarks, rules } from "@/lib/catalog";
import { severityTone } from "@/lib/spine";
import {
  Badge,
  Id,
  Indicator,
  PageHeader,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
} from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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

  const benchmarkItems = [
    { value: "All", label: "All benchmarks" },
    ...benchmarks.map((b) => ({
      value: b.id,
      label: (
        <>
          {b.technology} · {b.version}
        </>
      ),
    })),
  ];
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"STIG & SRG library"}</PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <UnavailableAction
            reason="Benchmark import is not connected. This library is read-only."
            variant="secondary"
          >
            Import benchmark
          </UnavailableAction>
        </PageHeader.Actions>
      </PageHeader>
      <Section
        title="Benchmarks"
        description={
          drifted.length
            ? `${drifted.length} of ${benchmarks.length} benchmarks are behind the current DISA release.`
            : "Every benchmark is at the current DISA release."
        }
      >
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={96}>ID</Table.Header>
              <Table.Header>Benchmark</Table.Header>
              <Table.Header width={168}>Technology</Table.Header>
              <Table.Header width={76}>Current</Table.Header>
              <Table.Header width={96}>Released</Table.Header>
              <Table.Header width={132}>Applied</Table.Header>
              <Table.Header width={72} className="text-right">
                Rules
              </Table.Header>
              <Table.Header width={148} className="text-right">
                CAT I / II / III
              </Table.Header>
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
                    <span className="text-subtle">{b.appliedVersion}</span>
                  ) : (
                    <Badge variant="secondary" tone="warning">
                      {b.appliedVersion} behind
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">{b.rules}</Table.Cell>
                <Table.Cell className="tabular-nums text-right">
                  {b.catI} / {b.catII} / {b.catIII}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Section>
      <Section
        title="Rule to CCI mapping"
        action={
          <Select<string>
            items={benchmarkItems}
            value={benchmark}
            onValueChange={(value) => {
              if (value === null) return;
              return setBenchmark(value);
            }}
          >
            <SelectTrigger
              className="w-full"
              aria-label="Benchmark"
              style={{ width: 224, maxWidth: "100%" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {benchmarkItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={104}>Rule</Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header width={160}>Technology</Table.Header>
              <Table.Header width={72}>Severity</Table.Header>
              <Table.Header width={200}>Satisfies CCI</Table.Header>
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
                    <span className="text-subtle">CAT III</span>
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
    </Stack>
  );
}
