import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, FileDown } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  IdCell,
  KeyValue,
  Mono,
  PreviewRail,
  RailGroup,
  RecordHeader,
  TabStrip,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  packageStateTone,
  packages,
  readiness,
  submissionsFor,
  type TraceRow,
} from "@/lib/packages";
import { statusTone } from "@/lib/spine";

export const Route = createFileRoute("/packages/$pkgId")({
  head: ({ params }) => {
    const p = packages.find((x) => x.id === params.pkgId);
    const title = p ? `${p.id} ${p.name} — authorization package` : "Package — Equinox";
    const description = p
      ? `${p.state} snapshot ${p.version} for ${p.program}, traced across ${p.ccisInScope.length} in-scope CCIs.`
      : "Authorization package snapshot with CCI traceability and generated artifacts.";
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
  component: PackageRecord,
});

const tabs = ["Traceability", "Artifacts", "Submission log"] as const;
type Tab = (typeof tabs)[number];

function resultTone(r: TraceRow["result"]) {
  if (r === "Met") return "success" as const;
  if (r === "Not met") return "danger" as const;
  if (r === "Partially met") return "warning" as const;
  return "neutral" as const;
}

function PackageRecord() {
  const { pkgId } = Route.useParams();
  const pkg = packages.find((p) => p.id === pkgId);
  const [tab, setTab] = useState<Tab>("Traceability");
  const [preview, setPreview] = useState<TraceRow | null>(null);
  const [gapsOnly, setGapsOnly] = useState(false);

  const ready = useMemo(() => (pkg ? readiness(pkg) : null), [pkg]);
  const log = useMemo(() => (pkg ? submissionsFor(pkg.id) : []), [pkg]);

  if (!pkg || !ready) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Package not found</h1>
          <Link to="/packages" className="text-[13px] text-primary hover:underline">
            Back to packages
          </Link>
        </div>
      </Shell>
    );
  }

  const traceRows = gapsOnly ? ready.rows.filter((r) => r.gap) : ready.rows;
  const counts: Record<Tab, number> = {
    Traceability: ready.rows.length,
    Artifacts: ready.artifacts.length,
    "Submission log": log.length,
  };

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        <RecordHeader
          backTo="/packages"
          id={pkg.id}
          title={pkg.name}
          meta={`${pkg.version} · ${pkg.program} · snapshot ${pkg.snapshotAt}`}
          actions={
            <>
              <Badge tone={packageStateTone[pkg.state]}>{pkg.state}</Badge>
              <Button variant="primary" disabled={!ready.shippable}>
                <FileDown className="size-3.5" /> Submit snapshot
              </Button>
            </>
          }
        />

        {ready.gaps.length > 0 || ready.stale.length > 0 ? (
          <div className="flex items-start gap-2 border-l-2 border-warning bg-warning-soft px-3 py-2 text-[12.5px]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <p className="leading-relaxed">
              <span className="font-medium">{pkg.id} is not shippable.</span> {ready.gaps.length} of{" "}
              {ready.rows.length} in-scope CCIs have a traceability gap
              {ready.stale.length > 0
                ? ` and ${ready.stale.length} generated artifact${ready.stale.length === 1 ? " is" : "s are"} out of date with the snapshot`
                : ""}
              .
            </p>
          </div>
        ) : null}

        <TabStrip
          items={tabs.map((t) => ({
            key: t,
            label: t,
            active: t === tab,
            onSelect: () => {
              setTab(t);
              setPreview(null);
            },
            trailing: (
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {counts[t]}
              </span>
            ),
          }))}
        />

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

        <div className={preview ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "Traceability" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "124px" }} />
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
                    <Tr key={r.cci}>
                      <IdCell
                        id={r.cci}
                        active={preview?.cci === r.cci}
                        onPreview={() => setPreview(r)}
                      />
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
                      <Td className="tnum text-right text-muted-foreground">{a.pages || "—"}</Td>
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

          {preview ? (
            <PreviewRail id={preview.cci} title={preview.statement} onClose={() => setPreview(null)}>
              {preview.gap ? (
                <p className="mb-3 border-l-2 border-warning bg-warning-soft px-2 py-1.5 text-[12px] leading-relaxed">
                  {preview.gap}
                </p>
              ) : null}
              <RailGroup title="Join keys">
                <KeyValue label="Control">
                  <Mono>{preview.control}</Mono>
                </KeyValue>
                <KeyValue label="Package">
                  <Mono>{pkg.id}</Mono>
                </KeyValue>
                <KeyValue label="System">
                  <Mono>{pkg.system}</Mono>
                </KeyValue>
                <KeyValue label="Rules">
                  {preview.paths.length ? <Mono>{preview.paths.join(", ")}</Mono> : "—"}
                </KeyValue>
              </RailGroup>
              <RailGroup title="Verification">
                <KeyValue label="Objectives">
                  {preview.objectives.length ? <Mono>{preview.objectives.join(", ")}</Mono> : "None"}
                </KeyValue>
                <KeyValue label="Result">
                  <Badge tone={resultTone(preview.result)}>{preview.result}</Badge>
                </KeyValue>
                <KeyValue label="Open findings">{preview.openFindings}</KeyValue>
                <KeyValue label="Worst severity">{preview.worstSeverity}</KeyValue>
              </RailGroup>
            </PreviewRail>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
