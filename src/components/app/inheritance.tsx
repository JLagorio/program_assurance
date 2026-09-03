import { Link } from "@tanstack/react-router";
import { Lock, Share2 } from "lucide-react";

import { Badge, Id, Inline, Table } from "@ledger/design-system";
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
      <Share2 className="shrink-0 opacity-disabled size-150" strokeWidth={2} />
      <span className="truncate font-body-xsmall">{component.key}</span>
      {stale ? <span className="shrink-0 text-warning">· stale</span> : null}
    </>
  );

  return (
    <Link
      to="/library/components/$componentKey"
      params={{ componentKey: component.key }}
      className="inline-flex max-w-full items-center gap-050 rounded-small border border-default bg-surface-sunken px-075 py-025 font-body-xsmall text-subtle transition-colors hover:border-brand hover:text-brand"
      title={`Inherited from ${component.name}`}
    >
      {label}
    </Link>
  );
}

/** Enclave-safe provenance: status is visible, the source program is not walkable. */
export function RestrictedSourceNote({ component }: { component: SystemComponent }) {
  return (
    <Inline
      className="font-body-small text-subtle"
      as="span"
      display="inline-flex"
      space="space.050"
      alignBlock="center"
    >
      <Lock className="size-150" /> Source system not in your enclave — status and provenance only
    </Inline>
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
                  className="font-medium text-brand hover:underline"
                >
                  {c.programName}
                </Link>
              ) : (
                <Inline
                  className="text-subtle"
                  as="span"
                  display="inline-flex"
                  space="space.075"
                  alignBlock="center"
                >
                  <Lock className="size-150" /> Not in your enclave
                </Inline>
              )}
            </Table.Cell>
            <Table.Cell className="truncate">{c.accessible ? <Id>{c.system}</Id> : "—"}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{c.controls}</Table.Cell>
            <Table.Cell className="tabular-nums text-right">{c.lastSync}</Table.Cell>
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
              <Table.Cell className="tabular-nums whitespace-nowrap text-right">
                {stale ? (
                  <Badge tone="warning">{c.evidenceAge}d</Badge>
                ) : (
                  <span className="text-subtle">{c.evidenceAge}d</span>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}
