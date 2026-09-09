import { useMemo, useState } from "react";

import { Badge, Field, Id, PickerSheet, Stack, Table, Text, Textarea } from "@ledger/design-system";

import { record } from "@/lib/activity";
import {
  mapRequirementToControl,
  requirementStateTone,
  requirementsForProgram,
} from "@/lib/requirements";

/** Map existing requirements to a control without allocating or assessing them. */
export function MapRequirementsSheet({
  open,
  onClose,
  programId,
  controlId,
  controlLabel,
  mapped,
  actor,
  scopeName,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  controlId: string;
  controlLabel: string;
  /** Requirement ids already mapped, hidden from the list. */
  mapped: string[];
  actor: string;
  scopeName?: string | undefined;
}) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [rationale, setRationale] = useState("");
  const already = useMemo(() => new Set(mapped), [mapped]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requirementsForProgram(programId)
      .filter((r) => !already.has(r.id))
      .filter((r) => !q || r.id.toLowerCase().includes(q) || r.text.toLowerCase().includes(q));
  }, [programId, already, query]);

  const toggle = (id: string) =>
    setChosen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const close = () => {
    setChosen(new Set());
    setQuery("");
    setRationale("");
    onClose();
  };

  const apply = () => {
    const ids = [...chosen];
    const done = ids.filter((id) =>
      mapRequirementToControl(id, controlId, controlLabel, rationale),
    );
    if (done.length) {
      record({
        program: programId,
        actor,
        kind: "link",
        summary: `mapped ${done.join(", ")} to ${controlId}`,
        body: rationale.trim() || undefined,
        subject: { kind: "control", id: controlId, label: controlLabel },
      });
      for (const id of done) {
        record({
          program: programId,
          actor,
          kind: "link",
          summary: `mapped it to ${controlId} ${controlLabel}`,
          subject: { kind: "requirement", id },
          about: { kind: "control", id: controlId, label: controlLabel },
        });
      }
    }
    close();
  };

  return (
    <PickerSheet
      open={open}
      onClose={close}
      title={`Map requirements to ${controlId}`}
      subtitle={scopeName ? `${controlLabel} · ${scopeName}` : controlLabel}
      search={{ value: query, onChange: setQuery, placeholder: "Search requirements" }}
      selected={chosen.size}
      total={rows.length}
      onClear={() => setChosen(new Set())}
      action={{
        label: chosen.size
          ? `Map ${chosen.size} requirement${chosen.size === 1 ? "" : "s"}`
          : "Map",
        onClick: apply,
        disabled: chosen.size === 0,
      }}
      toolbar={
        <Field label="Relationship rationale">
          <Textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="The signed boot chain covers the integrity verification objectives."
            rows={2}
          />
        </Field>
      }
    >
      <Stack space="space.100">
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={40}>
                <span className="sr-only">Select</span>
              </Table.Header>
              <Table.Header width={110}>Requirement</Table.Header>
              <Table.Header>Shall statement</Table.Header>
              <Table.Header width={120}>Type</Table.Header>
              <Table.Header width={96}>State</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Table.Row
                key={r.id}
                isSelected={chosen.has(r.id)}
                onClick={() => toggle(r.id)}
                className="cursor-pointer"
              >
                <Table.Selection
                  checked={chosen.has(r.id)}
                  onCheckedChange={() => toggle(r.id)}
                  label={`Select ${r.id}`}
                />
                <Table.Cell>
                  <Id>{r.id}</Id>
                </Table.Cell>
                <Table.Cell className="truncate" title={r.text}>
                  {r.text}
                </Table.Cell>
                <Table.Cell className="truncate">{r.type}</Table.Cell>
                <Table.Cell>
                  <Badge variant="secondary" size="xsmall" tone={requirementStateTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        {rows.length === 0 ? (
          <Text as="p" size="small" color="color.text.subtle">
            {already.size ? "Every requirement is mapped." : "Nothing matches."}
          </Text>
        ) : null}
      </Stack>
    </PickerSheet>
  );
}
