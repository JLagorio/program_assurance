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
} from "@/lib/control-work";
import { isOpen } from "@/lib/findings";
import { programs } from "@/lib/grc-data";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Count,
  Editable,
  Gates,
  Id,
  Indicator,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Person,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Shell,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * The control record: where the loop lives. The header is the trail, the name
 * and the actions. The rail is the details, the links and the catalog text,
 * folded. The body is the work: what is next, the statement, the requirements
 * that satisfy it, the evidence, the tasks, the assessor's determination, and
 * the feed with the log bar last.
 */
export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: string | undefined; scope?: string | undefined; element?: string | undefined } => {
    const raw = search["tab"];
    return {
      tab: typeof raw === "string" && raw ? raw : undefined,
      scope: typeof search["scope"] === "string" ? search["scope"] : undefined,
      element: typeof search["element"] === "string" ? search["element"] : undefined,
    };
  },
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    // One control, so one family chunk: `loadControlText` fetches only the
    // family the id belongs to, not all 20. The screens that render the whole
    // catalog (SCTM, ConMon, baseline) import `@/lib/nist-control-text` instead.
    const { loadControlText } = await import("@/lib/nist-control-text/registry");
    return { program, text: await loadControlText(params.controlId) };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.controlId} — Equinox` },
      {
        name: "description",
        content: `Control ${params.controlId} in program ${params.programId}: implementation statement, requirements, evidence, tasks, determination and activity.`,
      },
      { property: "og:title", content: `${params.controlId} — Equinox` },
      { property: "og:description", content: `Control ${params.controlId}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlRecord,
});

function ControlRecord() {
  const { programId, controlId } = Route.useParams();
  const { program, text } = Route.useLoaderData();
  const rows = useControlMatrix(programId);

  const workVersion = useWorkVersion();
  const requirementsVersion = useRequirementsVersion();
  const libraryVersion = useLibraryVersion();
  useTasksVersion();
  const scopes = useMemo(() => scopesForProgram(programId), [programId, rows, libraryVersion]);
  const requestedScope = Route.useSearch().scope;
  const requestedElement = Route.useSearch().element;
  const navigate = Route.useNavigate();
  const [scopeId, setScopeId] = useState(
    () =>
      (scopes.some((scope) => scope.id === requestedScope) ? requestedScope : undefined) ??
      preferredScope(
        programId,
        controlId,
        scopes.map((s) => s.id),
      ) ??
      "",
  );
  useEffect(() => {
    if (requestedScope && scopes.some((scope) => scope.id === requestedScope))
      setScopeId(requestedScope);
  }, [requestedScope, scopes]);
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

  const scopeIdItems = scopes.map((sc) => ({ value: sc.id, label: sc.name }));
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
        <KeyValue label="Scope">
          <Select<string>
            items={scopeIdItems}
            value={scopeId}
            onValueChange={(value) => {
              if (value === null) return;
              setScopeId(value);
              void navigate({
                search: (previous) => ({
                  ...previous,
                  scope: value,
                  element: originElementId,
                }),
              });
            }}
          >
            <SelectTrigger
              className={"w-full " + "font-body-small"}
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
        </KeyValue>
        <KeyValue label="Implementation">
          <Badge
            variant="secondary"
            size="xsmall"
            tone={
              work.implementationRecorded === false
                ? "neutral"
                : implementationTone[work.implementation]
            }
          >
            {work.implementationRecorded === false ? "Unrecorded" : work.implementation}
          </Badge>
        </KeyValue>
        <KeyValue label="Assessment">
          <Badge variant="secondary" size="xsmall" tone={assessmentTone[work.assessment]}>
            {work.assessment}
          </Badge>
        </KeyValue>
        {work.submitted ? (
          <KeyValue label="Status">
            <Indicator tone="information">With the assessor</Indicator>
          </KeyValue>
        ) : null}
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

      <Inspector.Group title="Catalog">
        <Accordion multiple className="border-b border-default pt-050">
          <AccordionItem value="control-statement" className="border-t border-default border-t-0">
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
              {detail.objectives.length > 0 ? <Count value={detail.objectives.length} /> : null}
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
          <AccordionItem className="border-t border-default" value="discussion-and-references">
            <AccordionTrigger>
              {"Discussion and references"}{" "}
              {detail.discussion.length > 0 ? <Count value={detail.discussion.length} /> : null}
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
      </Inspector.Group>
    </>
  );

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
                        search={{ tab: "Controls", element: originElementId }}
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
                  <Id>{controlId}</Id>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="min-w-0">
            <PageHeader.Title>{row.fullTitle}</PageHeader.Title>
            <Inline
              space="space.100"
              alignBlock="center"
              shouldWrap
              className="pt-050 font-body-small text-subtle"
            >
              {scope?.name}
            </Inline>
          </div>
          <PageHeader.Actions>
            <ControlActions work={work} context={context} onChange={refresh} />
          </PageHeader.Actions>
        </PageHeader>
        <Stack space="space.300" className="min-w-0 pt-200">
          {unmet.length ? (
            <Section title="Next" count={unmet.length}>
              <Box paddingBlockStart="space.100">
                <Gates>
                  {unmet.map((g) => {
                    const existing = gateTaskFor(scopeId, controlId, g.key);
                    return (
                      <Gates.Item
                        key={g.key}
                        met={false}
                        label={askFor(g.key)}
                        reason={g.detail}
                        action={
                          existing ? (
                            <span className="font-body-small text-subtle">
                              Task with {existing.assignee}
                            </span>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => {
                                createTask({
                                  program: programId,
                                  title: askFor(g.key),
                                  subject,
                                  assignee: work.owner ?? me,
                                  requester: me,
                                  gate: { scope: scopeId, control: controlId, key: g.key },
                                });
                              }}
                            >
                              Add task
                            </Button>
                          )
                        }
                      />
                    );
                  })}
                </Gates>
              </Box>
            </Section>
          ) : null}
          <Section
            title="Implementation"
            action={
              <Button
                size="small"
                render={
                  <Link
                    to="/programs/$programId/export"
                    params={{ programId }}
                    search={{ tab: "OSCAL" }}
                  />
                }
              >
                View SSP
              </Button>
            }
          >
            <Box paddingBlockStart="space.100">
              <Narrative key={work.id} work={work} elementId={originElementId} onChange={refresh} />
            </Box>
          </Section>
          <LibraryControlSources
            programId={programId}
            controlId={controlId}
            sources={librarySources}
          />
          <Section
            title="Requirements"
            count={derived.length || null}
            action={
              <Button size="small" iconBefore={<Plus />} onClick={() => setMapping(true)}>
                Map requirements
              </Button>
            }
          >
            <Box paddingBlockStart="space.100">
              <ControlRequirementTable
                requirements={derived}
                programId={programId}
                controlId={controlId}
                elementId={originElementId}
                allocationCount={(id: string) => controlAllocationCount(programId, id, elementId)}
              />
            </Box>
          </Section>
          <Section title="Supporting evidence" count={controlEvidence(work).length || null}>
            <Box paddingBlockStart="space.100">
              <EvidenceBlock
                key={work.id}
                work={work}
                elementId={originElementId}
                onChange={refresh}
              />
            </Box>
          </Section>
          <TasksSection program={programId} subject={subject} me={me} />
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
          <RecordActivity program={programId} subject={subject} me={me} />
        </Stack>
        <Shell.Aside label="Record properties">{rail}</Shell.Aside>
      </Stack>
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
