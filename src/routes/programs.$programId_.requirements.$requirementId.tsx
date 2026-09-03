import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AllocationTable, ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { AllocateModal } from "@/components/app/requirement-forms";
import {
  Badge,
  Button,
  Editable,
  Fact,
  Id,
  Inline,
  Inspector,
  KeyValue,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Tabs,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { programs } from "@/lib/grc-data";
import {
  allocationsFor,
  ancestorsOfRequirement,
  childrenOfRequirement,
  derivationSourceTone,
  getRequirement,
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
          <Link
            to="/programs/$programId"
            params={{ programId }}
            search={{ tab: "Requirements" }}
            className="font-body text-brand hover:underline"
          >
            Back to security requirements
          </Link>
        </Stack>
      </Shell>
    );
  }

  const controlSources = requirement.derivations.filter(
    (d) => d.sourceType === "Control statement" || d.sourceType === "Overlay",
  );
  const go = (next: RequirementTab) => navigate({ search: { tab: next }, replace: true });

  return (
    <Shell>
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
                onChange={(next) => setRequirementField(requirement.id, { state: next })}
                save={(next) => saveRequirementField(`${requirement.id} state`, next)}
                render={(v) => <Badge tone={requirementStateTone[v]}>{v}</Badge>}
              />
            }
            below={
              // The facts you act on, on one line above the fold. Reference
              // joins live in the rail; these do not, because needing to open a
              // panel to find out who owns a requirement is the problem.
              <dl className="flex flex-wrap items-baseline gap-x-300 gap-y-075 border-t border-default pt-100">
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
                        <Link
                          key={d.sourceId}
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId, controlId: d.sourceId }}
                          search={{ tab: undefined }}
                          className="hover:underline"
                        >
                          <Id className="text-brand">{d.sourceId}</Id>
                        </Link>
                      ))}
                    </Inline>
                  ) : (
                    <span className="text-warning">None</span>
                  )}
                </Fact>
              </dl>
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
        showRail={tab === "Overview"}
        rail={
          <>
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
                <button
                  type="button"
                  onClick={() => go("Provenance")}
                  className="text-brand hover:underline"
                >
                  {requirement.derivations.length} on the Provenance tab
                </button>
              </KeyValue>
            </Inspector.Group>

            <Inspector.Group title="Position">
              <KeyValue label="Parent">
                {parent ? (
                  <Link
                    to="/programs/$programId/requirements/$requirementId"
                    params={{ programId, requirementId: parent.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Id className="text-brand">{parent.id}</Id>
                  </Link>
                ) : (
                  "Top level"
                )}
              </KeyValue>
              <KeyValue label="Children">{children.length || "None"}</KeyValue>
              <KeyValue label="Revision">{requirement.revision}</KeyValue>
              <KeyValue label="Workstream">
                {requirement.workstream ? (
                  <Link
                    to="/workstreams/$workstreamId"
                    params={{ workstreamId: requirement.workstream }}
                    className="hover:underline"
                  >
                    <Id className="text-brand">{requirement.workstream}</Id>
                  </Link>
                ) : (
                  "—"
                )}
              </KeyValue>
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={{ tab: "Requirements" }}
                  className="hover:underline"
                >
                  <Id className="text-brand">{programId}</Id>
                </Link>
              </KeyValue>
            </Inspector.Group>
          </>
        }
      >
        {tab === "Overview" ? (
          <>
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
            <AllocateModal
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

            <Section title="Verification">
              <dl className="flex flex-wrap items-baseline gap-x-300 gap-y-075 pt-150">
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
              </dl>
            </Section>
          </>
        ) : null}

        {tab === "Provenance" ? (
          <Section title="Provenance">
            <ProvenanceTable derivations={requirement.derivations} programId={programId} />
          </Section>
        ) : null}
      </ShowPage>
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
      <Link
        to="/programs/$programId/controls/$controlId"
        params={{ programId, controlId: sourceId }}
        search={{ tab: undefined }}
        className="hover:underline"
      >
        <Id className="text-brand">{sourceId}</Id>
      </Link>
    );
  }
  if (sourceType === "Threat") {
    return (
      <Link
        to="/programs/$programId/te-phases"
        params={{ programId }}
        search={{ tab: "Threat scenarios", scenario: sourceId }}
        className="hover:underline"
      >
        <Id className="text-brand">{sourceId}</Id>
      </Link>
    );
  }
  if (sourceId.startsWith("CMP-")) {
    return (
      <Link
        to="/library/components/$componentKey"
        params={{ componentKey: sourceId }}
        className="hover:underline"
      >
        <Id className="text-brand">{sourceId}</Id>
      </Link>
    );
  }
  if (sourceId.startsWith("WS-")) {
    return (
      <Link
        to="/workstreams/$workstreamId"
        params={{ workstreamId: sourceId }}
        className="hover:underline"
      >
        <Id className="text-brand">{sourceId}</Id>
      </Link>
    );
  }
  return (
    <Badge size="xsmall" tone={tone}>
      {sourceId}
    </Badge>
  );
}
