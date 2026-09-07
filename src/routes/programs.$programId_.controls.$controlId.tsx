import { Count } from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ControlActions,
  Determination,
  EvidenceBlock,
  Narrative,
} from "@/components/app/control-work";
import {
  MethodList,
  ObjectiveList,
  ParameterTable,
  ReferenceList,
  StatementList,
} from "@/components/app/control-text";
import { MapRequirementsSheet } from "@/components/app/map-requirements";
import { RecordActivity } from "@/components/app/record-activity";
import { ControlRequirementTable } from "@/components/app/requirements";
import { Shell } from "@/components/app/shell";
import { TasksSection } from "@/components/app/tasks-section";
import {
  Accordion,
  Badge,
  Box,
  Breadcrumb,
  Button,
  Editable,
  Gates,
  Id,
  Indicator,
  Inspector,
  KeyValue,
  NativeSelect,
  Person,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { controlDetail } from "@/lib/control-detail";
import {
  assessmentTone,
  assignOwner,
  currentSession,
  gatesFor,
  implementationTone,
  linkEvidence,
  preferredScope,
  useWorkVersion,
  workFor,
} from "@/lib/control-work";
import { useControlMatrix } from "@/lib/control-matrix";
import { evidenceCatalog } from "@/lib/evidence-catalog";
import { isOpen } from "@/lib/findings";
import { programs } from "@/lib/grc-data";
import { catalogVersion } from "@/lib/nist-catalog";
import { mentionablePeople } from "@/lib/people";
import { allocationsFor, requirementsForControl, useRequirementsVersion } from "@/lib/requirements";
import { controlSetFor, scopesForProgram } from "@/lib/scopes";
import { severityTone } from "@/lib/spine";
import { askFor, createTask, gateTaskFor, resolveGateTasks, useTasksVersion } from "@/lib/tasks";

/**
 * The control record: where the loop lives. The header is the trail, the name
 * and the actions. The rail is the details, the links and the catalog text,
 * folded. The body is the work: what is next, the statement, the requirements
 * that satisfy it, the evidence, the tasks, the assessor's determination, and
 * the feed with the log bar last.
 */
export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string | undefined } => {
    const raw = search["tab"];
    return { tab: typeof raw === "string" && raw ? raw : undefined };
  },
  loader: async ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    const { controlText } = await import("@/lib/nist-control-text");
    return { program, text: controlText[params.controlId] ?? null };
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
  const row = rows.find((r) => r.id === controlId);

  const workVersion = useWorkVersion();
  const requirementsVersion = useRequirementsVersion();
  useTasksVersion();
  const scopes = useMemo(() => scopesForProgram(programId), [programId]);
  const [scopeId, setScopeId] = useState(
    () =>
      preferredScope(
        programId,
        controlId,
        scopes.map((s) => s.id),
      ) ?? "",
  );
  const [, tick] = useState(0);
  const refresh = () => tick((n) => n + 1);
  const [mapping, setMapping] = useState(false);
  const session = currentSession();
  const me = session.name;

  const work = useMemo(
    () => (scopeId ? workFor(programId, scopeId, controlId) : null),
    [programId, scopeId, controlId, workVersion],
  );
  const derived = useMemo(
    () => requirementsForControl(controlId, programId),
    [controlId, programId, requirementsVersion],
  );
  const context = useMemo(() => {
    const allocated = derived.reduce((n, r) => n + allocationsFor(r.id).length, 0);
    return {
      contributors: allocated,
      contributorDetail: allocated
        ? `${derived.length} requirements, ${allocated} allocations`
        : "No allocated requirement",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived, workVersion]);

  const inScope = useMemo(() => {
    const ids = new Set(rows.map((r) => r.id));
    return (id: string) => ids.has(id);
  }, [rows]);

  const gates = useMemo(() => (work ? gatesFor(work, context) : []), [work, context, workVersion]);

  // Tasks born from a gate close by artifact: the gate is met, so the ask is done.
  useEffect(() => {
    if (scopeId) resolveGateTasks(scopeId, controlId, gates);
  }, [scopeId, controlId, gates]);

  if (!row || !work) {
    return (
      <Shell>
        <Stack space="space.150">
          <h1 className="font-heading-small font-semibold">Control not in scope</h1>
          <TextLink size="medium">
            <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Controls" }}>
              Back to controls
            </Link>
          </TextLink>
        </Stack>
      </Shell>
    );
  }

  const detail = controlDetail(row, text, inScope);
  const open = row.findings.filter(isOpen);
  const scope = scopes.find((s) => s.id === scopeId);
  const set = scopeId ? controlSetFor(scopeId) : null;
  const selection = set?.controls.find((c) => c.control.id === controlId);
  const subject = { kind: "control" as const, id: controlId, label: row.fullTitle };
  const unmet = gates.filter((g) => !g.met);
  const people = mentionablePeople(programId).map((p) => p.name);
  const ownerOptions = [...new Set([...(work.owner ? [work.owner] : []), me, ...people])];

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
          <NativeSelect
            size="small"
            className="font-body-small"
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
            aria-label="Assessment scope"
          >
            {scopes.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </NativeSelect>
        </KeyValue>
        <KeyValue label="Implementation">
          <Badge size="xsmall" tone={implementationTone[work.implementation]}>
            {work.implementation}
          </Badge>
        </KeyValue>
        <KeyValue label="Assessment">
          <Badge size="xsmall" tone={assessmentTone[work.assessment]}>
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
            <Badge size="xsmall" tone="danger">
              {open.length} open
            </Badge>
          ) : (
            "None"
          )}
        </KeyValue>
        <KeyValue label="POA&M">
          {row.poam ? (
            <TextLink>
              <Link to="/register/poam/$poamId" params={{ poamId: row.poam }}>
                <Id>{row.poam}</Id>
              </Link>
            </TextLink>
          ) : (
            "None"
          )}
        </KeyValue>
        <KeyValue label="Requirements">{derived.length || "None"}</KeyValue>
        <KeyValue label="Evidence">{work.evidence.length || "None"}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Catalog">
        <Accordion type="multiple" className="border-b border-default pt-050">
          <Accordion.Item value="control-statement" className="border-t border-default border-t-0">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger>{"Control statement"}</Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content>
              <Box paddingBlockEnd="space.200">
                {detail.statement.length ? (
                  <StatementList items={detail.statement} />
                ) : (
                  <p className="font-body-small text-subtle">None published.</p>
                )}
              </Box>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item className="border-t border-default" value="assessment-objectives">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger>
                  {"Assessment objectives"}{" "}
                  {detail.objectives.length > 0 ? <Count value={detail.objectives.length} /> : null}
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content>
              <Box paddingBlockEnd="space.200">
                <ObjectiveList items={detail.objectives} />
              </Box>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item className="border-t border-default" value="parameters">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger>
                  {"Parameters"}{" "}
                  {detail.params.length > 0 ? <Count value={detail.params.length} /> : null}
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content>
              <Box paddingBlockEnd="space.200">
                <ParameterTable params={detail.params} />
              </Box>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item className="border-t border-default" value="assessment-methods">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger>
                  {"Assessment methods"}{" "}
                  {detail.methods.length > 0 ? <Count value={detail.methods.length} /> : null}
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content>
              <Box paddingBlockEnd="space.200">
                <MethodList methods={detail.methods} />
              </Box>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item className="border-t border-default" value="discussion-and-references">
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger>
                  {"Discussion and references"}{" "}
                  {detail.discussion.length > 0 ? <Count value={detail.discussion.length} /> : null}
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content>
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
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Inspector.Group>
    </>
  );

  return (
    <Shell>
      <ShowPage
        rail={rail}
        header={
          <RecordHeader
            crumbs={
              <>
                <Breadcrumb.Item asChild>
                  <Link to="/programs">Programs</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item asChild>
                  <Link
                    to="/programs/$programId"
                    params={{ programId }}
                    search={{ tab: "Controls" }}
                  >
                    {program.name}
                  </Link>
                </Breadcrumb.Item>
              </>
            }
            id={controlId}
            title={row.fullTitle}
            actions={<ControlActions work={work} context={context} onChange={refresh} />}
          />
        }
      >
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

        <Section title="Implementation">
          <Box paddingBlockStart="space.100">
            <Narrative work={work} onChange={refresh} />
          </Box>
        </Section>

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
              allocationCount={(id: string) => allocationsFor(id).length}
            />
          </Box>
        </Section>

        <Section title="Evidence" count={work.evidence.length || null}>
          <Box paddingBlockStart="space.100">
            <EvidenceBlock work={work} available={evidenceCatalog} onChange={refresh} />
          </Box>
        </Section>

        <TasksSection program={programId} subject={subject} me={me} />

        <Section title="Assessment" count={open.length || null}>
          <Stack space="space.200" className="pt-100">
            <Determination work={work} onChange={refresh} />
            {open.length ? (
              <Table>
                <tbody>
                  {open.map((f) => (
                    <Table.Row key={f.id}>
                      <Table.Cell className="max-w-none" width={104}>
                        <TextLink>
                          <Link to="/findings/$findingId" params={{ findingId: f.id }}>
                            <Id>{f.id}</Id>
                          </Link>
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
      </ShowPage>

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
    </Shell>
  );
}
