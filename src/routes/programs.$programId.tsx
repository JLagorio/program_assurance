import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Lock, MoreHorizontal, Pencil } from "lucide-react";

import { CdrPackageModal, DigitalThreadSection } from "@/components/app/digital-thread";
import { InheritChip } from "@/components/app/inheritance";
import { LifecycleSection } from "@/components/app/lifecycle";
import { PoamSection } from "@/components/app/poam";
import { Shell } from "@/components/app/shell";
import { TailoringSection } from "@/components/app/tailoring";
import { AuthorizationSection } from "@/components/app/authorization";
import { VerificationSection } from "@/components/app/verification";
import {
  Badge,
  Button,
  Dot,
  Field,
  Input,
  KeyValue,
  RailGroup,
  Meter,
  Modal,
  Mono,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  controlFamilies,
  programControls,
  programStatusTone,
  programTimeline,
  programs,
} from "@/lib/grc-data";
import { programState, stages, type Stage } from "@/lib/program-stage";
import { inheritanceForProgram, staleThresholdDays } from "@/lib/reusable-components";

export const Route = createFileRoute("/programs/$programId")({
  loader: ({ params }) => {
    const program = programs.find(
      (p) => p.id.toLowerCase() === params.programId.toLowerCase(),
    );
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} — Equinox GRC` },
      {
        name: "description",
        content:
          loaderData?.summary ??
          "Program detail: FIPS-199 categorization, NIST SP 800-53 control families, assessment results and authorization history.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} — Equinox GRC` },
      {
        property: "og:description",
        content:
          loaderData?.summary ??
          "System assessment program with NIST SP 800-53 control families and results.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramDetail,
});

