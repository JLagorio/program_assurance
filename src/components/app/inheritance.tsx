import { Link } from "@tanstack/react-router";
import { Lock, Share2 } from "lucide-react";

import { Badge, Table, Id } from "@/ds/primitives";
import { staleThresholdDays, type SystemComponent } from "@/lib/reusable-components";

/** Program → source component. One affordance, used everywhere a row is inherited. */
export function InheritChip({
  component,
  stale = false,
}: {
  component: SystemComponent;
  stale?: boolean;
}) {
  const label = (
    <>
      <Share2 className="size-3 shrink-0 opacity-70" strokeWidth={2} />
      <span className="truncate text-[11.5px]">{component.key}</span>
      {stale ? <span className="shrink-0 text-warning">· stale</span> : null}
    </>
  );

  return (
    <Link
      to="/library/components/$componentKey"
      params={{ componentKey: component.key }}
      className="inline-flex max-w-full items-center gap-1 rounded border border-border bg-subtle px-1.5 py-px text-[11.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      title={`Inherited from ${component.name}`}
    >
      {label}
    </Link>
  );
}

/** Enclave-safe provenance: status is visible, the source program is not walkable. */
export function RestrictedSourceNote({ component }: { component: SystemComponent }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
      <Lock className="size-3" /> Source system not in your enclave — status and provenance only
    </span>
  );
}

/** Component → consumers. The blast radius of a change to one definition. */
export function ConsumerTable({ component }: { component: SystemComponent }) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "88px" }} />
        <col />
        <col style={{ width: "132px" }} />
        <col style={{ width: "72px" }} />
        <col style={{ width: "112px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Program</Table.Header>
          <Table.Header>Name</Table.Header>
          <Table.Header>System</Table.Header>
          <Table.Header className="text-right">Controls</Table.Header>
          <Table.Header className="text-right">Last sync</Table.Header>
        </tr>
      </thead>
      <tbody>
        {component.consumers.map((c) => (
          <Table.Row key={c.programId}>
            <Table.Cell>
              <Id>{c.programId}</Id>
            </Table.Cell>
            <Table.Cell className="truncate">
              {c.accessible ? (
                <Link
                  to="/programs/$programId"
                  params={{ programId: c.programId }}
                  className="font-medium text-primary hover:underline"
                >
                  {c.programName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="size-3" /> Not in your enclave
                </span>
              )}
            </Table.Cell>
            <Table.Cell className="truncate">{c.accessible ? <Id>{c.system}</Id> : "—"}</Table.Cell>
            <Table.Cell className="tnum text-right">{c.controls}</Table.Cell>
            <Table.Cell className="tnum text-right">{c.lastSync}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

export function ProvidedControlsTable({ component }: { component: SystemComponent }) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "76px" }} />
        <col />
        <col style={{ width: "132px" }} />
        <col style={{ width: "168px" }} />
        <col style={{ width: "92px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Control</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header>Model</Table.Header>
          <Table.Header>Evidence</Table.Header>
          <Table.Header className="text-right">Age</Table.Header>
        </tr>
      </thead>
      <tbody>
        {component.controls.map((c) => {
          const stale = c.evidenceAge > staleThresholdDays;
          return (
            <Table.Row key={c.id}>
              <Table.Cell>
                <Id>{c.id}</Id>
              </Table.Cell>
              <Table.Cell className="truncate">{c.title}</Table.Cell>
              <Table.Cell>{c.model}</Table.Cell>
              <Table.Cell className="truncate">{c.evidence}</Table.Cell>
              <Table.Cell className="tnum whitespace-nowrap text-right">
                {stale ? (
                  <Badge tone="warning">{c.evidenceAge}d</Badge>
                ) : (
                  <span className="text-muted-foreground">{c.evidenceAge}d</span>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}
