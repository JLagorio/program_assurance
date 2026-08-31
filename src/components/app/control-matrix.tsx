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
  EmptyState,
  Mono,
  Section,
  Select,
  StackedBar,
  Table,
  Td,
  Th,
  Toolbar,
  Tr,
} from "@/components/app/ui";
import { InlineSelect, InlineText } from "@/components/app/inline-edit";
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
            <Th>ID</Th>
            <Th>Family</Th>
            <Th className="text-right">Total</Th>
            <Th className="text-right">Satisfied</Th>
            <Th className="text-right">Partial</Th>
            <Th className="text-right">Other</Th>
            <Th className="text-right">Inherited</Th>
            <Th>Coverage</Th>
            <Th>Owner</Th>
          </tr>
        </thead>
        <tbody>
          {[...coverage.families]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((f) => (
              <Tr
                key={f.id}
                className="cursor-pointer"
                onClick={() => onSelectFamily(f.id)}
                title={`Filter the matrix to ${f.id}`}
              >
                <Td>
                  <Mono>{f.id}</Mono>
                </Td>
                <Td className="truncate font-medium">{f.name}</Td>
                <Td className="tnum text-right text-muted-foreground">{f.total}</Td>
                <Td className="tnum text-right text-muted-foreground">{f.satisfied}</Td>
                <Td className="tnum text-right text-muted-foreground">{f.partial}</Td>
                <Td className="tnum text-right text-muted-foreground">{f.other}</Td>
                <Td className="tnum text-right text-muted-foreground">{f.inherited}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <span className="w-20">
                      <StackedBar
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
                </Td>
                <Td className="truncate text-muted-foreground">{f.owner}</Td>
              </Tr>
            ))}
        </tbody>
      </Table>
    </Section>
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
        (!q || r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)),
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
            <StackedBar
              height={4}
              segments={scoped.segments.map((s) => ({ key: s.key, value: s.value, tone: s.tone }))}
            />
            <span className="tnum shrink-0 text-12 text-muted-foreground">{scoped.pct}%</span>
          </span>
        }
      >
        <Select
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
        </Select>
        <Select
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
        </Select>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No controls match this filter"
          description="Clear the search or pick another family."
          action={
            <Button
              size="sm"
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
              <col style={{ width: "108px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "196px" }} />
              <col style={{ width: "112px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Control</Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Implementation</Th>
                <Th>POA&M</Th>
                <Th>Next action</Th>
                <Th className="text-right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: r.id }}
                      className="hover:underline"
                    >
                      <Mono className="text-primary">{r.id}</Mono>
                    </Link>
                  </Td>
                  <Td className="truncate font-medium" title={r.title}>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: r.id }}
                      className="hover:underline"
                    >
                      {r.title}
                    </Link>
                    {r.openFindings > 0 ? (
                      <span className="tnum ml-1.5 text-11 text-danger">{r.openFindings} open</span>
                    ) : null}
                  </Td>
                  <Td className="overflow-visible">
                    <InlineSelect<ControlStatus>
                      label="Assessment"
                      options={controlStatuses}
                      value={r.status}
                      onChange={(next) => updateControl(programId, r.id, { status: next })}
                      save={save(r.id, "status")}
                      render={(v) => <Badge tone={controlStatusTone[v]}>{v}</Badge>}
                    />
                  </Td>
                  <Td className="truncate text-muted-foreground" title={r.source}>
                    {r.implementation}
                  </Td>
                  <Td>
                    {r.poam ? (
                      <Link
                        to="/register/poam/$poamId"
                        params={{ poamId: r.poam }}
                        className="text-primary hover:underline"
                      >
                        <Mono className="text-primary">{r.poam}</Mono>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="overflow-visible">
                    <InlineText
                      value={r.nextAction}
                      placeholder="Add next action"
                      onChange={(next) => updateControl(programId, r.id, { nextAction: next })}
                      save={save(r.id, "nextAction")}
                    />
                  </Td>
                  <Td className="tnum overflow-visible text-right">
                    <InlineText
                      value={r.due}
                      placeholder="—"
                      onChange={(next) => updateControl(programId, r.id, { due: next })}
                      save={save(r.id, "due")}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {filtered.length > visible.length ? (
            <div className="pt-2">
              <Button size="sm" variant="ghost" onClick={() => setLimit(limit + PAGE)}>
                Show {Math.min(PAGE, filtered.length - visible.length)} more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
