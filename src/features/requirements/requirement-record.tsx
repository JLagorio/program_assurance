import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import { LinkControlsSheet } from "@/components/app/link-controls";
import { RequirementEvidence } from "@/components/app/program-evidence";
import { RecordActivity } from "@/components/app/record-activity";
import { ProvenanceTable, RequirementTable } from "@/components/app/requirements";
import { TasksSection } from "@/components/app/tasks-section";
import { campaignById, eventById, objectiveTone } from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import { evidenceForTarget, useEvidenceVersion } from "@/lib/evidence-catalog";
import { useLinkCurrencyVersion } from "@/lib/link-currency";
import {
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
  requirementStateTone,
  saveRequirementField,
  setRequirementField,
  useRequirementsVersion,
} from "@/lib/requirements";
import { resolvedObjectiveResult, runById } from "@/lib/test-execution";
import {
  Badge,
  Box,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Editable,
  Gates,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { LinkAssessmentDialog } from "./link-assessment-dialog";
import { RequirementAllocations } from "./requirement-allocations";
import { RequirementEditor } from "./requirement-editor";

import type { RequirementTab } from "./tabs";

type RequirementRecordProps = {
  programId: string;
  requirementId: string;
  elementId?: string | undefined;
  tab: RequirementTab;
  preview?: boolean | undefined;
  onTabChange: (tab: RequirementTab) => void | Promise<unknown>;
  header: (content: { title: string; actions: ReactNode }) => ReactNode;
  properties: (content: ReactNode) => ReactNode;
};

/** Shared domain content and actions; callers supply the page or preview layout. */
export function RequirementRecord({
  programId,
  requirementId,
  elementId,
  tab,
  preview = false,
  onTabChange,
  header,
  properties,
}: RequirementRecordProps) {
  // Store versions keep the record, preview and collection in sync after edits.
  const storeVersion = useRequirementsVersion();
  const verificationVersion = useVerificationVersion();
  const currencyVersion = useLinkCurrencyVersion();
  const [allocating, setAllocating] = useState(false);
  const [linking, setLinking] = useState(false);
  const [showGates, setShowGates] = useState(false);
  const [assessmentLinking, setAssessmentLinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const criteriaRef = useRef<HTMLDivElement>(null);
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

  if (!requirement || requirement.program !== programId) {
    return (
      <Stack space="space.150">
        <h1 className="font-heading-small font-semibold">Requirement not found</h1>
        <p className="max-w-layout-measure font-body text-subtle">
          {requirementId} is not a security requirement of {programId}.
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
  const needs = needsWithVerification(requirement);
  const objectives = objectivesForRequirement(requirement.id);
  const candidates = unlinkedObjectives(requirement.id);
  const go = (next: RequirementTab) =>
    Promise.resolve(onTabChange(next)).then(() => {
      tabRefs.current[next]?.focus();
    });
  const me = currentSession().name;
  const evidence = evidenceForTarget(programId, "requirement", requirement.id);

  return (
    <>
      <Stack space="space.200" className="min-w-0">
        {header({
          title: requirement.text,
          actions: (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="small" iconAfter={<ChevronDown />}>
                    Actions
                  </Button>
                }
              />
              <DropdownMenuContent align="end" style={{ width: 220 }}>
                {preview ? (
                  <DropdownMenuLinkItem
                    closeOnClick
                    render={
                      <Link
                        to="/programs/$programId/requirements/$requirementId"
                        params={{ programId, requirementId }}
                        search={{ tab, element: elementId }}
                      />
                    }
                  >
                    Open requirement
                  </DropdownMenuLinkItem>
                ) : null}
                <DropdownMenuItem onClick={() => setEditing(true)}>Edit details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAllocating(true)}>Allocate</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinking(true)}>Link controls</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssessmentLinking(true)}>
                  Link assessment objective
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        })}
        <Tabs value={tab} onValueChange={(value) => go(value as typeof tab)} className="gap-150">
          <TabsList className="w-full justify-start" variant="line" aria-label="Requirement work">
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
          <TabsContent value="Overview" keepMounted>
            <Stack space="space.300" className="min-w-0 pt-200">
              {needs.length ? (
                <Card className="gap-0 overflow-hidden" role="region" aria-label="Needs attention">
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
                            else if (need.key === "criterion")
                              criteriaRef.current?.querySelector("button")?.click();
                            else if (need.key === "quality") {
                              setShowGates(true);
                              checksRef.current?.focus();
                            } else if (need.key === "verify") setAssessmentLinking(true);
                            else void go("Allocations");
                          }}
                        >
                          {need.key === "allocate"
                            ? "Allocate"
                            : need.key === "criterion"
                              ? "Add criteria"
                              : need.key === "quality"
                                ? "View checks"
                                : need.key === "verify"
                                  ? "Link assessment"
                                  : "Review allocations"}
                        </Button>
                        {need.key === "review" ? (
                          <Button size="small" variant="subtle" onClick={() => go("Provenance")}>
                            Review sources
                          </Button>
                        ) : null}
                      </Inline>
                    </Stack>
                  ))}
                </Card>
              ) : null}
              <Section title="Success criteria">
                <div ref={criteriaRef} className="pt-100">
                  <p className="mb-100 font-body-small text-subtle">
                    Assessment method: {requirementMethodLabel(requirement)}
                  </p>
                  <Editable.Text
                    label="Success criteria"
                    multiline
                    value={requirement.successCriteria}
                    placeholder="Add success criteria"
                    validate={(value) => (value.trim() ? null : "Describe the success criteria.")}
                    onChange={(successCriteria) =>
                      setRequirementField(requirement.id, { successCriteria })
                    }
                    save={(value) => saveRequirementField(requirement.id, value)}
                  />
                </div>
              </Section>
              <Section
                title="Assessment objectives"
                count={objectives.length || null}
                action={
                  <Button size="small" onClick={() => setAssessmentLinking(true)}>
                    Link objective
                  </Button>
                }
              >
                <div className="divide-y divide-default pt-100">
                  {objectives.map((objective) => {
                    const event = objective.event ? eventById.get(objective.event) : undefined;
                    const campaign = event ? campaignById.get(event.campaign) : undefined;
                    const result = resolvedObjectiveResult(objective.id);
                    const assessedNodes = result.run ? runById(result.run)?.nodes : objective.nodes;
                    const collected = objectiveEvidence(objective.id);
                    return (
                      <article key={objective.id} className="min-w-0 py-150">
                        <Inline space="space.100" alignBlock="center" spread="space-between">
                          <Id className="font-body-small text-subtle">{objective.id}</Id>
                          <Badge variant="secondary" tone={objectiveTone(result.result)}>
                            {result.result}
                          </Badge>
                        </Inline>
                        <p className="whitespace-normal break-words pt-075 font-body">
                          {objective.statement}
                        </p>
                        {event && campaign ? (
                          <TextLink
                            className="mt-100 whitespace-normal break-words text-start"
                            render={
                              <Link
                                to="/programs/$programId"
                                params={{ programId }}
                                search={{
                                  tab: "Assessments",
                                  assessmentId: campaign.id,
                                  element: elementId,
                                }}
                              />
                            }
                          >
                            {event.name}
                          </TextLink>
                        ) : (
                          <p className="pt-100 font-body-small text-subtle">No assessment event</p>
                        )}
                        <p className="pt-050 font-body-small text-subtle">
                          {collected.length} evidence item{collected.length === 1 ? "" : "s"}
                          {assessedNodes?.length
                            ? ` across ${assessedNodes.length} element${assessedNodes.length === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      </article>
                    );
                  })}
                  {!objectives.length ? (
                    <div className="py-200">
                      <p className="font-body text-subtle">No assessment objectives linked.</p>
                      <p className="pt-050 font-body-small text-subtle">
                        Link an objective to track how this requirement is verified.
                      </p>
                    </div>
                  ) : null}
                </div>
              </Section>
              <TasksSection
                program={programId}
                subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
                me={me}
              />
            </Stack>
          </TabsContent>
          <TabsContent value="Allocations" keepMounted>
            <Stack space="space.300" className="min-w-0 pt-200">
              <Section
                title="Allocated to"
                action={
                  <Button size="small" onClick={() => setAllocating(true)}>
                    Allocate
                  </Button>
                }
              >
                <RequirementAllocations allocations={allocations} programId={programId} />
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
            </Stack>
          </TabsContent>
          <TabsContent value="Evidence" keepMounted>
            <Section title="Supporting evidence" count={evidence.length}>
              <Box paddingBlockStart="space.150">
                <RequirementEvidence programId={programId} requirementId={requirement.id} />
              </Box>
            </Section>
          </TabsContent>
          <TabsContent value="Activity" keepMounted>
            <RecordActivity
              program={programId}
              subject={{ kind: "requirement", id: requirement.id, label: requirement.text }}
              me={me}
              filters
            />
          </TabsContent>
          <TabsContent value="Provenance" keepMounted>
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
          </TabsContent>
          {properties(
            tab === "Overview" ? (
              <>
                <Inspector.Group
                  title="Details"
                  action={
                    <Button size="small" onClick={() => setEditing(true)}>
                      Edit details
                    </Button>
                  }
                >
                  <KeyValue label="Status">
                    <Badge variant="secondary" tone={requirementStateTone[requirement.state]}>
                      {requirement.state}
                    </Badge>
                  </KeyValue>
                  <KeyValue label="Owner">{requirement.owner || "Unassigned"}</KeyValue>
                  <KeyValue label="Method">{requirementMethodLabel(requirement)}</KeyValue>
                  <KeyValue label="Type">{requirement.type}</KeyValue>
                  <KeyValue label="Revision">{requirement.revision}</KeyValue>
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
                                search={{ tab: undefined, element: elementId }}
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
            ) : null,
          )}
        </Tabs>
      </Stack>
      {editing ? (
        <RequirementEditor requirement={requirement} onClose={() => setEditing(false)} />
      ) : null}
      {assessmentLinking ? (
        <LinkAssessmentDialog
          requirementId={requirement.id}
          onClose={() => setAssessmentLinking(false)}
        />
      ) : null}
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
