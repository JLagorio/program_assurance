import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { Button, NativeSelect } from "../../components";
import { DataTable, PickerSheet, defineColumns, useDataTable } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Patterns/PickerSheet",
  component: PickerSheet,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PickerSheet>;
export default meta;
type Story = StoryObj;

const families = ["AC", "AU", "CM", "IA", "SC", "SI"] as const;
const statements = [
  "The system shall encrypt telemetry in transit.",
  "The system shall log every privileged command.",
  "The system shall lock an account after five failed attempts.",
  "The system shall verify firmware signatures before boot.",
  "The system shall retain audit records for one year.",
  "The system shall separate operator and maintainer roles.",
  "The system shall time out an idle session after fifteen minutes.",
];
const catalogue = Array.from({ length: 28 }, (_, i) => ({
  id: `REQ-${String(101 + i).padStart(4, "0")}`,
  text: statements[i % statements.length]!,
  family: families[i % families.length]!,
  state: (["Approved", "Draft", "Verified"] as const)[i % 3]!,
}));
const stateTone = { Approved: "information", Draft: "neutral", Verified: "success" } as const;
const responsibilities = ["Primary", "Supporting", "Inherited"] as const;
const coverages = ["Full", "Partial"] as const;
type Fields = {
  responsibility: (typeof responsibilities)[number];
  coverage: (typeof coverages)[number];
};

type Catalogue = (typeof catalogue)[number];
type ChosenRow = Catalogue & Fields;

const catalogueColumns = defineColumns<Catalogue>((c) => [
  c.id("id", { header: "Requirement", width: 110 }),
  c.text("text", { header: "Shall statement", sortable: false }),
  c.text("family", { header: "Family", width: 72 }),
  c.status("state", { header: "State", width: 96, tone: (r) => stateTone[r.state] }),
]);

function PickerStates() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [fields, setFields] = useState<Record<string, Fields>>({});

  // Frame one chooses: the table holds the search, the family facet, the sort and the selection,
  // and the selection survives the search because it is kept by row id.
  const choose = useDataTable({
    columns: catalogueColumns,
    data: catalogue,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Requirements",
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const chosenIds = Object.keys(choose.state.rowSelection);
  const chosen = new Set(chosenIds);
  const fieldOf = (id: string): Fields =>
    fields[id] ?? { responsibility: "Primary", coverage: "Full" };
  const setField = (id: string, patch: Partial<Fields>) =>
    setFields((f) => ({ ...f, [id]: { ...fieldOf(id), ...patch } }));
  const applyAll = (patch: Partial<Fields>) =>
    setFields(Object.fromEntries(chosenIds.map((id) => [id, { ...fieldOf(id), ...patch }])));
  const reset = () => {
    setOpen(false);
    setFrame("choose");
  };
  const chosenRows: ChosenRow[] = catalogue
    .filter((r) => chosen.has(r.id))
    .map((r) => ({ ...r, ...fieldOf(r.id) }));

  // Frame two fills in the fields the model requires, in place; "Does not apply" is a row action.
  const detailColumns = useMemo(
    () =>
      defineColumns<ChosenRow>((c) => [
        c.id("id", { header: "Requirement", width: 110, sortable: false }),
        c.text("text", { header: "Shall statement", sortable: false }),
        c.status("responsibility", {
          header: "Responsibility",
          width: 150,
          sortable: false,
          tone: () => "neutral",
          editable: {
            options: responsibilities,
            onChange: (row, next) =>
              setField(row.id, { responsibility: next as Fields["responsibility"] }),
            save: async () => undefined,
          },
        }),
        c.status("coverage", {
          header: "Coverage",
          width: 120,
          sortable: false,
          tone: (r) => (r.coverage === "Full" ? "success" : "warning"),
          editable: {
            options: coverages,
            onChange: (row, next) => setField(row.id, { coverage: next as Fields["coverage"] }),
            save: async () => undefined,
          },
        }),
        c.custom("apply", {
          header: "",
          width: 130,
          align: "end",
          cell: (r) => (
            <Button
              variant="link"
              size="small"
              onClick={() => choose.getRow(r.id).toggleSelected(false)}
            >
              Does not apply
            </Button>
          ),
        }),
      ]),
    // the chooser table is stable for the life of the story
    [],
  );
  const details = useDataTable({
    columns: detailColumns,
    data: chosenRows,
    getRowId: (r) => r.id,
    label: "Chosen requirements",
  });

  return (
    <Stack space="space.200">
      <Specimens title="PickerSheet">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Allocate requirements
        </Button>
        <Text size="small" color="color.text.subtle">
          {chosen.size} chosen so far
        </Text>
      </Specimens>
      {frame === "choose" ? (
        <PickerSheet
          open={open}
          onClose={reset}
          title="Allocate requirements"
          subtitle="Flight computer · 14 allocated today"
          search={{
            value: String(choose.state.globalFilter ?? ""),
            onChange: (v) => choose.setGlobalFilter(v),
            placeholder: "Search requirements",
          }}
          filters={
            <>
              <DataTable.Filter table={choose} column="family" />
              <DataTable.Filter table={choose} column="state" />
            </>
          }
          selected={chosen.size}
          total={choose.getRowCount()}
          onClear={() => choose.resetRowSelection()}
          action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
        >
          <DataTable
            table={choose}
            onRowClick={(r) => choose.getRow(r.id).toggleSelected()}
            className="rounded-none border-0"
            empty={{ title: "No requirements match", description: "Clear the search or a filter." }}
          />
        </PickerSheet>
      ) : (
        <PickerSheet
          open={open}
          onClose={reset}
          onBack={() => setFrame("choose")}
          title="Allocate requirements"
          subtitle="Flight computer · responsibility and coverage for each"
          toolbar={
            <Inline space="space.150" alignBlock="center">
              <Text size="small" color="color.text.subtle">
                Apply to all
              </Text>
              <Box style={{ width: 140 }}>
                <NativeSelect
                  aria-label="Responsibility for all"
                  className="[&>select]:h-control-small"
                  defaultValue=""
                  onChange={(e) =>
                    e.target.value &&
                    applyAll({ responsibility: e.target.value as Fields["responsibility"] })
                  }
                >
                  <option value="">Responsibility</option>
                  {responsibilities.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </NativeSelect>
              </Box>
              <Box style={{ width: 120 }}>
                <NativeSelect
                  aria-label="Coverage for all"
                  className="[&>select]:h-control-small"
                  defaultValue=""
                  onChange={(e) =>
                    e.target.value && applyAll({ coverage: e.target.value as Fields["coverage"] })
                  }
                >
                  <option value="">Coverage</option>
                  {coverages.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </NativeSelect>
              </Box>
            </Inline>
          }
          selected={chosen.size}
          action={{ label: `Allocate ${chosen.size} to Flight computer`, onClick: reset }}
        >
          <DataTable table={details} className="rounded-none border-0" />
        </PickerSheet>
      )}
    </Stack>
  );
}
/** Frame one is a DataTable in the sheet: search, the family and state facets, a sortable id column and a selection that survives the search; frame two is a second DataTable whose responsibility and coverage cells edit in place, with a defaults row and "Does not apply" per row. Open it. */
export const PickerSheetStory: Story = { name: "Picker sheet", render: () => <PickerStates /> };
export const PickerSheetMatrix: Story = { render: () => <PickerStates /> };
