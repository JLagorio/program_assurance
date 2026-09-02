/**
 * The remediation plan behind a control that is not satisfied: what has to
 * happen, who owns each step, when it is due, and the POA&M section that
 * carries the commitment.
 *
 * The table is the record; the timeline is the same tasks laid on the plan
 * window so slippage against the scheduled completion is visible at a glance.
 */

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Badge, Meter, Person, Section, Table, Id } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { planDay, spanDays, taskStatusTone, type RemediationPlan } from "@/lib/remediation";
import { statusTone } from "@/lib/spine";

const barTone: Record<string, string> = {
  Complete: "bg-success",
  "In progress": "bg-primary",
  Blocked: "bg-danger",
  Planned: "bg-muted-foreground/30",
};

function PoamLink({ id }: { id: string }) {
  return (
    <Link
      to="/register/poam/$poamId"
      params={{ poamId: id }}
      className="text-primary hover:underline"
    >
      <Id className="text-primary">{id}</Id>
    </Link>
  );
}

export function RemediationPlanSection({
  plan,
  programId,
  title = "Remediation plan",
  description,
}: {
  plan: RemediationPlan;
  programId?: string;
  title?: string;
  description?: string;
}) {
  const window = spanDays(plan.start, plan.due);
  const origin = planDay(plan.start);
  const now = Date.now();
  const todayPct = origin === null ? null : ((now - origin) / (window * 86_400_000)) * 100;

  return (
    <>
      <Section
        title={title}
        description={
          description ??
          `${plan.complete} of ${plan.total} steps complete · ${plan.start} → ${plan.due}`
        }
        action={
          <span className="flex items-center gap-2">
            {plan.poam ? <PoamLink id={plan.poam.id} /> : null}
            <Badge
              tone={
                plan.status === "Complete"
                  ? "success"
                  : plan.status === "Blocked"
                    ? "danger"
                    : plan.status === "Accepted"
                      ? "neutral"
                      : "info"
              }
            >
              {plan.status}
            </Badge>
          </span>
        }
      >
        <div className="space-y-3 pt-3">
          <p className="max-w-3xl text-[13px] leading-relaxed">{plan.approach}</p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4">
            <Fact label="Plan owner">
              <Person name={plan.owner} />
            </Fact>
            <Fact label="Scheduled completion">
              <span className={cn("tnum", plan.slipped && "text-warning")}>
                {plan.poam?.scheduledCompletion ?? plan.due}
              </span>
            </Fact>
            <Fact label="POA&M section">
              {plan.poam ? (
                <span className="flex items-center gap-1.5">
                  <PoamLink id={plan.poam.id} />
                  <Badge tone={statusTone(plan.poam.status)} size="xs">
                    {plan.poam.status}
                  </Badge>
                </span>
              ) : (
                <span className="text-muted-foreground">Not yet opened</span>
              )}
            </Fact>
            <Fact label="Workstream">
              {plan.workstream ? (
                <Link
                  to="/workstreams/$workstreamId"
                  params={{ workstreamId: plan.workstream.id }}
                  className="text-primary hover:underline"
                >
                  <Id className="text-primary">{plan.workstream.id}</Id>
                </Link>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </Fact>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="w-40">
              <Meter
                value={plan.progress}
                tone={plan.status === "Blocked" ? "danger" : "success"}
              />
            </span>
            <span className="tnum text-12 text-muted-foreground">{plan.progress}% complete</span>
            {plan.slipped && plan.poam ? (
              <span className="tnum text-12 text-warning">
                Slipped from {plan.poam.originalCompletion}
              </span>
            ) : null}
          </div>

          {plan.poam?.milestoneNote ? (
            <p className="max-w-3xl border-l-2 border-border pl-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {plan.poam.milestoneNote}
            </p>
          ) : null}
        </div>
      </Section>

      <Section
        title="Tasks"
        description="Each step names an owner and a date. The plan cannot close while any step is open."
      >
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "96px" }} />
            <col />
            <col style={{ width: "148px" }} />
            <col style={{ width: "104px" }} />
            <col style={{ width: "104px" }} />
            <col style={{ width: "108px" }} />
          </colgroup>
          <thead>
            <tr>
              <Table.Header>Task</Table.Header>
              <Table.Header>Step</Table.Header>
              <Table.Header>Owner</Table.Header>
              <Table.Header className="text-right">Start</Table.Header>
              <Table.Header className="text-right">Due</Table.Header>
              <Table.Header>Status</Table.Header>
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell>
                  <Id className="text-11 text-muted-foreground">{t.id}</Id>
                </Table.Cell>
                <Table.Cell>
                  <span className="block font-medium">{t.title}</span>
                  <span className="mt-0.5 block text-12 leading-relaxed text-muted-foreground">
                    {t.detail}
                  </span>
                  <span className="mt-0.5 block text-11 text-muted-foreground">
                    Verified by: {t.verification}
                    {t.finding ? (
                      <>
                        {" · "}
                        <Link
                          to="/findings/$findingId"
                          params={{ findingId: t.finding }}
                          className="text-primary hover:underline"
                        >
                          {t.finding}
                        </Link>
                      </>
                    ) : null}
                  </span>
                </Table.Cell>
                <Table.Cell className="truncate">
                  {t.ownerId ? (
                    <Link
                      to="/people/$personId"
                      params={{ personId: t.ownerId }}
                      className="hover:underline"
                    >
                      <Person name={t.owner} />
                    </Link>
                  ) : (
                    <Person name={t.owner} />
                  )}
                  <span className="mt-0.5 block text-11 text-muted-foreground">{t.role}</span>
                </Table.Cell>
                <Table.Cell className="tnum text-right">{t.start}</Table.Cell>
                <Table.Cell className="tnum text-right">{t.due}</Table.Cell>
                <Table.Cell>
                  <Badge tone={taskStatusTone[t.status]} size="xs">
                    {t.status}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section
        title="Timeline"
        description={`${window} days from first task to the closure package.`}
        action={
          programId && plan.poam ? (
            <Link
              to="/register/poam/$poamId"
              params={{ poamId: plan.poam.id }}
              className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
            >
              Open the POA&amp;M section
              <ChevronRight className="size-3.5" />
            </Link>
          ) : null
        }
      >
        <div className="overflow-x-auto pt-3">
          <div className="min-w-[560px]">
            {plan.tasks.map((t) => {
              const left = (spanDays(plan.start, t.start) / window) * 100;
              const width = Math.max(2, (spanDays(t.start, t.due) / window) * 100);
              return (
                <div key={t.id} className="flex items-center gap-3 py-1">
                  <span className="w-[196px] shrink-0 truncate text-12" title={t.title}>
                    {t.title}
                  </span>
                  <span className="relative h-4 min-w-0 flex-1 rounded bg-muted/60">
                    <span
                      className={cn(
                        "absolute inset-y-0 rounded",
                        barTone[t.status] ?? "bg-muted-foreground/30",
                      )}
                      style={{
                        left: `${Math.min(97, Math.max(0, left))}%`,
                        width: `${Math.min(100 - Math.max(0, left), width)}%`,
                      }}
                      title={`${t.start} → ${t.due}`}
                    />
                    {todayPct !== null && todayPct >= 0 && todayPct <= 100 ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-[-2px] w-px bg-danger/70"
                        style={{ left: `${todayPct}%` }}
                      />
                    ) : null}
                  </span>
                  <span className="tnum w-[96px] shrink-0 text-right text-11 text-muted-foreground">
                    {t.due}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-3 pt-1.5">
              <span className="w-[196px] shrink-0" />
              <span className="tnum flex min-w-0 flex-1 justify-between text-11 text-muted-foreground">
                <span>{plan.start}</span>
                {todayPct !== null && todayPct >= 0 && todayPct <= 100 ? (
                  <span className="text-danger">today</span>
                ) : null}
                <span>{plan.due}</span>
              </span>
              <span className="w-[96px] shrink-0" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-11 uppercase tracking-[0.04em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[12.5px]">{children}</div>
    </div>
  );
}
