/**
 * The program control matrix — one row per tailored control, with the
 * assessment status, POA&M section, next action and due date the program
 * manages day to day. Status, next action and due date are inline-editable and
 * write back to the matrix store, so the Overview coverage band moves with them.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Badge,
  Box,
  Button,
  Editable,
  Empty,
  Id,
  Inline,
  NativeSelect,
  Progress,
  Section,
  Table,
  TextLink,
  Toolbar,
} from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";
import { saveProgramField } from "@/lib/program-save";
import {
  controlStatuses,
  controlStatusTone,
  updateControl,
  type ControlRow,
  type ControlStatus,
} from "@/lib/control-matrix";
import { coverageFromRows, type Coverage } from "@/lib/program-coverage";

const PAGE = 40;

/**
 * The findings that knocked this control down. One finding links straight to
 * the finding record; several link to the control's Findings tab.
 */
function FindingsCell({ programId, row }: { programId: string; row: ControlRow }) {
  if (row.findings.length === 0) return <span className="text-subtle">—</span>;

  const label = row.openFindings > 0 ? `${row.openFindings} open` : `${row.findings.length} closed`;

  if (row.findings.length === 1) {
    const only = row.findings[0]!;
    return (
      <TextLink>
        <Link to="/findings/$findingId" params={{ findingId: only.id }} title={only.title}>
          <Id className={row.openFindings ? "text-danger" : "text-subtle"}>{only.id}</Id>
        </Link>
      </TextLink>
    );
  }

  return (
    <TextLink
      size="small"
      className={cn("tabular-nums", row.openFindings ? "text-danger" : "text-subtle")}
    >
      <Link
        to="/programs/$programId/controls/$controlId"
        params={{ programId, controlId: row.id }}
        search={{ tab: "Assessment" as const }}
      >
        {label}
      </Link>
    </TextLink>
  );
}

export function ControlMatrixSection({
  programId,
  rows,
  family,
  onFamily,
  status,
  onStatus,
  families,
}: {
  programId: string;
  rows: ControlRow[];
  family: string;
  onFamily: (v: string) => void;
  status: ControlStatus | "All";
  onStatus: (v: ControlStatus | "All") => void;
  families: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (family === "All" || r.family === family) &&
        (status === "All" || r.status === status) &&
        (!q || r.id.toLowerCase().includes(q) || r.fullTitle.toLowerCase().includes(q)),
    );
  }, [rows, family, status, query]);

  const scoped = useMemo(() => coverageFromRows(filtered), [filtered]);
  const visible = filtered.slice(0, limit);

  const save = (id: string, field: string) => (next: string) =>
    saveProgramField({ programId, field: `${id} ${field}`, value: next });

  return (
    <Section
      title="Control matrix"
      action={
        <span className="tabular-nums font-body-small text-subtle">
          {filtered.length} of {rows.length} controls
        </span>
      }
    >
      <Toolbar
        search={query}
        onSearch={setQuery}
        placeholder="Search controls"
        actions={
          <Box as="span" style={{ width: 220 }}>
            <Inline as="span" space="space.100" alignBlock="center">
              <Progress.Stacked
                size="small"
                segments={scoped.segments.map((s) => ({
                  key: s.key,
                  value: s.value,
                  tone: s.tone,
                }))}
              />
              <span className="tabular-nums shrink-0 font-body-small text-subtle">
                {scoped.pct}%
              </span>
            </Inline>
          </Box>
        }
      >
        <NativeSelect
          value={family}
          onChange={(e) => {
            onFamily(e.target.value);
            setLimit(PAGE);
          }}
          className="h-control-small"
          style={{ width: 188 }}
        >
          <option value="All">All families</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} — {f.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={status}
          onChange={(e) => {
            onStatus(e.target.value as ControlStatus | "All");
            setLimit(PAGE);
          }}
          className="h-control-small"
          style={{ width: 176 }}
        >
          <option value="All">All statuses</option>
          {controlStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </Toolbar>

      {filtered.length === 0 ? (
        <Empty
          title="No controls match this filter"
          description="Clear the search or pick another family."
          action={
            <Button
              size="small"
              onClick={() => {
                setQuery("");
                onFamily("All");
                onStatus("All");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={92}>Control</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header width={176}>Status</Table.Header>
                <Table.Header width={96}>Implementation</Table.Header>
                <Table.Header width={116}>Findings</Table.Header>
                <Table.Header width={104}>POA&M</Table.Header>
                <Table.Header width={168}>Next action</Table.Header>
                <Table.Header width={112} className="text-right">
                  Due
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <TextLink>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: r.id }}
                      >
                        <Id>{r.id}</Id>
                      </Link>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="truncate" title={r.title}>
                    <TextLink>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: r.id }}
                      >
                        {r.title}
                      </Link>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="overflow-visible">
                    <Editable.Select<ControlStatus>
                      label="Assessment"
                      options={controlStatuses}
                      value={r.status}
                      onChange={(next) => updateControl(programId, r.id, { status: next })}
                      save={save(r.id, "status")}
                      render={(v) => <Badge tone={controlStatusTone[v]}>{v}</Badge>}
                    />
                  </Table.Cell>
                  <Table.Cell className="truncate" title={r.source}>
                    {r.implementation}
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    <FindingsCell programId={programId} row={r} />
                  </Table.Cell>
                  <Table.Cell>
                    {r.poam ? (
                      <TextLink>
                        <Link to="/register/poam/$poamId" params={{ poamId: r.poam }}>
                          <Id>{r.poam}</Id>
                        </Link>
                      </TextLink>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="overflow-visible">
                    <Editable.Text
                      label="Next action"
                      value={r.nextAction}
                      placeholder="Add next action"
                      onChange={(next) => updateControl(programId, r.id, { nextAction: next })}
                      save={save(r.id, "nextAction")}
                    />
                  </Table.Cell>
                  <Table.Cell className="tabular-nums overflow-visible text-right">
                    <Editable.Text
                      label="Due"
                      value={r.due}
                      placeholder="—"
                      onChange={(next) => updateControl(programId, r.id, { due: next })}
                      save={save(r.id, "due")}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>

          {filtered.length > visible.length ? (
            <Box paddingBlockStart="space.100">
              <Button size="small" variant="subtle" onClick={() => setLimit(limit + PAGE)}>
                Show {Math.min(PAGE, filtered.length - visible.length)} more
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </Section>
  );
}
