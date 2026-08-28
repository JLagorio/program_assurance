import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  PageHeader,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { benchmarkById, rulesByCci } from "@/lib/catalog";
import {
  assetById,
  assets,
  bySeverity,
  findings,
  findingsByAsset,
  isOpen,
  type Finding,
} from "@/lib/findings";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/findings")({
  head: () => ({
    meta: [
      { title: "Findings & assets — Equinox" },
      {
        name: "description",
        content:
          "Every technical finding joined to its CCI and asset, with raw and mitigated severity, verification path, and the POA&M or risk it rolls up to.",
      },
      { property: "og:title", content: "Findings & assets — Equinox" },
      {
        property: "og:description",
        content:
          "Findings joined to CCIs and assets: raw vs mitigated severity, verification path, POA&M and risk rollup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindingsPage,
});

const tabs = ["Findings", "Assets"] as const;
type Tab = (typeof tabs)[number];

const scopes = ["Open", "All", "CAT I", "Settled"] as const;
type Scope = (typeof scopes)[number];

function scopeFilter(f: Finding, scope: Scope) {
  if (scope === "All") return true;
  if (scope === "Open") return isOpen(f);
  if (scope === "CAT I") return f.mitigatedSeverity === "CAT I" || f.rawSeverity === "CAT I";
  return !isOpen(f);
}

function FindingsPage() {
  const [tab, setTab] = useState<Tab>("Findings");
  const [scope, setScope] = useState<Scope>("Open");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Finding | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return findings
      .filter((f) => scopeFilter(f, scope))
      .filter(
        (f) =>
          !needle ||
          f.title.toLowerCase().includes(needle) ||
          f.id.toLowerCase().includes(needle) ||
          f.cci.toLowerCase().includes(needle) ||
          f.control.toLowerCase().includes(needle) ||
          (assetById.get(f.asset)?.name ?? "").toLowerCase().includes(needle),
      )
      .slice()
      .sort(bySeverity);
  }, [scope, q]);

  const counts: Record<Tab, number> = {
    Findings: findings.filter(isOpen).length,
    Assets: assets.length,
  };

  const railRules = selected ? (rulesByCci.get(selected.cci) ?? []) : [];
  const asset = selected ? assetById.get(selected.asset) : undefined;

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="Findings & assets"
          description="One technical fact per row, joined to a CCI and an asset. Raw severity is what the scanner said; mitigated severity is what the AO will see."
          actions={
            <Button variant="secondary">
              <Download className="size-3.5" /> Export SAR extract
            </Button>
          }
        />

        <div className="flex items-center gap-4 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSelected(null);
              }}
            >
              <span
                className={
                  t === tab
                    ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                    : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {t}
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {counts[t]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {tab === "Findings" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search findings, CCIs, assets"
                className="h-7 w-[240px] rounded-md border border-border bg-background pl-7 pr-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary/40"
              />
            </label>
            <div className="flex items-center gap-1">
              {scopes.map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={
                    s === scope
                      ? "h-7 rounded-md bg-primary-soft px-2 text-[12.5px] font-medium text-primary"
                      : "h-7 rounded-md px-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={selected ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "Findings" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "92px" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "124px" }} />
                  <col style={{ width: "68px" }} />
                  <col style={{ width: "68px" }} />
                  <col style={{ width: "112px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Finding</Th>
                    <Th>Title</Th>
                    <Th>CCI</Th>
                    <Th>Asset</Th>
                    <Th>Source</Th>
                    <Th>Raw</Th>
                    <Th>Mitigated</Th>
                    <Th>Lifecycle</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <Tr
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className={
                        selected?.id === f.id ? "cursor-pointer bg-subtle" : "cursor-pointer"
                      }
                    >
                      <Td>
                        <Mono className="text-primary">{f.id}</Mono>
                      </Td>
                      <Td className="truncate font-medium">{f.title}</Td>
                      <Td>
                        <Mono className="text-muted-foreground">{f.cci}</Mono>
                      </Td>
                      <Td className="truncate text-muted-foreground">
                        {assetById.get(f.asset)?.name ?? f.asset}
                      </Td>
                      <Td className="truncate text-muted-foreground">{f.source}</Td>
                      <Td className="text-muted-foreground">{f.rawSeverity}</Td>
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
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "92px" }} />
                  <col />
                  <col style={{ width: "128px" }} />
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "128px" }} />
                  <col style={{ width: "116px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Asset</Th>
                    <Th>Name</Th>
                    <Th>Kind</Th>
                    <Th>Technology</Th>
                    <Th>Environment</Th>
                    <Th>Last scan</Th>
                    <Th className="text-right">Open I / II / III</Th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <Tr key={a.id}>
                      <Td>
                        <Mono className="text-primary">{a.id}</Mono>
                      </Td>
                      <Td className="truncate font-medium">{a.name}</Td>
                      <Td className="truncate text-muted-foreground">{a.kind}</Td>
                      <Td className="truncate text-muted-foreground">{a.technology}</Td>
                      <Td className="truncate text-muted-foreground">{a.environment}</Td>
                      <Td className="truncate text-[12px] text-muted-foreground">{a.lastScan}</Td>
                      <Td className="tnum text-right">
                        <span className={a.openCatI ? "font-medium text-danger" : ""}>
                          {a.openCatI}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {a.openCatII} / {a.openCatIII}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {selected ? (
            <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-baseline gap-2">
                <Mono className="text-primary">{selected.id}</Mono>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <h2 className="mt-1 text-[13.5px] font-semibold leading-snug">{selected.title}</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.detail}
              </p>

              <div className="mt-3">
                <RailGroup title="Join keys">
                  <KeyValue label="CCI">
                    <Mono>{selected.cci}</Mono>
                  </KeyValue>
                  <KeyValue label="Control">
                    <Mono>{selected.control}</Mono>
                  </KeyValue>
                  <KeyValue label="Asset">
                    {asset ? `${asset.name} · ${asset.technology}` : selected.asset}
                  </KeyValue>
                  <KeyValue label="Rule">
                    {selected.rule ? <Mono>{selected.rule}</Mono> : "—"}
                  </KeyValue>
                </RailGroup>

                <RailGroup title="Severity">
                  <KeyValue label="Raw">{selected.rawSeverity}</KeyValue>
                  <KeyValue label="Mitigated">
                    <Badge tone={severityTone(selected.mitigatedSeverity)}>
                      {selected.mitigatedSeverity}
                    </Badge>
                  </KeyValue>
                  <KeyValue label="Lifecycle">
                    <Badge tone={statusTone(selected.lifecycle)}>{selected.lifecycle}</Badge>
                  </KeyValue>
                </RailGroup>

                {selected.mitigation ? (
                  <RailGroup title="Mitigation">
                    <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                      {selected.mitigation}
                    </p>
                  </RailGroup>
                ) : null}

                <RailGroup title="Provenance">
                  <KeyValue label="Source">{selected.source}</KeyValue>
                  <KeyValue label="Artifact">
                    <Mono>{selected.sourceArtifact}</Mono>
                  </KeyValue>
                  <KeyValue label="First seen">{selected.firstSeen}</KeyValue>
                  <KeyValue label="Last seen">{selected.lastSeen}</KeyValue>
                  <KeyValue label="Occurrences">{selected.occurrences}</KeyValue>
                  <KeyValue label="Owner">{selected.owner}</KeyValue>
                </RailGroup>

                <RailGroup title="Rolls up to">
                  <KeyValue label="POA&M">
                    {selected.poam ? <Mono>{selected.poam}</Mono> : "Not yet scheduled"}
                  </KeyValue>
                  <KeyValue label="Risk">
                    {selected.risk ? (
                      <Link to="/risks" className="text-primary hover:underline">
                        <Mono className="text-primary">{selected.risk}</Mono>
                      </Link>
                    ) : (
                      "Not aggregated"
                    )}
                  </KeyValue>
                </RailGroup>

                <RailGroup title="Same CCI elsewhere" defaultOpen={false}>
                  <div className="space-y-1.5 text-[12.5px]">
                    {railRules.length ? (
                      railRules.map((r) => (
                        <div key={r.id} className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0 truncate">
                            <Mono>{r.id}</Mono>{" "}
                            <span className="text-muted-foreground">
                              {benchmarkById.get(r.benchmark)?.technology}
                            </span>
                          </span>
                          <span className="shrink-0 text-muted-foreground">{r.severity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No STIG rule implements this CCI — verification is procedural.
                      </p>
                    )}
                  </div>
                </RailGroup>

                {asset ? (
                  <RailGroup title={`Other findings on ${asset.name}`} defaultOpen={false}>
                    <div className="space-y-1.5 text-[12.5px]">
                      {findingsByAsset(asset.id)
                        .filter((f) => f.id !== selected.id)
                        .map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSelected(f)}
                            className="flex w-full items-baseline justify-between gap-2 text-left"
                          >
                            <span className="min-w-0 truncate">
                              <Mono className="text-primary">{f.id}</Mono>{" "}
                              <span className="text-muted-foreground">{f.title}</span>
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              {f.mitigatedSeverity}
                            </span>
                          </button>
                        ))}
                    </div>
                  </RailGroup>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
