import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  IdCell,
  KeyValue,
  Mono,
  IndexPage,
  PageHeader,
  PreviewRail,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  componentHealthTone,
  systemComponents,
  staleThresholdDays,
  type SystemComponent,
} from "@/lib/reusable-components";

export const Route = createFileRoute("/library/components/")({
  head: () => ({
    meta: [
      { title: "Provider library — Equinox GRC" },
      {
        name: "description",
        content:
          "Reusable system components that programs inherit controls from: identity, landing zone, policy set and facility, with the blast radius of every change.",
      },
      { property: "og:title", content: "Provider library — Equinox GRC" },
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
  const navigate = useNavigate();
  const [preview, setPreview] = useState<SystemComponent | null>(null);

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Provider library"
            description="Definitions, not instances. Programs inherit controls from these providers, and requirements allocate to them; changing one here propagates to every consumer."
            actions={
              <>
                <Button variant="secondary">Export inheritance matrix</Button>
                <Button variant="primary">
                  <Plus className="size-3.5" /> New component
                </Button>
              </>
            }
          />
        }
      >
        <div className={preview ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            <Table className="table-fixed">
              <colgroup>
                <col style={{ width: "116px" }} />
                <col />
                <col style={{ width: "124px" }} />
                <col style={{ width: "72px" }} />
                <col style={{ width: "96px" }} />
                <col style={{ width: "164px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Th>Key</Th>
                  <Th>Provider</Th>
                  <Th>Owner</Th>
                  <Th className="text-right">Controls</Th>
                  <Th className="text-right">Used by</Th>
                  <Th className="text-right">Health</Th>
                </tr>
              </thead>
              <tbody>
                {systemComponents.map((c) => {
                  const stale = c.controls.filter((x) => x.evidenceAge > staleThresholdDays).length;
                  return (
                    <Tr
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/library/components/$componentKey",
                          params: { componentKey: c.key },
                        })
                      }
                    >
                      <IdCell
                        id={c.key}
                        active={preview?.key === c.key}
                        onPreview={() => setPreview(c)}
                      />
                      <Td className="truncate font-medium">{c.name}</Td>
                      <Td className="truncate text-muted-foreground">{c.owner}</Td>
                      <Td className="tnum text-right text-muted-foreground">{c.controls.length}</Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {c.consumers.length}
                      </Td>
                      <Td className="truncate text-right">
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
          </div>

          {preview ? (
            <PreviewRail
              id={preview.id}
              title={preview.name}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/library/components/$componentKey"
                  params={{ componentKey: preview.key }}
                  className="text-primary hover:underline"
                >
                  Open component →
                </Link>
              }
            >
              <RailGroup title="Definition">
                <KeyValue label="Key">
                  <Mono>{preview.key}</Mono>
                </KeyValue>
                <KeyValue label="Type">{preview.type}</KeyValue>
                <KeyValue label="Version">{preview.version}</KeyValue>
                <KeyValue label="Provider">{preview.provider}</KeyValue>
                <KeyValue label="Owner">{preview.owner}</KeyValue>
              </RailGroup>
              <RailGroup title="Standing">
                <KeyValue label="Authorization">{preview.authorization}</KeyValue>
                <KeyValue label="Health">{preview.health}</KeyValue>
                <KeyValue label="Controls">{preview.controls.length}</KeyValue>
                <KeyValue label="Consumers">{preview.consumers.length}</KeyValue>
                <KeyValue label="Updated">{preview.updated}</KeyValue>
              </RailGroup>
            </PreviewRail>
          ) : null}
        </div>
      </IndexPage>
    </Shell>
  );
}
