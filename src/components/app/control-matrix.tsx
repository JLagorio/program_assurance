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
  Button,
  NativeSelect,
  Table,
  Toolbar,
  Id,
  Progress,
  Editable,
} from "@/ds/primitives";
import { Empty, Section } from "@/ds/patterns";
import { cn } from "@/lib/utils";
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

export function FamilyCoverageTable({
  coverage,
  onSelectFamily,
}: {
  coverage: Coverage;
  onSelectFamily: (family: string) => void;
}) {
  return (
    <Section
      title="Coverage by control family"
      description="Live rollup of the tailored baseline. Click a family to filter the matrix."
      action={
        <span className="tnum text-12 text-muted-foreground">
          {coverage.satisfied}/{coverage.total} satisfied · {coverage.pct}%
        </span>
      }
    >
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "56px" }} />
          <col />
          <col style={{ width: "72px" }} />
          <col style={{ width: "84px" }} />
          <col style={{ width: "72px" }} />
          <col style={{ width: "104px" }} />
          <col style={{ width: "84px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "140px" }} />
        </colgroup>
        <thead>
          <tr>
            <Table.Header>ID</Table.Header>
            <Table.Header>Family</Table.Header>
            <Table.Header className="text-right">Total</Table.Header>
            <Table.Header className="text-right">Satisfied</Table.Header>
            <Table.Header className="text-right">Partial</Table.Header>
            <Table.Header className="text-right">Other</Table.Header>
            <Table.Header className="text-right">Inherited</Table.Header>
            <Table.Header>Coverage</Table.Header>
            <Table.Header>Owner</Table.Header>
          </tr>
        </thead>
        <tbody>
          {[...coverage.families]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((f) => (
              <Table.Row
                key={f.id}
                className="cursor-pointer"
                onClick={() => onSelectFamily(f.id)}
                title={`Filter the matrix to ${f.id}`}
              >
                <Table.Cell>
                  <Id>{f.id}</Id>
                </Table.Cell>
                <Table.Cell className="truncate">{f.name}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.total}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.satisfied}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.partial}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.other}</Table.Cell>
                <Table.Cell className="tnum text-right">{f.inherited}</Table.Cell>
                <Table.Cell>
                  <span className="flex items-center gap-2">
                    <span className="w-20">
                      <Progress.Stacked
                        height={4}
                        segments={[
                          { key: "s", value: f.satisfied, tone: "success" },
                          { key: "p", value: f.partial, tone: "warning" },
                          { key: "o", value: f.other, tone: "danger" },
                          { key: "n", value: f.notAssessed, tone: "neutral" },
                        ]}
                      />
                    </span>
                    <span className="tnum text-12 text-muted-foreground">{f.pct}%</span>
                  </span>
                </Table.Cell>
                <Table.Cell className="truncate">{f.owner}</Table.Cell>
              </Table.Row>
            ))}
        </tbody>
      </Table>
    </Section>
  );
}

/**
 * The findings that knocked this control down. One finding links straight to
 * the finding record; several link to the control's Findings tab.
 */
function FindingsCell({ programId, row }: { programId: string; row: ControlRow }) {
  if (row.findings.length === 0) return <span className="text-muted-foreground">—</span>;

  const label = row.openFindings > 0 ? `${row.openFindings} open` : `${row.findings.length} closed`;

  if (row.findings.length === 1) {
    const only = row.findings[0]!;
    return (
      <Link
        to="/findings/$findingId"
        params={{ findingId: only.id }}
        className="hover:underline"
        title={only.title}
      >
        <Id className={row.openFindings ? "text-legacy-danger" : "text-muted-foreground"}>{only.id}</Id>
      </Link>
    );
  }

  return (
    <Link
      to="/programs/$programId/controls/$controlId"
      params={{ programId, controlId: row.id }}
      search={{ tab: "Assessment" as const }}
      className={cn(
        "tnum text-12 hover:underline",
        row.openFindings ? "text-legacy-danger" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
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
      description="Every tailored control with its assessment, remediation section and next action."
      action={
        <span className="tnum text-12 text-muted-foreground">
          {filtered.length} of {rows.length} controls
        </span>
      }
    >
      <Toolbar
        search={query}
        onSearch={setQuery}
        placeholder="Search controls"
        actions={
          <span className="flex w-[220px] items-center gap-2">
            <Progress.Stacked
              height={4}
              segments={scoped.segments.map((s) => ({ key: s.key, value: s.value, tone: s.tone }))}
            />
            <span className="tnum shrink-0 text-12 text-muted-foreground">{scoped.pct}%</span>
          </span>
        }
      >
        <NativeSelect
          value={family}
          onChange={(e) => {
            onFamily(e.target.value);
            setLimit(PAGE);
          }}
          className="h-7 w-[188px]"
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
          className="h-7 w-[176px]"
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
            <colgroup>
              <col style={{ width: "92px" }} />
              <col />
              <col style={{ width: "176px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "116px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "168px" }} />
              <col style={{ width: "112px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>Control</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header>Implementation</Table.Header>
                <Table.Header>Findings</Table.Header>
                <Table.Header>POA&M</Table.Header>
                <Table.Header>Next action</Table.Header>
                <Table.Header className="text-right">Due</Table.Header>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: r.id }}
                      className="hover:underline"
                    >
                      <Id className="text-primary">{r.id}</Id>
                    </Link>
                  </Table.Cell>
                  <Table.Cell className="truncate" title={r.title}>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: r.id }}
                      className="hover:underline"
                    >
                      {r.title}
                    </Link>
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
                      <Link
                        to="/register/poam/$poamId"
                        params={{ poamId: r.poam }}
                        className="text-primary hover:underline"
                      >
                        <Id className="text-primary">{r.poam}</Id>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="overflow-visible">
                    <Editable.Text
                      value={r.nextAction}
                      placeholder="Add next action"
                      onChange={(next) => updateControl(programId, r.id, { nextAction: next })}
                      save={save(r.id, "nextAction")}
                    />
                  </Table.Cell>
                  <Table.Cell className="tnum overflow-visible text-right">
                    <Editable.Text
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
            <div className="pt-2">
              <Button size="small" variant="subtle" onClick={() => setLimit(limit + PAGE)}>
                Show {Math.min(PAGE, filtered.length - visible.length)} more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
