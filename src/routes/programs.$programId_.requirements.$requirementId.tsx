import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import { LinkControlsSheet } from "@/components/app/link-controls";
import { RequirementEvidence } from "@/components/app/program-evidence";
import { RecordActivity } from "@/components/app/record-activity";
import { AllocationTable, ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { TasksSection } from "@/components/app/tasks-section";
import { campaignById, eventById, objectiveTone } from "@/lib/campaigns";
import { nodeById } from "@/lib/composition";
import { currentSession } from "@/lib/control-work";
import { evidenceForTarget, useEvidenceVersion } from "@/lib/evidence-catalog";
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
import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Count,
  Editable,
  Gates,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ClipboardCheck, FileText, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";

// Keep each work surface directly addressable; Overview retains existing record links.
const requirementTabs = ["Overview", "Allocations", "Evidence", "Activity", "Provenance"] as const;
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
  const [showGates, setShowGates] = useState(false);
  const assessmentRef = useRef<HTMLInputElement>(null);
  const checksRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Partial<Record<RequirementTab, HTMLButtonElement | null>>>({});
  useEvidenceVersion();
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
      <Stack space="space.150">
        <h1 className="font-heading-small font-semibold">Requirement not found</h1>
        <p className="max-w-layout-measure font-body text-subtle">
          {requirementId} is not a security requirement of {program.id}.
        </p>
        <TextLink
          size="medium"
          render={
            <Link
              to="/programs/$programId"
              params={{ programId }}
              search={{ tab: "Requirements", element: elementId }}
            />
          }
        >
          Back to security requirements
        </TextLink>
      </Stack>
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
    navigate({ search: { tab: next, element: elementId }, replace: true }).then(() => {
      tabRefs.current[next]?.focus();
    });
  const me = currentSession().name;
  const evidence = evidenceForTarget(programId, "requirement", requirement.id);

  const choiceItems = candidates.map((o) => ({
    value: o.id,
    label: `${o.id} · ${o.statement}`,
  }));
  return (
    <>
      <Stack space="space.200" className="min-w-0">
        <PageHeader>
          <Breadcrumb className="col-span-full">
            <BreadcrumbList>
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
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Id>{requirement.id}</Id>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="min-w-0">
            <PageHeader.Title>{requirement.text}</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            <Inline space="space.100" alignBlock="center">
              <Button size="small" variant="primary" onClick={() => setAllocating(true)}>
                Allocate
              </Button>
              <Button size="small" onClick={() => setLinking(true)}>
                Link controls
              </Button>
            </Inline>
          </PageHeader.Actions>
          <div className="col-span-full">
            <Inline
              space="space.300"
              rowSpace="space.100"
              alignBlock="center"
              shouldWrap
              className="pb-050"
            >
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
              <Inline space="space.075" alignBlock="center" className="font-body-small">
                <UserRound aria-hidden className="size-icon-small text-subtle" />
                <Editable.Text
                  label="Owner"
                  value={requirement.owner}
                  onChange={(next) => setRequirementField(requirement.id, { owner: next })}
                  save={(next) => saveRequirementField(`${requirement.id} owner`, next)}
                />
              </Inline>
              <span className="font-body-small text-subtle">
                {requirement.type} · r{requirement.revision}
              </span>
            </Inline>
          </div>
        </PageHeader>
        <Tabs value={tab} onValueChange={(value) => go(value as typeof tab)} className="gap-150">
          <TabsList className="w-full justify-start" variant="line" activateOnFocus>
            {(
              [
                ["Overview", null],
                ["Allocations", allocations.length || null],
                ["Evidence", evidence.length || null],
                ["Activity", null],
                ["Provenance", requirement.derivations.length || null],
              ] as [RequirementTab, number | null][]
            ).map(([key, count]) => (
              <TabsTrigger
                key={key}
                value={key}
                ref={(node) => {
                  tabRefs.current[key] = node;
                }}
              >
                {key}
                {count ? <Count value={count} max={9999} /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab}>
            <Stack space="space.300" className="min-w-0 pt-200">
              {tab === "Overview" ? (
                <>
                  {needs.length ? (
                    <Card
                      className="gap-0 overflow-hidden"
                      role="region"
                      aria-label="Needs attention"
                    >
                      <Inline
                        space="space.100"
                        alignBlock="center"
                        className="border-b border-default px-200 py-100"
                      >
                        <h2 className="font-body font-semibold">Needs attention</h2>
                        <Count value={needs.length} />
                      </Inline>
                      {needs.map((need) => (
                        <Stack
                          key={need.key}
                          space="space.150"
                          className="border-b border-default px-200 py-150 last:border-b-0"
                        >
                          <Inline space="space.100" alignBlock="baseline">
                            <span
                              className="size-075 shrink-0 rounded-full bg-warning-bold"
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-body font-medium">{need.label}</p>
                              <p className="font-body-small text-subtle">{need.reason}</p>
                            </div>
                          </Inline>
                          <Inline space="space.100" shouldWrap>
                            <Button
                              size="small"
                              iconAfter={<ArrowRight />}
                              disabled={need.key === "verify" && candidates.length === 0}
                              onClick={() => {
                                if (need.key === "allocate") setAllocating(true);
                                else if (need.key === "quality" || need.key === "criterion") {
                                  setShowGates(true);
                                  checksRef.current?.focus();
                                } else if (need.key === "verify") assessmentRef.current?.focus();
                                else void go("Allocations");
                              }}
                            >
                              {need.key === "allocate"
                                ? "Allocate"
                                : need.key === "quality" || need.key === "criterion"
                                  ? "View checks"
                                  : need.key === "verify"
                                    ? "Link assessment"
                                    : "Review allocations"}
                            </Button>
                            {need.key === "review" ? (
                              <Button
                                size="small"
                                variant="subtle"
                                onClick={() => go("Provenance")}
                              >
                                Review sources
                              </Button>
                            ) : null}
                          </Inline>
                        </Stack>
                      ))}
                    </Card>
                  ) : null}
                  <Stack as="section" space="space.150">
                    <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
                      <h2 className="font-body font-medium">Assessment result</h2>
                      {candidates.length ? (
                        <div style={{ width: 260, maxWidth: "100%" }}>
                          <Combobox<(typeof choiceItems)[number]>
                            items={choiceItems}
                            isItemEqualToValue={(item, selected) => item.value === selected.value}
                            filter={(item, query) =>
                              [item.label, item.value, "keywords" in item ? item.keywords : ""]
                                .join(" ")
                                .toLocaleLowerCase()
                                .includes(query.toLocaleLowerCase())
                            }
                            value={choiceItems.find((item) => item.value === "") ?? null}
                            onValueChange={(item) => {
                              const id = item?.value ?? "";
                              return linkVerification(requirement.id, id, currentSession().name);
                            }}
                          >
                            <ComboboxInput
                              ref={assessmentRef}
                              aria-label="Link an assessment objective"
                              placeholder="Link an assessment objective…"
                            />
                            <ComboboxContent>
                              <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                              <ComboboxList>
                                {(item) => (
                                  <ComboboxItem
                                    key={item.value}
                                    value={item}
                                    disabled={"disabled" in item && Boolean(item.disabled)}
                                  >
                                    <span className="min-w-0 flex-1">{item.label}</span>
                                    {"meta" in item && item.meta ? (
                                      <span className="text-subtle font-body-small">
                                        {String(item.meta)}
                                      </span>
                                    ) : null}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                      ) : null}
                    </Inline>
                    <Stack space="space.100">
                      {objectives.map((objective) => {
                        const event = objective.event ? eventById.get(objective.event) : undefined;
                        const campaign = event ? campaignById.get(event.campaign) : undefined;
                        const result = resolvedObjectiveResult(objective.id);
                        const assessedNodes = result.run
                          ? runById(result.run)?.nodes
                          : objective.nodes;
                        const collected = objectiveEvidence(objective.id);
                        return (
                          <Card key={objective.id} className="gap-100 p-150">
                            <Inline space="space.100" alignBlock="start">
                              <ClipboardCheck
                                aria-hidden
                                className="size-icon-medium shrink-0 text-subtle"
                              />
                              <div className="min-w-0 flex-1">
                                <Inline
                                  space="space.100"
                                  alignBlock="center"
                                  spread="space-between"
                                  shouldWrap
                                >
                                  <Id className="font-body-small text-subtle">{objective.id}</Id>
                                  <Indicator tone={objectiveTone(result.result)}>
                                    {result.result}
                                  </Indicator>
                                </Inline>
                                <Text as="p" className="pt-050">
                                  {objective.statement}
                                </Text>
                              </div>
                            </Inline>
                            <Inline
                              space="space.100"
                              alignBlock="center"
                              spread="space-between"
                              shouldWrap
                              className="border-t border-default pt-100"
                            >
                              {event && campaign ? (
                                <TextLink
                                  render={
                                    <Link
                                      to="/programs/$programId"
                                      params={{ programId }}
                                      search={{ tab: "Assessments", assessmentId: campaign.id }}
                                      title={event.window}
                                    />
                                  }
                                >
                                  {event.name}
                                </TextLink>
                              ) : (
                                <span className="font-body-small text-subtle">
                                  No assessment event
                                </span>
                              )}
                              <Inline
                                as="span"
                                space="space.050"
                                alignBlock="center"
                                className="font-body-small text-subtle"
                              >
                                <FileText aria-hidden className="size-icon-small" />
                                {collected.length} evidence
                              </Inline>
                            </Inline>
                            {assessedNodes?.length ? (
                              <Text as="p" size="small" color="color.text.subtle">
                                {assessedNodes.map((id) => nodeById.get(id)?.name ?? id).join(", ")}
                              </Text>
                            ) : null}
                            {collected.length ? <Id.List ids={collected} /> : null}
                          </Card>
                        );
                      })}
                      {!objectives.length ? (
                        <Inline
                          space="space.150"
                          alignBlock="center"
                          className="rounded-medium border border-dashed border-default p-200"
                        >
                          <ClipboardCheck aria-hidden className="size-icon-medium text-subtle" />
                          <div>
                            <p className="font-body font-medium">No assessment linked</p>
                            <p className="font-body-small text-subtle">
                              Choose an objective to track its result here.
                            </p>
                          </div>
                        </Inline>
                      ) : null}
                    </Stack>
                    <div>
                      <p className="pb-050 font-body-small font-medium text-subtle">
                        Success criteria · {requirementMethodLabel(requirement)}
                      </p>
                      <div className="font-body">
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
                      </div>
                    </div>
                  </Stack>
                  <TasksSection
                    program={programId}
                    subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
                    me={me}
                  />
                </>
              ) : null}
              {tab === "Allocations" ? (
                <>
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
                </>
              ) : null}
              <div hidden={tab !== "Evidence"}>
                <Section title="Supporting evidence" count={evidence.length}>
                  <Box paddingBlockStart="space.150">
                    <RequirementEvidence programId={programId} requirementId={requirement.id} />
                  </Box>
                </Section>
              </div>
              <div hidden={tab !== "Activity"}>
                <RecordActivity
                  program={programId}
                  subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
                  me={me}
                  filters
                />
              </div>
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
            </Stack>
          </TabsContent>
          <Shell.Aside label="Record properties">
            {tab === "Overview" ? (
              <>
                <Inspector.Group title="Details">
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
                          <TextLink
                            key={d.sourceId}
                            render={
                              <Link
                                to="/programs/$programId/controls/$controlId"
                                params={{ programId, controlId: d.sourceId }}
                                search={{ tab: undefined }}
                              />
                            }
                          >
                            <span className="text-subtle">
                              {d.relation === "mapped" ? "Mapped to " : "Derived from "}
                            </span>
                            <Id>{d.sourceId}</Id>
                          </TextLink>
                        ))}
                      </Inline>
                    ) : (
                      <span className="text-subtle">Independent</span>
                    )}
                  </KeyValue>
                </Inspector.Group>
                <Collapsible
                  open={showGates}
                  onOpenChange={setShowGates}
                  className="border-t border-default first:border-t-0"
                >
                  <h3>
                    <CollapsibleTrigger
                      ref={checksRef}
                      className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered"
                    >
                      Approval checks
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
                <Inspector.Group title="Position">
                  <KeyValue label="Parent">
                    {parent ? (
                      <TextLink
                        render={
                          <Link
                            to="/programs/$programId/requirements/$requirementId"
                            params={{ programId, requirementId: parent.id }}
                            search={{ tab: undefined, element: elementId }}
                          />
                        }
                      >
                        <Id>{parent.id}</Id>
                      </TextLink>
                    ) : (
                      "Top level"
                    )}
                  </KeyValue>
                  <KeyValue label="Children">{children.length || "None"}</KeyValue>
                  <KeyValue label="Workstream">
                    {requirement.workstream ? (
                      <TextLink
                        render={
                          <Link
                            to="/workstreams/$workstreamId"
                            params={{ workstreamId: requirement.workstream }}
                          />
                        }
                      >
                        <Id>{requirement.workstream}</Id>
                      </TextLink>
                    ) : (
                      "—"
                    )}
                  </KeyValue>
                  <KeyValue label="Program">
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId"
                          params={{ programId }}
                          search={{ tab: "Requirements", element: elementId }}
                        />
                      }
                    >
                      <Id>{programId}</Id>
                    </TextLink>
                  </KeyValue>
                </Inspector.Group>
              </>
            ) : null}
          </Shell.Aside>
        </Tabs>
      </Stack>
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
  );
}
