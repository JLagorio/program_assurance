import {
  MethodList,
  ObjectiveList,
  ParameterTable,
  ReferenceList,
  StatementList,
} from "@/components/app/control-text";
import {
  ControlActions,
  Determination,
  EvidenceBlock,
  Narrative,
} from "@/components/app/control-work";
import { LibraryControlSources } from "@/components/app/library-control-sources";
import { MapRequirementsSheet } from "@/components/app/map-requirements";
import { RecordActivity } from "@/components/app/record-activity";
import { ControlRequirementTable } from "@/components/app/requirements";
import { TasksSection } from "@/components/app/tasks-section";
import { librarySourcesForScope, useLibraryVersion } from "@/lib/assurance-library";
import { controlDetail } from "@/lib/control-detail";
import { controlEvidence } from "@/lib/control-evidence";
import { useControlMatrix } from "@/lib/control-matrix";
import {
  assessmentTone,
  assignOwner,
  currentSession,
  gatesFor,
  implementationTone,
  preferredScope,
  useWorkVersion,
  workFor,
  type GateKey,
} from "@/lib/control-work";
import { isOpen } from "@/lib/findings";
import { catalogVersion } from "@/lib/nist-catalog";
import { mentionablePeople } from "@/lib/people";
import {
  controlAllocationCount,
  controlRequirementsInElement,
  programControlRows,
} from "@/lib/program-controls";
import { resolveProgramElement } from "@/lib/program-scope";
import { useRequirementsVersion } from "@/lib/requirements";
import { controlSetFor, scopesForProgram } from "@/lib/scopes";
import { severityTone } from "@/lib/spine";
import { askFor, createTask, gateTaskFor, resolveGateTasks, useTasksVersion } from "@/lib/tasks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Box,
  Button,
  buttonVariants,
  Count,
  DropdownMenuLinkItem,
  DropdownMenuItem,
  Editable,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  Person,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { NewRequirementModal } from "@/components/app/requirement-forms";
import type { NistControlText } from "@/lib/nist-catalog";
import { controlTabs, type ControlTab } from "./tabs";

const gateTabs: Record<Exclude<GateKey, "owner">, ControlTab> = {
  narrative: "Implementation",
  contributor: "Requirements",
  evidence: "Evidence",
  determination: "Assessment",
};

type ControlRecordProps = {
  programId: string;
  controlId: string;
  elementId?: string | undefined;
  tab: ControlTab;
  onTabChange: (tab: ControlTab) => void | Promise<unknown>;
  header: (content: { title: string; actions: ReactNode }) => ReactNode;
  properties: (content: ReactNode) => ReactNode;
  text: NistControlText | null;
  scopeId?: string | undefined;
  scopeIds?: readonly string[] | undefined;
  preview?: boolean | undefined;
  onScopeChange: (scopeId: string) => void;
};

