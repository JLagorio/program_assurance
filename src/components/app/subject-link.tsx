import { Link } from "@tanstack/react-router";

import { Id, Inline } from "@ledger/design-system";

import type { Subject } from "@/lib/activity";

/* The record a task or an entry sits on, as a link to its page. Shared by the task rows, the
   task table, the feed and the task record, so it lives on its own and nothing imports in a ring. */

/** The record a task or an entry sits on, as a link to its page. */
export function SubjectLink({ subject, program }: { subject: Subject; program: string | null }) {
  const id = <Id>{subject.id}</Id>;
  if (!program) return id;
  switch (subject.kind) {
    case "control":
      return (
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId: program, controlId: subject.id }}
          search={{ tab: undefined }}
        >
          {id}
        </Link>
      );
    case "node":
    case "scope":
      return (
        <Link
          to="/programs/$programId/components/$componentId"
          params={{ programId: program, componentId: subject.id }}
        >
          {id}
        </Link>
      );
    case "requirement":
      return (
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId: program, requirementId: subject.id }}
          search={{ tab: undefined }}
        >
          {id}
        </Link>
      );
    case "program":
      return (
        <Link
          to="/programs/$programId"
          params={{ programId: program }}
          search={{ tab: undefined, peek: undefined }}
        >
          {id}
        </Link>
      );
    case "finding":
      return (
        <Link to="/findings/$findingId" params={{ findingId: subject.id }}>
          {id}
        </Link>
      );
    case "task":
      return (
        <Link to="/tasks/$taskId" params={{ taskId: subject.id }}>
          {id}
        </Link>
      );
    default:
      return id;
  }
}

/** Id and name, inline: where a task sits when the list spans records. */
export function SubjectWords({ subject, program }: { subject: Subject; program: string | null }) {
  return (
    <Inline as="span" space="space.050" alignBlock="center">
      <SubjectLink subject={subject} program={program} />
      {subject.label ? <span className="truncate">{subject.label}</span> : null}
    </Inline>
  );
}
