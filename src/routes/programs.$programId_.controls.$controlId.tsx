import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { InlineSelect, InlineText } from "@/components/app/inline-edit";
import { Shell } from "@/components/app/shell";
import {
  MethodList,
  ObjectiveList,
  ParameterTable,
  ReferenceList,
  StatementList,
  TextBlock,
} from "@/components/app/control-text";
import { RemediationPlanSection } from "@/components/app/remediation";
import {
  Badge,
  EmptyState,
  KeyValue,
  Mono,
  Person,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  TabStrip,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { controlDetail } from "@/lib/control-detail";
import {
  controlStatuses,
  controlStatusTone,
  implementations,
  updateControl,
  useControlMatrix,
} from "@/lib/control-matrix";
import { assetById, isOpen } from "@/lib/findings";
import { catalogVersion } from "@/lib/nist-catalog";
import { remediationPlan } from "@/lib/remediation";
import { saveProgramField } from "@/lib/program-save";
import { severityTone, statusTone } from "@/lib/spine";

const controlTabs = ["Overview", "Assessment", "Findings", "Remediation"] as const;
type ControlTab = (typeof controlTabs)[number];

export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  validateSearch: (search: Record<string, unknown>): { tab?: ControlTab } => {
    const raw = String(search["tab"] ?? "");
    const match = controlTabs.find((t) => t.toLowerCase() === raw.toLowerCase());
    return match ? { tab: match } : {};
  },
  // The catalog text is large; load the one control the page needs rather than
  // shipping the whole of 800-53 in the bundle.
  loader: async ({ params }) => {
    const { controlText } = await import("@/lib/nist-control-text");
    return { text: controlText[params.controlId] ?? null };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.controlId} — Equinox` },
      {
        name: "description",
        content: `Control ${params.controlId} in program ${params.programId}: NIST SP 800-53 Rev. 5 statement, assessment objectives, findings and remediation plan.`,
      },
      { property: "og:title", content: `${params.controlId} — Equinox` },
      {
        property: "og:description",
        content: `Control ${params.controlId} in program ${params.programId}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlRecord,
});

