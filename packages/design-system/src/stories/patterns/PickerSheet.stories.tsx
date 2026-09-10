import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useMemo, useState, type ReactNode } from "react";
import { DataTable, PickerSheet, defineColumns, useDataTable } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

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

  const undefinedItems = [
    { value: "", label: "Responsibility" },
    ...responsibilities.map((r) => ({ value: r, label: r })),
  ];
  const undefinedItems2 = [
    { value: "", label: "Coverage" },
    ...coverages.map((c) => ({ value: c, label: c })),
  ];
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
                <Select<string>
                  items={undefinedItems}
                  defaultValue=""
                  onValueChange={(value) => {
                    if (value === null) return;
                    return value && applyAll({ responsibility: value as Fields["responsibility"] });
                  }}
                >
                  <SelectTrigger
                    className={"w-full " + "[&>select]:h-control-small"}
                    aria-label="Responsibility for all"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {undefinedItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box style={{ width: 120 }}>
                <Select<string>
                  items={undefinedItems2}
                  defaultValue=""
                  onValueChange={(value) => {
                    if (value === null) return;
                    return value && applyAll({ coverage: value as Fields["coverage"] });
                  }}
                >
                  <SelectTrigger
                    className={"w-full " + "[&>select]:h-control-small"}
                    aria-label="Coverage for all"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {undefinedItems2.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
export const PickerSheetStory: Story = {
  name: "Picker sheet",
  render: () => <PickerStates />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Allocate requirements" });
    await userEvent.click(opener);
    const dialog = within(await page.findByRole("dialog", { name: "Allocate requirements" }));
    await expect(dialog.queryByRole("button", { name: "Back" })).toBeNull();
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select row REQ-0101" }));
    await userEvent.click(dialog.getByRole("button", { name: "Continue with 1" }));
    await userEvent.click(dialog.getByRole("button", { name: "Back" }));
    await expect(dialog.getByRole("button", { name: "Continue with 1" })).toBeEnabled();
    await expect(dialog.queryByRole("button", { name: "Back" })).toBeNull();
    await expect(page.getByRole("dialog")).toContainElement(
      canvasElement.ownerDocument.activeElement as HTMLElement,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** The sheet's footer, drawn on its own for a pair. */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-150 rounded-medium border border-default bg-surface-sunken px-200 py-100">
      {children}
    </div>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Footer>
            <span className="flex items-center gap-100 font-body-small text-subtle">
              <span className="tabular-nums">12 chosen of 28</span>
              <Button variant="link" size="small">
                Clear
              </Button>
            </span>
            <Inline space="space.100">
              <Button>Cancel</Button>
              <Button variant="primary">Allocate 12 to Flight computer</Button>
            </Inline>
          </Footer>
        }
        doText="The footer counts what is chosen and names the one thing to do with it, in full."
        dont={
          <Footer>
            <span />
            <Inline space="space.100">
              <Button>Cancel</Button>
              <Button variant="primary">OK</Button>
            </Inline>
          </Footer>
        }
        dontText="OK and no count. The reader cannot tell what is about to happen, or to how many."
      />
      <Pair
        do={
          <Footer>
            <span className="font-body-small text-subtle tabular-nums">28 to choose from</span>
            <Inline space="space.100">
              <Button>Cancel</Button>
              <Button variant="primary" disabled>
                Allocate to Flight computer
              </Button>
            </Inline>
          </Footer>
        }
        doText="Nothing chosen: the action waits, disabled, and the footer says what there is to choose from."
        dont={
          <Footer>
            <span className="font-body-small text-subtle tabular-nums">0 chosen</span>
            <Inline space="space.100">
              <Button>Cancel</Button>
              <Button variant="primary">Allocate to Flight computer</Button>
            </Inline>
          </Footer>
        }
        dontText="An enabled action with nothing chosen. It does nothing, or something the reader did not ask for."
      />
    </Stack>
  ),
};

function ControlledSearchDemo() {
  const [open, setOpen] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [query, setQuery] = useState("");
  return (
    <Stack>
      <Button
        onClick={() => {
          setSearchable(true);
          setOpen(true);
        }}
      >
        Open searchable picker
      </Button>
      <Button
        onClick={() => {
          setSearchable(false);
          setOpen(true);
        }}
      >
        Open minimal picker
      </Button>
      <PickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Choose records"
        search={searchable ? { value: query, onChange: setQuery } : undefined}
        selected={0}
        action={{ label: "Link records", onClick: () => undefined }}
      >
        <Text>Current query: {query || "none"}</Text>
      </PickerSheet>
    </Stack>
  );
}

/** Search has a persistent accessible name and reports string values to the caller. */
export const ControlledSearch: Story = {
  render: () => <ControlledSearchDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open searchable picker" }));
    const dialog = within(await page.findByRole("dialog", { name: "Choose records" }));
    const search = dialog.getByRole("textbox", { name: "Search" });
    await userEvent.type(search, "Annual review");
    await expect(search).toHaveAccessibleName("Search");
    await expect(dialog.getByText("Current query: Annual review")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Link records" })).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Open searchable picker" })).toHaveFocus();
    const opener = canvas.getByRole("button", { name: "Open minimal picker" });
    await userEvent.click(opener);
    const minimal = within(await page.findByRole("dialog", { name: "Choose records" }));
    await expect(minimal.queryByRole("textbox")).toBeNull();
    await expect(minimal.queryByRole("button", { name: "Back" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
  },
};
