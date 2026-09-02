import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AllocationTable, ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { InlineSelect, InlineText } from "@/components/app/inline-edit";
import { AllocateModal } from "@/components/app/requirement-forms";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  Id,
  Tabs,
} from "@/components/app/ui";
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
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Requirement not found</h1>
          <p className="max-w-lg text-[13px] text-muted-foreground">
            {requirementId} is not a security requirement of {program.id}.
          </p>
          <Link
            to="/programs/$programId"
            params={{ programId }}
            search={{ tab: "Requirements" }}
            className="text-[13px] text-primary hover:underline"
          >
            Back to security requirements
          </Link>
        </div>
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
            backTo="/programs/$programId"
            backParams={{ programId }}
            id={requirement.id}
            title={requirement.text}
            meta={`${program.acronym} · ${requirement.type} · revision ${requirement.revision}`}
            actions={
              <InlineSelect
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
              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t border-border pt-2.5">
                <Fact label="Owner">
                  <InlineText
                    value={requirement.owner}
                    onChange={(next) => setRequirementField(requirement.id, { owner: next })}
                    save={(next) => saveRequirementField(`${requirement.id} owner`, next)}
                  />
                </Fact>
                <Fact label="Method">
                  <InlineSelect
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
                    <span className="flex flex-wrap gap-1">
                      {controlSources.map((d) => (
                        <Link
                          key={d.sourceId}
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId, controlId: d.sourceId }}
                          search={{ tab: undefined }}
                          className="hover:underline"
                        >
                          <Id className="text-primary">{d.sourceId}</Id>
                        </Link>
                      ))}
                    </span>
                  ) : (
                    <span className="text-warning">None</span>
                  )}
                </Fact>
              </dl>
            }
          />
        }
        tabs={
          <Tabs
            items={(
              [
                ["Overview", allocations.length || null],
                ["Provenance", requirement.derivations.length || null],
              ] as [RequirementTab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key,
              active: tab === key,
              onSelect: () => go(key),
              trailing: count ? (
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {count}
                </span>
              ) : null,
            }))}
          />
        }
        showRail={tab === "Overview"}
        rail={
          <>
            <RailGroup title="Derives from">
              {requirement.derivations.map((d) => (
                <KeyValue key={`${d.sourceType}-${d.sourceId}`} label={d.sourceType}>
                  <span className="flex flex-col gap-0.5">
                    <SourceRef derivation={d} programId={programId} />
                    <span className="text-[11.5px] leading-snug text-muted-foreground">
                      {d.sourceLabel}
                    </span>
                  </span>
                </KeyValue>
              ))}
              <KeyValue label="Rationale">
                <button
                  type="button"
                  onClick={() => go("Provenance")}
                  className="text-primary hover:underline"
                >
                  {requirement.derivations.length} on the Provenance tab
                </button>
              </KeyValue>
            </RailGroup>

            <RailGroup title="Position">
              <KeyValue label="Parent">
                {parent ? (
                  <Link
                    to="/programs/$programId/requirements/$requirementId"
                    params={{ programId, requirementId: parent.id }}
                    search={{ tab: undefined }}
                    className="hover:underline"
                  >
                    <Id className="text-primary">{parent.id}</Id>
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
                    <Id className="text-primary">{requirement.workstream}</Id>
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
                  <Id className="text-primary">{programId}</Id>
                </Link>
              </KeyValue>
            </RailGroup>
          </>
        }
      >
        {tab === "Overview" ? (
          <>
            <Section
              title="Allocation"
              action={
                <Button size="sm" onClick={() => setAllocating(true)}>
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
              <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 pt-3">
                <Fact label="Method">{requirement.method}</Fact>
                <Fact label="Success criteria">
                  <span className="text-[13px] font-normal">
                    <InlineText
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
        <Id className="text-primary">{sourceId}</Id>
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
        <Id className="text-primary">{sourceId}</Id>
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
        <Id className="text-primary">{sourceId}</Id>
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
        <Id className="text-primary">{sourceId}</Id>
      </Link>
    );
  }
  return (
    <Badge size="xs" tone={tone}>
      {sourceId}
    </Badge>
  );
}

/** One label/value pair on a horizontal fact row. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] font-medium">{children}</dd>
    </div>
  );
}