/** Shared domain content and actions; callers supply the page or preview layout. */
export function ControlRecord({
  programId,
  controlId,
  text,
  scopeId: requestedScope,
  scopeIds,
  preview = false,
  elementId: requestedElement,
  tab,
  onTabChange,
  onScopeChange,
  header,
  properties,
}: ControlRecordProps) {
  const rows = useControlMatrix(programId);

  const workVersion = useWorkVersion();
  const requirementsVersion = useRequirementsVersion();
  const libraryVersion = useLibraryVersion();
  useTasksVersion();
  const scopes = useMemo(() => scopesForProgram(programId), [programId, rows, libraryVersion]);
  const navigate = useNavigate();
  const tabRefs = useRef<Partial<Record<ControlTab, HTMLButtonElement | null>>>({});
  const [pendingAction, setPendingAction] = useState<{
    tab: ControlTab;
    editor?: "narrative" | "evidence" | undefined;
  } | null>(null);
  const setTab = onTabChange;
  const openWork = (tab: ControlTab, editor?: "narrative" | "evidence") => {
    setPendingAction({ tab, editor });
    setTab(tab);
  };
  const scopeId =
    (scopes.some((scope) => scope.id === requestedScope) ? requestedScope : undefined) ??
    preferredScope(
      programId,
      controlId,
      scopes.map((scope) => scope.id),
    ) ??
    "";
  // Program navigation retains its origin; the scope independently selects the work record.
  const originElementId = resolveProgramElement(programId, requestedElement)?.id;
  const scope = scopes.find((item) => item.id === scopeId);
  const elementId = scope?.element;
  const set = scope ? controlSetFor(scope.id) : null;
  const selection = set?.controls.find((item) => item.control.id === controlId);
  const applies = !!selection;
  const scopedRow = selection
    ? programControlRows(programId, elementId).find((control) => control.id === controlId)
    : undefined;
  const row = scopedRow ? { ...scopedRow.record, findings: scopedRow.findings } : undefined;
  const [, tick] = useState(0);
  const refresh = () => tick((n) => n + 1);
  const [mapping, setMapping] = useState(false);
  const [deriving, setDeriving] = useState(false);
  const narrativeEditRef = useRef<HTMLButtonElement>(null);
  const evidenceLinkRef = useRef<HTMLButtonElement>(null);
  // Start an editor after its panel is visible, so focus can enter it.
  useEffect(() => {
    if (!pendingAction || pendingAction.tab !== tab) return;
    tabRefs.current[tab]?.focus();
    if (pendingAction.editor === "narrative") narrativeEditRef.current?.click();
    if (pendingAction.editor === "evidence") evidenceLinkRef.current?.click();
    setPendingAction(null);
  }, [pendingAction, tab]);
  const session = currentSession();
  const me = session.name;

  const work = useMemo(
    () => (scopeId && applies ? workFor(programId, scopeId, controlId) : null),
    [programId, scopeId, controlId, applies, workVersion],
  );
  const derived = useMemo(
    () => controlRequirementsInElement(programId, controlId, elementId),
    [controlId, programId, elementId, requirementsVersion],
  );
  const librarySources = useMemo(
    () => (elementId ? librarySourcesForScope(programId, elementId, controlId) : []),
    [programId, elementId, controlId, libraryVersion],
  );
  const context = useMemo(() => {
    const allocated = derived.reduce(
      (n, r) => n + controlAllocationCount(programId, r.id, elementId),
      0,
    );
    const confirmed = librarySources.filter((source) => source.decision === "Confirmed").length;
    const contributors = [
      allocated ? `${derived.length} requirements, ${allocated} allocations` : "",
      confirmed ? `${confirmed} confirmed library source${confirmed === 1 ? "" : "s"}` : "",
    ].filter(Boolean);
    return {
      contributors: allocated + confirmed,
      contributorDetail: contributors.join(" · ") || "No allocated requirement",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived, workVersion, programId, elementId, librarySources]);

  const inScope = useMemo(() => {
    const ids = new Set(controlSetFor(scopeId)?.controls.map((row) => row.control.id) ?? []);
    return (id: string) => ids.has(id);
  }, [rows, scopeId]);

  const gates = useMemo(() => (work ? gatesFor(work, context) : []), [work, context, workVersion]);

  // Tasks born from a gate close by artifact: the gate is met, so the ask is done.
  useEffect(() => {
    if (scopeId && work) resolveGateTasks(scopeId, controlId, gates);
  }, [scopeId, controlId, gates, work]);

  if (!row || !work) {
    return (
      <Stack space="space.150">
        <h1 className="font-heading-small font-semibold">Control not in scope</h1>
        <TextLink
          size="medium"
          render={
            <Link
              to="/programs/$programId"
              params={{ programId }}
              search={{ tab: "Controls", element: originElementId }}
            />
          }
        >
          Back to controls
        </TextLink>
      </Stack>
    );
  }

  const detail = controlDetail(row, text, inScope);
  const open = row.findings.filter(isOpen);
  const subject = { kind: "control" as const, id: controlId, label: row.fullTitle };
  const unmet = gates.filter((g) => !g.met);
  const people = mentionablePeople(programId).map((p) => p.name);
  const ownerOptions = [...new Set([...(work.owner ? [work.owner] : []), me, ...people])];

  const scopeIdItems = scopes
    .filter(
      (scope) =>
        (!scopeIds || scopeIds.includes(scope.id)) &&
        controlSetFor(scope.id)?.controls.some((row) => row.control.id === controlId),
    )
    .map((scope) => ({ value: scope.id, label: scope.name }));
  const rail = (
    <>
      <Inspector.Group title="Details">
        <KeyValue label="Owner">
          <Editable.Select
            label="Owner"
            value={work.owner ?? "Unassigned"}
            options={work.owner ? ownerOptions : ["Unassigned", ...ownerOptions]}
            onChange={(next) => {
              if (next !== "Unassigned") assignOwner(work.id, next);
              refresh();
            }}
            save={() => Promise.resolve()}
            render={(v) =>
              v === "Unassigned" ? (
                <span className="text-subtlest">Unassigned</span>
              ) : (
                <Person name={v} />
              )
            }
          />
        </KeyValue>
        <KeyValue label="Implementation">
          <Badge size="xsmall" tone={implementationTone[work.implementation]}>
            {work.implementationRecorded === false ? "Unrecorded" : work.implementation}
          </Badge>
        </KeyValue>
        <KeyValue label="Assessment">
          <Badge size="xsmall" tone={assessmentTone[work.assessment]}>
            {work.assessment}
          </Badge>
        </KeyValue>
        <KeyValue label="Origination">{row.implementation}</KeyValue>
        <KeyValue label="Family">{`${row.family} · ${row.familyName}`}</KeyValue>
        <KeyValue label="Selected by">
          {selection?.selectedBy.length
            ? selection.selectedBy.join(" · ")
            : (selection?.source ?? "—")}
        </KeyValue>
        <KeyValue label="Baselines">{row.baselines.join(", ") || "Tailored in"}</KeyValue>
        <KeyValue label="Statement">
          {work.narrativeRevision ? `r${work.narrativeRevision}` : "Not written"}
        </KeyValue>
        <KeyValue label="Catalog">{catalogVersion}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Linked">
        <KeyValue label="Findings">
          {open.length ? (
            <Badge variant="secondary" size="xsmall" tone="danger">
              {open.length} open
            </Badge>
          ) : (
            "None"
          )}
        </KeyValue>
        <KeyValue label="POA&M">
          {row.poam ? (
            <TextLink
              render={
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={{ tab: "POA&M", poamId: row.poam, element: originElementId }}
                />
              }
            >
              <Id>{row.poam}</Id>
            </TextLink>
          ) : (
            "None"
          )}
        </KeyValue>
        <KeyValue label="Requirements">{derived.length || "None"}</KeyValue>
        <KeyValue label="Implementation evidence">{work.evidence.length || "None"}</KeyValue>
      </Inspector.Group>
    </>
  );

  return (
    <>
      <Stack space="space.200" className="min-w-0">
        {header({
          title: row.fullTitle,
          actions: (
            <ControlActions
              work={work}
              context={context}
              onChange={refresh}
              menuOnly
              extra={
                <>
                  {preview ? (
                    <DropdownMenuLinkItem
                      closeOnClick
                      render={
                        <Link
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId, controlId }}
                          search={{ scope: scopeId, element: originElementId, tab }}
                        />
                      }
                    >
                      Open control
                    </DropdownMenuLinkItem>
                  ) : null}
                  {unmet[0] ? (
                    <DropdownMenuItem
                      onClick={() => {
                        const gate = unmet[0]!;
                        if (!gateTaskFor(scopeId, controlId, gate.key)) {
                          createTask({
                            program: programId,
                            title: askFor(gate.key),
                            subject,
                            assignee: work.owner ?? me,
                            requester: me,
                            gate: { scope: scopeId, control: controlId, key: gate.key },
                          });
                        }
                        openWork("Tasks");
                      }}
                    >
                      {gateTaskFor(scopeId, controlId, unmet[0].key) ? "View task" : "Create task"}
                    </DropdownMenuItem>
                  ) : null}
                </>
              }
            />
          ),
        })}
        <Inline space="space.075" alignBlock="center">
          <span className="font-body-small text-subtle">Scope</span>
          <Select<string>
            items={scopeIdItems}
            value={scopeId}
            onValueChange={(value) => {
              if (value === null) return;
              onScopeChange(value);
            }}
          >
            <SelectTrigger
              className="max-w-full font-body-small"
              size="sm"
              aria-label="Assessment scope"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeIdItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Inline>
        {unmet[0] ? (
          <Inline
            space="space.200"
            rowSpace="space.100"
            alignBlock="center"
            shouldWrap
            className="rounded-medium border border-default bg-neutral-subtle p-150"
          >
            <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
              <p className="font-body-small text-subtle">Next step · {unmet.length} remaining</p>
              <p className="font-body font-medium">{askFor(unmet[0].key)}</p>
            </div>
            <Button
              size="small"
              onClick={() => {
                const gate = unmet[0]!;
                if (gate.key === "owner") {
                  assignOwner(work.id, me);
                  refresh();
                } else {
                  openWork(
                    gateTabs[gate.key],
                    gate.key === "narrative" || gate.key === "evidence" ? gate.key : undefined,
                  );
                }
              }}
            >
              {unmet[0].key === "owner"
                ? "Assign to me"
                : unmet[0].key === "narrative"
                  ? "Write implementation"
                  : unmet[0].key === "evidence"
                    ? "Link evidence"
                    : `Open ${gateTabs[unmet[0].key].toLowerCase()}`}
            </Button>
          </Inline>
        ) : null}
        <Tabs
          key={work.id}
          value={tab}
          onValueChange={(value) => setTab(value as ControlTab)}
          className="gap-200"
        >
          <TabsList variant="line" className="w-full justify-start" aria-label="Control work">
            {controlTabs.map((name) => (
              <TabsTrigger
                key={name}
                value={name}
                ref={(node) => {
                  tabRefs.current[name] = node;
                }}
              >
                {name}
                {name === "Requirements" && derived.length > 0 ? (
                  <Count value={derived.length} />
                ) : null}
                {name === "Evidence" && controlEvidence(work).length > 0 ? (
                  <Count value={controlEvidence(work).length} />
                ) : null}
                {name === "Assessment" && open.length > 0 ? <Count value={open.length} /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Implementation" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <Section
                title="Implementation"
                action={
                  <Link
                    to="/programs/$programId/export"
                    params={{ programId }}
                    search={{ tab: "OSCAL" }}
                    className={buttonVariants({ size: "small" })}
                  >
                    View SSP
                  </Link>
                }
              >
                <Box paddingBlockStart="space.100">
                  <Narrative
                    editButtonRef={narrativeEditRef}
                    key={work.id}
                    work={work}
                    elementId={originElementId}
                    onChange={refresh}
                  />
                </Box>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="Requirements" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <LibraryControlSources
                programId={programId}
                controlId={controlId}
                sources={librarySources}
              />
              <Section
                title="Requirements"
                count={derived.length || null}
                action={
                  <Inline space="space.100" shouldWrap>
                    <Button size="small" iconBefore={<Plus />} onClick={() => setMapping(true)}>
                      Map requirements
                    </Button>
                    <Button size="small" onClick={() => setDeriving(true)}>
                      Derive requirement
                    </Button>
                  </Inline>
                }
              >
                <Box paddingBlockStart="space.100">
                  <ControlRequirementTable
                    requirements={derived}
                    programId={programId}
                    controlId={controlId}
                    elementId={originElementId}
                    allocationCount={(id: string) =>
                      controlAllocationCount(programId, id, elementId)
                    }
                  />
                </Box>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="Evidence" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <Section title="Supporting evidence" count={controlEvidence(work).length || null}>
                <Box paddingBlockStart="space.100">
                  <EvidenceBlock
                    linkButtonRef={evidenceLinkRef}
                    key={work.id}
                    work={work}
                    elementId={originElementId}
                    onChange={refresh}
                  />
                </Box>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="Assessment" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <Section title="Assessment" count={open.length || null}>
                <Stack space="space.200" className="pt-100">
                  <Determination key={work.id} work={work} onChange={refresh} />
                  {open.length ? (
                    <Table>
                      <tbody>
                        {open.map((f) => (
                          <Table.Row key={f.id}>
                            <Table.Cell className="max-w-none" width={104}>
                              <TextLink
                                render={
                                  <Link
                                    to="/programs/$programId"
                                    params={{ programId }}
                                    search={{
                                      tab: "Findings",
                                      findingId: f.id,
                                      element: originElementId,
                                    }}
                                  />
                                }
                              >
                                <Id>{f.id}</Id>
                              </TextLink>
                            </Table.Cell>
                            <Table.Cell width={88}>
                              <Indicator tone={severityTone(f.mitigatedSeverity)}>
                                {f.mitigatedSeverity}
                              </Indicator>
                            </Table.Cell>
                            <Table.Cell className="truncate">{f.title}</Table.Cell>
                          </Table.Row>
                        ))}
                      </tbody>
                    </Table>
                  ) : null}
                </Stack>
              </Section>
            </Stack>
          </TabsContent>
          <TabsContent value="Tasks" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <TasksSection program={programId} subject={subject} me={me} />
            </Stack>
          </TabsContent>
          <TabsContent value="Activity" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <RecordActivity program={programId} subject={subject} me={me} />
            </Stack>
          </TabsContent>
          <TabsContent value="Reference" keepMounted>
            <Stack space="space.300" className="min-w-0">
              <Accordion multiple className="border-b border-default pt-050">
                <AccordionItem
                  value="control-statement"
                  className="border-t border-default border-t-0"
                >
                  <AccordionTrigger>{"Control statement"}</AccordionTrigger>
                  <AccordionContent>
                    <Box paddingBlockEnd="space.200">
                      {detail.statement.length ? (
                        <StatementList items={detail.statement} />
                      ) : (
                        <p className="font-body-small text-subtle">None published.</p>
                      )}
                    </Box>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem className="border-t border-default" value="assessment-objectives">
                  <AccordionTrigger>
                    {"Assessment objectives"}{" "}
                    {detail.objectives.length > 0 ? (
                      <Count value={detail.objectives.length} />
                    ) : null}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Box paddingBlockEnd="space.200">
                      <ObjectiveList items={detail.objectives} />
                    </Box>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem className="border-t border-default" value="parameters">
                  <AccordionTrigger>
                    {"Parameters"}{" "}
                    {detail.params.length > 0 ? <Count value={detail.params.length} /> : null}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Box paddingBlockEnd="space.200">
                      <ParameterTable params={detail.params} />
                    </Box>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem className="border-t border-default" value="assessment-methods">
                  <AccordionTrigger>
                    {"Assessment methods"}{" "}
                    {detail.methods.length > 0 ? <Count value={detail.methods.length} /> : null}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Box paddingBlockEnd="space.200">
                      <MethodList methods={detail.methods} />
                    </Box>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  className="border-t border-default"
                  value="discussion-and-references"
                >
                  <AccordionTrigger>
                    {"Discussion and references"}{" "}
                    {detail.discussion.length > 0 ? (
                      <Count value={detail.discussion.length} />
                    ) : null}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Box paddingBlockEnd="space.200">
                      <Stack className="font-body-small text-subtle" space="space.100">
                        {detail.discussion.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </Stack>
                      <Box paddingBlockStart="space.150">
                        <ReferenceList references={detail.references} />
                      </Box>
                    </Box>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Stack>
          </TabsContent>
        </Tabs>
        {properties(rail)}
      </Stack>
      <NewRequirementModal
        open={deriving}
        onClose={() => setDeriving(false)}
        programId={programId}
        initialControlId={controlId}
        onCreated={(requirement) => {
          void navigate({
            to: "/programs/$programId/requirements/$requirementId",
            params: { programId, requirementId: requirement.id },
            search: { element: originElementId },
          });
        }}
      />
      <MapRequirementsSheet
        open={mapping}
        onClose={() => setMapping(false)}
        programId={programId}
        controlId={controlId}
        controlLabel={row.fullTitle}
        mapped={derived.map((r) => r.id)}
        actor={me}
        scopeName={scope?.name}
      />
    </>
  );
}
