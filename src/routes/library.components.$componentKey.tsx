import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { ConsumerTable, ProvidedControlsTable } from "@/components/app/inheritance";
import {
  Badge,
  Button,
  Id,
  Inline,
  Inspector,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
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
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Provider not found</h1>
          <TextLink size="medium">
            <Link to="/library/components">Back to component library</Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const stale = component.controls.filter((c) => c.evidenceAge > staleThresholdDays).length;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            back={<Link to="/library/components" />}
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
        tabs={<div className="border-b border-default" />}
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
                    <TextLink>
                      <Link
                        to="/programs/$programId"
                        params={{ programId: component.sourceProgramId }}
                      >
                        <Id>{component.sourceProgramId}</Id>
                      </Link>
                    </TextLink>
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
        <p className="max-w-layout-measure font-body text-subtle">{component.summary}</p>

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
              <Inline
                className="font-body-small font-medium text-warning"
                as="span"
                display="inline-flex"
                space="space.075"
                alignBlock="center"
              >
                <AlertTriangle className="size-icon-small" />
                {stale} stale definition{stale === 1 ? "" : "s"} propagating
              </Inline>
            ) : null
          }
        >
          <ConsumerTable component={component} />
        </Section>
      </ShowPage>
    </Shell>
  );
}
