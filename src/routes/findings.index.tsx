import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  IdCell,
  IndexPage,
  KeyValue,
  Mono,
  PageHeader,
  PreviewRail,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  assetById,
  assets,
  bySeverity,
  findings,
  isOpen,
  type Asset,
  type Finding,
} from "@/lib/findings";
import { assetPosture } from "@/lib/graph-posture";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/findings/")({
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

type Preview = { kind: "finding"; item: Finding } | { kind: "asset"; item: Asset } | null;

/**
 * Register-derived open counts for an asset's composition subtree. The scanner
 * columns beside these stay exactly as authored — the delta between the two is
 * the reconciliation an SCA writes up, so neither side overwrites the other.
 */
function trackedLabel(assetId: string): string {
  const rolled = assetPosture(assetId)?.rolled ?? null;
  return rolled ? `${rolled.catI} / ${rolled.catII} / ${rolled.catIII}` : "—";
}

/** The register-tracked CAT triple, rendered as its own table cell. */
function TrackedCell({ assetId }: { assetId: string }) {
  const rolled = assetPosture(assetId)?.rolled ?? null;
  if (!rolled) {
    return <Td className="text-right text-muted-foreground">—</Td>;
  }
  return (
    <Td className="tnum text-right">
      <span className={rolled.catI ? "font-medium text-danger" : ""}>{rolled.catI}</span>
      <span className="text-muted-foreground">
        {" "}
        / {rolled.catII} / {rolled.catIII}
      </span>
    </Td>
  );
}

function FindingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Findings");
  const [scope, setScope] = useState<Scope>("Open");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Preview>(null);

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

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Findings & assets"
            description="One technical fact per row, joined to a CCI and an asset. Open a row for the record; hover the first column to preview it in place."
            actions={
              <Button variant="secondary">
                <Download className="size-3.5" /> Export SAR extract
              </Button>
            }
          />
        }
      >
        <div className="flex items-center gap-4 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPreview(null);
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

        <div className={preview ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "Findings" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "112px" }} />
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
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({ to: "/findings/$findingId", params: { findingId: f.id } })
                      }
                    >
                      <IdCell
                        id={f.id}
                        active={preview?.kind === "finding" && preview.item.id === f.id}
                        onPreview={() => setPreview({ kind: "finding", item: f })}
                      />
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
                        <Badge tone={severityTone(f.mitigatedSeverity)}>{f.mitigatedSeverity}</Badge>
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
                  <col style={{ width: "112px" }} />
                  <col />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "148px" }} />
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "116px" }} />
                  <col style={{ width: "124px" }} />
                  <col style={{ width: "124px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Asset</Th>
                    <Th>Name</Th>
                    <Th>Kind</Th>
                    <Th>Technology</Th>
                    <Th>Environment</Th>
                    <Th>Last scan</Th>
                    <Th className="text-right">Scanner I / II / III</Th>
                    <Th className="text-right">Tracked I / II / III</Th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <Tr
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({ to: "/findings/assets/$assetId", params: { assetId: a.id } })
                      }
                    >
                      <IdCell
                        id={a.id}
                        active={preview?.kind === "asset" && preview.item.id === a.id}
                        onPreview={() => setPreview({ kind: "asset", item: a })}
                      />
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
                      <TrackedCell assetId={a.id} />
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {preview?.kind === "finding" ? (
            <PreviewRail
              id={preview.item.id}
              title={preview.item.title}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/findings/$findingId"
                  params={{ findingId: preview.item.id }}
                  className="text-primary hover:underline"
                >
                  Open finding →
                </Link>
              }
            >
              <RailGroup title="Join keys">
                <KeyValue label="CCI">
                  <Mono>{preview.item.cci}</Mono>
                </KeyValue>
                <KeyValue label="Control">
                  <Mono>{preview.item.control}</Mono>
                </KeyValue>
                <KeyValue label="Asset">
                  {assetById.get(preview.item.asset)?.name ?? preview.item.asset}
                </KeyValue>
                <KeyValue label="Rule">
                  {preview.item.rule ? <Mono>{preview.item.rule}</Mono> : "—"}
                </KeyValue>
              </RailGroup>
              <RailGroup title="Severity">
                <KeyValue label="Raw">{preview.item.rawSeverity}</KeyValue>
                <KeyValue label="Mitigated">
                  <Badge tone={severityTone(preview.item.mitigatedSeverity)}>
                    {preview.item.mitigatedSeverity}
                  </Badge>
                </KeyValue>
                <KeyValue label="Lifecycle">
                  <Badge tone={statusTone(preview.item.lifecycle)}>{preview.item.lifecycle}</Badge>
                </KeyValue>
              </RailGroup>
              <RailGroup title="Rolls up to">
                <KeyValue label="POA&M">
                  {preview.item.poam ? <Mono>{preview.item.poam}</Mono> : "Not yet scheduled"}
                </KeyValue>
                <KeyValue label="Risk">
                  {preview.item.risk ? <Mono>{preview.item.risk}</Mono> : "Not aggregated"}
                </KeyValue>
              </RailGroup>
            </PreviewRail>
          ) : null}

          {preview?.kind === "asset" ? (
            <PreviewRail
              id={preview.item.id}
              title={preview.item.name}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/findings/assets/$assetId"
                  params={{ assetId: preview.item.id }}
                  className="text-primary hover:underline"
                >
                  Open asset →
                </Link>
              }
            >
              <RailGroup title="Inventory">
                <KeyValue label="Kind">{preview.item.kind}</KeyValue>
                <KeyValue label="Technology">{preview.item.technology}</KeyValue>
                <KeyValue label="Environment">{preview.item.environment}</KeyValue>
                <KeyValue label="Last scan">{preview.item.lastScan}</KeyValue>
              </RailGroup>
              <RailGroup title="Open findings">
                <KeyValue label="Scanner declared">
                  <span className="tnum">
                    {preview.item.openCatI} / {preview.item.openCatII} / {preview.item.openCatIII}
                  </span>
                </KeyValue>
                <KeyValue label="Register tracked">
                  <span className="tnum">{trackedLabel(preview.item.id)}</span>
                </KeyValue>
              </RailGroup>
            </PreviewRail>
          ) : null}
        </div>
      </IndexPage>
    </Shell>
  );
}
