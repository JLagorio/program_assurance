import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { ConsumerTable, ProvidedControlsTable } from "@/components/app/inheritance";
import { Badge, Button, KeyValue, Id } from "@/ds/primitives";
import { RecordHeader, ShowPage, Section } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { Shell } from "@/ds/shell";
import {
  componentHealthTone,
  systemComponents,
  staleThresholdDays,
} from "@/lib/reusable-components";

export const Route = createFileRoute("/library/components/$componentKey")({
  head: ({ params }) => {
    const c = systemComponents.find((x) => x.key === params.componentKey);
    const title = c ? `${c.name} — provider library` : "Provider — Equinox GRC";
    const description = c
      ? c.summary
      : "Shared system component: the controls it provides and the programs that inherit them.";
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
  component: ComponentRecord,
});

function ComponentRecord() {
  const { componentKey } = Route.useParams();
  const component = systemComponents.find((c) => c.key === componentKey);

  if (!component) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Provider not found</h1>
          <Link to="/library/components" className="text-[13px] text-primary hover:underline">
            Back to component library
          </Link>
        </div>
      </Shell>
    );
  }

  const stale = component.controls.filter((c) => c.evidenceAge > staleThresholdDays).length;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/library/components"
            id={component.id}
            title={component.name}
            meta={`${component.type} · ${component.version} · ${component.owner}`}
            actions={
              <>
                <Badge tone={componentHealthTone[component.health]}>{component.health}</Badge>
                <Button variant="secondary">Edit definition</Button>
              </>
            }
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <Inspector.Group title="Definition">
              <KeyValue label="Provider">
                <Id>{component.id}</Id>
              </KeyValue>
              <KeyValue label="Key">
                <Id>{component.key}</Id>
              </KeyValue>
              <KeyValue label="Type">{component.type}</KeyValue>
              <KeyValue label="Version">{component.version}</KeyValue>
              <KeyValue label="Provider">{component.provider}</KeyValue>
              <KeyValue label="Owner">{component.owner}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Standing">
              <KeyValue label="Authorization">{component.authorization}</KeyValue>
              <KeyValue label="Health">{component.health}</KeyValue>
              <KeyValue label="Controls">{component.controls.length}</KeyValue>
              <KeyValue label="Consumers">{component.consumers.length}</KeyValue>
              <KeyValue label="Updated">{component.updated}</KeyValue>
            </Inspector.Group>
            <Inspector.Group title="Source">
              <KeyValue label="Program">
                {component.sourceProgramId ? (
                  component.sourceAccessible ? (
                    <Link
                      to="/programs/$programId"
                      params={{ programId: component.sourceProgramId }}
                      className="text-primary hover:underline"
                    >
                      <Id className="text-primary">{component.sourceProgramId}</Id>
                    </Link>
                  ) : (
                    "Not in your enclave"
                  )
                ) : (
                  "—"
                )}
              </KeyValue>
            </Inspector.Group>
          </>
        }
      >
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          {component.summary}
        </p>

        <Section
          title="Provided controls"
          description="What consuming programs inherit, and how fresh the evidence behind it is."
        >
          <ProvidedControlsTable component={component} />
        </Section>

        <Section
          title="Blast radius"
          description={`Consumed by ${component.consumers.length} program${component.consumers.length === 1 ? "" : "s"}. Evidence or status changes here re-open every inherited row.`}
          action={
            stale ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning">
                <AlertTriangle className="size-3.5" />
                {stale} stale definition{stale === 1 ? "" : "s"} propagating
              </span>
            ) : null
          }
        >
          <ConsumerTable component={component} />
        </Section>
      </ShowPage>
    </Shell>
  );
}
