import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { ConsumerTable, ProvidedControlsTable } from "@/components/app/inheritance";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  ShowPage,
  Section,
} from "@/components/app/ui";
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
            <RailGroup title="Definition">
              <KeyValue label="Provider">
                <Mono>{component.id}</Mono>
              </KeyValue>
              <KeyValue label="Key">
                <Mono>{component.key}</Mono>
              </KeyValue>
              <KeyValue label="Type">{component.type}</KeyValue>
              <KeyValue label="Version">{component.version}</KeyValue>
              <KeyValue label="Provider">{component.provider}</KeyValue>
              <KeyValue label="Owner">{component.owner}</KeyValue>
            </RailGroup>
            <RailGroup title="Standing">
              <KeyValue label="Authorization">{component.authorization}</KeyValue>
              <KeyValue label="Health">{component.health}</KeyValue>
              <KeyValue label="Controls">{component.controls.length}</KeyValue>
              <KeyValue label="Consumers">{component.consumers.length}</KeyValue>
              <KeyValue label="Updated">{component.updated}</KeyValue>
            </RailGroup>
            <RailGroup title="Source">
              <KeyValue label="Program">
                {component.sourceProgramId ? (
                  component.sourceAccessible ? (
                    <Link
                      to="/programs/$programId"
                      params={{ programId: component.sourceProgramId }}
                      className="text-primary hover:underline"
                    >
                      <Mono className="text-primary">{component.sourceProgramId}</Mono>
                    </Link>
                  ) : (
                    "Not in your enclave"
                  )
                ) : (
                  "—"
                )}
              </KeyValue>
            </RailGroup>
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
