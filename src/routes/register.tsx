import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Meter,
  Mono,
  PageHeader,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { assetById, isOpen } from "@/lib/findings";
import {
  ccisForRisk,
  findingsForPoam,
  findingsForRisk,
  openCount,
  poamItems,
  poamsForRisk,
  registerRisks,
  riskById,
  unrolledFindings,
  worstSeverity,
  type PoamItem,
  type RegisterRisk,
} from "@/lib/register";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/register")({
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

type Selection =
  | { kind: "poam"; item: PoamItem }
  | { kind: "risk"; item: RegisterRisk }
  | null;

function residualTone(v: number) {
  return v > 60 ? "danger" : v > 30 ? "warning" : "success";
}

function RegisterPage() {
  const [tab, setTab] = useState<Tab>("POA&M");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Selection>(null);

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

  const railFindings =
    selected?.kind === "poam"
      ? findingsForPoam(selected.item.id)
      : selected?.kind === "risk"
        ? findingsForRisk(selected.item.id)
        : [];

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="POA&M & risk register"
          description="A POA&M item is a dated commitment to close findings. A risk is what the AO signs. Both reach the spine only through findings — never straight to a control."
          actions={
            <Button variant="secondary">
              <Download className="size-3.5" /> Export eMASS POA&M
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

        <div className={selected ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "POA&M" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "104px" }} />
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
                    <Th>POA&M</Th>
                    <Th>Weakness</Th>
                    <Th>Owner</Th>
                    <Th className="text-right">Findings</Th>
                    <Th>Worst</Th>
                    <Th>Scheduled</Th>
                    <Th>Risk</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {poamRows.map((p) => {
                    const fs = findingsForPoam(p.id);
                    const worst = worstSeverity(fs);
                    return (
                      <Tr
                        key={p.id}
                        onClick={() => setSelected({ kind: "poam", item: p })}
                        className={
                          selected?.kind === "poam" && selected.item.id === p.id
                            ? "cursor-pointer bg-subtle"
                            : "cursor-pointer"
                        }
                      >
                        <Td>
                          <Mono className="text-primary">{p.id}</Mono>
                        </Td>
                        <Td className="truncate font-medium">{p.title}</Td>
                        <Td className="truncate text-muted-foreground">{p.owner}</Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {openCount(fs)} / {fs.length}
                        </Td>
                        <Td>{worst ? <Badge tone={severityTone(worst)}>{worst}</Badge> : "—"}</Td>
                        <Td className="truncate text-[12px] text-muted-foreground">
                          {p.scheduledCompletion}
                        </Td>
                        <Td className="truncate">
                          {p.risk ? (
                            <Mono className="text-muted-foreground">{p.risk}</Mono>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Td>
                        <Td className="truncate">
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            ) : null}

            {tab === "Risks" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "96px" }} />
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
                    <Th>Risk</Th>
                    <Th>Statement</Th>
                    <Th>Owner</Th>
                    <Th className="text-right">Findings</Th>
                    <Th className="text-right">CCIs</Th>
                    <Th>POA&M</Th>
                    <Th>Residual</Th>
                    <Th>Disposition</Th>
                  </tr>
                </thead>
                <tbody>
                  {registerRisks.map((r) => {
                    const fs = findingsForRisk(r.id);
                    return (
                      <Tr
                        key={r.id}
                        onClick={() => setSelected({ kind: "risk", item: r })}
                        className={
                          selected?.kind === "risk" && selected.item.id === r.id
                            ? "cursor-pointer bg-subtle"
                            : "cursor-pointer"
                        }
                      >
                        <Td>
                          <Mono className="text-primary">{r.id}</Mono>
                        </Td>
                        <Td className="truncate font-medium">{r.title}</Td>
                        <Td className="truncate text-muted-foreground">{r.owner}</Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {openCount(fs)} / {fs.length}
                        </Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {ccisForRisk(r.id).length}
                        </Td>
                        <Td className="tnum text-muted-foreground">{poamsForRisk(r.id).length}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="tnum w-5 text-right text-[12px] text-muted-foreground/70 line-through">
                              {r.inherent}
                            </span>
                            <Meter value={r.residual} tone={residualTone(r.residual)} />
                            <span className="tnum w-5 shrink-0 text-right text-[12px] font-medium">
                              {r.residual}
                            </span>
                          </div>
                        </Td>
                        <Td className="truncate">
                          <Badge tone={statusTone(r.disposition)}>{r.disposition}</Badge>
                        </Td>
                      </Tr>
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
                      <Th>Finding</Th>
                      <Th>Title</Th>
                      <Th>CCI</Th>
                      <Th>Asset</Th>
                      <Th>Mitigated</Th>
                      <Th>Lifecycle</Th>
                      <Th className="text-right">Roll up</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {unrolled.map((f) => (
                      <Tr key={f.id}>
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
                        <Td>
                          <Badge tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Badge>
                        </Td>
                        <Td className="truncate">
                          <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                        </Td>
                        <Td className="max-w-none text-right">
                          <span className="inline-flex gap-1.5">
                            <Button size="sm" variant="secondary">
                              New POA&M
                            </Button>
                            <Button size="sm" variant="secondary">
                              Attach risk
                            </Button>
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : null}
          </div>

          {selected ? (
            <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-baseline gap-2">
                <Mono className="text-primary">{selected.item.id}</Mono>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <h2 className="mt-1 text-[13.5px] font-semibold leading-snug">
                {selected.item.title}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.kind === "poam"
                  ? selected.item.remediation
                  : selected.item.statement}
              </p>

              <div className="mt-3">
                {selected.kind === "poam" ? (
                  <>
                    <RailGroup title="Commitment">
                      <KeyValue label="Status">
                        <Badge tone={statusTone(selected.item.status)}>
                          {selected.item.status}
                        </Badge>
                      </KeyValue>
                      <KeyValue label="Owner">{selected.item.owner}</KeyValue>
                      <KeyValue label="Resources">{selected.item.resources}</KeyValue>
                      <KeyValue label="Scheduled">{selected.item.scheduledCompletion}</KeyValue>
                      <KeyValue label="Original">{selected.item.originalCompletion}</KeyValue>
                    </RailGroup>
                    <RailGroup title="Latest milestone">
                      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                        {selected.item.milestoneNote}
                      </p>
                    </RailGroup>
                  </>
                ) : (
                  <>
                    <RailGroup title="Adjudication">
                      <KeyValue label="Disposition">
                        <Badge tone={statusTone(selected.item.disposition)}>
                          {selected.item.disposition}
                        </Badge>
                      </KeyValue>
                      <KeyValue label="Owner">{selected.item.owner}</KeyValue>
                      <KeyValue label="Treatment">{selected.item.treatment}</KeyValue>
                      <KeyValue label="Likelihood × impact">
                        {selected.item.likelihood} × {selected.item.impact}
                      </KeyValue>
                      <KeyValue label="Inherent">{selected.item.inherent}</KeyValue>
                      <KeyValue label="Residual">{selected.item.residual}</KeyValue>
                      <KeyValue label="Reviewed">{selected.item.reviewed}</KeyValue>
                    </RailGroup>
                    {selected.item.aoNote ? (
                      <RailGroup title="AO note">
                        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                          {selected.item.aoNote}
                        </p>
                      </RailGroup>
                    ) : null}
                    <RailGroup title="Reducing POA&M items">
                      {poamsForRisk(selected.item.id).length === 0 ? (
                        <p className="text-[12.5px] text-muted-foreground">
                          None — residual is untreated.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {poamsForRisk(selected.item.id).map((p) => (
                            <li key={p.id} className="flex items-baseline gap-2">
                              <Mono className="text-muted-foreground">{p.id}</Mono>
                              <span className="truncate text-[12.5px]">{p.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </RailGroup>
                    <RailGroup title="CCIs in scope">
                      <div className="flex flex-wrap gap-1">
                        {ccisForRisk(selected.item.id).map((c) => (
                          <Mono key={c} className="text-muted-foreground">
                            {c}
                          </Mono>
                        ))}
                      </div>
                    </RailGroup>
                  </>
                )}

                <RailGroup title={`Findings (${railFindings.length})`}>
                  <ul className="space-y-2">
                    {railFindings.map((f) => (
                      <li key={f.id}>
                        <div className="flex items-baseline gap-2">
                          <Mono className="text-muted-foreground">{f.id}</Mono>
                          <Badge tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Badge>
                          {isOpen(f) ? null : (
                            <span className="text-[11.5px] text-muted-foreground">settled</span>
                          )}
                        </div>
                        <div className="truncate text-[12.5px]">{f.title}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {f.cci} · {assetById.get(f.asset)?.name ?? f.asset}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/findings"
                    className="mt-2 inline-block text-[12px] text-primary hover:underline"
                  >
                    Open in findings →
                  </Link>
                </RailGroup>

                {selected.kind === "poam" && selected.item.risk ? (
                  <RailGroup title="Rolls up to">
                    <KeyValue label="Risk">
                      <Mono>{selected.item.risk}</Mono>
                    </KeyValue>
                    <KeyValue label="Disposition">
                      {riskById.get(selected.item.risk)?.disposition ?? "—"}
                    </KeyValue>
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
