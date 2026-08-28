import { Link } from "@tanstack/react-router";
import { Lock, Share2 } from "lucide-react";

import { Badge, Mono, Table, Td, Th, Tr } from "@/components/app/ui";
import {
  staleThresholdDays,
  type SystemComponent,
} from "@/lib/reusable-components";

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
      <span className="truncate font-mono text-[11.5px]">{component.key}</span>
      {stale ? <span className="shrink-0 text-warning">· stale</span> : null}
    </>
  );

  return (
    <Link
      to="/library/components"
      search={{ component: component.key }}
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
          <Th>Program</Th>
          <Th>Name</Th>
          <Th>System</Th>
          <Th className="text-right">Controls</Th>
          <Th className="text-right">Last sync</Th>
        </tr>
      </thead>
      <tbody>
        {component.consumers.map((c) => (
          <Tr key={c.programId}>
            <Td>
              <Mono>{c.programId}</Mono>
            </Td>
            <Td className="truncate">
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
            </Td>
            <Td className="truncate text-muted-foreground">
              {c.accessible ? <Mono className="text-muted-foreground">{c.system}</Mono> : "—"}
            </Td>
            <Td className="tnum text-right text-muted-foreground">{c.controls}</Td>
            <Td className="tnum text-right text-muted-foreground">{c.lastSync}</Td>
          </Tr>
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
          <Th>Control</Th>
          <Th>Title</Th>
          <Th>Model</Th>
          <Th>Evidence</Th>
          <Th className="text-right">Age</Th>
        </tr>
      </thead>
      <tbody>
        {component.controls.map((c) => {
          const stale = c.evidenceAge > staleThresholdDays;
          return (
            <Tr key={c.id}>
              <Td>
                <Mono>{c.id}</Mono>
              </Td>
              <Td className="truncate font-medium">{c.title}</Td>
              <Td className="text-muted-foreground">{c.model}</Td>
              <Td className="truncate text-muted-foreground">{c.evidence}</Td>
              <Td className="tnum whitespace-nowrap text-right">
                {stale ? (
                  <Badge tone="warning">{c.evidenceAge}d</Badge>
                ) : (
                  <span className="text-muted-foreground">{c.evidenceAge}d</span>
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
