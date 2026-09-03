/**
 * Renderers for verbatim catalog text.
 *
 * SP 800-53 statements and SP 800-53A objectives are nested lists with their
 * own label scheme (a. → 1. → (a)), and the labels carry meaning — an assessor
 * cites AC-02(03)(a), not "the first bullet". These components keep the label
 * in a hanging column so the prose stays in one readable measure.
 */

import type { ReactNode } from "react";

import { Badge, Box, Id, Inline, Stack, Table, TextLink } from "@ledger/design-system";
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
          <span key={i} className="text-subtle">
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
    <Stack
      className={cn("max-w-layout-measure font-body", depth > 0 && "pt-075")}
      as="ol"
      space="space.075"
    >
      {items.map((item, i) => (
        <Inline key={i} as="li" space="space.100">
          <span
            className={cn(
              "shrink-0 tabular-nums font-medium text-subtle",
              depth === 0 ? "w-200" : "w-300",
            )}
          >
            {item.label ?? ""}
          </span>
          <div className="min-w-0">
            <ControlStatement>{item.prose}</ControlStatement>
            {item.items?.length ? <StatementList items={item.items} depth={depth + 1} /> : null}
          </div>
        </Inline>
      ))}
    </Stack>
  );
}

export function ObjectiveList({ items, depth = 0 }: { items: NistObjective[]; depth?: number }) {
  if (items.length === 0) return null;
  return (
    <Stack
      className={cn("max-w-layout-measure font-body", depth > 0 && "pt-075")}
      as="ol"
      space="space.075"
    >
      {items.map((item, i) => (
        <Inline key={item.label || i} as="li" space="space.150">
          <Id className="shrink-0 font-body-xsmall text-subtle" style={{ width: 132 }}>
            {item.label}
          </Id>
          <div className="min-w-0">
            {item.prose ? <ControlStatement>{item.prose}</ControlStatement> : null}
            {item.items?.length ? <ObjectiveList items={item.items} depth={depth + 1} /> : null}
          </div>
        </Inline>
      ))}
    </Stack>
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
    <Box paddingBlockStart="space.050">
      {methods.map((m) => (
        <Inline
          key={m.method}
          className="border-b border-default py-100 last:border-0"
          space="space.150"
        >
          <Box className="shrink-0" as="span" paddingBlockStart="space.025" style={{ width: 92 }}>
            <Badge tone={methodTone[m.method]} size="xsmall">
              {m.method}
            </Badge>
          </Box>
          <p className="min-w-0 font-body-small text-subtle">{m.objects.join(" · ")}</p>
        </Inline>
      ))}
    </Box>
  );
}

export function ParameterTable({ params }: { params: NistParameter[] }) {
  if (params.length === 0) {
    return (
      <p className="pt-100 font-body text-subtle">
        This control carries no organization-defined parameters.
      </p>
    );
  }
  return (
    <Table className="table-fixed">
      <thead>
        <tr>
          <Table.Header width={156}>Parameter</Table.Header>
          <Table.Header width={88}>Kind</Table.Header>
          <Table.Header>Value the program must set</Table.Header>
        </tr>
      </thead>
      <tbody>
        {params.map((p) => (
          <Table.Row key={p.id}>
            <Table.Cell>
              <Id className="font-body-xsmall">{p.id}</Id>
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
    <p className="font-body-small text-subtle">
      {references.map((r, i) => (
        <span key={r.title}>
          {i > 0 && " · "}
          {r.url ? (
            <TextLink>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
            </TextLink>
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
    <Inline className="border-b border-default py-100 last:border-0" space="space.150">
      <span className="shrink-0 font-body-small text-subtle" style={{ width: 132 }}>
        {label}
      </span>
      <div className="min-w-0 font-body-small">{children}</div>
    </Inline>
  );
}
