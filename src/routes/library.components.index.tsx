import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Badge, Button, KeyValue, Table, Id } from "@/ds/primitives";
import { IndexPage, PageHeader, PreviewRail } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { PreviewSplit } from "@/components/app/preview-split";
import { Shell } from "@/ds/shell";
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
        <PreviewSplit open={preview !== null}>
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
                  <Table.Header>Key</Table.Header>
                  <Table.Header>Provider</Table.Header>
                  <Table.Header>Owner</Table.Header>
                  <Table.Header className="text-right">Controls</Table.Header>
                  <Table.Header className="text-right">Used by</Table.Header>
                  <Table.Header className="text-right">Health</Table.Header>
                </tr>
              </thead>
              <tbody>
                {systemComponents.map((c) => {
                  const stale = c.controls.filter((x) => x.evidenceAge > staleThresholdDays).length;
                  return (
                    <Table.Row
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/library/components/$componentKey",
                          params: { componentKey: c.key },
                        })
                      }
                    >
                      <Table.Id
                        id={c.key}
                        active={preview?.key === c.key}
                        onPreview={() => setPreview(c)}
                      />
                      <Table.Cell className="truncate">{c.name}</Table.Cell>
                      <Table.Cell className="truncate">{c.owner}</Table.Cell>
                      <Table.Cell className="tnum text-right">{c.controls.length}</Table.Cell>
                      <Table.Cell className="tnum text-right">{c.consumers.length}</Table.Cell>
                      <Table.Cell className="truncate text-right">
                        {c.health === "Current" ? (
                          <span className="text-muted-foreground">
                            Current{stale ? ` · ${stale} stale` : ""}
                          </span>
                        ) : (
                          <Badge tone={componentHealthTone[c.health]}>{c.health}</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
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
              <Inspector.Group title="Definition">
                <KeyValue label="Key">
                  <Id>{preview.key}</Id>
                </KeyValue>
                <KeyValue label="Type">{preview.type}</KeyValue>
                <KeyValue label="Version">{preview.version}</KeyValue>
                <KeyValue label="Provider">{preview.provider}</KeyValue>
                <KeyValue label="Owner">{preview.owner}</KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Standing">
                <KeyValue label="Authorization">{preview.authorization}</KeyValue>
                <KeyValue label="Health">{preview.health}</KeyValue>
                <KeyValue label="Controls">{preview.controls.length}</KeyValue>
                <KeyValue label="Consumers">{preview.consumers.length}</KeyValue>
                <KeyValue label="Updated">{preview.updated}</KeyValue>
              </Inspector.Group>
            </PreviewRail>
          ) : null}
        </PreviewSplit>
      </IndexPage>
    </Shell>
  );
}
