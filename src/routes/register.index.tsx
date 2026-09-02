import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Meter,
  PageHeader,
  PreviewRail,
  IndexPage,
  Table,
  Id,
  Indicator,
} from "@/components/app/ui";
import { assetById } from "@/lib/findings";
import {
  ccisForRisk,
  findingsForPoam,
  findingsForRisk,
  openCount,
  poamItems,
  poamsForRisk,
  registerRisks,
  unrolledFindings,
  worstSeverity,
  type PoamItem,
  type RegisterRisk,
} from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";
import { Inspector } from "@/components/app/shapes";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "POA&M & risk register — Equinox" },
      {
        name: "description",
        content:
          "One register: POA&M items that close findings, risks the AO adjudicates, and the open findings that have not yet rolled up to either.",
      },
      { property: "og:title", content: "POA&M & risk register — Equinox" },
      {
        property: "og:description",
        content:
          "POA&M items close findings; risks aggregate them for AO disposition. Nothing rolls up without a CCI join.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

const tabs = ["POA&M", "Risks", "Unrolled"] as const;
type Tab = (typeof tabs)[number];

type Preview = { kind: "poam"; item: PoamItem } | { kind: "risk"; item: RegisterRisk } | null;

function residualTone(v: number) {
  return v > 60 ? "danger" : v > 30 ? "warning" : "success";
}

function RegisterPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("POA&M");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Preview>(null);

  const unrolled = unrolledFindings();

  const poamRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const order: Record<string, number> = {
      Overdue: 0,
      Ongoing: 1,
      "Risk accepted": 2,
      Completed: 3,
    };
    return poamItems
      .filter(
        (p) =>
          !needle ||
          p.title.toLowerCase().includes(needle) ||
          p.id.toLowerCase().includes(needle) ||
          p.owner.toLowerCase().includes(needle),
      )
      .slice()
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [q]);

  const counts: Record<Tab, number> = {
    "POA&M": poamItems.filter((p) => p.status === "Ongoing" || p.status === "Overdue").length,
    Risks: registerRisks.filter((r) => r.disposition === "Pending AO").length,
    Unrolled: unrolled.length,
  };

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="POA&M & risk register"
            description="A POA&M item is a dated commitment to close findings. A risk is what the AO signs. Both reach the spine only through findings — never straight to a control."
            actions={
              <Button variant="secondary">
                <Download className="size-3.5" /> Export eMASS POA&M
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

        {tab === "POA&M" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search POA&M items, owners"
                className="h-7 w-[240px] rounded-md border border-border bg-background pl-7 pr-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary/40"
              />
            </label>
          </div>
        ) : null}

        <div className={preview ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "POA&M" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "104px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>POA&M</Table.Header>
                    <Table.Header>Weakness</Table.Header>
                    <Table.Header>Owner</Table.Header>
                    <Table.Header className="text-right">Findings</Table.Header>
                    <Table.Header>Worst</Table.Header>
                    <Table.Header>Scheduled</Table.Header>
                    <Table.Header>Risk</Table.Header>
                    <Table.Header>Status</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {poamRows.map((p) => {
                    const fs = findingsForPoam(p.id);
                    const worst = worstSeverity(fs);
                    return (
                      <Table.Row
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/register/poam/$poamId", params: { poamId: p.id } })
                        }
                      >
                        <Table.Id
                          id={p.id}
                          active={preview?.kind === "poam" && preview.item.id === p.id}
                          onPreview={() => setPreview({ kind: "poam", item: p })}
                        />
                        <Table.Cell className="truncate">{p.title}</Table.Cell>
                        <Table.Cell className="truncate">{p.owner}</Table.Cell>
                        <Table.Cell className="tnum text-right">
                          {openCount(fs)} / {fs.length}
                        </Table.Cell>
                        <Table.Cell>
                          {worst ? <Indicator tone={severityTone(worst)}>{worst}</Indicator> : "—"}
                        </Table.Cell>
                        <Table.Cell className="truncate">{p.scheduledCompletion}</Table.Cell>
                        <Table.Cell className="truncate">
                          {p.risk ? (
                            <Id>{p.risk}</Id>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : null}

            {tab === "Risks" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "104px" }} />
                  <col />
                  <col style={{ width: "128px" }} />
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "68px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "138px" }} />
                  <col style={{ width: "108px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Risk</Table.Header>
                    <Table.Header>Statement</Table.Header>
                    <Table.Header>Owner</Table.Header>
                    <Table.Header className="text-right">Findings</Table.Header>
                    <Table.Header className="text-right">CCIs</Table.Header>
                    <Table.Header>POA&M</Table.Header>
                    <Table.Header>Residual</Table.Header>
                    <Table.Header>Disposition</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {registerRisks.map((r) => {
                    const fs = findingsForRisk(r.id);
                    return (
                      <Table.Row
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/register/risks/$riskId", params: { riskId: r.id } })
                        }
                      >
                        <Table.Id
                          id={r.id}
                          active={preview?.kind === "risk" && preview.item.id === r.id}
                          onPreview={() => setPreview({ kind: "risk", item: r })}
                        />
                        <Table.Cell className="truncate">{r.title}</Table.Cell>
                        <Table.Cell className="truncate">{r.owner}</Table.Cell>
                        <Table.Cell className="tnum text-right">
                          {openCount(fs)} / {fs.length}
                        </Table.Cell>
                        <Table.Cell className="tnum text-right">
                          {ccisForRisk(r.id).length}
                        </Table.Cell>
                        <Table.Cell className="tnum">{poamsForRisk(r.id).length}</Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <span className="tnum w-5 text-right text-[12px] text-muted-foreground/70 line-through">
                              {r.inherent}
                            </span>
                            <Meter value={r.residual} tone={residualTone(r.residual)} />
                            <span className="tnum w-5 shrink-0 text-right text-[12px] font-medium">
                              {r.residual}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge tone={statusTone(r.disposition)}>{r.disposition}</Badge>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : null}

            {tab === "Unrolled" ? (
              <>
                <p className="pb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  Open findings with no POA&M item and no risk. Every row here is exposure the
                  package cannot explain — either commit it to a POA&M or aggregate it into a risk.
                </p>
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "92px" }} />
                    <col />
                    <col style={{ width: "104px" }} />
                    <col style={{ width: "132px" }} />
                    <col style={{ width: "76px" }} />
                    <col style={{ width: "112px" }} />
                    <col style={{ width: "148px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Table.Header>Finding</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header>CCI</Table.Header>
                      <Table.Header>Asset</Table.Header>
                      <Table.Header>Mitigated</Table.Header>
                      <Table.Header>Lifecycle</Table.Header>
                      <Table.Header className="text-right">Roll up</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {unrolled.map((f) => (
                      <Table.Row
                        key={f.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/findings/$findingId", params: { findingId: f.id } })
                        }
                      >
                        <Table.Id id={f.id} />
                        <Table.Cell className="truncate">{f.title}</Table.Cell>
                        <Table.Cell>
                          <Id>{f.cci}</Id>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {assetById.get(f.asset)?.name ?? f.asset}
                        </Table.Cell>
                        <Table.Cell>
                          <Indicator tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Indicator>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                        </Table.Cell>
                        <Table.Cell className="max-w-none text-right">
                          <span
                            className="inline-flex gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="secondary">
                              New POA&M
                            </Button>
                            <Button size="sm" variant="secondary">
                              Attach risk
                            </Button>
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : null}
          </div>

          {preview?.kind === "poam" ? (
            <PreviewRail
              id={preview.item.id}
              title={preview.item.title}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/register/poam/$poamId"
                  params={{ poamId: preview.item.id }}
                  className="text-primary hover:underline"
                >
                  Open POA&M item →
                </Link>
              }
            >
              <Inspector.Group title="Commitment">
                <KeyValue label="Status">
                  <Badge tone={statusTone(preview.item.status)}>{preview.item.status}</Badge>
                </KeyValue>
                <KeyValue label="Owner">{preview.item.owner}</KeyValue>
                <KeyValue label="Scheduled">{preview.item.scheduledCompletion}</KeyValue>
                <KeyValue label="Original">{preview.item.originalCompletion}</KeyValue>
                <KeyValue label="Findings">
                  {openCount(findingsForPoam(preview.item.id))} open of{" "}
                  {findingsForPoam(preview.item.id).length}
                </KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Latest milestone">
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {preview.item.milestoneNote}
                </p>
              </Inspector.Group>
            </PreviewRail>
          ) : null}

          {preview?.kind === "risk" ? (
            <PreviewRail
              id={preview.item.id}
              title={preview.item.title}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/register/risks/$riskId"
                  params={{ riskId: preview.item.id }}
                  className="text-primary hover:underline"
                >
                  Open risk →
                </Link>
              }
            >
              <Inspector.Group title="Adjudication">
                <KeyValue label="Disposition">
                  <Badge tone={statusTone(preview.item.disposition)}>
                    {preview.item.disposition}
                  </Badge>
                </KeyValue>
                <KeyValue label="Owner">{preview.item.owner}</KeyValue>
                <KeyValue label="Treatment">{preview.item.treatment}</KeyValue>
                <KeyValue label="Likelihood × impact">
                  {preview.item.likelihood} × {preview.item.impact}
                </KeyValue>
                <KeyValue label="Inherent">{preview.item.inherent}</KeyValue>
                <KeyValue label="Residual">{preview.item.residual}</KeyValue>
                <KeyValue label="Reviewed">{preview.item.reviewed}</KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Statement">
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {preview.item.statement}
                </p>
              </Inspector.Group>
            </PreviewRail>
          ) : null}
        </div>
      </IndexPage>
    </Shell>
  );
}
