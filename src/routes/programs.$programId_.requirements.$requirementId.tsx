import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AllocationTable, ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import {
  Badge,
  Block,
  Button,
  Collapsible,
  Combobox,
  Editable,
  Fact,
  Gates,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  Panel,
  RecordHeader,
  Section,
  Shell as DsShell,
  ShowPage,
  Stack,
  Table,
  Tabs,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { campaignById, eventById, objectiveTone } from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import { useLinkCurrencyVersion } from "@/lib/link-currency";
import { programs } from "@/lib/grc-data";
import {
  linkVerification,
  needsWithVerification,
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
  requirementStateTone,
  requirementStates,
  saveRequirementField,
  setRequirementField,
  useRequirementsVersion,
  verificationMethods,
} from "@/lib/requirements";

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
  validateSearch: (search: Record<string, unknown>): { tab?: RequirementTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    return { tab: requirementTabs.find((t) => t.toLowerCase() === raw.toLowerCase()) };
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
            <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Requirements" }}>
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
  const go = (next: RequirementTab) => navigate({ search: { tab: next }, replace: true });

  return (
    <Shell>
      <>
        <ShowPage
          header={
            <RecordHeader
              back={<Link to="/programs/$programId" params={{ programId }} />}
              id={requirement.id}
              title={requirement.text}
              meta={`${program.acronym} · ${requirement.type} · revision ${requirement.revision}`}
              actions={
                <Editable.Select
                  label="State"
                  options={requirementStates}
                  value={requirement.state}
                  validate={(next) =>
                    next === "Approved" && firstUnmet
                      ? `${firstUnmet.label}: ${firstUnmet.reason}`
                      : null
                  }
                  onChange={(next) => setRequirementField(requirement.id, { state: next })}
                  save={(next) => saveRequirementField(`${requirement.id} state`, next)}
                  render={(v) => <Badge tone={requirementStateTone[v]}>{v}</Badge>}
                />
              }
              facts={
                // The facts you act on, on one line above the fold. Reference
                // joins live in the rail; these do not, because needing to open a
                // panel to find out who owns a requirement is the problem.
                <>
                  <Fact label="Owner">
                    <Editable.Text
                      value={requirement.owner}
                      onChange={(next) => setRequirementField(requirement.id, { owner: next })}
                      save={(next) => saveRequirementField(`${requirement.id} owner`, next)}
                    />
                  </Fact>
                  <Fact label="Method">
                    <Editable.Select
                      label="Verification method"
                      options={verificationMethods}
                      value={requirement.method}
                      onChange={(next) => setRequirementField(requirement.id, { method: next })}
                      save={(next) => saveRequirementField(`${requirement.id} method`, next)}
                    />
                  </Fact>
                  <Fact label="Allocations">{allocations.length || "None"}</Fact>
                  <Fact label="From catalog">
                    {controlSources.length ? (
                      <Inline as="span" space="space.050" shouldWrap>
                        {controlSources.map((d) => (
                          <TextLink key={d.sourceId}>
                            <Link
                              to="/programs/$programId/controls/$controlId"
                              params={{ programId, controlId: d.sourceId }}
                              search={{ tab: undefined }}
                            >
                              <Id>{d.sourceId}</Id>
                            </Link>
                          </TextLink>
                        ))}
                      </Inline>
                    ) : (
                      <span className="text-warning">None</span>
                    )}
                  </Fact>
                </>
              }
            />
          }
          tabs={
            <Tabs>
              {(
                [
                  ["Overview", allocations.length || null],
                  ["Provenance", requirement.derivations.length || null],
                ] as [RequirementTab, number | null][]
              ).map(([key, count]) => (
                <Tabs.Tab
                  key={key}
                  isSelected={tab === key}
                  onClick={() => go(key)}
                  count={count || null}
                >
                  {key}
                </Tabs.Tab>
              ))}
            </Tabs>
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
                title="Allocation"
                action={
                  <Button size="small" onClick={() => setAllocating(true)}>
                    Allocate to…
                  </Button>
                }
              >
                <AllocationTable allocations={allocations} programId={programId} editable />
              </Section>
              <AllocateElementsSheet
                open={allocating}
                onClose={() => setAllocating(false)}
                programId={programId}
                requirement={requirement}
              />

              {children.length > 0 ? (
                <Section title="Decomposed into">
                  <RequirementTable
                    requirements={children}
                    programId={programId}
                    allocationCount={(id) => allocationsFor(id).length}
                  />
                </Section>
              ) : null}

              <Section
                title="Verification"
                action={
                  candidates.length ? (
                    <Combobox
                      aria-label="Link a test objective"
                      value=""
                      onChange={(id) => linkVerification(requirement.id, id, currentSession().name)}
                      options={candidates.map((o) => ({
                        value: o.id,
                        label: `${o.id} · ${o.statement}`,
                      }))}
                      placeholder="Link a test objective…"
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
                        <Table.Header width={120}>Result</Table.Header>
                        <Table.Header width={96}>Evidence</Table.Header>
                      </Table.Row>
                    </thead>
                    <tbody>
                      {objectives.map((o) => {
                        const event = o.event ? eventById.get(o.event) : undefined;
                        const campaign = event ? campaignById.get(event.campaign) : undefined;
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
                                    to="/campaigns/$campaignId"
                                    params={{ campaignId: campaign.id }}
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
                              <Indicator tone={objectiveTone(o.result)}>{o.result}</Indicator>
                            </Table.Cell>
                            <Table.Cell>{o.evidence ? <Id>{o.evidence}</Id> : "—"}</Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : null}
                <Fact.Group className="pt-150">
                  <Fact label="Method">{requirement.method}</Fact>
                  <Fact label="Success criteria">
                    <span className="font-body font-regular">
                      <Editable.Text
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
            </>
          ) : null}

          {tab === "Provenance" ? (
            <Section title="Provenance">
              <ProvenanceTable
                derivations={requirement.derivations}
                programId={programId}
                requirementId={requirement.id}
              />
            </Section>
          ) : null}
        </ShowPage>
        <DsShell.Panel label="Details">
          <DsShell.Panel.Splitter label="Resize details" />
          <Panel flush>
            <Collapsible
              title="Gates"
              count={unmet.length || null}
              defaultOpen
              className="first:border-t-0"
            >
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
            </Collapsible>
            <Inspector.Group title="Derives from">
              {requirement.derivations.map((d) => (
                <KeyValue key={`${d.sourceType}-${d.sourceId}`} label={d.sourceType}>
                  <Stack as="span" space="space.025">
                    <SourceRef derivation={d} programId={programId} />
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
                      search={{ tab: undefined }}
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
                    search={{ tab: "Requirements" }}
                  >
                    <Id>{programId}</Id>
                  </Link>
                </TextLink>
              </KeyValue>
            </Inspector.Group>
          </Panel>
        </DsShell.Panel>
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
    <Badge size="xsmall" tone={tone}>
      {sourceId}
    </Badge>
  );
}
