import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Plus } from "lucide-react";

import { ConsumerTable, ProvidedControlsTable } from "@/components/app/inheritance";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  PageHeader,
  RailGroup,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  componentHealthTone,
  systemComponents,
  staleThresholdDays,
} from "@/lib/reusable-components";

type Search = { component?: string | undefined };

export const Route = createFileRoute("/library/components")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const value = search["component"];
    return typeof value === "string" ? { component: value } : {};
  },
  head: () => ({
    meta: [
      { title: "Component library — Equinox GRC" },
      {
        name: "description",
        content:
          "Reusable system components that programs inherit controls from: identity, landing zone, policy set and facility, with the blast radius of every change.",
      },
      { property: "og:title", content: "Component library — Equinox GRC" },
      {
        property: "og:description",
        content:
          "Definition-side control inheritance: what each shared component provides and which programs consume it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComponentLibrary,
});

function ComponentLibrary() {
  const { component: selectedKey } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const selected =
    systemComponents.find((c) => c.key === selectedKey) ?? null;

  const select = (key: string | undefined) =>
    navigate({ search: () => (key ? { component: key } : {}) });

  return (
    <Shell>
      <div className="animate-slide-up space-y-5">
        <PageHeader
          title="Component library"
          description="Definitions, not instances. Programs inherit controls from these components; changing one here propagates to every consumer."
          actions={
            <>
              <Button variant="secondary">Export inheritance matrix</Button>
              <Button variant="primary">
                <Plus className="size-3.5" /> New component
              </Button>
            </>
          }
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_272px]">
          <div className="min-w-0 space-y-7 pt-1 lg:pr-6">
            <Section
              title="Shared components"
              description="Provided control counts and the number of programs consuming each definition."
            >
              <Table className="table-fixed">
                <colgroup>
                  <col />
                  <col style={{ width: "124px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "96px" }} />
                  <col style={{ width: "164px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Component</Th>
                    <Th>Owner</Th>
                    <Th className="text-right">Controls</Th>
                    <Th className="text-right">Used by</Th>
                    <Th className="text-right">Health</Th>
                  </tr>
                </thead>
                <tbody>
                  {systemComponents.map((c) => {
                    const active = selected?.key === c.key;
                    const stale = c.controls.filter(
                      (x) => x.evidenceAge > staleThresholdDays,
                    ).length;
                    return (
                      <Tr
                        key={c.id}
                        onClick={() => select(c.key)}
                        className={active ? "cursor-pointer bg-subtle" : "cursor-pointer"}
                      >
                        <Td>
                          <span className="font-medium">{c.name}</span>{" "}
                          <Mono className="text-muted-foreground">{c.key}</Mono>
                        </Td>
                        <Td className="text-muted-foreground">{c.owner}</Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {c.controls.length}
                        </Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {c.consumers.length} program{c.consumers.length === 1 ? "" : "s"}
                        </Td>
                        <Td className="text-right">
                          {c.health === "Current" ? (
                            <span className="text-muted-foreground">
                              Current{stale ? ` · ${stale} stale` : ""}
                            </span>
                          ) : (
                            <Badge tone={componentHealthTone[c.health]}>{c.health}</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>

              </Table>
            </Section>

            {selected ? (
              <>
                <Section
                  title={`${selected.name} — provided controls`}
                  description={selected.summary}
                  action={
                    <Button variant="link" onClick={() => select(undefined)}>
                      Clear selection
                    </Button>
                  }
                >
                  <ProvidedControlsTable component={selected} />
                </Section>

                <Section
                  title="Blast radius"
                  description={`Consumed by ${selected.consumers.length} programs. Evidence or status changes here re-open the inherited rows below.`}
                  action={
                    selected.controls.some((c) => c.evidenceAge > staleThresholdDays) ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning">
                        <AlertTriangle className="size-3.5" />
                        Stale evidence propagating
                      </span>
                    ) : null
                  }
                >
                  <ConsumerTable component={selected} />
                </Section>
              </>
            ) : null}
          </div>

          <aside className="pt-1 lg:border-l lg:border-border lg:pl-6">
            {selected ? (
              <>
                <RailGroup title="Definition">
                  <KeyValue label="Component">
                    <Mono>{selected.id}</Mono>
                  </KeyValue>
                  <KeyValue label="Key">
                    <Mono>{selected.key}</Mono>
                  </KeyValue>
                  <KeyValue label="Type">{selected.type}</KeyValue>
                  <KeyValue label="Version">{selected.version}</KeyValue>
                  <KeyValue label="Provider">{selected.provider}</KeyValue>
                  <KeyValue label="Owner">{selected.owner}</KeyValue>
                </RailGroup>
                <RailGroup title="Standing">
                  <KeyValue label="Authorization">{selected.authorization}</KeyValue>
                  <KeyValue label="Health">{selected.health}</KeyValue>
                  <KeyValue label="Controls">{selected.controls.length}</KeyValue>
                  <KeyValue label="Consumers">{selected.consumers.length}</KeyValue>
                  <KeyValue label="Updated">{selected.updated}</KeyValue>
                </RailGroup>
              </>
            ) : (
              <p className="pt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Select a component to see the controls it provides and the programs that would
                feel a change to it.
              </p>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