function ProgramDetail() {
  const program = Route.useLoaderData();
  const state = useMemo(() => programState(program), [program]);
  const [stage, setStage] = useState<Stage>(state.currentStage);
  const [assessing, setAssessing] = useState(false);
  const [cdrOpen, setCdrOpen] = useState(false);
  const [family, setFamily] = useState("All");

  const inheritance = useMemo(() => inheritanceForProgram(program.id), [program.id]);

  const rows = useMemo(
    () =>
      family === "All"
        ? programControls
        : programControls.filter((c) => c.family === family),
    [family],
  );

  const locked = state.stageStatus[stage] === "locked";

  const runPrimary = () => {
    if (state.primaryAction === "Generate CDR package") setCdrOpen(true);
    else if (state.primaryAction === "Record assessment result") setAssessing(true);
  };

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        {/* Title row — back chevron inline, no breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <Link
              to="/programs"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to programs"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <h1 className="truncate text-[19px] font-semibold tracking-[-0.02em]">
              {program.name}
            </h1>
            <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted-foreground">
              <Mono>{program.id}</Mono>
              <span className="text-border">·</span>
              <span className="truncate">{program.system}</span>
              <span className="text-border">·</span>
              <span>{program.baseline}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={runPrimary}>
              {state.primaryAction}
            </Button>
            <Button variant="secondary" className="w-8 px-0" aria-label="More actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        {/* Persistent state header: gate · days out · blocker */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-md bg-subtle px-3 py-2 text-[12.5px]">
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Gate</span>
            <Mono>{state.currentGate?.id ?? "—"}</Mono>
            <span className="truncate font-medium">{state.currentGate?.name}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Planned</span>
            <span className="tnum">{state.currentGate?.planned ?? "—"}</span>
            {state.daysOut !== null ? (
              <span
                className={
                  state.daysOut < 0
                    ? "tnum font-medium text-danger"
                    : state.daysOut < 30
                      ? "tnum font-medium text-warning"
                      : "tnum text-muted-foreground"
                }
              >
                {state.daysOut < 0
                  ? `${Math.abs(state.daysOut)}d overdue`
                  : `${state.daysOut}d out`}
              </span>
            ) : null}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="text-muted-foreground">Blocker</span>
            {state.blocker ? (
              <Badge tone={state.blockerTone === "danger" ? "danger" : "warning"}>
                {state.blocker}
              </Badge>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-muted-foreground">Status</span>
            <Badge tone={programStatusTone[program.status]}>{program.status}</Badge>
          </span>
        </div>

        {/* Stage tabs run the full width; the rail's left rule meets this line */}
        <div className="flex items-center gap-4 border-b border-border">
          {stages.map((s) => {
            const status = state.stageStatus[s];
            const active = s === stage;
            return (
              <button key={s} onClick={() => setStage(s)}>
                <span
                  className={
                    active
                      ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                      : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {s}
                  {status === "locked" ? <Lock className="size-3 opacity-60" /> : null}
                  {status === "current" && !active ? <Dot tone="info" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className={stage === "Scope" ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 space-y-7 pt-6 lg:pr-6">
            {locked ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-[12.5px] text-muted-foreground">
                <Lock className="size-3.5" />
                Preview — the program reaches {stage} after {state.currentGate?.id}. Records here
                are read-only until then.
              </div>
            ) : null}

            {stage === "Scope" ? (
              <>
                <TailoringSection programId={program.id} programOwner={program.owner} />

                <Section
                  title="Control families"
                  description="Coverage of the tailored baseline by NIST 800-53 family."
                >
                  <Table>
                    <thead>
                      <tr>
                        <Th className="w-[56px]">ID</Th>
                        <Th>Family</Th>
                        <Th className="w-[64px] text-right">Total</Th>
                        <Th className="w-[80px] text-right">Satisfied</Th>
                        <Th className="w-[64px] text-right">Other</Th>
                        <Th className="w-[80px] text-right">Inherited</Th>
                        <Th className="w-[132px]">Coverage</Th>
                        <Th className="w-[120px]">Owner</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {controlFamilies.map((f) => {
                        const cov = Math.round((f.satisfied / f.total) * 100);
                        return (
                          <Tr key={f.id}>
                            <Td className="w-[56px]">
                              <Mono>{f.id}</Mono>
                            </Td>
                            <Td className="font-medium">{f.name}</Td>
                            <Td className="tnum w-[64px] text-right text-muted-foreground">{f.total}</Td>
                            <Td className="tnum w-[80px] text-right text-muted-foreground">{f.satisfied}</Td>
                            <Td className="tnum w-[64px] text-right text-muted-foreground">{f.other}</Td>
                            <Td className="tnum w-[80px] text-right text-muted-foreground">{f.inherited}</Td>
                            <Td className="w-[132px]">
                              <span className="flex items-center gap-2">
                                <span className="w-14">
                                  <Meter
                                    value={cov}
                                    tone={cov >= 95 ? "success" : cov >= 80 ? "info" : "warning"}
                                  />
                                </span>
                                <span className="tnum text-muted-foreground">{cov}% satisfied</span>
                              </span>
                            </Td>
                            <Td className="w-[120px] text-muted-foreground">{f.owner}</Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Section>

                <Section title="System description">
                  <p className="max-w-3xl pt-3 text-[13px] leading-relaxed text-muted-foreground">
                    {program.summary}
                  </p>
                </Section>
              </>
            ) : null}

            {stage === "Build" ? (
              <>
                <LifecycleSection programId={program.id} programName={program.name} />
                <DigitalThreadSection programId={program.id} programName={program.name} />
              </>
            ) : null}

            {stage === "Assess" ? (
              <>
                <Section
                  title="Controls"
                  description="The tailored instance of the baseline for this system. Inherited rows resolve to a library component."
                  action={
                    <Select
                      value={family}
                      onChange={(e) => setFamily(e.target.value)}
                      className="h-7 w-[176px]"
                    >
                      <option value="All">All families</option>
                      {controlFamilies.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.id} — {f.name}
                        </option>
                      ))}
                    </Select>
                  }
                >
                  <Table className="table-fixed">
                    <colgroup>
                      <col style={{ width: "84px" }} />
                      <col />
                      <col style={{ width: "160px" }} />
                      <col style={{ width: "168px" }} />
                      <col style={{ width: "208px" }} />
                      <col style={{ width: "84px" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <Th>Control</Th>
                        <Th>Title</Th>
                        <Th>Implementation</Th>
                        <Th>Assessment</Th>
                        <Th>Source</Th>
                        <Th className="text-right">Assessed</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => {
                        const edge = inheritance.get(c.id);
                        const stale =
                          !!edge && edge.control.evidenceAge > staleThresholdDays;
                        return (
                          <Tr key={c.id}>
                            <Td>
                              <Mono>{c.id}</Mono>
                            </Td>
                            <Td className="truncate font-medium">{c.title}</Td>
                            <Td className="truncate text-muted-foreground">{c.implementation}</Td>
                            <Td>
                              {/* Exception-only colour: plain text when healthy */}
                              {c.assessment === "Other than satisfied" ? (
                                <Badge tone="danger">Other than satisfied</Badge>
                              ) : (
                                <span className="text-muted-foreground">{c.assessment}</span>
                              )}
                            </Td>
                            <Td className="truncate">
                              {edge ? (
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <InheritChip component={edge.component} stale={stale} />
                                  {edge.component.sourceProgramId &&
                                  !edge.component.sourceAccessible ? (
                                    <Lock
                                      className="size-3 shrink-0 text-muted-foreground"
                                      aria-label="Source system not in your enclave"
                                    />
                                  ) : null}
                                </span>
                              ) : (
                                <Mono className="text-muted-foreground">{c.source}</Mono>
                              )}
                            </Td>
                            <Td className="tnum text-right text-muted-foreground">{c.assessed}</Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Section>

                <VerificationSection programName={program.name} />

                <PoamSection
                  programId={program.id}
                  programName={program.name}
                  defaultOwner={program.owner}
                />
              </>
            ) : null}

            {stage === "Authorize" ? (
              <AuthorizationSection programId={program.id} programName={program.name} />
            ) : null}

            {stage === "Operate" ? (
              <Section
                title="Activity"
                description="Continuous monitoring events and record changes for this program."
              >
                <ol className="pt-1">
                  {programTimeline.map((e) => (
                    <li
                      key={e.title}
                      className="flex gap-3 border-b border-border/70 py-2.5 last:border-0"
                    >
                      <span className="mt-1.5">
                        <Dot tone={e.tone} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{e.title}</span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{e.actor}</span>
                      <span className="tnum w-[104px] shrink-0 text-right text-[12px] text-muted-foreground">
                        {e.time}
                      </span>
                    </li>
                  ))}
                </ol>
              </Section>
            ) : null}
          </div>

          {/* Right rail — Scope stage only, border meets the tabs rule */}
          {stage === "Scope" ? (
            <aside className="pt-6 lg:border-l lg:border-border lg:pl-6">
              <RailGroup
                title="Properties"
                action={
                  <button
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Edit properties"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                }
              >
                <KeyValue label="Program ID">
                  <Mono>{program.id}</Mono>
                </KeyValue>
                <KeyValue label="Acronym">
                  <Mono>{program.acronym}</Mono>
                </KeyValue>
                <KeyValue label="System type">{program.type}</KeyValue>
                <KeyValue label="Environment">{program.environment}</KeyValue>
                <KeyValue label="Owner">{program.owner}</KeyValue>
              </RailGroup>

              <RailGroup title="Authorization">
                <KeyValue label="Baseline">{program.baseline}</KeyValue>
                <KeyValue label="Assessor">{program.assessor}</KeyValue>
                <KeyValue label="AO">{program.authorizingOfficial}</KeyValue>
                <KeyValue label="Authorized">{program.authorized}</KeyValue>
                <KeyValue label="Expires">{program.expires}</KeyValue>
                <KeyValue label="Updated">{program.updated}</KeyValue>
              </RailGroup>

              <RailGroup title="Inherits from">
                <div className="space-y-1.5 text-[12.5px]">
                  {[...new Set([...inheritance.values()].map((v) => v.component))].map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <Link
                        to="/library/components"
                        search={{ component: c.key }}
                        className="truncate text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.sourceProgramId && !c.sourceAccessible ? (
                        <Lock
                          className="size-3 shrink-0 text-muted-foreground"
                          aria-label="Source system not in your enclave"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </RailGroup>

              <RailGroup title="Linked records">
                <div className="space-y-1 text-[12.5px]">
                  <Link to="/risks" className="block text-primary hover:underline">
                    3 linked risks
                  </Link>
                  <Link to="/controls" className="block text-primary hover:underline">
                    Control library mappings
                  </Link>
                  <Link to="/evidence" className="block text-primary hover:underline">
                    128 evidence artifacts
                  </Link>
                </div>
              </RailGroup>
            </aside>
          ) : null}
        </div>
      </div>

      <CdrPackageModal
        open={cdrOpen}
        onClose={() => setCdrOpen(false)}
        programId={program.id}
        programName={program.name}
      />

      <Modal
        open={assessing}
        onClose={() => setAssessing(false)}
        title="Record a control assessment"
        description={`${program.id} · ${program.baseline}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssessing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setAssessing(false)}>
              Save assessment
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Control">
              <Select defaultValue="AC-6(9)">
                {programControls.map((c) => (
                  <option key={c.id}>{c.id}</option>
                ))}
              </Select>
            </Field>
            <Field label="Result">
              <Select defaultValue="Other than satisfied">
                <option>Satisfied</option>
                <option>Other than satisfied</option>
                <option>Not applicable</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assessment method">
              <Select defaultValue="Test">
                <option>Examine</option>
                <option>Interview</option>
                <option>Test</option>
              </Select>
            </Field>
            <Field label="Assessed on">
              <Input type="date" defaultValue="2026-08-27" />
            </Field>
          </div>
          <Field label="Assessor findings" hint="Included verbatim in the SAR export.">
            <Textarea placeholder="Privileged function invocations on the settlement service are not forwarded to the audit sink; sampling of 20 events found 6 missing." />
          </Field>
        </div>
      </Modal>
    </Shell>
  );
}
