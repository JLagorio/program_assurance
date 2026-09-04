/**
 * Controls into a set: the tailoring picker. Frame one chooses controls from
 * the catalog, in the set (to tailor out) or not (to tailor in); frame two
 * takes the source and the rationale each decision must carry, so a decision
 * never reaches the draft without the reason the submit gate will ask for.
 */

import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Editable,
  FilterChip,
  Id,
  Indicator,
  Inline,
  NativeSelect,
  PickerSheet,
  Table,
  Text,
} from "@ledger/design-system";
import { tailoringSources, type TailoringDecision, type TailoringSource } from "@/lib/control-set";
import { currentSession } from "@/lib/control-work";
import { datasetToday } from "@/lib/dataset-clock";
import { nistControls } from "@/lib/nist-catalog";

const shown = 150;

type Fields = { source: TailoringSource; rationale: string };
const defaults: Fields = { source: "system-tailoring", rationale: "" };

export function TailorControlsSheet({
  open,
  onClose,
  inSet,
  decided,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  /** Control ids the draft selects today. */
  inSet: Set<string>;
  /** Control ids that already carry a decision. */
  decided: Set<string>;
  onAdd: (decisions: TailoringDecision[]) => void;
}) {
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<"in" | "out">("in");
  const [family, setFamily] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [fields, setFields] = useState<Record<string, Fields>>({});

  const families = useMemo(() => [...new Set(nistControls.map((c) => c.family))].sort(), []);
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      nistControls.filter(
        (c) =>
          !decided.has(c.id) &&
          (side === "in") === inSet.has(c.id) &&
          (!family || c.family === family) &&
          (!q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)),
      ),
    [decided, inSet, side, family, q],
  );
  const rows = matches.slice(0, shown);
  const chosenControls = nistControls.filter((c) => chosen.has(c.id));
  const fieldOf = (id: string): Fields => fields[id] ?? defaults;
  const setField = (id: string, patch: Partial<Fields>) =>
    setFields((f) => ({ ...f, [id]: { ...(f[id] ?? defaults), ...patch } }));
  const missing = chosenControls.filter((c) => !fieldOf(c.id).rationale.trim()).length;
  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allShown = rows.length > 0 && rows.every((c) => chosen.has(c.id));
  const someShown = rows.some((c) => chosen.has(c.id));

  const close = () => {
    setFrame("choose");
    setQuery("");
    setChosen(new Set());
    setFields({});
    onClose();
  };

  const confirm = () => {
    const s = currentSession();
    onAdd(
      chosenControls.map((c) => ({
        control: c.id,
        decision: inSet.has(c.id) ? "excluded" : "included",
        source: fieldOf(c.id).source,
        rationale: fieldOf(c.id).rationale.trim(),
        authority: `${s.name} · ${s.role}`,
        at: datasetToday,
      })),
    );
    close();
  };

  if (frame === "choose")
    return (
      <PickerSheet
        open={open}
        onClose={close}
        width={880}
        title="Tailor controls"
        subtitle={
          side === "in"
            ? "In the set today: chosen ones are tailored out"
            : "Not in the set: chosen ones are tailored in"
        }
        search={{ value: query, onChange: setQuery, placeholder: "Search the catalog" }}
        filters={
          <>
            <FilterChip
              label={side === "in" ? "In the set" : "Not in the set"}
              isActive
              onClick={() => setSide((s) => (s === "in" ? "out" : "in"))}
            />
            <FilterChip
              label="Family"
              value={family ?? undefined}
              isActive={family !== null}
              onClick={() =>
                setFamily((f) =>
                  f === null ? (families[0] ?? null) : (families[families.indexOf(f) + 1] ?? null),
                )
              }
            />
          </>
        }
        selected={chosen.size}
        total={matches.length}
        onClear={() => setChosen(new Set())}
        action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
      >
        <Table>
          <thead>
            <tr>
              <Table.Selection
                header
                checked={allShown ? true : someShown ? "indeterminate" : false}
                onCheckedChange={(checked) =>
                  setChosen((prev) => {
                    const next = new Set(prev);
                    for (const c of rows)
                      if (checked) next.add(c.id);
                      else next.delete(c.id);
                    return next;
                  })
                }
                label="Select every row shown"
              />
              <Table.Header width={96}>Control</Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header width={64}>Family</Table.Header>
              <Table.Header width={120}>Today</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <Table.Row
                key={c.id}
                isSelected={chosen.has(c.id)}
                onClick={() => toggle(c.id)}
                className="cursor-pointer"
              >
                <Table.Selection
                  checked={chosen.has(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                  label={`Select ${c.id}`}
                />
                <Table.Cell>
                  <Id>{c.id}</Id>
                </Table.Cell>
                <Table.Cell
                  className="truncate"
                  title={c.parentTitle ? `${c.parentTitle} · ${c.title}` : c.title}
                >
                  {c.parentTitle ? `${c.parentTitle} · ${c.title}` : c.title}
                </Table.Cell>
                <Table.Cell>{c.family}</Table.Cell>
                <Table.Cell>
                  <Indicator tone={inSet.has(c.id) ? "success" : "neutral"}>
                    {inSet.has(c.id) ? "In the set" : "Not selected"}
                  </Indicator>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        {matches.length > shown ? (
          <Text as="p" size="small" color="color.text.subtle" className="pt-150">
            First {shown} of {matches.length}. Search or filter to narrow.
          </Text>
        ) : null}
      </PickerSheet>
    );

  return (
    <PickerSheet
      open={open}
      onClose={close}
      onBack={() => setFrame("choose")}
      width={880}
      title="Tailor controls"
      subtitle={missing ? `${missing} without a rationale` : "A source and a rationale for each"}
      toolbar={
        <Inline space="space.150" alignBlock="center">
          <Text size="small" color="color.text.subtle">
            Apply to all
          </Text>
          <Box style={{ width: 200 }}>
            <NativeSelect
              aria-label="Source for all"
              size="small"
              defaultValue=""
              onChange={(e) => {
                const source = e.target.value as TailoringSource;
                if (source)
                  setFields((f) =>
                    Object.fromEntries(
                      [...chosen].map((id) => [id, { ...(f[id] ?? defaults), source }]),
                    ),
                  );
              }}
            >
              <option value="">Source</option>
              {tailoringSources.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </Box>
        </Inline>
      }
      selected={chosen.size}
      action={{
        label: `Record ${chosen.size} decision${chosen.size === 1 ? "" : "s"}`,
        onClick: confirm,
        disabled: missing > 0,
      }}
    >
      <Table>
        <thead>
          <tr>
            <Table.Header width={96}>Control</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={100}>Decision</Table.Header>
            <Table.Header width={170}>Source</Table.Header>
            <Table.Header width={280}>Rationale</Table.Header>
            <Table.Header width={80} />
          </tr>
        </thead>
        <tbody>
          {chosenControls.map((c) => (
            <Table.Row key={c.id} isStatic>
              <Table.Cell>
                <Id>{c.id}</Id>
              </Table.Cell>
              <Table.Cell className="truncate" title={c.title}>
                {c.title}
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={inSet.has(c.id) ? "danger" : "success"}>
                  {inSet.has(c.id) ? "Tailored out" : "Tailored in"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Editable.Select
                  label="Source"
                  options={tailoringSources.map((s) => s.value)}
                  value={fieldOf(c.id).source}
                  onChange={(next) => setField(c.id, { source: next })}
                  save={async () => undefined}
                  render={(v) => tailoringSources.find((s) => s.value === v)?.label ?? v}
                />
              </Table.Cell>
              <Table.Cell>
                <Editable.Text
                  value={fieldOf(c.id).rationale}
                  placeholder="Why"
                  onChange={(next) => setField(c.id, { rationale: next })}
                  save={async () => undefined}
                />
              </Table.Cell>
              <Table.Cell className="text-right">
                <Button variant="link" size="small" onClick={() => toggle(c.id)}>
                  Remove
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </PickerSheet>
  );
}
