import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

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
  component: CampaignsPage,
});

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
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="Test campaigns"
          description="A campaign is scoped work opened against a trigger. Its events prove objectives, and every objective names the CCIs it covers — that is the only place T&E and RMF meet."
          actions={
            <Button variant="primary">
              <Plus className="size-3.5" /> Open campaign
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

        {tab === "Events" ? (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {["All", ...campaigns.map((c) => c.id)].map((c) => (
              <button
                key={c}
                onClick={() => setCampaign(c)}
                className={
                  c === campaign
                    ? "h-7 rounded-md bg-primary-soft px-2 text-[12.5px] font-medium text-primary"
                    : "h-7 rounded-md px-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        <div className={selected ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
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
                </colgroup>
                <thead>
                  <tr>
                    <Th>Campaign</Th>
                    <Th>Name</Th>
                    <Th>Trigger</Th>
                    <Th>Gate</Th>
                    <Th>State</Th>
                    <Th>Lead</Th>
                    <Th className="text-right">Obj. run</Th>
                    <Th className="text-right">Findings</Th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const cov = campaignCoverage(c.id);
                    return (
                      <Tr
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setCampaign(c.id);
                          setTab("Events");
                        }}
                      >
                        <Td>
                          <Mono className="text-primary">{c.id}</Mono>
                        </Td>
                        <Td className="truncate font-medium">{c.name}</Td>
                        <Td className="truncate text-muted-foreground">{c.trigger}</Td>
                        <Td className="text-muted-foreground">{c.gate}</Td>
                        <Td className="truncate text-muted-foreground">{c.state}</Td>
                        <Td className="truncate text-muted-foreground">{c.lead}</Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {cov.run}/{cov.objectives}
                        </Td>
                        <Td className="tnum text-right text-muted-foreground">{cov.findings}</Td>
                      </Tr>
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
                    <Th>Event</Th>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>State</Th>
                    <Th>Window</Th>
                    <Th className="text-right">CCIs</Th>
                    <Th className="text-right">Findings</Th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((e) => (
                    <Tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={
                        selected?.id === e.id ? "cursor-pointer bg-subtle" : "cursor-pointer"
                      }
                    >
                      <Td>
                        <Mono className="text-primary">{e.id}</Mono>
                      </Td>
                      <Td className="truncate font-medium">{e.name}</Td>
                      <Td className="truncate text-muted-foreground">{e.kind}</Td>
                      <Td className="truncate">
                        <Badge tone={statusTone(e.state)}>{e.state}</Badge>
                      </Td>
                      <Td className="truncate text-[12px] text-muted-foreground">{e.window}</Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {ccisForEvent(e.id).length}
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {e.findings.length}
                      </Td>
                    </Tr>
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
                    <Th>Objective</Th>
                    <Th>Statement</Th>
                    <Th>CCIs covered</Th>
                    <Th>Method</Th>
                    <Th>Event</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {objectives.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Mono>{o.id}</Mono>
                      </Td>
                      <Td className="truncate">{o.statement}</Td>
                      <Td className="truncate">
                        <Mono className="text-muted-foreground">{o.ccis.join(", ")}</Mono>
                      </Td>
                      <Td className="truncate text-muted-foreground">{o.method}</Td>
                      <Td>
                        {o.event ? <Mono className="text-muted-foreground">{o.event}</Mono> : "—"}
                      </Td>
                      <Td className="truncate">
                        <Badge tone={objectiveTone(o.result)}>{o.result}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
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
              <h2 className="mt-1 text-[13.5px] font-semibold leading-snug">{selected.name}</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.notes}
              </p>

              <div className="mt-3">
                <RailGroup title="Execution">
                  <KeyValue label="Campaign">
                    <Mono>{selected.campaign}</Mono>
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
                </RailGroup>

                <RailGroup title="Assets under test">
                  <div className="space-y-1.5 text-[12.5px]">
                    {selected.assets.map((a) => (
                      <div key={a} className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate">
                          <Mono>{a}</Mono>{" "}
                          <span className="text-muted-foreground">
                            {assetById.get(a)?.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {assetById.get(a)?.environment}
                        </span>
                      </div>
                    ))}
                  </div>
                </RailGroup>

                <RailGroup title="Objectives proved">
                  <div className="space-y-2 text-[12.5px]">
                    {objectivesForEvent(selected.id).map((o) => (
                      <div key={o.id}>
                        <div className="flex items-baseline justify-between gap-2">
                          <Mono>{o.id}</Mono>
                          <Badge tone={objectiveTone(o.result)}>{o.result}</Badge>
                        </div>
                        <p className="mt-0.5 leading-snug text-muted-foreground">{o.statement}</p>
                        <p className="mt-0.5">
                          <Mono className="text-muted-foreground">{o.ccis.join(", ")}</Mono>
                        </p>
                      </div>
                    ))}
                  </div>
                </RailGroup>

                <RailGroup title="Findings yielded">
                  <div className="space-y-1.5 text-[12.5px]">
                    {selected.findings.length ? (
                      selected.findings.map((id) => {
                        const f = findingById.get(id);
                        return (
                          <Link
                            key={id}
                            to="/findings"
                            className="flex items-baseline justify-between gap-2"
                          >
                            <span className="min-w-0 truncate">
                              <Mono className="text-primary">{id}</Mono>{" "}
                              <span className="text-muted-foreground">{f?.title}</span>
                            </span>
                            {f ? (
                              <Badge tone={severityTone(f.mitigatedSeverity)}>
                                {f.mitigatedSeverity}
                              </Badge>
                            ) : null}
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No findings from this event.</p>
                    )}
                  </div>
                </RailGroup>

                <RailGroup title="Sibling events" defaultOpen={false}>
                  <div className="space-y-1.5 text-[12.5px]">
                    {eventsByCampaign(selected.campaign)
                      .filter((e) => e.id !== selected.id)
                      .map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className="flex w-full items-baseline justify-between gap-2 text-left"
                        >
                          <span className="min-w-0 truncate">
                            <Mono className="text-primary">{e.id}</Mono>{" "}
                            <span className="text-muted-foreground">{e.name}</span>
                          </span>
                          <span className="shrink-0 text-muted-foreground">{e.state}</span>
                        </button>
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