function ControlRecord() {
  const { programId, controlId } = Route.useParams();
  const tab = Route.useSearch().tab ?? "Overview";
  const { text } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const rows = useControlMatrix(programId);
  const row = rows.find((r) => r.id === controlId);

  const inScope = useMemo(() => {
    const ids = new Set(rows.map((r) => r.id));
    return (id: string) => ids.has(id);
  }, [rows]);

  const plan = useMemo(() => (row ? remediationPlan(row) : null), [row]);

  if (!row) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Control not found</h1>
          <p className="max-w-lg text-[13px] text-muted-foreground">
            {controlId} is not in the tailored baseline for {programId}.
          </p>
          <Link
            to="/programs/$programId"
            params={{ programId }}
            className="text-[13px] text-primary hover:underline"
          >
            Back to the program
          </Link>
        </div>
      </Shell>
    );
  }

  const detail = controlDetail(row, text, inScope);
  const open = row.findings.filter(isOpen);

  const save = (field: string) => (next: string) =>
    saveProgramField({ programId, field: `${row.id} ${field}`, value: next });

  const go = (next: ControlTab) => navigate({ search: { tab: next }, replace: true });

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId }}
            id={row.id}
            title={row.title}
            meta={`${row.family} ${row.familyName} · ${catalogVersion}${
              row.baselines.length ? ` · ${row.baselines.join(" / ")} baseline` : " · tailored in"
            }`}
            actions={<Badge tone={controlStatusTone[row.status]}>{row.status}</Badge>}
          />
        }
        tabs={
          <TabStrip
            items={(
              [
                ["Overview", null],
                ["Assessment", detail.objectives.length || null],
                ["Findings", open.length || row.findings.length || null],
                ["Remediation", plan ? plan.total : null],
              ] as [ControlTab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key === "Remediation" ? "Remediation plan" : key,
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
            <RailGroup title="Matrix row">
              <KeyValue label="Status">
                <InlineSelect
                  label="Assessment"
                  options={controlStatuses}
                  value={row.status}
                  onChange={(next) => updateControl(programId, row.id, { status: next })}
                  save={save("status")}
                  render={(v) => <Badge tone={controlStatusTone[v]}>{v}</Badge>}
                />
              </KeyValue>
              <KeyValue label="Implementation">
                <InlineSelect
                  label="Implementation"
                  options={implementations}
                  value={row.implementation}
                  onChange={(next) => updateControl(programId, row.id, { implementation: next })}
                  save={save("implementation")}
                />
              </KeyValue>
              <KeyValue label="Owner">
                <InlineText
                  value={row.owner}
                  onChange={(next) => updateControl(programId, row.id, { owner: next })}
                  save={save("owner")}
                />
              </KeyValue>
              <KeyValue label="Due">
                <InlineText
                  value={row.due}
                  placeholder="—"
                  onChange={(next) => updateControl(programId, row.id, { due: next })}
                  save={save("due")}
                />
              </KeyValue>
              <KeyValue label="Next action">
                <InlineText
                  value={row.nextAction}
                  placeholder="Add next action"
                  onChange={(next) => updateControl(programId, row.id, { nextAction: next })}
                  save={save("nextAction")}
                />
              </KeyValue>
            </RailGroup>

            <RailGroup title="Catalog">
              <KeyValue label="Family">
                {row.family} — {row.familyName}
              </KeyValue>
              <KeyValue label="Kind">
                {row.enhancement ? "Control enhancement" : "Base control"}
              </KeyValue>
              {row.parent ? (
                <KeyValue label="Extends">
                  <Link
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId, controlId: row.parent }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{row.parent}</Mono>
                  </Link>
                </KeyValue>
              ) : null}
              <KeyValue label="Baselines">
                {row.baselines.length ? row.baselines.join(", ") : "Tailored in"}
              </KeyValue>
              <KeyValue label="Parameters">{detail.params.length}</KeyValue>
            </RailGroup>

            <RailGroup title="Joins">
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  className="text-primary hover:underline"
                >
                  <Mono className="text-primary">{programId}</Mono>
                </Link>
              </KeyValue>
              <KeyValue label="POA&M">
                {row.poam ? (
                  <Link
                    to="/register/poam/$poamId"
                    params={{ poamId: row.poam }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{row.poam}</Mono>
                  </Link>
                ) : (
                  "No open section"
                )}
              </KeyValue>
              <KeyValue label="Workstream">
                {row.workstream ? (
                  <Link
                    to="/workstreams/$workstreamId"
                    params={{ workstreamId: row.workstream }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{row.workstream}</Mono>
                  </Link>
                ) : (
                  "Unassigned"
                )}
              </KeyValue>
              <KeyValue label="Source">{row.source}</KeyValue>
              <KeyValue label="Assessed">{row.assessed}</KeyValue>
              {row.stale ? (
                <KeyValue label="Inheritance">
                  <Badge tone="warning">Evidence stale</Badge>
                </KeyValue>
              ) : null}
            </RailGroup>
          </>
        }
      >
        {tab === "Overview" ? (
          <>
            <Section
              title="Control statement"
              description={`${catalogVersion} · ${row.family} ${row.familyName} · ${
                row.enhancement ? `enhancement of ${row.parent}` : "base control"
              }`}
            >
              <div className="pt-3">
                {detail.statement.length ? (
                  <StatementList items={detail.statement} />
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    The catalog carries no statement for this control.
                  </p>
                )}
              </div>
            </Section>

            {detail.discussion.length ? (
              <Section title="Discussion" description="SP 800-53 Rev. 5 supplemental guidance.">
                <div className="max-w-3xl space-y-2 pt-3 text-[13px] leading-relaxed text-muted-foreground">
                  {detail.discussion.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section
              title="Organization-defined parameters"
              description="Values the program has to set before the control can be assessed."
            >
              <ParameterTable params={detail.params} />
            </Section>

            {detail.ccis.length ? (
              <Section
                title="CCI decomposition"
                description={`${detail.ccis.length} control correlation identifiers join this requirement to verification.`}
              >
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "104px" }} />
                    <col />
                    <col style={{ width: "96px" }} />
                    <col style={{ width: "108px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>CCI</Th>
                      <Th>Definition</Th>
                      <Th>Type</Th>
                      <Th>Compliance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.ccis.map((c) => (
                      <Tr key={c.id}>
                        <Td>
                          <Mono>{c.id}</Mono>
                        </Td>
                        <Td className="text-muted-foreground">{c.definition}</Td>
                        <Td className="text-muted-foreground">{c.type}</Td>
                        <Td>
                          <Badge tone={statusTone(c.compliance)}>{c.compliance}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Section>
            ) : null}

            <Section
              title="Related controls"
              description="Rev. 5 cross-references. Controls this program carries are linked."
            >
              <div className="space-y-2 pt-2">
                <p className="text-[13px] text-muted-foreground">
                  {detail.relatedInScope.length === 0 && detail.relatedOutOfScope.length === 0
                    ? "The catalog lists no related controls."
                    : null}
                  {detail.relatedInScope.map((id, i) => (
                    <span key={id}>
                      {i > 0 && " · "}
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: id }}
                        className="text-primary hover:underline"
                      >
                        <Mono className="text-primary">{id}</Mono>
                      </Link>
                    </span>
                  ))}
                  {detail.relatedOutOfScope.length ? (
                    <span className="ml-2">
                      {detail.relatedInScope.length ? "· " : null}
                      <span title="Not in this program's tailored baseline">
                        {detail.relatedOutOfScope.join(" · ")}
                      </span>
                    </span>
                  ) : null}
                </p>
                <ReferenceList references={detail.references} />
              </div>
            </Section>
          </>
        ) : null}

        {tab === "Assessment" ? (
          <>
            <Section
              title="Assessment result"
              description="What the program has recorded against this control."
            >
              <div className="pt-1">
                <TextBlock label="Determination">
                  <Badge tone={controlStatusTone[row.status]} size="xs">
                    {row.status}
                  </Badge>
                  <span className="ml-2 text-muted-foreground">
                    {row.status === "Satisfied"
                      ? "Every assessment objective was met."
                      : row.status === "Not assessed"
                        ? "No assessment has been executed against this control yet."
                        : `${open.length ? `${open.length} open finding${open.length > 1 ? "s keep" : " keeps"}` : "Objectives remain"} the control short of satisfied.`}
                  </span>
                </TextBlock>
                <TextBlock label="Assessed">{row.assessed}</TextBlock>
                <TextBlock label="Implementation">
                  {row.implementation} · {row.source}
                </TextBlock>
                <TextBlock label="Owner">
                  <Person name={row.owner} />
                </TextBlock>
                <TextBlock label="Next action">{row.nextAction}</TextBlock>
              </div>
            </Section>

            <Section
              title="Assessment objectives"
              description="SP 800-53A determination statements. The assessor closes each one by label."
            >
              <div className="pt-3">
                {detail.objectives.length ? (
                  <ObjectiveList items={detail.objectives} />
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    No assessment objectives are published for this control.
                  </p>
                )}
              </div>
            </Section>

            <Section
              title="Assessment methods"
              description="Objects the assessor examines, the roles interviewed, and what gets tested."
            >
              <MethodList methods={detail.methods} />
            </Section>
          </>
        ) : null}

        {tab === "Findings" ? (
          <Section
            title="Findings"
            description={
              row.findings.length
                ? `${open.length} open of ${row.findings.length}. Open findings keep the control other than satisfied.`
                : "Nothing has been raised against this control."
            }
          >
            {row.findings.length ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col />
                  <col style={{ width: "104px" }} />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "78px" }} />
                  <col style={{ width: "112px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Finding</Th>
                    <Th>Title</Th>
                    <Th>CCI</Th>
                    <Th>Asset</Th>
                    <Th>Severity</Th>
                    <Th>Lifecycle</Th>
                  </tr>
                </thead>
                <tbody>
                  {row.findings.map((f) => (
                    <Tr key={f.id}>
                      <Td>
                        <Link
                          to="/findings/$findingId"
                          params={{ findingId: f.id }}
                          className="hover:underline"
                        >
                          <Mono className="text-primary">{f.id}</Mono>
                        </Link>
                      </Td>
                      <Td className="truncate">
                        <Link
                          to="/findings/$findingId"
                          params={{ findingId: f.id }}
                          className="hover:underline"
                        >
                          {f.title}
                        </Link>
                      </Td>
                      <Td>
                        <Mono className="text-muted-foreground">{f.cci}</Mono>
                      </Td>
                      <Td className="truncate text-muted-foreground">
                        {assetById.get(f.asset)?.name ?? f.asset}
                      </Td>
                      <Td>
                        <Badge tone={severityTone(f.mitigatedSeverity)}>
                          {f.mitigatedSeverity}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState
                title="No findings against this control"
                description="Scans, checklists and test events that touch this control have all come back clean."
              />
            )}
          </Section>
        ) : null}

        {tab === "Remediation" ? (
          plan ? (
            <RemediationPlanSection plan={plan} programId={programId} />
          ) : (
            <Section title="Remediation plan">
              <EmptyState
                title="Nothing to remediate"
                description={`${row.id} is satisfied with no open findings, so there is no plan to run. A finding or a downgraded assessment opens one automatically.`}
              />
            </Section>
          )
        ) : null}
      </ShowPage>
    </Shell>
  );
}
