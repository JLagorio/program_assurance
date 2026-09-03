import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Id,
  IndexPage,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  PreviewRail,
  Stack,
  Table,
  Tabs,
  ToggleGroup,
} from "@ledger/design-system";
import { PreviewSplit } from "@/components/app/preview-split";
import { Shell } from "@/components/app/shell";
import {
  campaignById,
  campaignCoverage,
  campaigns,
  ccisForEvent,
  events,
  objectives,
  objectiveTone,
  objectivesForEvent,
  eventsByCampaign,
  type TestEvent,
} from "@/lib/campaigns";
import { assetById, findings } from "@/lib/findings";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Test campaigns — Equinox" },
      {
        name: "description",
        content:
          "Cyber T&E campaigns, their events, and the test objectives each event proves — every objective named against the CCIs it covers.",
      },
      { property: "og:title", content: "Test campaigns — Equinox" },
      {
        property: "og:description",
        content: "Campaigns, events and objectives joined to CCIs and the findings they produced.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsLayout,
});

/**
 * `/campaigns` is both the index and the parent of `/campaigns/$campaignId`.
 * Without this guard the index table renders over the campaign record, exactly
 * as `programs.tsx` and `risks.tsx` guard their own children.
 */
function CampaignsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/campaigns") return <Outlet />;
  return <CampaignsPage />;
}

const tabs = ["Campaigns", "Events", "Objectives"] as const;
type Tab = (typeof tabs)[number];

const findingById = new Map(findings.map((f) => [f.id, f]));

