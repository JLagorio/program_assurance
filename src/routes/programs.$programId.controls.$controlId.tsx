import { createFileRoute, Link } from "@tanstack/react-router";

import { InlineSelect, InlineText } from "@/components/app/inline-edit";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
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
import { saveProgramField } from "@/lib/program-save";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/programs/$programId/controls/$controlId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.controlId} — Equinox` },
      { name: "description", content: `Control ${params.controlId} in program ${params.programId}: statement, assessment status, findings and remediation.` },
      { property: "og:title", content: `${params.controlId} — Equinox` },
      { property: "og:description", content: `Control ${params.controlId} in program ${params.programId}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlRecord,
});

function ControlRecord() {
  const { programId, controlId } = Route.useParams();
  const rows = useControlMatrix(programId);
  const row = rows.find((r) => r.id === controlId);

  if (!row) {
    return (
      <Shell>
        <div className="space-y-3">
          <h1 className="text-[18px] font-semibold">Control not found</h1>
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

  const detail = controlDetail(row);
  const open = row.findings.filter(isOpen);

  const save = (field: string) => (next: string) =>
    saveProgramField({ programId, field: `${row.id} ${field}`, value: next });

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId }}
            id={row.id}
            title={row.title}
            meta={`${row.family} ${row.familyName} · NIST SP 800-53 Rev. 5`}
            actions={<Badge tone={controlStatusTone[row.status]}>{row.status}</Badge>}
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
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
        <Section
          title="Control statement"
          description={`NIST SP 800-53 Rev. 5 · ${row.family} family${row.id.includes("(") ? " · enhancement" : " · base control"}`}
        >
          <ol className="max-w-3xl list-none space-y-1.5 text-[13px] leading-relaxed">
            {detail.statement.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-4 shrink-0 font-medium text-muted-foreground">
                  {String.fromCharCode(97 + i)}.
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Supplemental guidance">
          <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            {detail.guidance}
          </p>
        </Section>

        <Section title="Assessment objective" description="800-53A procedure the assessor executes.">
          <p className="max-w-3xl text-[13px] leading-relaxed">{detail.objective}</p>
        </Section>

        <Section title="Parameters" description="Organization-defined values the program sets before assessment.">
          <ul className="max-w-3xl list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted-foreground">
            {detail.parameters.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
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
                <col style={{ width: "96px" }} />
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

        {row.findings.length ? (
          <Section
            title="Findings"
            description={`${open.length} open of ${row.findings.length}. Open findings keep the control other than satisfied.`}
          >
            <Table className="table-fixed">
              <colgroup>
                <col style={{ width: "112px" }} />
                <col />
                <col style={{ width: "120px" }} />
                <col style={{ width: "78px" }} />
                <col style={{ width: "112px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Th>Finding</Th>
                  <Th>Title</Th>
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
                    <Td className="truncate">{f.title}</Td>
                    <Td className="truncate text-muted-foreground">
                      {assetById.get(f.asset)?.name ?? f.asset}
                    </Td>
                    <Td>
                      <Badge tone={severityTone(f.mitigatedSeverity)}>{f.mitigatedSeverity}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(f.lifecycle)}>{f.lifecycle}</Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Section>
        ) : null}

        <Section title="Related controls">
          <p className="text-[13px] text-muted-foreground">
            {detail.related.map((id, i) => (
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
            <span className="ml-3 text-12">References: {detail.references.join(", ")}</span>
          </p>
        </Section>
      </ShowPage>
    </Shell>
  );
}
