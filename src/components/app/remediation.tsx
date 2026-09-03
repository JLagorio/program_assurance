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

import {
  Badge,
  Box,
  Grid,
  Id,
  Inline,
  Person,
  Progress,
  Section,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";
import { planDay, spanDays, taskStatusTone, type RemediationPlan } from "@/lib/remediation";
import { statusTone } from "@/lib/spine";

const barTone: Record<string, string> = {
  Complete: "bg-success-bold",
  "In progress": "bg-brand-bold",
  Blocked: "bg-danger-bold",
  Planned: "bg-neutral-bold",
};

function PoamLink({ id }: { id: string }) {
  return (
    <TextLink>
      <Link to="/register/poam/$poamId" params={{ poamId: id }}>
        <Id>{id}</Id>
      </Link>
    </TextLink>
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
          <Inline as="span" space="space.100" alignBlock="center">
            {plan.poam ? <PoamLink id={plan.poam.id} /> : null}
            <Badge
              tone={
                plan.status === "Complete"
                  ? "success"
                  : plan.status === "Blocked"
                    ? "danger"
                    : plan.status === "Accepted"
                      ? "neutral"
                      : "information"
              }
            >
              {plan.status}
            </Badge>
          </Inline>
        }
      >
        <Stack className="pt-150" space="space.150">
          <p className="max-w-layout-measure font-body">{plan.approach}</p>

          <Grid
            columnGap="space.400"
            rowGap="space.100"
            templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }}
          >
            <StackedFact label="Plan owner">
              <Person name={plan.owner} />
            </StackedFact>
            <StackedFact label="Scheduled completion">
              <span className={cn("tabular-nums", plan.slipped && "text-warning")}>
                {plan.poam?.scheduledCompletion ?? plan.due}
              </span>
            </StackedFact>
            <StackedFact label="POA&M section">
              {plan.poam ? (
                <Inline as="span" space="space.075" alignBlock="center">
                  <PoamLink id={plan.poam.id} />
                  <Badge tone={statusTone(plan.poam.status)} size="xsmall">
                    {plan.poam.status}
                  </Badge>
                </Inline>
              ) : (
                <span className="text-subtle">Not yet opened</span>
              )}
            </StackedFact>
            <StackedFact label="Workstream">
              {plan.workstream ? (
                <TextLink>
                  <Link
                    to="/workstreams/$workstreamId"
                    params={{ workstreamId: plan.workstream.id }}
                  >
                    <Id>{plan.workstream.id}</Id>
                  </Link>
                </TextLink>
              ) : (
                <span className="text-subtle">Unassigned</span>
              )}
            </StackedFact>
          </Grid>

          <Inline className="pt-050" space="space.150" alignBlock="center">
            <span style={{ width: 160 }}>
              <Progress
                value={plan.progress}
                tone={plan.status === "Blocked" ? "danger" : "success"}
              />
            </span>
            <span className="tabular-nums font-body-small text-subtle">
              {plan.progress}% complete
            </span>
            {plan.slipped && plan.poam ? (
              <span className="tabular-nums font-body-small text-warning">
                Slipped from {plan.poam.originalCompletion}
              </span>
            ) : null}
          </Inline>

          {plan.poam?.milestoneNote ? (
            <p className="max-w-layout-measure border-s border-default ps-150 font-body-small text-subtle">
              {plan.poam.milestoneNote}
            </p>
          ) : null}
        </Stack>
      </Section>

      <Section
        title="Tasks"
        description="Each step names an owner and a date. The plan cannot close while any step is open."
      >
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={96}>Task</Table.Header>
              <Table.Header>Step</Table.Header>
              <Table.Header width={148}>Owner</Table.Header>
              <Table.Header width={104} className="text-right">
                Start
              </Table.Header>
              <Table.Header width={104} className="text-right">
                Due
              </Table.Header>
              <Table.Header width={108}>Status</Table.Header>
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell>
                  <Id className="font-body-xsmall text-subtle">{t.id}</Id>
                </Table.Cell>
                <Table.Cell>
                  <span className="block font-medium">{t.title}</span>
                  <Box
                    className="block font-body-small text-subtle"
                    as="span"
                    paddingBlockStart="space.025"
                  >
                    {t.detail}
                  </Box>
                  <Box
                    className="block font-body-xsmall text-subtle"
                    as="span"
                    paddingBlockStart="space.025"
                  >
                    Verified by: {t.verification}
                    {t.finding ? (
                      <>
                        {" · "}
                        <TextLink>
                          <Link to="/findings/$findingId" params={{ findingId: t.finding }}>
                            {t.finding}
                          </Link>
                        </TextLink>
                      </>
                    ) : null}
                  </Box>
                </Table.Cell>
                <Table.Cell className="truncate">
                  {t.ownerId ? (
                    <TextLink>
                      <Link to="/people/$personId" params={{ personId: t.ownerId }}>
                        <Person name={t.owner} />
                      </Link>
                    </TextLink>
                  ) : (
                    <Person name={t.owner} />
                  )}
                  <Box
                    className="block font-body-xsmall text-subtle"
                    as="span"
                    paddingBlockStart="space.025"
                  >
                    {t.role}
                  </Box>
                </Table.Cell>
                <Table.Cell className="tabular-nums text-right">{t.start}</Table.Cell>
                <Table.Cell className="tabular-nums text-right">{t.due}</Table.Cell>
                <Table.Cell>
                  <Badge tone={taskStatusTone[t.status]} size="xsmall">
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
            <TextLink size="small" className="inline-flex items-center gap-025">
              <Link to="/register/poam/$poamId" params={{ poamId: plan.poam.id }}>
                Open the POA&amp;M section
                <ChevronRight className="size-icon-small" />
              </Link>
            </TextLink>
          ) : null
        }
      >
        <Box className="overflow-x-auto" paddingBlockStart="space.150">
          <div style={{ minWidth: 560 }}>
            {plan.tasks.map((t) => {
              const left = (spanDays(plan.start, t.start) / window) * 100;
              const width = Math.max(2, (spanDays(t.start, t.due) / window) * 100);
              return (
                <Inline key={t.id} className="py-050" space="space.150" alignBlock="center">
                  <span
                    className="shrink-0 truncate font-body-small"
                    title={t.title}
                    style={{ width: 196 }}
                  >
                    {t.title}
                  </span>
                  <span className="relative min-w-0 flex-1 rounded-small bg-neutral-subtle h-200">
                    <span
                      className={cn(
                        "absolute inset-y-0 rounded-small",
                        barTone[t.status] ?? "bg-neutral-bold",
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
                        className="absolute -inset-y-025 w-px bg-danger"
                        style={{ left: `${todayPct}%` }}
                      />
                    ) : null}
                  </span>
                  <span
                    className="tabular-nums shrink-0 text-right font-body-xsmall text-subtle"
                    style={{ width: 96 }}
                  >
                    {t.due}
                  </span>
                </Inline>
              );
            })}
            <Inline className="pt-075" space="space.150" alignBlock="center">
              <span className="shrink-0" style={{ width: 196 }} />
              <Inline
                className="tabular-nums min-w-0 font-body-xsmall text-subtle"
                as="span"
                spread="space-between"
                grow="fill"
              >
                <span>{plan.start}</span>
                {todayPct !== null && todayPct >= 0 && todayPct <= 100 ? (
                  <span className="text-danger">today</span>
                ) : null}
                <span>{plan.due}</span>
              </Inline>
              <span className="shrink-0" style={{ width: 96 }} />
            </Inline>
          </div>
        </Box>
      </Section>
    </>
  );
}

function StackedFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="font-heading-xxsmall uppercase text-subtle">{label}</div>
      <Box className="truncate font-body-small" paddingBlockStart="space.025">
        {children}
      </Box>
    </div>
  );
}
