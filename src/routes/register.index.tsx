import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import {
  Badge,
  Button,
  Id,
  IndexPage,
  Indicator,
  Inline,
  Input,
  InputGroup,
  Inspector,
  KeyValue,
  PageHeader,
  PreviewRail,
  Progress,
  Table,
  Tabs,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { PreviewSplit } from "@/components/app/preview-split";
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
                <Download className="size-icon-small" /> Export eMASS POA&M
              </Button>
            }
          />
        }
      >
        <Tabs>
          {tabs.map((t) => (
            <Tabs.Tab
              key={t}
              isSelected={tab === t}
              onClick={() => {
                setTab(t);
                setPreview(null);
              }}
              count={counts[t]}
            >
              {t}
            </Tabs.Tab>
          ))}
        </Tabs>

        {tab === "POA&M" ? (
          <Inline className="pt-050" space="space.100" alignBlock="center" shouldWrap>
            <InputGroup leading={<Search />}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search POA&M items, owners"
                aria-label="Search"
                style={{ width: 240 }}
              />
            </InputGroup>
          </Inline>
        ) : null}

        <PreviewSplit open={preview !== null}>
          <div className="min-w-0 lg:pe-300">
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
                          isActive={preview?.kind === "poam" && preview.item.id === p.id}
                          onPreview={() => setPreview({ kind: "poam", item: p })}
                        />
                        <Table.Cell className="truncate">{p.title}</Table.Cell>
                        <Table.Cell className="truncate">{p.owner}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {openCount(fs)} / {fs.length}
                        </Table.Cell>
                        <Table.Cell>
                          {worst ? <Indicator tone={severityTone(worst)}>{worst}</Indicator> : "—"}
                        </Table.Cell>
                        <Table.Cell className="truncate">{p.scheduledCompletion}</Table.Cell>
                        <Table.Cell className="truncate">
                          {p.risk ? <Id>{p.risk}</Id> : <span className="text-subtle">—</span>}
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
                          isActive={preview?.kind === "risk" && preview.item.id === r.id}
                          onPreview={() => setPreview({ kind: "risk", item: r })}
                        />
                        <Table.Cell className="truncate">{r.title}</Table.Cell>
                        <Table.Cell className="truncate">{r.owner}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {openCount(fs)} / {fs.length}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {ccisForRisk(r.id).length}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums">
                          {poamsForRisk(r.id).length}
                        </Table.Cell>
                        <Table.Cell>
                          <Inline space="space.100" alignBlock="center">
                            <span className="tabular-nums text-right font-body-small text-subtlest line-through w-250">
                              {r.inherent}
                            </span>
                            <Progress value={r.residual} tone={residualTone(r.residual)} />
                            <span className="tabular-nums shrink-0 text-right font-body-small font-medium w-250">
                              {r.residual}
                            </span>
                          </Inline>
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
                <p className="pb-150 font-body-small text-subtle">
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
                          <Inline
                            onClick={(e) => e.stopPropagation()}
                            as="span"
                            display="inline-flex"
                            space="space.075"
                          >
                            <Button size="small" variant="secondary">
                              New POA&M
                            </Button>
                            <Button size="small" variant="secondary">
                              Attach risk
                            </Button>
                          </Inline>
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
                  className="text-brand hover:underline"
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
                <p className="font-body-small text-subtle">{preview.item.milestoneNote}</p>
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
                  className="text-brand hover:underline"
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
                <p className="font-body-small text-subtle">{preview.item.statement}</p>
              </Inspector.Group>
            </PreviewRail>
          ) : null}
        </PreviewSplit>
      </IndexPage>
    </Shell>
  );
}
