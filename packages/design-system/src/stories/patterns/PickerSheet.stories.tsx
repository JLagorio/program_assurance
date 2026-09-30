import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DataTable, PickerSheet, defineColumns, useDataTable } from "../..";
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../components";
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

// The statement is what the reader chooses by, so it keeps its place in a narrow sheet.
const catalogueColumns = defineColumns<Catalogue>((c) => [
  c.id("id", { header: "Requirement", width: 110, priority: 1 }),
  c.text("text", { header: "Shall statement", sortable: false, minWidth: 200, priority: 0 }),
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
        c.id("id", { header: "Requirement", width: 110, sortable: false, priority: 1 }),
        c.text("text", { header: "Shall statement", sortable: false, minWidth: 200, priority: 0 }),
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
          table={choose}
          search={{ placeholder: "Search requirements" }}
          filters={
            <>
              <DataTable.Filter table={choose} column="family" />
              <DataTable.Filter table={choose} column="state" />
            </>
          }
          action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
        >
          <DataTable
            table={choose}
            responsive
            onRowClick={(r) => choose.getRow(r.id).toggleSelected()}
            empty={{
              title: "Every requirement is already allocated here",
              description: "Add requirements to the library to allocate more.",
            }}
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
          <DataTable table={details} responsive />
        </PickerSheet>
      )}
    </Stack>
  );
}
/** Frame one is a DataTable in the sheet, passed as `table`: the search drives its global filter, and the count, the total and Clear come from its selection. The family and state facets, a sortable id column and a selection that survives the search; frame two is a second DataTable whose responsibility and coverage cells edit in place, with a defaults row and "Does not apply" per row. Open it. */
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
    await expect(dialog.getByRole("searchbox", { name: "Search requirements" })).toHaveFocus();
    await expect(dialog.getByRole("status")).toHaveTextContent("28 to choose from");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "data-button-variant",
      "subtle",
    );
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select row REQ-0101" }));
    await expect(dialog.getByRole("status")).toHaveTextContent("1 chosen of 28");
    // The selection survives a search: the count keeps it, "of" the rows on offer.
    await userEvent.type(dialog.getByRole("searchbox", { name: "Search requirements" }), "encrypt");
    await waitFor(() => expect(dialog.getByText("1 chosen of 4")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await expect(dialog.getByRole("searchbox", { name: "Search requirements" })).toHaveValue("");
    await expect(dialog.getByText("1 chosen of 28")).toBeVisible();
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

/**
 * Escape until the sheet has closed: a focused control's tooltip takes the first Escape, as a
 * tooltip should, and the sheet the next.
 */
const closeSheet = async (canvasElement: HTMLElement) => {
  const body = within(canvasElement.ownerDocument.body);
  for (let press = 0; press < 3 && body.queryByRole("dialog"); press++) {
    await userEvent.keyboard("{Escape}");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
};

/**
 * Whether a focused control is inside the popup's visible box and clear of its footer. A region
 * taller than that box (the table's own frame) only has to show part of itself.
 */
const inView = (element: HTMLElement, popup: HTMLElement, footer: HTMLElement) => {
  const box = element.getBoundingClientRect();
  const frame = popup.getBoundingClientRect();
  const floor = footer.contains(element) ? frame.bottom : footer.getBoundingClientRect().top;
  if (box.height > floor - frame.top) return box.top < floor && box.bottom > frame.top;
  return box.top >= frame.top - 1 && box.bottom <= floor + 1;
};

/**
 * At 400% zoom, 320 by 256 CSS px. Under 30rem tall the sheet scrolls as one: the header and the
 * search scroll away with the rows and the footer stays, so the list is not squeezed to a row, and
 * every control that takes focus can be seen.
 */
export const ShortWindow: Story = {
  render: () => <PickerStates />,
  parameters: {
    viewport: {
      options: {
        ledgerShort: {
          name: "Short window (320 by 256 CSS px)",
          styles: { width: "320px", height: "256px" },
        },
      },
    },
  },
  globals: { viewport: { value: "ledgerShort", isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(window.innerHeight).toBeLessThanOrEqual(480);
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Allocate requirements" }));
    const popup = await page.findByRole("dialog", { name: "Allocate requirements" });
    const region = popup.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    await expect(getComputedStyle(region).overflowY).toBe("visible");
    await expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
    const footer = popup.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;
    for (let step = 0; step < 8; step++) {
      await userEvent.tab();
      const focused = canvasElement.ownerDocument.activeElement as HTMLElement;
      await expect(popup).toContainElement(focused);
      await waitFor(() => expect(inView(focused, popup, footer)).toBe(true));
    }
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    await closeSheet(canvasElement);
  },
};

function SearchTheTable() {
  const [open, setOpen] = useState(false);
  const table = useDataTable({
    columns: catalogueColumns,
    data: catalogue,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Requirements",
  });
  return (
    <Stack space="space.200">
      <Specimens title="PickerSheet">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Allocate requirements
        </Button>
      </Specimens>
      <PickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Allocate requirements"
        subtitle="Flight computer"
        table={table}
        search={{ placeholder: "Search requirements" }}
        action={{
          label: `Allocate ${Object.keys(table.state.rowSelection).length} to Flight computer`,
          onClick: () => setOpen(false),
        }}
      >
        <DataTable
          table={table}
          responsive
          empty={{
            title: "Every requirement is already allocated here",
            description: "Add requirements to the library to allocate more.",
          }}
        />
      </PickerSheet>
    </Stack>
  );
}

/**
 * The search filters the table, not the rows handed to it, so a search that matches nothing shows
 * the table's filtered empty with Clear filters. It never says there is nothing to add, which is
 * the empty for a collection with no rows at all.
 */
export const SearchWithNoMatch: Story = {
  render: () => <SearchTheTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Allocate requirements" }));
    const dialog = within(await page.findByRole("dialog", { name: "Allocate requirements" }));
    const search = dialog.getByRole("searchbox", { name: "Search requirements" });
    await userEvent.type(search, "zzzzqq");
    await expect(await dialog.findByText("Nothing matches")).toBeVisible();
    await expect(dialog.queryByText("Every requirement is already allocated here")).toBeNull();
    await expect(dialog.getByText("0 to choose from")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Clear filters" }));
    await expect(search).toHaveValue("");
    await expect(dialog.getByText("28 to choose from")).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "Select row REQ-0101" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  },
};

/** The save each PendingAndFailure run is waiting on; its play function settles it. */
const waitingSaves: Array<() => void> = [];

function PendingPicker() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closedBy, setClosedBy] = useState("Not closed yet");
  const rationale = useRef<HTMLTextAreaElement>(null);
  const table = useDataTable({
    columns: catalogueColumns,
    data: catalogue,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Requirements",
  });
  const count = Object.keys(table.state.rowSelection).length;
  const allocate = async () => {
    setError(null);
    setPending(true);
    await new Promise<void>((settle) => waitingSaves.push(settle));
    setPending(false);
    setError("The allocation could not be saved. Your choice is kept; try again.");
  };
  return (
    <Stack space="space.200">
      <Specimens title="PickerSheet">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Allocate requirements
        </Button>
        <Text size="small" color="color.text.subtle">
          {closedBy}
        </Text>
      </Specimens>
      <PickerSheet
        open={open}
        initialFocus={rationale}
        onClose={(details) => {
          setClosedBy(`Closed by ${details?.reason ?? "the caller"}`);
          setOpen(false);
          setError(null);
        }}
        title="Allocate requirements"
        subtitle="Flight computer"
        table={table}
        search={{ placeholder: "Search requirements" }}
        toolbar={
          <Field>
            <FieldLabel>Rationale</FieldLabel>
            <Textarea ref={rationale} rows={2} />
          </Field>
        }
        pending={pending}
        error={error}
        action={{
          label: `Allocate ${count} to Flight computer`,
          onClick: () => void allocate(),
        }}
      >
        <DataTable table={table} responsive />
      </PickerSheet>
    </Stack>
  );
}

/**
 * `initialFocus` puts focus in the rationale. While the allocation runs, `pending` holds the
 * sheet: Escape, the blanket, the close button and Cancel do nothing, the toolbar and the rows
 * cannot change, and the primary shows it is working. A failure ends it and shows `error` above the
 * footer's buttons, outside the scroll, with the choice kept for a retry, as the story ends. `onClose`
 * hears why the reader closed (`details.reason`), and focus goes back to the opener.
 */
export const PendingAndFailure: Story = {
  render: () => <PendingPicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Allocate requirements" });
    // Closing: `onClose` hears why, and focus goes back to the opener.
    await userEvent.click(opener);
    let popup = await page.findByRole("dialog", { name: "Allocate requirements" });
    await waitFor(() =>
      expect(within(popup).getByRole("textbox", { name: "Rationale" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByText("Closed by escape-key")).toBeVisible();
    await expect(opener).toHaveFocus();
    // Saving: the sheet holds until the command settles, then shows the failure.
    await userEvent.click(opener);
    popup = await page.findByRole("dialog", { name: "Allocate requirements" });
    const dialog = within(popup);
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select row REQ-0101" }));
    const primary = dialog.getByRole("button", { name: "Allocate 1 to Flight computer" });
    await userEvent.click(primary);
    await waitFor(() => expect(popup).toHaveAttribute("aria-busy", "true"));
    await expect(primary).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(popup.querySelector('[data-slot="sheet-body"]')).toHaveAttribute("inert");
    await userEvent.keyboard("{Escape}");
    await expect(page.getByRole("dialog", { name: "Allocate requirements" })).toBeVisible();
    await expect(canvas.getByText("Closed by escape-key")).toBeVisible();
    waitingSaves.shift()?.();
    const alert = await dialog.findByRole("alert");
    await expect(alert).toHaveTextContent("The allocation could not be saved");
    await expect(popup).not.toHaveAttribute("aria-busy");
    await expect(popup.querySelector('[data-slot="sheet-body"]')).not.toHaveAttribute("inert");
    await expect(dialog.getByText("1 chosen of 28")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Allocate 1 to Flight computer" }),
    ).toBeEnabled();
  },
};

/**
 * The sheet's footer, drawn on its own for a pair. Where the row is too narrow, the count moves
 * above the buttons and the buttons wrap, each label on one line.
 */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-150 gap-y-100 rounded-medium border border-default bg-surface-sunken px-200 py-100">
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
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
              <Button>Cancel</Button>
              <Button variant="primary">Allocate 12 to Flight computer</Button>
            </Inline>
          </Footer>
        }
        doText="The footer counts what is chosen and names the one thing to do with it, in full."
        dont={
          <Footer>
            <span />
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
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
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
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
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
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

function SingleChoicePicker() {
  const [open, setOpen] = useState(false);
  const table = useDataTable({
    columns: catalogueColumns,
    data: catalogue,
    getRowId: (r) => r.id,
    selectable: "single",
    rowLabel: (r) => r.id,
    label: "Requirements",
  });
  return (
    <Stack space="space.200">
      <Specimens title="PickerSheet">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Derive from a requirement
        </Button>
      </Specimens>
      <PickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Derive from a requirement"
        subtitle="Flight computer"
        table={table}
        search={{ placeholder: "Search requirements" }}
        filters={<DataTable.Filter table={table} column="family" />}
        action={{ label: "Derive requirement", onClick: () => setOpen(false) }}
      >
        <DataTable table={table} responsive />
      </PickerSheet>
    </Stack>
  );
}

/**
 * One record to choose: the table's `selectable: "single"` draws a radio per row, and the footer
 * names the chosen record by the table's `rowLabel` instead of counting it. The search and the
 * filter are the kit's Toolbar, so a narrow sheet folds the filter into More.
 */
export const SingleChoice: Story = {
  name: "Single choice",
  render: () => <SingleChoicePicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Derive from a requirement" }));
    const popup = await page.findByRole("dialog", { name: "Derive from a requirement" });
    const dialog = within(popup);
    await expect(
      popup.querySelector('[data-slot="picker-sheet-toolbar"] [data-slot="toolbar-filters"]'),
    ).not.toBeNull();
    await expect(dialog.getByRole("status")).toHaveTextContent("28 to choose from");
    await userEvent.click(dialog.getByRole("radio", { name: "Select REQ-0103" }));
    await expect(dialog.getByRole("status")).toHaveTextContent("REQ-0103");
    await expect(dialog.getByRole("button", { name: "Derive requirement" })).toBeEnabled();
    await closeSheet(canvasElement);
  },
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

/** Without `table` the caller owns the query: the search has a persistent accessible name, reports string values to the caller, and Escape empties it before it closes the sheet. */
export const ControlledSearch: Story = {
  render: () => <ControlledSearchDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open searchable picker" }));
    const dialog = within(await page.findByRole("dialog", { name: "Choose records" }));
    const search = dialog.getByRole("searchbox", { name: "Search" });
    await userEvent.type(search, "Annual review");
    await expect(search).toHaveAccessibleName("Search");
    await expect(dialog.getByText("Current query: Annual review")).toBeVisible();
    // Escape empties the query first and keeps the sheet; the next Escape would close it.
    await userEvent.keyboard("{Escape}");
    await expect(dialog.getByText("Current query: none")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Choose records" })).toBeVisible();
    await userEvent.type(search, "Annual review");
    await expect(dialog.getByRole("button", { name: "Link records" })).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Open searchable picker" })).toHaveFocus();
    const opener = canvas.getByRole("button", { name: "Open minimal picker" });
    await userEvent.click(opener);
    const minimal = within(await page.findByRole("dialog", { name: "Choose records" }));
    await expect(minimal.queryByRole("searchbox")).toBeNull();
    await expect(minimal.queryByRole("textbox")).toBeNull();
    await expect(minimal.queryByRole("button", { name: "Back" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
  },
};
