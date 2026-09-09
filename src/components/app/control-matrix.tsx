import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Box,
  Button,
  Editable,
  Empty,
  Id,
  Inline,
  ProgressStacked,
  Section,
  Table,
  TextLink,
  Toolbar,
  EmptyHeader,
  EmptyContent,
  EmptyTitle,
  EmptyDescription,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  controlStatuses,
  controlStatusTone,
  updateControl,
  type ControlRow,
  type ControlStatus,
} from "@/lib/control-matrix";
import { coverageFromRows } from "@/lib/program-coverage";
import { saveProgramField } from "@/lib/program-save";
import { cn } from "@ledger/design-system/cn";

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
      <TextLink
        render={
          <Link to="/findings/$findingId" params={{ findingId: only.id }} title={only.title} />
        }
      >
        <Id className={row.openFindings ? "text-danger" : "text-subtle"}>{only.id}</Id>
      </TextLink>
    );
  }

  return (
    <TextLink
      size="small"
      className={cn("tabular-nums", row.openFindings ? "text-danger" : "text-subtle")}
      render={
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: row.id }}
          search={{ tab: "Assessment" as const }}
        />
      }
    >
      {label}
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

  const familyItems = [
    { value: "All", label: "All families" },
    ...families.map((f) => ({
      value: f.id,
      label: (
        <>
          {f.id}— {f.name}
        </>
      ),
    })),
  ];
  const statusItems = [
    { value: "All", label: "All statuses" },
    ...controlStatuses.map((s) => ({ value: s, label: s })),
  ];
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
          <Box as="span" style={{ width: 220, maxWidth: "100%" }}>
            <Inline as="span" space="space.100" alignBlock="center">
              <ProgressStacked
                size="small"
                segments={scoped.segments.map((s) => ({
                  key: s.key,
                  value: s.value,
                  tone: s.tone,
                }))}
              ></ProgressStacked>
              <span className="tabular-nums shrink-0 font-body-small text-subtle">
                {scoped.pct}%
              </span>
            </Inline>
          </Box>
        }
      >
        <Select<string>
          items={familyItems}
          value={family}
          onValueChange={(value) => {
            if (value === null) return;
            onFamily(value);
            setLimit(PAGE);
          }}
        >
          <SelectTrigger
            className={"w-full " + "h-control-small"}
            aria-label="Control family"
            style={{ width: 188, maxWidth: "100%" }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {familyItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select<string>
          items={statusItems}
          value={status}
          onValueChange={(value) => {
            if (value === null) return;
            onStatus(value as ControlStatus | "All");
            setLimit(PAGE);
          }}
        >
          <SelectTrigger
            className={"w-full " + "h-control-small"}
            aria-label="Control status"
            style={{ width: 176, maxWidth: "100%" }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No controls match this filter</EmptyTitle>
            <EmptyDescription>Clear the search or pick another family.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
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
          </EmptyContent>
        </Empty>
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
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId, controlId: r.id }}
                        />
                      }
                    >
                      <Id>{r.id}</Id>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="truncate" title={r.title}>
                    <TextLink
                      render={
                        <Link
                          to="/programs/$programId/controls/$controlId"
                          params={{ programId, controlId: r.id }}
                        />
                      }
                    >
                      {r.title}
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="overflow-visible">
                    <Editable.Select<ControlStatus>
                      label="Assessment"
                      options={controlStatuses}
                      value={r.status}
                      onChange={(next) => updateControl(programId, r.id, { status: next })}
                      save={save(r.id, "status")}
                      render={(v) => (
                        <Badge variant="secondary" tone={controlStatusTone[v]}>
                          {v}
                        </Badge>
                      )}
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
                      <TextLink
                        render={<Link to="/register/poam/$poamId" params={{ poamId: r.poam }} />}
                      >
                        <Id>{r.poam}</Id>
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
