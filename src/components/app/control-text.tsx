/**
 * Renderers for verbatim catalog text.
 *
 * SP 800-53 statements and SP 800-53A objectives are nested lists with their
 * own label scheme (a. → 1. → (a)), and the labels carry meaning — an assessor
 * cites AC-02(03)(a), not "the first bullet". These components keep the label
 * in a hanging column so the prose stays in one readable measure.
 */

import type { ReactNode } from "react";

import { Badge, Table, Id } from "@/ds/primitives";
import { cn } from "@/lib/utils";
import type {
  NistMethod,
  NistObjective,
  NistParameter,
  NistReference,
  NistStatementItem,
} from "@/lib/nist-catalog";

/** Assignment / Selection brackets, set apart from the surrounding sentence. */
export function ControlStatement({ children }: { children: string }) {
  const parts = children.split(/(\[(?:Assignment|Selection)[^\]]*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[(Assignment|Selection)/.test(part) ? (
          <span key={i} className="text-muted-foreground">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function StatementList({
  items,
  depth = 0,
}: {
  items: NistStatementItem[];
  depth?: number;
}) {
  if (items.length === 0) return null;
  return (
    <ol className={cn("max-w-3xl space-y-1.5 text-[13px] leading-relaxed", depth > 0 && "pt-1.5")}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            className={cn(
              "shrink-0 tabular-nums font-medium text-muted-foreground",
              depth === 0 ? "w-4" : "w-6",
            )}
          >
            {item.label ?? ""}
          </span>
          <div className="min-w-0">
            <ControlStatement>{item.prose}</ControlStatement>
            {item.items?.length ? <StatementList items={item.items} depth={depth + 1} /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ObjectiveList({ items, depth = 0 }: { items: NistObjective[]; depth?: number }) {
  if (items.length === 0) return null;
  return (
    <ol className={cn("max-w-3xl space-y-1.5 text-[13px] leading-relaxed", depth > 0 && "pt-1.5")}>
      {items.map((item, i) => (
        <li key={item.label || i} className="flex gap-3">
          <Id className="w-[132px] shrink-0 text-11 text-muted-foreground">{item.label}</Id>
          <div className="min-w-0">
            {item.prose ? <ControlStatement>{item.prose}</ControlStatement> : null}
            {item.items?.length ? <ObjectiveList items={item.items} depth={depth + 1} /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

const methodTone = {
  Examine: "neutral",
  Interview: "information",
  Test: "warning",
} as const;

export function MethodList({ methods }: { methods: NistMethod[] }) {
  if (methods.length === 0) return null;
  return (
    <div className="pt-1">
      {methods.map((m) => (
        <div key={m.method} className="flex gap-3 border-b border-border-legacy-subtle py-2 last:border-0">
          <span className="w-[92px] shrink-0 pt-0.5">
            <Badge tone={methodTone[m.method]} size="xsmall">
              {m.method}
            </Badge>
          </span>
          <p className="min-w-0 text-[12.5px] leading-relaxed text-muted-foreground">
            {m.objects.join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ParameterTable({ params }: { params: NistParameter[] }) {
  if (params.length === 0) {
    return (
      <p className="pt-2 text-[13px] text-muted-foreground">
        This control carries no organization-defined parameters.
      </p>
    );
  }
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "156px" }} />
        <col style={{ width: "88px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Parameter</Table.Header>
          <Table.Header>Kind</Table.Header>
          <Table.Header>Value the program must set</Table.Header>
        </tr>
      </thead>
      <tbody>
        {params.map((p) => (
          <Table.Row key={p.id}>
            <Table.Cell>
              <Id className="text-11">{p.id}</Id>
            </Table.Cell>
            <Table.Cell>{p.kind}</Table.Cell>
            <Table.Cell>
              {p.guideline ? `${p.guideline[0]!.toUpperCase()}${p.guideline.slice(1)}.` : p.value}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

export function ReferenceList({ references }: { references: NistReference[] }) {
  if (references.length === 0) return null;
  return (
    <p className="text-[12.5px] leading-relaxed text-muted-foreground">
      {references.map((r, i) => (
        <span key={r.title}>
          {i > 0 && " · "}
          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {r.title}
            </a>
          ) : (
            r.title
          )}
        </span>
      ))}
    </p>
  );
}

/** Small labelled block used down the assessment tab. */
export function TextBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-border-legacy-subtle py-2 last:border-0">
      <span className="w-[132px] shrink-0 text-12 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-[12.5px] leading-relaxed">{children}</div>
    </div>
  );
}
