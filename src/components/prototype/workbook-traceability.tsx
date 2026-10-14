import { useMemo, useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spreadsheet,
  Stack,
  Text,
} from "@ledger/design-system";
import type { Workbook } from "@ledger/spreadsheet-core";
import type { AssuranceWorkbookSnapshot, MappingWorkbookChange } from "@/lib/assurance-workbook";
import { labelFor } from "@/lib/records";

/** A second projection of the same proposed traceability links; a link is never an outcome. */
export function WorkbookTraceability({
  snapshot,
  workbook,
  proposals,
  onOpen,
  actions,
}: {
  snapshot: AssuranceWorkbookSnapshot;
  workbook: Workbook;
  proposals: MappingWorkbookChange[];
  onOpen: (requirementId: string) => void;
  actions?: ReactNode;
}) {
  const [system, setSystem] = useState("all");
  const matrix = useMemo(() => {
    const sheet = workbook.sheets.find((item) => item.id === "mappings");
    const removed = new Set(
      proposals.filter((item) => item.operation === "delete").map((item) => item.id),
    );
    const links = snapshot.mappings
      .filter((link) => !removed.has(link.id))
      .map((link) => ({
        requirementId: link.requirement_id,
        controlId: link.control_id,
        controlCode: link.control_code ?? "Unavailable control",
        systemId: link.system_id,
        scope: link.system_code ?? link.scope_label,
        relationship: sheet?.cells[link.id]?.["relationship_type"]?.input ?? link.relationship_type,
        needsReview: link.needs_review,
      }));
    for (const change of proposals)
      if (change.operation === "create") {
        const requirement = snapshot.requirements.find(
          (item) => item.content_id === change.contentId,
        );
        const control = snapshot.selectedControls.find(
          (item) => item.id === change.selectedControlId,
        );
        if (requirement && control)
          links.push({
            requirementId: requirement.id,
            controlId: change.controlId,
            controlCode: control.control_code,
            systemId: change.systemId,
            scope: snapshot.systems.find((item) => item.id === change.systemId)?.code ?? "System",
            relationship: change.relationshipType,
            needsReview: false,
          });
      }
    const filtered = links.filter(
      (link) =>
        system === "all" ||
        (system === "unscoped" ? link.systemId === null : link.systemId === system),
    );
    const controls = [
      ...new Map(
        filtered.map((link) => [
          link.controlId,
          { id: link.controlId, label: link.controlCode, readOnly: true, width: 190 },
        ]),
      ).values(),
    ].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    const values = new Map<string, Record<string, string>>();
    for (const link of filtered) {
      const cells = values.get(link.requirementId) ?? {};
      const description = `${labelFor(link.relationship)} · ${link.scope}${link.needsReview ? " · Needs review" : ""}`;
      cells[link.controlId] = cells[link.controlId]
        ? `${cells[link.controlId]}; ${description}`
        : description;
      values.set(link.requirementId, cells);
    }
    return {
      columns: [
        { id: "requirement", label: "Requirement", readOnly: true, width: 200 },
        ...controls,
      ],
      rows: snapshot.requirements
        .filter((item) => values.has(item.id))
        .map((item) => ({
          id: item.id,
          values: { requirement: item.code, ...values.get(item.id) },
        })),
    };
  }, [snapshot, workbook, proposals, system]);
  return (
    <Stack space="space.200">
      <Text size="small" color="color.text.subtle">
        Each populated cell is a requirement-to-control relationship, with its recorded system
        scope. This matrix includes your staged mapping changes. Empty cells mean no mapping; a
        populated cell does not establish implementation or verification.
      </Text>
      <Spreadsheet
        label="Traceability relationship matrix"
        columns={matrix.columns}
        rows={matrix.rows}
        readOnly
        freezeFirstColumn
        onOpenRow={onOpen}
        actions={
          <>
            {actions}{" "}
            <Select value={system} onValueChange={(value) => value && setSystem(value)}>
              <SelectTrigger size="small" aria-label="Matrix scope">
                <SelectValue>
                  {system === "all"
                    ? "All recorded scopes"
                    : system === "unscoped"
                      ? "Unscoped mappings"
                      : snapshot.systems.find((item) => item.id === system)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All recorded scopes</SelectItem>
                <SelectItem value="unscoped">Unscoped mappings</SelectItem>
                {snapshot.systems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
    </Stack>
  );
}
