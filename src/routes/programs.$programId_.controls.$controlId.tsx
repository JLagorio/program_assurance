import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  Comments,
  ControlActionBar,
  Determination,
  EvidenceBlock,
  GateList,
  History,
  Narrative,
} from "@/components/app/control-work";
import {
  MethodList,
  ObjectiveList,
  ParameterTable,
  ReferenceList,
  StatementList,
} from "@/components/app/control-text";
import { ControlRequirementTable } from "@/components/app/requirements";
import {
  Badge,
  Block,
  Box,
  Breadcrumb,
  Collapsible,
  Id,
  Indicator,
  Inspector,
  NativeSelect,
  Stack,
  Table,
  Tabs,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { controlDetail } from "@/lib/control-detail";
import {
  currentSession,
  implementationTone,
  preferredScope,
  roles,
  setSession,
  useWorkVersion,
  workFor,
} from "@/lib/control-work";
import { useControlMatrix } from "@/lib/control-matrix";
import { evidenceCatalog } from "@/lib/evidence-catalog";
import { isOpen } from "@/lib/findings";
import { programs } from "@/lib/grc-data";
import { catalogVersion } from "@/lib/nist-catalog";
import { allocationsFor, requirementsForControl } from "@/lib/requirements";
import { controlSetFor, scopesForProgram } from "@/lib/scopes";
import { severityTone } from "@/lib/spine";

/**
 * The control work surface — the reference implementation for the new shapes.
 *
 * What this replaced: nineteen stacked `<Section>` blocks across five tabs,
 * 194 words of explanatory prose, the record's facts spread between a rail
 * that only rendered on one tab and a fact row on another, and a "Work" tab
 * that was eight more sections of the same shape.
 *
 * What it is now: an `ActionBar` carrying identity, both state axes and the
 * actions that move them; a main column holding only the work; an `Inspector`
 * holding the facts and the gates; and the catalog reference — statement,
 * objectives, parameters, methods — behind `Disclosure`, present but closed.
 * No component on this page takes a description.
 */
const controlTabs = ["Implementation", "Assessment", "Catalog", "History"] as const;
type ControlTab = (typeof controlTabs)[number];

export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  validateSearch: (search: Record<string, unknown>): { tab?: ControlTab | undefined } => {
    const raw = String(search["tab"] ?? "");
    return { tab: controlTabs.find((t) => t.toLowerCase() === raw.toLowerCase()) };
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
        content: `Control ${params.controlId} in program ${params.programId}: implementation statement, contributors, evidence, assessment determination and history.`,
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
  const tab = Route.useSearch().tab ?? "Implementation";
  const navigate = useNavigate({ from: Route.fullPath });
  const rows = useControlMatrix(programId);
  const row = rows.find((r) => r.id === controlId);

  const workVersion = useWorkVersion();
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
  const session = currentSession();

  const work = useMemo(
    () => (scopeId ? workFor(programId, scopeId, controlId) : null),
    [programId, scopeId, controlId, workVersion],
  );
  const derived = useMemo(
    () => requirementsForControl(controlId, programId),
    [controlId, programId],
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

  return (
    <Shell>
      <div className="animate-rise">
        <ControlActionBar
          work={work}
          context={context}
          title={row.fullTitle}
          scopeName={scope?.name ?? "—"}
          onChange={refresh}
          breadcrumb={
            <Breadcrumb>
              <Breadcrumb.Item asChild>
                <Link to={"/programs"}>{"Programs"}</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item asChild>
                <Link
                  to={"/programs/$programId"}
                  params={{ programId }}
                  search={{ tab: "Controls" }}
                >
                  {program.name}
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item isCurrent>{`${row.family} controls`}</Breadcrumb.Item>
            </Breadcrumb>
          }
          tabs={
            <Tabs>
              {(
                [
                  ["Implementation", work.evidence.length || null],
                  ["Assessment", open.length || null],
                  ["Catalog", detail.objectives.length || null],
                  ["History", null],
                ] as [ControlTab, number | null][]
              ).map(([key, count]) => (
                <Tabs.Tab
                  key={key}
                  isSelected={tab === key}
                  onClick={() => navigate({ search: { tab: key }, replace: true })}
                  count={count || null}
                >
                  {key}
                </Tabs.Tab>
              ))}
            </Tabs>
          }
        />

        <div className="grid gap-400 pt-200 lg:grid-cols-main-rail lg:gap-0">
          <Box className="min-w-0 lg:pe-300">
            {tab === "Implementation" ? (
              <>
                <Block title="Implementation statement">
                  <Narrative work={work} onChange={refresh} />
                </Block>
                <Block title="Contributors" count={derived.length}>
                  <ControlRequirementTable
                    requirements={derived}
                    programId={programId}
                    controlId={controlId}
                    allocationCount={(id: string) => allocationsFor(id).length}
                  />
                </Block>
                <Block title="Evidence" count={work.evidence.length}>
                  <EvidenceBlock work={work} available={evidenceCatalog} onChange={refresh} />
                </Block>
              </>
            ) : null}

            {tab === "Assessment" ? (
              <>
                <Block title="Determination">
                  <Determination work={work} onChange={refresh} />
                </Block>
                <Block title="Open findings" count={open.length}>
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
                  ) : (
                    <p className="font-body text-subtle">None open.</p>
                  )}
                </Block>
                <Block title="Discussion" count={null}>
                  <Comments work={work} onChange={refresh} />
                </Block>
              </>
            ) : null}

            {tab === "Catalog" ? (
              <>
                <Block title="Control statement">
                  {detail.statement.length ? (
                    <StatementList items={detail.statement} />
                  ) : (
                    <p className="font-body text-subtle">None published.</p>
                  )}
                </Block>
                <Block title="Assessment objectives" count={detail.objectives.length}>
                  <ObjectiveList items={detail.objectives} />
                </Block>
                <Block title="Parameters" count={detail.params.length}>
                  <ParameterTable params={detail.params} />
                </Block>
                <Block title="Assessment methods" count={detail.methods.length}>
                  <MethodList methods={detail.methods} />
                </Block>
                <Collapsible title="Discussion and references" count={detail.discussion.length}>
                  <Stack className="max-w-layout-measure font-body text-subtle" space="space.100">
                    {detail.discussion.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </Stack>
                  <Box paddingBlockStart="space.150">
                    <ReferenceList references={detail.references} />
                  </Box>
                </Collapsible>
              </>
            ) : null}

            {tab === "History" ? (
              <Block title="History">
                <History work={work} />
              </Block>
            ) : null}
          </Box>
          <aside className="border-t border-default pt-300 lg:border-s lg:border-t-0 lg:ps-300 lg:pt-0">
            <Inspector
              groups={[
                {
                  title: "Working as",
                  rows: [
                    {
                      label: "Scope",
                      value: (
                        <NativeSelect
                          className="h-control-small font-body-small"
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
                      ),
                    },
                    {
                      label: "Role",
                      value: (
                        <NativeSelect
                          className="h-control-small font-body-small"
                          value={session.role}
                          onChange={(e) => {
                            setSession({ role: e.target.value as (typeof roles)[number] });
                            refresh();
                          }}
                          aria-label="Acting as"
                        >
                          {roles.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </NativeSelect>
                      ),
                    },
                    { label: "Owner", value: work.owner ?? "Unassigned" },
                  ],
                },
                {
                  title: "Gates",
                  rows: [{ label: "", value: <GateList work={work} context={context} /> }],
                },
                {
                  title: "Selection",
                  rows: [
                    { label: "Family", value: `${row.family} — ${row.familyName}` },
                    {
                      label: "Selected by",
                      value: selection?.selectedBy.length
                        ? selection.selectedBy.join(" · ")
                        : (selection?.source ?? "—"),
                    },
                    { label: "Baselines", value: row.baselines.join(", ") || "Tailored in" },
                    { label: "Origination", value: row.implementation },
                  ],
                },
                {
                  title: "Linked",
                  rows: [
                    {
                      label: "Findings",
                      value: open.length ? (
                        <Badge size="xsmall" tone="danger">
                          {open.length} open
                        </Badge>
                      ) : (
                        "None"
                      ),
                    },
                    {
                      label: "POA&M",
                      value: row.poam ? (
                        <TextLink>
                          <Link to="/register/poam/$poamId" params={{ poamId: row.poam }}>
                            <Id>{row.poam}</Id>
                          </Link>
                        </TextLink>
                      ) : (
                        "None"
                      ),
                    },
                    {
                      label: "Revision",
                      value: work.narrativeRevision ? `r${work.narrativeRevision}` : "—",
                    },
                    { label: "Catalog", value: catalogVersion },
                  ],
                },
              ]}
            />
          </aside>
        </div>
      </div>
    </Shell>
  );
}
