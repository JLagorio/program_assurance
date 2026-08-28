import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, FileDown, RefreshCw } from "lucide-react";

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
import {
  artifacts,
  packageStateTone,
  packages,
  readiness,
  submissionsFor,
  type Pkg,
  type TraceRow,
} from "@/lib/packages";
import { statusTone } from "@/lib/spine";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "Authorization packages — Equinox" },
      {
        name: "description",
        content:
          "PKG- snapshots of the spine: every in-scope CCI traced to the objective that proved it, the findings still open, and the SSP/SAR/POA&M generated from that snapshot.",
      },
      { property: "og:title", content: "Authorization packages — Equinox" },
      {
        property: "og:description",
        content: "Package readiness, CCI traceability and generated SSP/SAR/POA&M artifacts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackagesPage,
});

const tabs = ["Traceability", "Artifacts", "Submission log"] as const;
type Tab = (typeof tabs)[number];

function resultTone(r: TraceRow["result"]) {
  if (r === "Met") return "success" as const;
  if (r === "Not met") return "danger" as const;
  if (r === "Partially met") return "warning" as const;
  return "neutral" as const;
}

function PackagesPage() {
  const [pkgId, setPkgId] = useState<string>(packages[0]!.id);
  const [tab, setTab] = useState<Tab>("Traceability");
  const [row, setRow] = useState<TraceRow | null>(null);
  const [gapsOnly, setGapsOnly] = useState(false);

  const pkg = useMemo(() => packages.find((p) => p.id === pkgId) as Pkg, [pkgId]);
  const ready = useMemo(() => readiness(pkg), [pkg]);
  const log = useMemo(() => submissionsFor(pkg.id), [pkg]);

  const traceRows = gapsOnly ? ready.rows.filter((r) => r.gap) : ready.rows;

  const counts: Record<Tab, number> = {
    Traceability: ready.rows.length,
    Artifacts: ready.artifacts.length,
    "Submission log": log.length,
  };

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="Authorization packages"
          description="A package is a snapshot of the spine, not a folder of documents. The SSP, SAR and POA&M are generated views of the same in-scope CCIs — if a CCI has no objective, no result, or an open finding it did not declare, the package is not shippable."
          actions={
            <>
              <Button>
                <RefreshCw className="size-3.5" /> Regenerate stale
              </Button>
              <Button variant="primary" disabled={!ready.shippable}>
                <FileDown className="size-3.5" /> Submit snapshot
              </Button>
            </>
          }
        />

        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "96px" }} />
            <col />
            <col style={{ width: "68px" }} />
            <col style={{ width: "124px" }} />
            <col style={{ width: "132px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "84px" }} />
            <col style={{ width: "84px" }} />
          </colgroup>
          <thead>
            <tr>
              <Th>Package</Th>
              <Th>Name</Th>
              <Th>Ver.</Th>
              <Th>State</Th>
              <Th>Snapshot</Th>
              <Th>Owner</Th>
              <Th className="text-right">Traced</Th>
              <Th className="text-right">Gaps</Th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => {
              const r = readiness(p);
              return (
                <Tr
                  key={p.id}
                  className={p.id === pkgId ? "cursor-pointer bg-subtle" : "cursor-pointer"}
                  onClick={() => {
                    setPkgId(p.id);
                    setRow(null);
                  }}
                >
                  <Td>
                    <Mono className="text-primary">{p.id}</Mono>
                  </Td>
                  <Td className="truncate font-medium">{p.name}</Td>
                  <Td className="tnum text-muted-foreground">{p.version}</Td>
                  <Td className="truncate">
                    <Badge tone={packageStateTone[p.state]}>{p.state}</Badge>
                  </Td>
                  <Td className="truncate text-[12px] text-muted-foreground">{p.snapshotAt}</Td>
                  <Td className="truncate text-muted-foreground">{p.owner}</Td>
                  <Td className="tnum text-right text-muted-foreground">{r.coverage}%</Td>
                  <Td className="tnum text-right">
                    {r.gaps.length > 0 ? (
                      <span className="font-medium text-danger">{r.gaps.length}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>

        {ready.gaps.length > 0 || ready.stale.length > 0 ? (
          <div className="flex items-start gap-2 border-l-2 border-warning bg-warning-soft px-3 py-2 text-[12.5px]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <p className="leading-relaxed">
              <span className="font-medium">{pkg.id} is not shippable.</span>{" "}
              {ready.gaps.length} of {ready.rows.length} in-scope CCIs have a traceability gap
              {ready.stale.length > 0
                ? ` and ${ready.stale.length} generated artifact${ready.stale.length === 1 ? " is" : "s are"} out of date with the snapshot`
                : ""}
              .
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-4 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setRow(null);
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

        {tab === "Traceability" ? (
          <div className="flex items-center gap-1 pt-1">
            {[
              { label: "All CCIs", on: false },
              { label: `Gaps only (${ready.gaps.length})`, on: true },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setGapsOnly(f.on)}
                className={
                  f.on === gapsOnly
                    ? "h-7 rounded-md bg-primary-soft px-2 text-[12.5px] font-medium text-primary"
                    : "h-7 rounded-md px-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className={row ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "Traceability" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "108px" }} />
                  <col style={{ width: "84px" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "72px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>CCI</Th>
                    <Th>Control</Th>
                    <Th>Statement</Th>
                    <Th>Objectives</Th>
                    <Th>Result</Th>
                    <Th className="text-right">Open</Th>
                    <Th>Worst</Th>
                  </tr>
                </thead>
                <tbody>
                  {traceRows.map((r) => (
                    <Tr
                      key={r.cci}
                      onClick={() => setRow(r)}
                      className={row?.cci === r.cci ? "cursor-pointer bg-subtle" : "cursor-pointer"}
                    >
                      <Td>
                        <Mono className="text-primary">{r.cci}</Mono>
                      </Td>
                      <Td>
                        <Mono className="text-muted-foreground">{r.control}</Mono>
                      </Td>
                      <Td className="truncate">
                        {r.gap ? (
                          <span className="inline-flex items-center gap-1.5">
                            <AlertTriangle className="size-3 shrink-0 text-warning" />
                            <span className="truncate">{r.statement}</span>
                          </span>
                        ) : (
                          r.statement
                        )}
                      </Td>
                      <Td className="truncate">
                        {r.objectives.length ? (
                          <Mono className="text-muted-foreground">{r.objectives.join(", ")}</Mono>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </Td>
                      <Td className="truncate">
                        <Badge tone={resultTone(r.result)}>{r.result}</Badge>
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">{r.openFindings}</Td>
                      <Td className="text-muted-foreground">{r.worstSeverity}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {tab === "Artifacts" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "72px" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "60px" }} />
                  <col style={{ width: "112px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Kind</Th>
                    <Th>Artifact</Th>
                    <Th>Format</Th>
                    <Th>Generated</Th>
                    <Th className="text-right">Pages</Th>
                    <Th>State</Th>
                  </tr>
                </thead>
                <tbody>
                  {ready.artifacts.map((a) => (
                    <Tr key={a.id}>
                      <Td className="font-medium">{a.kind}</Td>
                      <Td className="truncate">
                        <span className="truncate">{a.name}</span>
                        <span className="ml-2 text-[12px] text-muted-foreground">{a.note}</span>
                      </Td>
                      <Td className="truncate text-muted-foreground">{a.format}</Td>
                      <Td className="truncate text-[12px] text-muted-foreground">{a.generated}</Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {a.pages || "—"}
                      </Td>
                      <Td className="truncate">
                        <Badge tone={statusTone(a.state)}>{a.state}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {tab === "Submission log" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "176px" }} />
                  <col style={{ width: "168px" }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Actor</Th>
                    <Th>Action</Th>
                    <Th>Detail</Th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((s) => (
                    <Tr key={s.id}>
                      <Td className="truncate text-[12px] text-muted-foreground">{s.at}</Td>
                      <Td className="truncate">{s.actor}</Td>
                      <Td className="truncate font-medium">{s.action}</Td>
                      <Td className="truncate text-muted-foreground">{s.detail}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </div>

          {row ? (
            <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-baseline gap-2">
                <Mono className="text-primary">{row.cci}</Mono>
                <button
                  onClick={() => setRow(null)}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed">{row.statement}</p>

              {row.gap ? (
                <p className="mt-2 border-l-2 border-warning bg-warning-soft px-2 py-1.5 text-[12px] leading-relaxed">
                  {row.gap}
                </p>
              ) : null}

              <div className="mt-3">
                <RailGroup title="Join keys">
                  <KeyValue label="Control">
                    <Mono>{row.control}</Mono>
                  </KeyValue>
                  <KeyValue label="Package">
                    <Mono>{pkg.id}</Mono>
                  </KeyValue>
                  <KeyValue label="System">
                    <Mono>{pkg.system}</Mono>
                  </KeyValue>
                  <KeyValue label="Rules">
                    {row.paths.length ? <Mono>{row.paths.join(", ")}</Mono> : "—"}
                  </KeyValue>
                </RailGroup>

                <RailGroup title="Verification">
                  <KeyValue label="Objectives">
                    {row.objectives.length ? <Mono>{row.objectives.join(", ")}</Mono> : "None"}
                  </KeyValue>
                  <KeyValue label="Result">
                    <Badge tone={resultTone(row.result)}>{row.result}</Badge>
                  </KeyValue>
                  <KeyValue label="Open findings">{row.openFindings}</KeyValue>
                  <KeyValue label="Worst severity">{row.worstSeverity}</KeyValue>
                </RailGroup>

                <RailGroup title="Appears in">
                  <div className="space-y-1.5 text-[12.5px]">
                    {artifacts
                      .filter((a) => a.pkg === pkg.id && a.kind !== "Appendix")
                      .map((a) => (
                        <div key={a.id} className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0 truncate">{a.kind}</span>
                          <span className="shrink-0 text-[12px] text-muted-foreground">
                            {a.state}
                          </span>
                        </div>
                      ))}
                  </div>
                </RailGroup>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
