// A library component's record (the pass-six boards component.html, component--overview.html and
// component--assessment.html; Josef's decisions of 2026-11-14 and 15: "Unit · The component
// version is assessed once", "Components register · One row a component"). What holds for this
// screen alone:
//
// The record is one component, followed across the versions of its set by its name; its address,
// `/library/components/<id>`, names the version shown by that version's own id
// (`defined_components`), with the tab (`?tab=`) and, on Findings, the offer under review
// (`&offer=`). An address that names a component set instead, as the Components address did before
// components had pages, opens the set at `/library/component-sets/<id>` with its version and tab.
// Choosing another version in the version menu opens its own address, on the same tab.
//
// The header is the component's name, the version menu beside it (the board's place for it) and
// the version's state, then its facts (Owner, its own or its set's; Business line; Type; Component
// set, a link to the set; Used in, products and programs), ending with the offer slot
// (component-offer-slot). Under it, one line says where the version stands: how many controls,
// one bar, each standing with its count (Satisfied always, then what holds a control), and how many
// determinations were carried from an earlier version; a standing opens the Assessment tab at it.
// The tabs are Overview, Assessment, Where used, Findings, SBOM and Versions, the address keeping
// the tab; Versions counts the versions the component is in.
//
// Overview opens with three trays, each opening the tab that holds what it counts: the controls
// satisfied out of every control claimed (42 of 61, Josef's "Counting"), with the bar and the
// standings worst first and what was carried; what uses it, with how many consumers are behind
// and changed it and what each system inherits; and what waits on its owner (offers, open CVEs,
// open findings, programs with no issue yet for a CVE). Then its description, beside the Details
// (Owner, Business line, Component set, Type, Built as, Latest version, Assessed). Assessment
// (component-assessment-panel) and Where used (component-where-used) fill the work area without
// the Details; Findings, SBOM and Versions are their own panels, each given the version's id.

