import {
  Badge,
  Block,
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  Count,
  Editable,
  Fact,
  Gates,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import { LinkControlsSheet } from "@/components/app/link-controls";
import { RequirementEvidence } from "@/components/app/program-evidence";
import { RecordActivity } from "@/components/app/record-activity";
import { AllocationTable, ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { Shell } from "@/components/app/shell";
import { TasksSection } from "@/components/app/tasks-section";
import { campaignById, eventById, objectiveTone } from "@/lib/campaigns";
import { nodeById } from "@/lib/composition";
import { currentSession } from "@/lib/control-work";
import { programs } from "@/lib/grc-data";
import { useLinkCurrencyVersion } from "@/lib/link-currency";
import { resolveProgramElement } from "@/lib/program-scope";
import {
  linkVerification,
  needsWithVerification,
  objectiveEvidence,
  objectivesForRequirement,
  unlinkedObjectives,
  useVerificationVersion,
} from "@/lib/requirement-verification";
import {
  allocationsFor,
  ancestorsOfRequirement,
  childrenOfRequirement,
  derivationSourceTone,
  getRequirement,
  qualityGates,
  requirementMethodLabel,
  requirementStates,
  requirementStateTone,
  saveRequirementField,
  setRequirementField,
  useRequirementsVersion,
  verificationMethods,
} from "@/lib/requirements";
import { resolvedObjectiveResult, runById } from "@/lib/test-execution";

/**
 * Two tabs, not four. Each pane holds one to four rows — a requirement carries
 * at most three derivation sources and four allocations — so splitting
 * allocation, decomposition and verification into their own tabs would mean
 * clicking to reach almost nothing. Provenance earns its own pane only because
 * the rationale column is the one thing the rail cannot hold.
 */
const requirementTabs = ["Overview", "Provenance"] as const;
type RequirementTab = (typeof requirementTabs)[number];

export const Route = createFileRoute("/programs/$programId_/requirements/$requirementId")({
  // `tab` is emitted unconditionally — the validated object is merged over the
  // raw search, so returning `{}` on a miss keeps `?tab=Bogus` in the URL and
  // renders a tab strip over an empty body.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: RequirementTab | undefined; element?: string | undefined } => {
    const raw = String(search["tab"] ?? "");
    return {
      tab: requirementTabs.find((t) => t.toLowerCase() === raw.toLowerCase()),
      element: typeof search["element"] === "string" ? search["element"] : undefined,
    };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.requirementId} — Equinox` },
      {
        name: "description",
        content: `Security requirement ${params.requirementId} in program ${params.programId}: shall statement, derivation provenance, decomposition and allocation to system elements, providers and processes.`,
      },
      { property: "og:title", content: `${params.requirementId} — Equinox` },
      {
        property: "og:description",
        content: `Security requirement ${params.requirementId} in ${params.programId}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequirementRecord,
});

function RequirementRecord() {
  const { programId, requirementId } = Route.useParams();
  const tab = Route.useSearch().tab ?? "Overview";
  const elementId = resolveProgramElement(programId, Route.useSearch().element)?.id;
  const program = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });

  // Every read goes through the store so an edit made in the allocation table
  // re-renders the header counts in the same tick.
  // Keyed off the store version so an edit made in the allocation table
  // re-renders the header counts in the same tick.
  const storeVersion = useRequirementsVersion();
  const verificationVersion = useVerificationVersion();
  const currencyVersion = useLinkCurrencyVersion();
  const [allocating, setAllocating] = useState(false);
  const [linking, setLinking] = useState(false);
  const requirement = useMemo(
    () => getRequirement(requirementId) ?? null,
    [requirementId, storeVersion],
  );
  const allocations = useMemo(
    () => (requirement ? allocationsFor(requirement.id) : []),
    [requirement, storeVersion],
  );
  const children = useMemo(
    () => (requirement ? childrenOfRequirement(requirement.id) : []),
    [requirement],
  );
  const parent = useMemo(
    () => (requirement ? (ancestorsOfRequirement(requirement.id)[0] ?? null) : null),
    [requirement],
  );

  if (!requirement || requirement.program !== program.id) {
    return (
      <Shell>
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Requirement not found</h1>
          <p className="max-w-layout-measure font-body text-subtle">
            {requirementId} is not a security requirement of {program.id}.
          </p>
          <TextLink size="medium">
            <Link
              to="/programs/$programId"
              params={{ programId }}
              search={{ tab: "Requirements", element: elementId }}
            >
              Back to security requirements
            </Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const controlSources = requirement.derivations.filter(
    (d) => d.sourceType === "Control statement" || d.sourceType === "Overlay",
  );
  const gates = qualityGates(requirement);
  const unmet = gates.filter((g) => !g.met);
  const firstUnmet = unmet[0] ?? null;
  const needs = needsWithVerification(requirement);
  const objectives = objectivesForRequirement(requirement.id);
  const candidates = unlinkedObjectives(requirement.id);
  const go = (next: RequirementTab) =>
    navigate({ search: { tab: next, element: elementId }, replace: true });
  const me = currentSession().name;

  return (
    <Shell>
      <>
        <ShowPage
          tab={tab}
          onTabChange={(value) => go(value as typeof tab)}
          rail={
            tab === "Overview" ? (
              <>
                <Inspector.Group title="Details">
                  <KeyValue label="Type">{requirement.type}</KeyValue>
                  <KeyValue label="Revision">{`r${requirement.revision}`}</KeyValue>
                  <KeyValue label="Owner">
                    <Editable.Text
                      label="Owner"
                      value={requirement.owner}
                      onChange={(next) => setRequirementField(requirement.id, { owner: next })}
                      save={(next) => saveRequirementField(`${requirement.id} owner`, next)}
                    />
                  </KeyValue>
                  <KeyValue label="Method">
                    {requirement.assessmentMethod ? (
                      <Editable.Select
                        label="Assessment method"
                        options={["Examine", "Interview", "Test"] as const}
                        value={requirement.assessmentMethod}
                        onChange={(next) =>
                          setRequirementField(requirement.id, {
                            assessmentMethod: next,
                            method:
                              next === "Examine"
                                ? "Inspection"
                                : next === "Interview"
                                  ? "Analysis"
                                  : "Test",
                          })
                        }
                        save={(next) => saveRequirementField(`${requirement.id} method`, next)}
                      />
                    ) : (
                      <Editable.Select
                        label="Verification method"
                        options={verificationMethods}
                        value={requirement.method}
                        onChange={(next) => setRequirementField(requirement.id, { method: next })}
                        save={(next) => saveRequirementField(`${requirement.id} method`, next)}
                      />
                    )}
                  </KeyValue>
                  <KeyValue label="Allocations">{allocations.length || "None"}</KeyValue>
                  <KeyValue label="Linked controls" wrap>
                    {controlSources.length ? (
                      <Inline as="span" space="space.050" shouldWrap>
                        {controlSources.map((d) => (
                          <TextLink key={d.sourceId}>
                            <Link
                              to="/programs/$programId/controls/$controlId"
                              params={{ programId, controlId: d.sourceId }}
                              search={{ tab: undefined }}
                            >
                              <span className="text-subtle">
                                {d.relation === "mapped" ? "Mapped to " : "Derived from "}
                              </span>
                              <Id>{d.sourceId}</Id>
                            </Link>
                          </TextLink>
                        ))}
                      </Inline>
                    ) : (
                      <span className="text-subtle">Independent</span>
                    )}
                  </KeyValue>
                </Inspector.Group>
                <Collapsible defaultOpen className="border-t border-default first:border-t-0">
                  <h3>
                    <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                      Gates
                      {unmet.length > 0 ? <Count value={unmet.length} /> : null}
                      <ChevronDown
                        aria-hidden="true"
                        className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                      />
                    </CollapsibleTrigger>
                  </h3>
                  <CollapsibleContent>
                    <Box paddingBlockEnd="space.200">
                      <Gates>
                        {gates.map((g) => (
                          <Gates.Item
                            key={g.key}
                            met={g.met}
                            label={g.label}
                            reason={g.met ? undefined : g.reason}
                          />
                        ))}
                      </Gates>
                    </Box>
                  </CollapsibleContent>
                </Collapsible>
                <Inspector.Group title="Sources">
                  {requirement.derivations.map((d) => (
                    <KeyValue
                      key={`${d.sourceType}-${d.sourceId}`}
                      label={
                        d.sourceType === "Control statement" || d.sourceType === "Overlay"
                          ? d.relation === "mapped"
                            ? "Mapped to"
                            : "Derived from"
                          : d.sourceType
                      }
                    >
                      <Stack as="span" space="space.025">
                        <SourceRef derivation={d} programId={programId} elementId={elementId} />
                        <span className="font-body-xsmall text-subtle">{d.sourceLabel}</span>
                      </Stack>
                    </KeyValue>
                  ))}
                  <KeyValue label="Rationale">
                    <Button onClick={() => go("Provenance")} variant="link">
                      {requirement.derivations.length} on the Provenance tab
                    </Button>
                  </KeyValue>
                </Inspector.Group>

                <Inspector.Group title="Position">
                  <KeyValue label="Parent">
                    {parent ? (
                      <TextLink>
                        <Link
                          to="/programs/$programId/requirements/$requirementId"
                          params={{ programId, requirementId: parent.id }}
                          search={{ tab: undefined, element: elementId }}
                        >
                          <Id>{parent.id}</Id>
                        </Link>
                      </TextLink>
                    ) : (
                      "Top level"
                    )}
                  </KeyValue>
                  <KeyValue label="Children">{children.length || "None"}</KeyValue>
                  <KeyValue label="Revision">{requirement.revision}</KeyValue>
                  <KeyValue label="Workstream">
                    {requirement.workstream ? (
                      <TextLink>
                        <Link
                          to="/workstreams/$workstreamId"
                          params={{ workstreamId: requirement.workstream }}
                        >
                          <Id>{requirement.workstream}</Id>
                        </Link>
                      </TextLink>
                    ) : (
                      "—"
                    )}
                  </KeyValue>
                  <KeyValue label="Program">
                    <TextLink>
                      <Link
                        to="/programs/$programId"
                        params={{ programId }}
                        search={{ tab: "Requirements", element: elementId }}
                      >
                        <Id>{programId}</Id>
                      </Link>
                    </TextLink>
                  </KeyValue>
                </Inspector.Group>
              </>
            ) : null
          }
          header={
            <RecordHeader
              crumbs={
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link
                          to="/programs/$programId"
                          params={{ programId }}
                          search={{ tab: "Requirements", element: elementId }}
                        />
                      }
                    >
                      {program.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              }
              id={requirement.id}
              title={requirement.text}
              actions={
                <Inline space="space.100" alignBlock="center">
                  <Button size="small" variant="primary" onClick={() => setAllocating(true)}>
                    Allocate
                  </Button>
                  <Button size="small" onClick={() => setLinking(true)}>
                    Link controls
                  </Button>
                  <Editable.Select
                    label="Lifecycle status"
                    options={requirementStates}
                    value={requirement.state}
                    validate={(next) =>
                      next === "Approved" && firstUnmet
                        ? `${firstUnmet.label}: ${firstUnmet.reason}`
                        : null
                    }
                    onChange={(next) => setRequirementField(requirement.id, { state: next })}
                    save={(next) => saveRequirementField(`${requirement.id} state`, next)}
                    render={(v) => (
                      <Badge variant="secondary" tone={requirementStateTone[v]}>
                        {v}
                      </Badge>
                    )}
                  />
                </Inline>
              }
            />
          }
          tabs={
            <TabsList className="w-full justify-start" variant="line" activateOnFocus>
              {(
                [
                  ["Overview", allocations.length || null],
                  ["Provenance", requirement.derivations.length || null],
                ] as [RequirementTab, number | null][]
              ).map(([key, count]) => (
                <TabsTrigger key={key} value={key}>
                  {key}
                  {count ? <Count value={count} max={9999} /> : null}
                </TabsTrigger>
              ))}
            </TabsList>
          }
        >
          {tab === "Overview" ? (
            <>
              {needs.length ? (
                <Block title="Needs" count={needs.length}>
                  <Gates>
                    {needs.map((n) => (
                      <Gates.Item
                        key={n.key}
                        met={false}
                        label={n.label}
                        reason={n.reason}
                        action={
                          n.key === "allocate" ? (
                            <Button size="small" variant="link" onClick={() => setAllocating(true)}>
                              Allocate
                            </Button>
                          ) : undefined
                        }
                      />
                    ))}
                  </Gates>
                </Block>
              ) : null}
              <Section
                title="Allocated to"
                action={
                  <Button size="small" onClick={() => setAllocating(true)}>
                    Allocate
                  </Button>
                }
              >
                <AllocationTable allocations={allocations} programId={programId} editable />
              </Section>

              <Section
                title="Linked controls"
                action={
                  <Button size="small" onClick={() => setLinking(true)}>
                    Link controls
                  </Button>
                }
              >
                {controlSources.length ? (
                  <ProvenanceTable
                    derivations={controlSources}
                    programId={programId}
                    requirementId={requirement.id}
                  />
                ) : (
                  <Text as="p" size="small" color="color.text.subtle">
                    Independent — no linked controls.
                  </Text>
                )}
              </Section>

              {children.length > 0 ? (
                <Section title="Decomposed into">
                  <RequirementTable
                    requirements={children}
                    programId={programId}
                    allocationCount={(id) => allocationsFor(id).length}
                    elementId={elementId}
                  />
                </Section>
              ) : null}

              <Section
                title="Assessment result"
                action={
                  candidates.length ? (
                    <Combobox
                      aria-label="Link an assessment objective"
                      value=""
                      onChange={(id) => linkVerification(requirement.id, id, currentSession().name)}
                      options={candidates.map((o) => ({
                        value: o.id,
                        label: `${o.id} · ${o.statement}`,
                      }))}
                      placeholder="Link an assessment objective…"
                      searchPlaceholder="Search objectives…"
                      width={260}
                    />
                  ) : null
                }
              >
                {objectives.length ? (
                  <Table className="pt-050">
                    <thead>
                      <Table.Row>
                        <Table.Header width={80}>Objective</Table.Header>
                        <Table.Header>Statement</Table.Header>
                        <Table.Header width={220}>Event</Table.Header>
                        <Table.Header width={220}>Assessed on</Table.Header>
                        <Table.Header width={120}>Result</Table.Header>
                        <Table.Header width={96}>Evidence</Table.Header>
                      </Table.Row>
                    </thead>
                    <tbody>
                      {objectives.map((o) => {
                        const event = o.event ? eventById.get(o.event) : undefined;
                        const campaign = event ? campaignById.get(event.campaign) : undefined;
                        const result = resolvedObjectiveResult(o.id);
                        const assessedNodes = result.run ? runById(result.run)?.nodes : o.nodes;
                        return (
                          <Table.Row key={o.id}>
                            <Table.Cell>
                              <Id>{o.id}</Id>
                            </Table.Cell>
                            <Table.Cell className="truncate" title={o.statement}>
                              {o.statement}
                            </Table.Cell>
                            <Table.Cell className="truncate">
                              {event && campaign ? (
                                <TextLink>
                                  <Link
                                    to="/programs/$programId"
                                    params={{ programId }}
                                    search={{
                                      tab: "Assessments",
                                      assessmentId: campaign.id,
                                    }}
                                    title={event.window}
                                  >
                                    {event.name}
                                  </Link>
                                </TextLink>
                              ) : (
                                "—"
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {assessedNodes?.length
                                ? assessedNodes.map((id) => nodeById.get(id)?.name ?? id).join(", ")
                                : "Not recorded"}
                            </Table.Cell>
                            <Table.Cell>
                              <Indicator tone={objectiveTone(result.result)}>
                                {result.result}
                              </Indicator>
                            </Table.Cell>
                            <Table.Cell>
                              <Id.List ids={objectiveEvidence(o.id)} empty="None collected" />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : null}
                <Fact.Group className="pt-150">
                  <Fact label="Method">{requirementMethodLabel(requirement)}</Fact>
                  <Fact label="Success criteria">
                    <span className="font-body font-regular">
                      <Editable.Text
                        label="Success criteria"
                        value={requirement.successCriteria}
                        onChange={(next) =>
                          setRequirementField(requirement.id, { successCriteria: next })
                        }
                        save={(next) =>
                          saveRequirementField(`${requirement.id} success criteria`, next)
                        }
                      />
                    </span>
                  </Fact>
                </Fact.Group>
              </Section>
              <RequirementEvidence programId={programId} requirementId={requirement.id} />
              <TasksSection
                program={programId}
                subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
                me={me}
              />

              <RecordActivity
                program={programId}
                subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
                me={me}
              />
            </>
          ) : null}

          {tab === "Provenance" ? (
            <Section
              title="Provenance"
              action={
                <Button size="small" onClick={() => setLinking(true)}>
                  Link controls
                </Button>
              }
            >
              <ProvenanceTable
                derivations={requirement.derivations}
                programId={programId}
                requirementId={requirement.id}
              />
            </Section>
          ) : null}
        </ShowPage>
        <AllocateElementsSheet
          key={requirement.id}
          open={allocating}
          onClose={() => setAllocating(false)}
          programId={programId}
          requirement={requirement}
        />
        <LinkControlsSheet
          key={`controls-${requirement.id}`}
          open={linking}
          onClose={() => setLinking(false)}
          requirement={requirement}
        />
      </>
    </Shell>
  );
}

/** Compact linked source for the rail. */
function SourceRef({
  derivation,
  programId,
}: {
  derivation: { sourceType: string; sourceId: string };
  programId: string;
  elementId?: string | undefined;
}) {
  const { sourceType, sourceId } = derivation;
  const tone = derivationSourceTone[sourceType as keyof typeof derivationSourceTone];

  if (sourceType === "Control statement" || sourceType === "Overlay") {
    return (
      <TextLink>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: sourceId }}
          search={{ tab: undefined }}
        >
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }
  if (sourceType === "Threat") {
    return (
      <TextLink>
        <Link
          to="/programs/$programId/te-phases"
          params={{ programId }}
          search={{ tab: "Threat scenarios", scenario: sourceId }}
        >
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }
  if (sourceId.startsWith("CMP-")) {
    return (
      <TextLink>
        <Link to="/library/components/$componentKey" params={{ componentKey: sourceId }}>
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }
  if (sourceId.startsWith("WS-")) {
    return (
      <TextLink>
        <Link to="/workstreams/$workstreamId" params={{ workstreamId: sourceId }}>
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }
  return (
    <Badge variant="secondary" size="xsmall" tone={tone}>
      {sourceId}
    </Badge>
  );
}