function CampaignsPage() {
  const [tab, setTab] = useState<Tab>("Campaigns");
  const [selected, setSelected] = useState<TestEvent | null>(null);
  const [campaign, setCampaign] = useState<string>("All");

  const eventRows = useMemo(
    () => (campaign === "All" ? events : events.filter((e) => e.campaign === campaign)),
    [campaign],
  );

  const counts: Record<Tab, number> = {
    Campaigns: campaigns.length,
    Events: events.length,
    Objectives: objectives.length,
  };

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Test campaigns"
            description="A campaign is scoped work opened against a trigger. Its events prove objectives, and every objective names the CCIs it covers — that is the only place T&E and RMF meet."
            actions={
              <Button variant="primary">
                <Plus className="size-icon-small" /> Open campaign
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
                setSelected(null);
              }}
              count={counts[t]}
            >
              {t}
            </Tabs.Tab>
          ))}
        </Tabs>

        {tab === "Events" ? (
          <Inline className="pt-050" space="space.050" alignBlock="center" shouldWrap>
            <ToggleGroup
              aria-label="Campaign"
              value={campaign}
              onChange={setCampaign}
              items={["All", ...campaigns.map((c) => c.id)].map((c) => ({ value: c, label: c }))}
            />
          </Inline>
        ) : null}

        <PreviewSplit open={selected !== null}>
          <div className="min-w-0 lg:pe-300">
            {tab === "Campaigns" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "88px" }} />
                  <col />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "108px" }} />
                  <col style={{ width: "148px" }} />
                  <col style={{ width: "96px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "72px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Campaign</Table.Header>
                    <Table.Header>Name</Table.Header>
                    <Table.Header>Trigger</Table.Header>
                    <Table.Header>Gate</Table.Header>
                    <Table.Header>State</Table.Header>
                    <Table.Header>Lead</Table.Header>
                    <Table.Header className="text-right">Obj. run</Table.Header>
                    <Table.Header className="text-right">Findings</Table.Header>
                    <Table.Header />
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const cov = campaignCoverage(c.id);
                    return (
                      <Table.Row
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setCampaign(c.id);
                          setTab("Events");
                        }}
                      >
                        <Table.Id id={c.id} />
                        <Table.Cell className="truncate">{c.name}</Table.Cell>
                        <Table.Cell className="truncate">{c.trigger}</Table.Cell>
                        <Table.Cell>{c.gate}</Table.Cell>
                        <Table.Cell className="truncate">{c.state}</Table.Cell>
                        <Table.Cell className="truncate">{c.lead}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {cov.run}/{cov.objectives}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{cov.findings}</Table.Cell>
                        <Table.Cell className="text-right">
                          <Link
                            to="/campaigns/$campaignId"
                            params={{ campaignId: c.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="font-body-small text-brand hover:underline"
                          >
                            Open →
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : null}

            {tab === "Events" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "88px" }} />
                  <col />
                  <col style={{ width: "108px" }} />
                  <col style={{ width: "128px" }} />
                  <col style={{ width: "148px" }} />
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "72px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Event</Table.Header>
                    <Table.Header>Name</Table.Header>
                    <Table.Header>Type</Table.Header>
                    <Table.Header>State</Table.Header>
                    <Table.Header>Window</Table.Header>
                    <Table.Header className="text-right">CCIs</Table.Header>
                    <Table.Header className="text-right">Findings</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((e) => (
                    <Table.Row
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={
                        selected?.id === e.id
                          ? "cursor-pointer bg-surface-sunken"
                          : "cursor-pointer"
                      }
                    >
                      <Table.Id id={e.id} />
                      <Table.Cell className="truncate">{e.name}</Table.Cell>
                      <Table.Cell className="truncate">{e.kind}</Table.Cell>
                      <Table.Cell className="truncate">
                        <Badge tone={statusTone(e.state)}>{e.state}</Badge>
                      </Table.Cell>
                      <Table.Cell className="truncate">{e.window}</Table.Cell>
                      <Table.Cell className="tabular-nums text-right">
                        {ccisForEvent(e.id).length}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums text-right">
                        {e.findings.length}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {tab === "Objectives" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "80px" }} />
                  <col />
                  <col style={{ width: "168px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "116px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Table.Header>Objective</Table.Header>
                    <Table.Header>Statement</Table.Header>
                    <Table.Header>CCIs covered</Table.Header>
                    <Table.Header>Method</Table.Header>
                    <Table.Header>Event</Table.Header>
                    <Table.Header>Result</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {objectives.map((o) => (
                    <Table.Row key={o.id}>
                      <Table.Cell>
                        <Id>{o.id}</Id>
                      </Table.Cell>
                      <Table.Cell className="truncate">{o.statement}</Table.Cell>
                      <Table.Cell className="truncate">
                        <Id>{o.ccis.join(", ")}</Id>
                      </Table.Cell>
                      <Table.Cell className="truncate">{o.method}</Table.Cell>
                      <Table.Cell>{o.event ? <Id>{o.event}</Id> : "—"}</Table.Cell>
                      <Table.Cell className="truncate">
                        <Badge tone={objectiveTone(o.result)}>{o.result}</Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </div>

          {selected ? (
            <PreviewRail id={selected.id} title={selected.name} onClose={() => setSelected(null)}>
              <p className="font-body-small text-subtle">{selected.notes}</p>

              <Box paddingBlockStart="space.150">
                <Inspector.Group title="Execution">
                  <KeyValue label="Campaign">
                    <Id>{selected.campaign}</Id>
                  </KeyValue>
                  <KeyValue label="Gate">
                    {campaignById.get(selected.campaign)?.gate ?? "—"}
                  </KeyValue>
                  <KeyValue label="Type">{selected.kind}</KeyValue>
                  <KeyValue label="State">
                    <Badge tone={statusTone(selected.state)}>{selected.state}</Badge>
                  </KeyValue>
                  <KeyValue label="Window">{selected.window}</KeyValue>
                  <KeyValue label="Team">{selected.team}</KeyValue>
                </Inspector.Group>

                <Inspector.Group title="Assets under test">
                  <Stack className="font-body-small" space="space.075">
                    {selected.assets.map((a) => (
                      <Inline
                        key={a}
                        space="space.100"
                        alignBlock="baseline"
                        spread="space-between"
                      >
                        <span className="min-w-0 truncate">
                          <Id>{a}</Id> <span className="text-subtle">{assetById.get(a)?.name}</span>
                        </span>
                        <span className="shrink-0 text-subtle">
                          {assetById.get(a)?.environment}
                        </span>
                      </Inline>
                    ))}
                  </Stack>
                </Inspector.Group>

                <Inspector.Group title="Objectives proved">
                  <Stack className="font-body-small" space="space.100">
                    {objectivesForEvent(selected.id).map((o) => (
                      <div key={o.id}>
                        <Inline space="space.100" alignBlock="baseline" spread="space-between">
                          <Id>{o.id}</Id>
                          <Badge tone={objectiveTone(o.result)}>{o.result}</Badge>
                        </Inline>
                        <p className="pt-025 text-subtle">{o.statement}</p>
                        <p className="pt-025">
                          <Id className="text-subtle">{o.ccis.join(", ")}</Id>
                        </p>
                      </div>
                    ))}
                  </Stack>
                </Inspector.Group>

                <Inspector.Group title="Findings yielded">
                  <Stack className="font-body-small" space="space.075">
                    {selected.findings.length ? (
                      selected.findings.map((id) => {
                        const f = findingById.get(id);
                        return (
                          <Link
                            key={id}
                            to="/findings"
                            className="flex items-baseline justify-between gap-100"
                          >
                            <span className="min-w-0 truncate">
                              <Id className="text-brand">{id}</Id>{" "}
                              <span className="text-subtle">{f?.title}</span>
                            </span>
                            {f ? (
                              <Indicator tone={severityTone(f.mitigatedSeverity)}>
                                {f.mitigatedSeverity}
                              </Indicator>
                            ) : null}
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-subtle">No findings from this event.</p>
                    )}
                  </Stack>
                </Inspector.Group>

                <Inspector.Group title="Sibling events">
                  <Stack className="font-body-small" space="space.075">
                    {eventsByCampaign(selected.campaign)
                      .filter((e) => e.id !== selected.id)
                      .map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className="flex w-full items-baseline justify-between gap-100 text-left"
                        >
                          <span className="min-w-0 truncate">
                            <Id className="text-brand">{e.id}</Id>{" "}
                            <span className="text-subtle">{e.name}</span>
                          </span>
                          <span className="shrink-0 text-subtle">{e.state}</span>
                        </button>
                      ))}
                  </Stack>
                </Inspector.Group>
              </Box>
            </PreviewRail>
          ) : null}
        </PreviewSplit>
      </IndexPage>
    </Shell>
  );
}