import { Link } from "@tanstack/react-router";
import {
  AsideLayout,
  Box,
  Button,
  Card,
  CardContent,
  Count,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Fact,
  Grid,
  Inline,
  Inspector,
  PageHeader,
  Prose,
  Shell,
  Stack,
  Stat,
  Tabs,
  TabsList,
  TabsTrigger,
  TextLink,
  Tray,
  useLedgerLocale,
} from "@ledger/design-system";
import type { UseQueryResult } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import {
  consumerLines,
  standingLine,
  usedInWords,
  useComponentVersions,
  type ComponentStanding,
  type ComponentVersionChoice,
  type StandingLine,
} from "@/lib/component-record";
import {
  useComponentConsumers,
  useComponentControlStatus,
  type ComponentConsumers,
  type ComponentControlStatusAnswer,
} from "@/lib/component-reuse";
import { useComponentVulnerabilities } from "@/lib/component-vulnerabilities";
import type { Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { componentStandings, revisionStates, statusLabel } from "@/lib/status";
import { questionSearch } from "./collection-question";
import { ComponentAssessmentPanel, componentControlsKey } from "./component-assessment-panel";
import { ComponentFindingsPanel } from "./component-findings";
import { ComponentOfferSlot } from "./component-offer-slot";
import { ComponentSbomPanel } from "./component-sbom";
import { StandingLineKey, StandingTally } from "./component-standing";
import { ComponentVersionsPanel } from "./component-versions-panel";
import { ComponentWhereUsed } from "./component-where-used";
import { ProductRecordDialog } from "./product-record-dialog";
import { RetainedTabPanels } from "./program-shared";
import { RecordTrail, TrailLink } from "./record-trail";
import { RelationName } from "./record-tools";
import { DetailFacts, MissingRecord, NoOwner, QueryState, ReportFailures } from "./work-common";

export const componentTabs = [
  "Overview",
  "Assessment",
  "Where used",
  "Findings",
  "SBOM",
  "Versions",
] as const;
export type ComponentTab = (typeof componentTabs)[number];
/** Whether a value names one of the record's tabs: an address's `tab` is checked with it. */
export const isComponentTab = (value: unknown): value is ComponentTab =>
  typeof value === "string" && (componentTabs as readonly string[]).includes(value);

/** The address of one of the record's tabs, with the question a link asks of its collection. */
const tabLink = (componentId: string, tab: ComponentTab, question?: Record<string, unknown>) => (
  <Link
    to="/library/components/$componentId"
    params={{ componentId }}
    search={{ tab, ...question } as never}
  />
);

/** The Assessment tab asked for the controls at one standing. */
const standingLink = (componentId: string) => (standing: ComponentStanding) =>
  tabLink(
    componentId,
    "Assessment",
    questionSearch(componentControlsKey(componentId), {
      filters: [{ id: "standing", value: [standing] }],
    }),
  );

export function ComponentRecord({
  id,
  component,
  tab,
  onTab,
  onVersion,
}: {
  /** The version shown: its `defined_components` id. */
  id: string;
  component: UseQueryResult<Row<"defined_components"> | null, Error>;
  tab: ComponentTab;
  onTab: (tab: ComponentTab) => void;
  /** Opens the component in another version of its set. */
  onVersion: (id: string) => void;
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const record = component.data;
  // Read once the address is known to name a component: one that names a set opens the set.
  const status = useComponentControlStatus(record ? id : null);
  const consumers = useComponentConsumers(record ? id : null);
  const facts = status.data?.component;
  const { versions, queries: versionQueries } = useComponentVersions(
    facts?.definitionId,
    record?.name,
  );
  const line = useMemo(() => (status.data ? standingLine(status.data) : null), [status.data]);
  const [editing, setEditing] = useState(false);
  const shown = versions?.find((version) => version.id === id);
  const state = shown?.state ?? facts?.state;
  const editable = workspace.role !== "viewer" && state === "draft";
  return (
    <Page>
      {/* The page is one failure region: a read its header, its standing or a tab draws from that
          fails reads as one alert at the top, whose Retry reloads all of them. */}
      <QueryState queries={[component]} region>
        {record ? (
          <>
            <ReportFailures queries={[status, consumers, ...versionQueries]} />
            <PageHeader>
              <RecordTrail current={record.name}>
                <TrailLink to="/library/components">Components</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <PageHeader.Title>{record.name}</PageHeader.Title>
                  {versions && shown && (
                    <VersionMenu versions={versions} shown={shown} onVersion={onVersion} />
                  )}
                  {state && <StatusBadge statuses={revisionStates} value={state} />}
                </Inline>
                {facts && (
                  <PageHeader.Facts>
                    <Fact label="Owner">
                      {facts.ownerPartyId ? (
                        <RelationName table="parties" id={facts.ownerPartyId} peek={false} />
                      ) : (
                        <NoOwner />
                      )}
                    </Fact>
                    {facts.businessLineId && (
                      <Fact label="Business line">
                        <BusinessLineLink id={facts.businessLineId} />
                      </Fact>
                    )}
                    <Fact label="Type">{labelFor(record.component_type)}</Fact>
                    <Fact label="Component set">
                      <TextLink
                        render={
                          <Link
                            to="/library/component-sets/$setId"
                            params={{ setId: facts.definitionId }}
                          />
                        }
                      >
                        {facts.definitionName}
                      </TextLink>
                    </Fact>
                    {consumers.data && usedInWords(consumers.data.totals) && (
                      <Fact label="Used in">{usedInWords(consumers.data.totals)}</Fact>
                    )}
                  </PageHeader.Facts>
                )}
              </PageHeader.Heading>
              {facts && (
                <ComponentOfferSlot
                  scope={{
                    component: {
                      componentDefinitionId: facts.definitionId,
                      componentName: facts.name,
                    },
                  }}
                  {...(editable
                    ? {
                        more: {
                          label: "More component actions",
                          items: (
                            <DropdownMenuItem onClick={() => setEditing(true)}>
                              Edit component
                            </DropdownMenuItem>
                          ),
                        },
                      }
                    : {})}
                />
              )}
            </PageHeader>
            {editing && (
              <ProductRecordDialog
                table="defined_components"
                existing={record as unknown as DataRecord}
                onClose={() => setEditing(false)}
              />
            )}
            {line && line.total > 0 && (
              <Box
                backgroundColor="elevation.surface.tray"
                paddingBlock="space.100"
                paddingInline="space.200"
                className="rounded-large"
              >
                <StandingLineKey
                  line={line}
                  name={`${record.name} version ${formatNumber(facts?.version ?? 1)}`}
                  link={standingLink(id)}
                />
              </Box>
            )}
            <Tabs value={tab} onValueChange={(value) => onTab(value as ComponentTab)}>
              <TabsList variant="line" aria-label="Component sections">
                {componentTabs.map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                    {name === "Versions" && versions && (
                      <Count value={versions.length} max={9999} />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* Each tab keeps its panel once drawn; another version is another set of panels. */}
              <RetainedTabPanels key={id} tabs={componentTabs} value={tab} space="space.200">
                {(name) => {
                  switch (name) {
                    case "Overview":
                      return (
                        <ComponentOverview
                          id={id}
                          record={record}
                          status={status.data}
                          line={line}
                          consumers={consumers.data}
                          versions={versions}
                        />
                      );
                    case "Assessment":
                      return <ComponentAssessmentPanel componentId={id} status={status} />;
                    case "Where used":
                      return <ComponentWhereUsed componentId={id} consumers={consumers} />;
                    case "Findings":
                      return <ComponentFindingsPanel componentId={id} />;
                    case "SBOM":
                      return <ComponentSbomPanel componentId={id} />;
                    case "Versions":
                      return <ComponentVersionsPanel componentId={id} />;
                  }
                }}
              </RetainedTabPanels>
            </Tabs>
          </>
        ) : (
          <MissingRecord backTo="/library/components" kind="Component" />
        )}
      </QueryState>
    </Page>
  );
}

/**
 * The version the page reads, as the header's version menu beside the name: its trigger names the
 * version, and the menu lists every version of the set that holds the component, newest first,
 * with its state, the shown one marked. Choosing one opens the component in it.
 */
function VersionMenu({
  versions,
  shown,
  onVersion,
}: {
  versions: readonly ComponentVersionChoice[];
  shown: ComponentVersionChoice;
  onVersion: (id: string) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="small" iconAfter={<ChevronDown />}>
            {`Version ${formatNumber(shown.version)}`}
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Component versions</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={shown.id}
            onValueChange={(value: string) => {
              if (value !== shown.id) onVersion(value);
            }}
          >
            {versions.map((version) => (
              <DropdownMenuRadioItem key={version.id} value={version.id} closeOnClick>
                {formatNumber(version.version)} · {statusLabel(revisionStates, version.state)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A business line by its name, a link to its record. */
function BusinessLineLink({ id }: { id: string }) {
  return (
    <TextLink render={<Link to="/library/business-lines/$lineId" params={{ lineId: id }} />}>
      <RelationName table="business_lines" id={id} peek={false} />
    </TextLink>
  );
}

/**
 * Where the version stands before anything is listed: three trays, each opening the tab that holds
 * what it counts, then the component's description, beside its Details.
 */
function ComponentOverview({
  id,
  record,
  status,
  line,
  consumers,
  versions,
}: {
  id: string;
  record: Row<"defined_components">;
  status: ComponentControlStatusAnswer | undefined;
  line: StandingLine | null;
  consumers: ComponentConsumers | undefined;
  versions: readonly ComponentVersionChoice[] | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const facts = status?.component;
  const lines = useMemo(() => (consumers ? consumerLines(consumers) : []), [consumers]);
  // Built as: the element codes the component sits on where a product or a program applied it.
  const builtAs = [
    ...new Set(lines.flatMap((consumer) => (consumer.elementCode ? [consumer.elementCode] : []))),
  ];
  const latest = versions?.find((version) => version.state === "published");
  const assessed = status?.assessments[0];
  return (
    <AsideLayout
      aside={
        <Shell.Aside
          label="Component details"
          summary={
            facts ? <StatusBadge statuses={revisionStates} value={facts.state} /> : undefined
          }
        >
          <Inspector.Group title="Details">
            {facts && (
              <DetailFacts
                facts={[
                  [
                    "Owner",
                    facts.ownerPartyId ? (
                      <RelationName table="parties" id={facts.ownerPartyId} peek={false} />
                    ) : null,
                  ],
                  [
                    "Business line",
                    facts.businessLineId ? <BusinessLineLink id={facts.businessLineId} /> : null,
                  ],
                  [
                    "Component set",
                    <TextLink
                      render={
                        <Link
                          to="/library/component-sets/$setId"
                          params={{ setId: facts.definitionId }}
                        />
                      }
                    >
                      {facts.definitionName}
                    </TextLink>,
                  ],
                  ["Type", labelFor(record.component_type)],
                  ["Built as", builtAs.length ? builtAs.join(" · ") : null],
                  [
                    "Latest version",
                    latest ? (
                      <>
                        {formatNumber(latest.version)}
                        {latest.publishedAt && (
                          <>
                            {" · "}
                            <DateTime value={latest.publishedAt} format="date" />
                          </>
                        )}
                      </>
                    ) : null,
                  ],
                  [
                    "Assessed",
                    assessed ? (
                      <>
                        <DateTime
                          value={assessed.completedOn ?? assessed.publishedAt}
                          format="date"
                        />
                        {` · version ${formatNumber(assessed.version)}`}
                      </>
                    ) : null,
                  ],
                ]}
              />
            )}
          </Inspector.Group>
        </Shell.Aside>
      }
    >
      <Stack space="space.300" className="min-w-0">
        <Grid
          templateColumns="repeat(auto-fit, minmax(min(100%, 240px), 1fr))"
          gap="space.200"
          alignItems="start"
        >
          <StandingTray id={id} line={line} name={record.name} />
          <UsedInTray id={id} consumers={consumers} />
          <FindingsTray id={id} consumers={consumers} />
        </Grid>
        {record.description && (
          <Box className="max-w-layout-measure">
            <Prose label="Description">{record.description}</Prose>
          </Box>
        )}
      </Stack>
    </AsideLayout>
  );
}

/** How many controls the version satisfies of every one it claims, and how the rest stand. */
function StandingTray({ id, line, name }: { id: string; line: StandingLine | null; name: string }) {
  const { formatNumber } = useLedgerLocale();
  const link = standingLink(id);
  if (!line) return <Tray title="controls satisfied" isLoading link={tabLink(id, "Assessment")} />;
  if (line.total === 0)
    return <Tray title="No controls claimed" link={tabLink(id, "Assessment")} />;
  // Worst first, a standing that holds no control left out.
  const rows = (
    ["other_than_satisfied", "partially_satisfied", "to_review", "not_assessed"] as const
  ).filter((key) => line.counts[key] > 0);
  return (
    <Tray
      value={`${formatNumber(line.counts.satisfied)} of ${formatNumber(line.total)}`}
      title="controls satisfied"
      link={tabLink(id, "Assessment")}
    >
      <Card size="small">
        <CardContent>
          <StandingTally line={line} size="xlarge" label={`Controls of ${name}, by standing`} />
        </CardContent>
      </Card>
      {rows.length > 0 && (
        <Stat.List aria-label="Controls not satisfied, by standing">
          {rows.map((key) => (
            <Stat.Row
              key={key}
              label={componentStandings[key].label}
              value={line.counts[key]}
              tone={key === "not_assessed" ? "neutral" : componentStandings[key].tone}
              link={link(key)}
            />
          ))}
        </Stat.List>
      )}
      {line.carried > 0 && (
        <Stat.List aria-label="Determinations carried forward">
          <Stat.Row
            label={
              line.carriedFrom === null
                ? "Carried forward"
                : `Carried from version ${formatNumber(line.carriedFrom)}`
            }
            value={line.carried}
          />
        </Stat.List>
      )}
    </Tray>
  );
}

/** What the component is used in, how many consumers are behind or changed it, and what each inherits. */
function UsedInTray({ id, consumers }: { id: string; consumers: ComponentConsumers | undefined }) {
  const { formatNumber } = useLedgerLocale();
  const link = tabLink(id, "Where used");
  if (!consumers) return <Tray title="Used in" isLoading link={link} />;
  const words = usedInWords(consumers.totals);
  if (!words) return <Tray title="Not used yet" link={link} />;
  const inheriting = consumers.systems.filter((system) => system.change !== "removed");
  const counts = [
    { label: "Behind", value: consumers.totals.behind, tone: "warning" as const },
    { label: "Modified here", value: consumers.totals.modified, tone: "neutral" as const },
  ].filter((count) => count.value > 0);
  return (
    <Tray title={`Used in ${words}`} link={link}>
      {counts.length > 0 && (
        <Stat.List aria-label="Consumers that differ">
          {counts.map((count) => (
            <Stat.Row key={count.label} {...count} link={link} />
          ))}
        </Stat.List>
      )}
      {inheriting.length > 0 && (
        <Stat.List aria-label="Controls each program inherits">
          {inheriting.map((system) => (
            <Stat.Row
              key={system.key}
              label={system.programName}
              value={`${formatNumber(system.controlsInherited)} of ${formatNumber(system.controlsJudged)}`}
              link={link}
            />
          ))}
        </Stat.List>
      )}
    </Tray>
  );
}

/**
 * What waits on the component's owner: the offers of programs' results, the open CVEs, the findings
 * programs still hold open and, for CVEs on one version, the programs that hold no issue for one.
 */
function FindingsTray({
  id,
  consumers,
}: {
  id: string;
  consumers: ComponentConsumers | undefined;
}) {
  const link = tabLink(id, "Findings");
  // The versions in use that carry an open CVE: where they are one, its programs' answers are read.
  const affected = useMemo(
    () => [
      ...new Set(
        [...(consumers?.products ?? []), ...(consumers?.systems ?? [])]
          .filter((consumer) => consumer.vulnerabilitiesOpen > 0)
          .map((consumer) => `${consumer.definedComponentId}:${consumer.version}`),
      ),
    ],
    [consumers],
  );
  const [only] = affected.length === 1 ? affected : [];
  const vulnerabilities = useComponentVulnerabilities(only?.split(":")[0]);
  if (!consumers) return <Tray title="findings" isLoading link={link} />;
  type Line = { label: string; value: number; tone: "danger" | "warning" | "neutral" };
  const lines: Line[] = [
    {
      label: only
        ? `Open ${consumers.vulnerabilitiesOpen === 1 ? "CVE" : "CVEs"} on version ${only.split(":")[1]}`
        : "Open CVEs",
      value: consumers.vulnerabilitiesOpen,
      tone: "danger",
    },
    { label: "Open findings", value: consumers.findingsOpen, tone: "warning" },
    {
      label: "Programs with no issue yet",
      value: vulnerabilities.data?.totals.programsUnanswered ?? 0,
      tone: "warning",
    },
  ];
  const rows = lines.filter((row) => row.value > 0);
  return (
    <Tray
      {...(consumers.offersOpen > 0
        ? {
            value: consumers.offersOpen,
            title: consumers.offersOpen === 1 ? "offer waiting" : "offers waiting",
          }
        : { title: rows.length ? "Findings" : "No open findings" })}
      link={link}
    >
      {rows.length > 0 && (
        <Stat.List aria-label="Findings on the component">
          {rows.map((row) => (
            <Stat.Row key={row.label} {...row} link={link} />
          ))}
        </Stat.List>
      )}
    </Tray>
  );
}
