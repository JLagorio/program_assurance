import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { interact } from "../_lib/interact";

import { useId, useRef, useState } from "react";

import {
  Editable,
  EditableDate,
  EditableSelect,
  EditableText,
  type EditableOption,
  type EditableTextProps,
} from "../..";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Fact,
  Field,
  FieldLabel,
  Input,
  KeyValue,
  Person,
  Table,
  type Tone,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Editable",
  component: EditableText,
  subcomponents: { EditableSelect, EditableDate },
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** A key pressed in the open field. Enter and Escape close it, so the key goes through `interact`, which settles the close in one act scope. */
const press = (field: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  interact(() =>
    field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init })),
  );
const statuses = ["Draft", "In review", "Verified", "Overdue"] as const;
type Status = (typeof statuses)[number];
const toneOf: Record<Status, Tone> = {
  Draft: "neutral",
  "In review": "information",
  Verified: "success",
  Overdue: "danger",
};

function RailDemo() {
  const [name, setName] = useState("Segregation of duties, payables");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Stack space="space.050" className="w-layout-list max-w-full">
      <KeyValue label="Name">
        <Editable.Text
          label="Name"
          value={name}
          onValueChange={setName}
          save={() => new Promise((resolve) => setTimeout(resolve, 700))}
          validate={(v) => (v.trim() ? null : "A name is required.")}
        />
      </KeyValue>
      <KeyValue label="Owner">
        <Editable.Text
          label="Owner"
          value={owner}
          onValueChange={setOwner}
          placeholder="Unassigned"
          save={() => new Promise((resolve) => setTimeout(resolve, 700))}
        />
      </KeyValue>
      <KeyValue label="Status">
        <Editable.Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={statuses}
          save={() => new Promise((resolve) => setTimeout(resolve, 500))}
          render={(s) => (
            <Badge variant="secondary" tone={toneOf[s]}>
              {s}
            </Badge>
          )}
        />
      </KeyValue>
      <KeyValue label="Frequency">Quarterly</KeyValue>
    </Stack>
  );
}

/** A record's facts in its rail: the name, the owner and the status edit in place; the frequency is plain text and lines up with them. Click a value, change it, and it saves. */
export const Rail: Story = {
  render: RailDemo,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: /Name: Segregation/ }));
    const input = canvas.getByRole("textbox", { name: "Name" });
    await expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveAccessibleDescription("A name is required.");
    await expect(input).toHaveFocus();
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    await expect(canvas.getByRole("button", { name: /Name: Segregation/ })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Owner: Unassigned" }));
    const ownerField = canvas.getByRole("textbox", { name: "Owner" });
    await userEvent.type(ownerField, "Dana Whitfield");
    await press(ownerField, "Enter");
    const owner = canvas.getByRole("button", { name: /Owner: Dana Whitfield/ });
    await expect(owner).toHaveFocus();
    await userEvent.tab();
    const status = canvas.getByRole("combobox", { name: /Status: In review/ });
    await expect(status).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const selected = await page.findByRole("option", { name: "In review" });
    await expect(selected).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(status).toHaveTextContent("Verified"));
    await expect(status).toHaveAttribute("aria-disabled", "true");
    await waitFor(() => expect(status).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(page.queryByRole("listbox")).toBeNull();
    await waitFor(() => expect(status).not.toHaveAttribute("aria-disabled", "true"));

    // The row is the field's height, so opening the field does not move the rail; the field's box
    // reaches space.050 past the text column on both sides. A KeyValue whose value is an Editable
    // does not clip it, so the field's sides, the tint and the row's focus ring are whole in every
    // browser, and the value stays on the text column with the plain ones.
    const name = canvas.getByRole("button", { name: /Name: Segregation/ });
    const value = name.closest("dd")!;
    const pair = value.closest("dl")!;
    const rowHeight = name.getBoundingClientRect().height;
    await expect(getComputedStyle(value).overflowX).toBe("visible");
    const plain = canvas.getByText("Quarterly");
    // Both start on the text column: their left edges, or their right ones in right to left.
    const startOf = (el: Element) =>
      getComputedStyle(el).direction === "rtl"
        ? el.getBoundingClientRect().right
        : el.getBoundingClientRect().left;
    await expect(Math.abs(startOf(name) - startOf(plain))).toBeLessThan(0.5);
    // The reach stays inside the Editable at the end, so the value is not cut, and neither a
    // hover nor focus on the row reveals its text in a tooltip.
    await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="truncate-full-text"]'),
    ).toBeNull();
    await userEvent.click(name);
    const field = canvas.getByRole("textbox", { name: "Name" });
    const fieldBox = field.getBoundingClientRect();
    const valueBox = value.getBoundingClientRect();
    await expect(fieldBox.height).toBe(rowHeight);
    await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);
    // Both sides of the field are inside the KeyValue: the start in the gap before the value,
    // the end inside the value. In right to left the start is the right.
    const pairBox = pair.getBoundingClientRect();
    if (getComputedStyle(field).direction === "rtl") {
      await expect(fieldBox.right).toBeLessThanOrEqual(pairBox.right + 0.5);
      await expect(fieldBox.right).toBeGreaterThan(valueBox.right);
      await expect(fieldBox.left).toBeGreaterThanOrEqual(valueBox.left - 0.5);
    } else {
      await expect(fieldBox.left).toBeGreaterThanOrEqual(pairBox.left - 0.5);
      await expect(fieldBox.left).toBeLessThan(valueBox.left);
      await expect(fieldBox.right).toBeLessThanOrEqual(valueBox.right + 0.5);
    }
    await press(field, "Escape");
    const row = canvas.getByRole("button", { name: /Name: Segregation/ });
    await expect(row).toHaveFocus();

    // Where a pointer is coarse a finger reaches the name anywhere in a band at least 24px tall
    // centred on its line, above and below the line as well as on it.
    await expect(row).toHaveClass("touch-target-block-after");
    const box = row.getBoundingClientRect();
    const at = (dy: number) =>
      canvasElement.ownerDocument.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2 + dy,
      );
    if (matchMedia("(any-pointer: coarse)").matches) {
      await expect(row.contains(at(-11.5))).toBe(true);
      await expect(row.contains(at(11.5))).toBe(true);
    } else await expect(getComputedStyle(row, "::after").content).toBe("none");
  },
};
const roster = [
  "Amara Bell",
  "Dan Whitfield",
  "Elena Vasquez",
  "Hana Lindqvist",
  "Ingrid Solberg",
  "Joel Barrantes",
  "Marcus Ryde",
  "Nadia Fournier",
  "Priya Raghavan",
  "Sarah Chen",
  "Tom Okafor",
  "Victor Amsel",
] as const;
type Member = (typeof roster)[number];

function RosterDemo() {
  const [owner, setOwner] = useState<Member>("Marcus Ryde");
  const [reviewer, setReviewer] = useState<Member>("Sarah Chen");
  return (
    <Stack space="space.050" className="w-layout-list max-w-full">
      <KeyValue label="Owner">
        <Editable.Select<Member>
          label="Owner"
          value={owner}
          onValueChange={setOwner}
          options={roster}
          render={(name) => <Person name={name} />}
          save={(next) =>
            wait(500).then(() => {
              if (next === "Elena Vasquez")
                throw new Error("Elena is not available for assignment.");
            })
          }
        />
      </KeyValue>
      <KeyValue label="Reviewer">
        <Editable.Select<Member>
          label="Reviewer"
          value={reviewer}
          onValueChange={setReviewer}
          options={roster}
          searchable
          validate={(next) =>
            next === "Victor Amsel" ? "Victor cannot review this record." : null
          }
          save={() => wait(500)}
        />
      </KeyValue>
      <Text size="small" color="color.text.subtle">
        Assigning Elena demonstrates a failed save; choosing Victor as reviewer demonstrates
        validation.
      </Text>
    </Stack>
  );
}

/** A roster keeps the same person rendering when its options become searchable. */
export const Roster: Story = {
  render: () => <RosterDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const owner = canvas.getByRole("combobox", { name: /Owner: Marcus Ryde/ });
    await userEvent.click(owner);
    let search = await page.findByRole("combobox", { name: "Owner" });
    await waitFor(() => expect(search).toHaveFocus());
    await userEvent.type(search, "No matching person");
    await expect(await page.findByText("Nothing matches")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(owner).toHaveFocus());
    await expect(owner).toHaveTextContent("Marcus Ryde");
    await userEvent.keyboard("{Enter}");
    search = await page.findByRole("combobox", { name: "Owner" });
    await expect(search).toHaveValue("");
    await userEvent.type(search, "Priya");
    const priya = await page.findByRole("option", { name: "Priya Raghavan" });
    await expect(priya.querySelector('[data-slot="person"]')).not.toBeNull();
    await expect(priya.querySelector('[data-slot="avatar"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(owner).toHaveTextContent("Priya Raghavan"));
    await expect(owner).toHaveAttribute("aria-disabled", "true");
    await waitFor(() => expect(owner).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(page.queryByRole("listbox")).toBeNull();
    await waitFor(() => expect(owner).not.toHaveAttribute("aria-disabled", "true"));
    await userEvent.click(owner);
    search = await page.findByRole("combobox", { name: "Owner" });
    await userEvent.type(search, "Elena");
    await userEvent.click(await page.findByRole("option", { name: "Elena Vasquez" }));
    await waitFor(() =>
      expect(owner).toHaveAccessibleDescription("Elena is not available for assignment."),
    );
    await expect(owner).toHaveTextContent("Priya Raghavan");
    const reviewer = canvas.getByRole("combobox", { name: /Reviewer: Sarah Chen/ });
    await userEvent.click(reviewer);
    await userEvent.type(await page.findByRole("combobox", { name: "Reviewer" }), "Victor");
    await userEvent.click(await page.findByRole("option", { name: "Victor Amsel" }));
    await expect(reviewer).toHaveTextContent("Sarah Chen");
    await expect(reviewer).toHaveAccessibleDescription("Victor cannot review this record.");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(reviewer).toHaveFocus());
  },
};

type Row = { id: string; name: string; next: string; status: Status };
const rows: Row[] = [
  {
    id: "AC-2",
    name: "Account management",
    next: "Confirm the review cadence",
    status: "In review",
  },
  { id: "AC-3", name: "Access enforcement", next: "", status: "Verified" },
  { id: "AC-6", name: "Least privilege", next: "Collect the admin roster", status: "Overdue" },
];

function TableDemo() {
  const [data, setData] = useState<Row[]>(rows);
  const set = (id: string, patch: Partial<Row>) =>
    setData((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <Table label="Controls" role="grid" className="max-w-layout-measure">
      <thead>
        <Table.Row>
          <Table.Header width={72}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={240}>Next action</Table.Header>
          <Table.Header width={140}>Assessment</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {data.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Editable.Text
                label="Next action"
                value={r.next}
                placeholder="Add next action"
                onValueChange={(next) => set(r.id, { next })}
                save={() => wait(500)}
              />
            </Table.Cell>
            <Table.Cell>
              <Editable.Select
                label="Assessment"
                options={statuses}
                value={r.status}
                onValueChange={(status) => set(r.id, { status })}
                save={() => wait(500)}
                render={(s) => (
                  <Badge variant="secondary" tone={toneOf[s]}>
                    {s}
                  </Badge>
                )}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** In a table's cells, under the column's heading. A DataTable column with `editable` draws these; here they are placed by hand. */
export const InTable: Story = {
  render: () => <TableDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    // Each value's save announcer is sr-only (absolutely positioned) inside its cell, so a table
    // wider than a phone scrolls in its own frame and never widens the page.
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    const value = canvas.getByRole("button", { name: /Next action: Confirm the review cadence/ });
    value.scrollIntoView({ block: "center", inline: "center" });
    const box = value.getBoundingClientRect();
    const at = (dy: number) =>
      canvasElement.ownerDocument.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2 + dy,
      );
    // The value keeps its 24px line. Where a pointer is coarse, a finger reaches it anywhere in a
    // band at least 24px tall centred on it (its ::after; ::before is the hover tint).
    if (matchMedia("(any-pointer: coarse)").matches) {
      await expect(value.contains(at(-11.5))).toBe(true);
      await expect(value.contains(at(11.5))).toBe(true);
    } else await expect(getComputedStyle(value, "::after").content).toBe("none");
  },
};

function ValidationDemo() {
  const [acronym, setAcronym] = useState("ATLAS");
  return (
    <Stack space="space.050" className="w-layout-list max-w-full">
      <KeyValue label="Acronym">
        <Editable.Text
          label="Acronym"
          value={acronym}
          onValueChange={setAcronym}
          validate={(v) =>
            v.trim().length === 0
              ? "An acronym is required."
              : /^[A-Za-z0-9-]{2,12}$/.test(v.trim())
                ? null
                : "Two to twelve letters, digits or hyphens."
          }
          save={() => wait(500)}
        />
      </KeyValue>
      <Text size="xsmall" color="color.text.subtlest">
        Type a space to see the message; Enter is refused while it shows; Escape puts the old value
        back.
      </Text>
    </Stack>
  );
}

/** `validate` runs as the reader types and blocks the commit with a message under the field. Escape or Cancel puts the old value back. Leaving the field with a refused value keeps it open with its message and shows Cancel and Save, so a pointer can back out; leaving the window keeps the draft. */
export const Validation: Story = {
  render: () => (
    <Stack space="space.100">
      <ValidationDemo />
      <Button size="small">Elsewhere</Button>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    await userEvent.click(canvas.getByRole("button", { name: "Acronym: ATLAS" }));
    const field = canvas.getByRole("textbox", { name: "Acronym" });
    await userEvent.type(field, " X");
    await expect(field).toHaveAccessibleDescription("Two to twelve letters, digits or hyphens.");

    // Enter is refused and the status says why, once: typing on does not change what it says.
    await press(field, "Enter");
    const status = canvas.getByText(/^Not saved:/, { selector: "[role=status]" });
    const refusal = "Not saved: Two to twelve letters, digits or hyphens.";
    await expect(status).toHaveTextContent(refusal);
    await userEvent.type(field, "{Backspace}{Backspace}");
    await expect(field).not.toHaveAttribute("aria-invalid");
    await expect(status).toHaveTextContent(refusal);
    await userEvent.type(field, " X");

    // Another window or tab takes focus: the field is not left, so nothing commits.
    const hasFocus = doc.hasFocus;
    doc.hasFocus = () => false;
    try {
      await interact(() => field.blur());
    } finally {
      doc.hasFocus = hasFocus;
    }
    await expect(canvas.getByRole("textbox", { name: "Acronym" })).toHaveValue("ATLAS X");

    // A click elsewhere with a refused value: the field stays open, and Cancel is there to press.
    await userEvent.click(field);
    await userEvent.click(canvas.getByRole("button", { name: "Elsewhere" }));
    await expect(canvas.getByRole("textbox", { name: "Acronym" })).toHaveValue("ATLAS X");
    const cancel = canvas.getByRole("button", { name: "Cancel editing Acronym" });
    await expect(canvas.getByRole("button", { name: "Save Acronym" })).toBeVisible();
    await userEvent.click(cancel);
    await expect(canvas.getByRole("button", { name: "Acronym: ATLAS" })).toHaveFocus();
    await expect(canvas.queryByRole("textbox", { name: "Acronym" })).toBeNull();
  },
};

function FailingDemo() {
  const [owner, setOwner] = useState("Dana Whitfield");
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [cancels, setCancels] = useState(0);
  return (
    <Stack space="space.050" className="w-layout-list max-w-full">
      <KeyValue label="Owner">
        <Editable.Text
          label="Owner"
          value={owner}
          onValueChange={setOwner}
          onDraftChange={setDraft}
          onEditingChange={setEditing}
          onCancel={() => setCancels((count) => count + 1)}
          save={() =>
            wait(300).then(() => Promise.reject(new Error("The owner must be on the programme.")))
          }
        />
      </KeyValue>
      <Text size="xsmall" color="color.text.subtlest">
        The value shows at once; when the save is refused it goes back, the reason stays under it,
        and the refused value waits for Try again or Discard.
      </Text>
      <Text size="xsmall" color="color.text.subtle">
        <output aria-label="Unsaved draft">{draft ?? "None"}</output> ·{" "}
        <output aria-label="Editing">{editing ? "Editing" : "At rest"}</output> ·{" "}
        <output aria-label="Cancelled">{cancels}</output>
      </Text>
    </Stack>
  );
}

/** The commit is optimistic. A rejected `save` rolls the value back and shows the error's message; the refused value is kept, and reopening the field shows it, with Try again and Discard under the row. `onDraftChange`, `onEditingChange` and `onCancel` tell the host. */
export const Failing: Story = {
  render: () => <FailingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unsaved = canvas.getByLabelText("Unsaved draft");
    const typed = "Priya Raghavan, lead for the payroll programme";
    await userEvent.click(canvas.getByRole("button", { name: "Owner: Dana Whitfield" }));
    await expect(canvas.getByLabelText("Editing")).toHaveTextContent("Editing");
    const field = canvas.getByRole("textbox", { name: "Owner" });
    await userEvent.clear(field);
    await userEvent.type(field, typed);
    await expect(unsaved).toHaveTextContent(typed);
    await press(field, "Enter");
    await expect(canvas.getByLabelText("Editing")).toHaveTextContent("At rest");
    const row = await canvas.findByRole("button", { name: "Owner: Dana Whitfield" });
    await waitFor(() =>
      expect(row).toHaveAccessibleDescription("The owner must be on the programme."),
    );
    await expect(row).toHaveFocus();
    await expect(row).toHaveAttribute("aria-invalid", "true");
    // The reason wraps under the value, which truncates, so none of it is cut.
    const reason = canvas.getByText("The owner must be on the programme.", { selector: "p" });
    await expect(getComputedStyle(reason).whiteSpace).toBe("normal");
    await expect(canvas.getByText(/^Not saved:/, { selector: "[role=status]" })).toHaveTextContent(
      "Not saved: The owner must be on the programme.",
    );
    // The value went back, and the refused one is still the host's unsaved draft.
    await waitFor(() => expect(unsaved).toHaveTextContent(typed));

    // Reopening shows the refused value, described by the reason.
    await userEvent.click(row);
    const reopened = canvas.getByRole("textbox", { name: "Owner" });
    await expect(reopened).toHaveValue(typed);
    await expect(reopened).toHaveAccessibleDescription("The owner must be on the programme.");
    await press(reopened, "Enter");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Try again to save Owner" })).toBeVisible(),
    );

    // Try again sends the refused value once more; focus waits on the row meanwhile.
    await userEvent.click(canvas.getByRole("button", { name: "Try again to save Owner" }));
    await expect(canvas.getByRole("button", { name: /^Owner:/ })).toHaveFocus();
    const retry = await canvas.findByRole("button", { name: "Try again to save Owner" });
    await expect(canvas.getByRole("button", { name: "Owner: Dana Whitfield" })).toHaveFocus();

    // Discard drops it: the committed value stays, the message goes, and focus stays on the row.
    await expect(retry).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Discard the change to Owner" }));
    const settled = canvas.getByRole("button", { name: "Owner: Dana Whitfield" });
    await expect(settled).toHaveFocus();
    await expect(settled).not.toHaveAccessibleDescription();
    await expect(canvas.queryByRole("button", { name: "Try again to save Owner" })).toBeNull();
    await expect(unsaved).toHaveTextContent("None");
    await expect(canvas.getByLabelText("Cancelled")).toHaveTextContent("1");
    await userEvent.click(settled);
    await expect(canvas.getByRole("textbox", { name: "Owner" })).toHaveValue("Dana Whitfield");
  },
};

function States() {
  const [name, setName] = useState("Northwind payroll");
  const [empty, setEmpty] = useState("");
  const [hinted, setHinted] = useState("");
  const [failing, setFailing] = useState("Saves never land");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Stack space="space.050" className="w-layout-list max-w-full">
      <KeyValue label="Text">
        <Editable.Text label="Text" value={name} onValueChange={setName} save={() => wait(600)} />
      </KeyValue>
      <KeyValue label="Empty">
        <Editable.Text
          label="Empty"
          value={empty}
          onValueChange={setEmpty}
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Placeholder">
        <Editable.Text
          label="Placeholder"
          value={hinted}
          onValueChange={setHinted}
          placeholder="Add a name"
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Invalid">
        <Editable.Text
          label="Invalid"
          value={name}
          onValueChange={setName}
          validate={(v) => (v.length < 4 ? "At least four characters." : null)}
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Save fails">
        <Editable.Text
          label="Save fails"
          value={failing}
          onValueChange={setFailing}
          save={() => wait(400).then(() => Promise.reject(new Error("Offline")))}
        />
      </KeyValue>
      <KeyValue label="Select">
        <Editable.Select
          label="Select"
          options={statuses}
          value={status}
          onValueChange={setStatus}
          save={() => wait(600)}
          render={(v) => (
            <Badge variant="secondary" tone={toneOf[v]}>
              {v}
            </Badge>
          )}
        />
      </KeyValue>
      <KeyValue label="Plain">Not editable: plain text in the same row.</KeyValue>
    </Stack>
  );
}

/** Resting, empty, with a placeholder, validating, failing to save, a select, and a plain value beside them for the alignment. Edit a row to see editing, saving and saved: an open field is a click away. */
export const EditableMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <States />
      <Specimens title="in a Fact">
        <Fact.Group>
          <Fact label="Owner">
            <FactOwner />
          </Fact>
          <Fact label="Method">Inspection</Fact>
        </Fact.Group>
      </Specimens>
      <Text size="xsmall" color="color.text.subtlest">
        Each row saves after 600ms; the fifth rejects.
      </Text>
    </Stack>
  ),
};

function FactOwner() {
  const [owner, setOwner] = useState("Priya Natarajan");
  return (
    <Editable.Text label="Owner" value={owner} onValueChange={setOwner} save={() => wait(500)} />
  );
}

function Dashes() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <Pair
      do={
        <Box className="w-layout-list max-w-full">
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={a}
              onValueChange={setA}
              placeholder="Unassigned"
              save={() => wait(300)}
            />
          </KeyValue>
        </Box>
      }
      doText="Empty says what is missing, as a noun: Unassigned. Nothing said, the row shows the muted dash."
      dont={
        <Box className="w-layout-list max-w-full">
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={b}
              onValueChange={setB}
              placeholder="Click to edit"
              save={() => wait(300)}
            />
          </KeyValue>
        </Box>
      }
      dontText="An instruction as the value. The row already says it can be clicked; the placeholder's job is to say what goes here."
    />
  );
}

function StatusAsText() {
  const [a, setA] = useState<Status>("In review");
  const [b, setB] = useState("In review");
  return (
    <Pair
      do={
        <Box className="w-layout-list max-w-full">
          <KeyValue label="Status">
            <Editable.Select
              label="Status"
              options={statuses}
              value={a}
              onValueChange={setA}
              save={() => wait(300)}
              render={(s) => (
                <Badge variant="secondary" tone={toneOf[s]}>
                  {s}
                </Badge>
              )}
            />
          </KeyValue>
        </Box>
      }
      doText="One of a fixed set is a Select: the options are the only values, drawn as the Badge the record shows."
      dont={
        <Box className="w-layout-list max-w-full">
          <KeyValue label="Status">
            <Editable.Text label="Status" value={b} onValueChange={setB} save={() => wait(300)} />
          </KeyValue>
        </Box>
      }
      dontText="A status typed as text. The reader can write anything, and the record loses its Badge."
    />
  );
}

function FormOfEditables() {
  const fieldId = useId();

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  return (
    <Pair
      do={
        <Stack space="space.200" className="w-layout-list max-w-full">
          <Field>
            <FieldLabel id={`${fieldId}-title-1-label`} htmlFor={`${fieldId}-title-1`}>
              {"Title"}
              <span aria-hidden="true" className="text-danger">
                {" "}
                *
              </span>
            </FieldLabel>
            <Input
              id={`${fieldId}-title-1`}
              aria-labelledby={`${fieldId}-title-1-label`}
              aria-required={true}
              placeholder="What was found"
            />
          </Field>
          <Field>
            <FieldLabel id={`${fieldId}-owner-2-label`} htmlFor={`${fieldId}-owner-2`}>
              {"Owner"}
              <span aria-hidden="true" className="text-danger">
                {" "}
                *
              </span>
            </FieldLabel>
            <Input
              id={`${fieldId}-owner-2`}
              aria-labelledby={`${fieldId}-owner-2-label`}
              aria-required={true}
              placeholder="Who fixes it"
            />
          </Field>
          <Inline space="space.100" rowSpace="space.100" alignInline="end" shouldWrap>
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Create finding</Button>
          </Inline>
        </Stack>
      }
      doText="A record that does not exist yet is a form: Fields, a primary that creates it, and the check on submit."
      dont={
        <Stack space="space.050" className="w-layout-list max-w-full">
          <KeyValue label="Title">
            <Editable.Text
              label="Title"
              value={title}
              onValueChange={setTitle}
              placeholder="What was found"
              save={() => wait(300)}
            />
          </KeyValue>
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={owner}
              onValueChange={setOwner}
              placeholder="Who fixes it"
              save={() => wait(300)}
            />
          </KeyValue>
        </Stack>
      }
      dontText="A new record built from Editables. Each field saves on its own, so a half-made record exists after the first, and nothing checks the set."
    />
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <FormOfEditables />
      <StatusAsText />
      <Dashes />
    </Stack>
  ),
};

type PlaygroundArgs = Pick<EditableTextProps, "label" | "placeholder"> & { value: string };

function PlaygroundText({ label, placeholder, value: initial }: PlaygroundArgs) {
  const [value, setValue] = useState(initial);
  return (
    <Box className="w-layout-list max-w-full">
      <KeyValue label={label}>
        <Editable.Text
          label={label}
          value={value}
          onValueChange={setValue}
          placeholder={placeholder}
          save={() => wait(500)}
        />
      </KeyValue>
    </Box>
  );
}

export const Playground: StoryObj<PlaygroundArgs> = {
  args: { label: "Owner", value: "Dana Whitfield", placeholder: "Unassigned" },
  render: (args) => <PlaygroundText key={args.value} {...args} />,
};

function SerializedSaveDemo() {
  const [value, setValue] = useState("Alpha");
  const [request, setRequest] = useState<{ resolve: () => void; reject: () => void } | null>(null);
  const [mounted, setMounted] = useState(true);
  return (
    <Stack space="space.200">
      {mounted ? (
        <Editable.Text
          label="Owner"
          value={value}
          onValueChange={setValue}
          save={(next) =>
            next === "Immediate"
              ? Promise.reject(new Error("Immediate rejection"))
              : new Promise<void>((resolve, reject) =>
                  setRequest({ resolve, reject: () => reject(new Error("Save failed")) }),
                )
          }
        />
      ) : null}
      <Button onClick={() => request?.resolve()}>Resolve save</Button>
      <Button onClick={() => request?.reject()}>Reject save</Button>
      <Button onClick={() => setValue("External")}>External update</Button>
      <Button onClick={() => setMounted(false)}>Unmount editor</Button>
      <output aria-label="Committed owner">{value}</output>
    </Stack>
  );
}

export const SerializedSave: Story = {
  render: () => <SerializedSaveDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const click = async (name: string | RegExp) =>
      interact(() => canvas.getByRole("button", { name }).click());
    const edit = async (current: string, next: string) => {
      await click(new RegExp(`Owner: ${current}`));
      const input = canvas.getByRole("textbox", { name: "Owner" }) as HTMLInputElement;
      await interact(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          next,
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await interact(() =>
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
      );
    };
    await edit("Alpha", "Beta");
    await expect(canvas.getByLabelText("Committed owner")).toHaveTextContent("Beta");
    await click(/Owner: Beta/);
    await expect(canvas.queryByRole("textbox", { name: "Owner" })).toBeNull();
    await click("Reject save");
    await expect(canvas.getByLabelText("Committed owner")).toHaveTextContent("Alpha");
    await edit("Alpha", "Gamma");
    await click("External update");
    await click("Reject save");
    await expect(canvas.getByLabelText("Committed owner")).toHaveTextContent("External");
    await edit("External", "Immediate");
    await expect(canvas.getByLabelText("Committed owner")).toHaveTextContent("External");
    await edit("External", "Resolved");
    await click("Resolve save");
    await expect(canvas.getByText("Saved", { selector: "[role=status]" })).toHaveTextContent(
      "Saved",
    );
    await edit("Resolved", "Delta");
    await click("Unmount editor");
    await click("Reject save");
    await expect(canvas.getByLabelText("Committed owner")).toHaveTextContent("Delta");
  },
};

function MultilineDemo() {
  const [value, setValue] = useState(
    "Reject unsigned images at every boot stage.\nPreserve the audit trail.",
  );
  return (
    <div style={{ width: 320, maxWidth: "100%" }}>
      <Field>
        <FieldLabel>Success criteria</FieldLabel>
        <EditableText
          multiline
          label="Success criteria"
          value={value}
          onValueChange={setValue}
          save={async () => {}}
          validate={(next) => (next.trim() ? null : "Describe the success criteria.")}
        />
      </Field>
      <Button size="small">Next field</Button>
    </div>
  );
}

/** A paragraph reads as text at rest, which the reader can select and copy, with an Edit button beside it. Editing is a textarea with Cancel and Save under it: Enter adds a line, Ctrl/Cmd+Enter or Save saves, Escape or Cancel puts the old value back. */
export const Multiline: Story = {
  render: () => <MultilineDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edit = () => canvas.getByRole("button", { name: "Edit Success criteria" });
    // The paragraph is text, not a button's name.
    const text = canvas.getByText(/Reject unsigned images/);
    await expect(text.closest("button")).toBeNull();
    await userEvent.click(edit());
    let input = canvas.getByRole("textbox", { name: "Success criteria" });
    await expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, "First check{Enter}Second check");
    await expect(input).toHaveValue("First check\nSecond check");
    await interact(() =>
      canvas.getByRole("button", { name: "Cancel editing Success criteria" }).click(),
    );
    await expect(canvas.getByText(/Reject unsigned images/)).toBeVisible();
    await expect(edit()).toHaveFocus();
    await userEvent.click(edit());
    input = canvas.getByRole("textbox", { name: "Success criteria" });
    await userEvent.clear(input);
    await interact(() =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      ),
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(input, "First check{Enter}Second check");
    await interact(() => canvas.getByRole("button", { name: "Save Success criteria" }).click());
    await waitFor(() => expect(edit()).toHaveFocus());
    await expect(canvas.getByText(/First check/)).toHaveTextContent("First check Second check");
    await waitFor(() => expect(edit()).not.toHaveAttribute("aria-disabled", "true"));
    await userEvent.click(edit());
    input = canvas.getByRole("textbox", { name: "Success criteria" });
    await userEvent.clear(input);
    await userEvent.type(input, "Updated by leaving the cell");
    await interact(() => canvas.getByRole("button", { name: "Next field" }).focus());
    await expect(canvas.getByText("Updated by leaving the cell")).toBeVisible();
  },
};

function DialogDemo() {
  const [owner, setOwner] = useState("Dana Whitfield");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Edit control</DialogTrigger>
      <DialogContent width="medium">
        <DialogHeader>
          <DialogTitle>Account management</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <KeyValue label="Owner">
            <EditableText
              label="Owner"
              value={owner}
              onValueChange={setOwner}
              save={() => wait(200)}
            />
          </KeyValue>
          <KeyValue label="Status">
            <EditableSelect
              label="Status"
              value={status}
              onValueChange={setStatus}
              options={statuses}
              save={() => wait(200)}
            />
          </KeyValue>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** In a Dialog, Sheet or Popover, Escape in the field puts the old value back and stops there, as Escape in a Select's options closes only them: the overlay stays open. The next Escape, from the row, closes it. */
export const InDialog: Story = {
  render: () => <DialogDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Edit control" }));
    const dialog = await page.findByRole("dialog", { name: "Account management" });
    // The reader works in the dialog once it has arrived. A Select opened while the dialog still
    // scales in measures a trigger that is still growing.
    await waitFor(() =>
      expect(dialog.getAnimations().filter((a) => a.playState === "running")).toHaveLength(0),
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Owner: Dana Whitfield" }));
    const field = within(dialog).getByRole("textbox", { name: "Owner" });
    await userEvent.type(field, " and Sam");
    await press(field, "Escape");
    await expect(dialog).toBeVisible();
    const row = within(dialog).getByRole("button", { name: "Owner: Dana Whitfield" });
    await expect(row).toHaveFocus();
    // A Select's options close on Escape and leave the dialog open too.
    const status = within(dialog).getByRole("combobox", { name: /^Status:/ });
    await userEvent.click(status);
    await page.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(status).toHaveFocus());
    await interact(() => row.focus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  },
};

function LockedDemo() {
  const [title, setTitle] = useState("Segregation of duties, payables");
  const [owner, setOwner] = useState("Dana Whitfield");
  const [status, setStatus] = useState<Status>("In review");
  const [statement, setStatement] = useState(
    "Payables are approved by someone other than the person who raised them.",
  );
  const [saving, setSaving] = useState<string | null>(null);
  const settle = useRef<(() => void) | null>(null);
  const hold = (field: string) =>
    new Promise<void>((resolve) => {
      setSaving(field);
      settle.current = () => {
        setSaving(null);
        resolve();
      };
    });
  const reason = (field: string) =>
    saving && saving !== field ? `Wait for the change to ${saving} to finish saving.` : undefined;
  return (
    <Stack space="space.100" className="w-layout-list max-w-full">
      <KeyValue.Group>
        <KeyValue label="Title">
          <EditableText
            label="Title"
            value={title}
            onValueChange={setTitle}
            lockedReason={reason("Title")}
            save={() => hold("Title")}
          />
        </KeyValue>
        <KeyValue label="Owner">
          <EditableText
            label="Owner"
            value={owner}
            onValueChange={setOwner}
            lockedReason={reason("Owner")}
            save={() => hold("Owner")}
          />
        </KeyValue>
        <KeyValue label="Status">
          <EditableSelect
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={statuses}
            lockedReason={reason("Status")}
            save={() => hold("Status")}
          />
        </KeyValue>
      </KeyValue.Group>
      <EditableText
        multiline
        label="Statement"
        value={statement}
        onValueChange={setStatement}
        lockedReason={reason("Statement")}
        save={() => hold("Statement")}
      />
      <Button size="small" onClick={() => settle.current?.()}>
        Finish the save
      </Button>
    </Stack>
  );
}

/** One change at a time: while one value saves, the host locks the others with `lockedReason`. A locked row stays focusable and in place, is described by the reason, and shows it when the reader tries to edit; nothing is disabled, so focus never drops. */
export const Locked: Story = {
  render: () => <LockedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Title:/ }));
    const titleField = canvas.getByRole("textbox", { name: "Title" });
    await userEvent.type(titleField, " review");
    await press(titleField, "Enter");
    const title = canvas.getByRole("button", { name: /^Title:/ });
    await expect(title).toHaveFocus();
    await expect(title).toHaveAttribute("aria-disabled", "true");
    const owner = canvas.getByRole("button", { name: "Owner: Dana Whitfield" });
    const reason = "Wait for the change to Title to finish saving.";
    await expect(owner).toHaveAttribute("aria-disabled", "true");
    await expect(owner).toHaveAccessibleDescription(reason);
    // Said to a screen reader on focus; shown once the reader tries to edit.
    for (const note of canvas.queryAllByText(reason)) await expect(note).not.toBeVisible();
    await userEvent.click(owner);
    await expect(canvas.queryByRole("textbox", { name: "Owner" })).toBeNull();
    await expect(owner).toHaveFocus();
    const note = canvas.getAllByText(reason)[0]!;
    await expect(note).toBeVisible();
    // The reason wraps under a value that truncates, so none of it is cut at the rail's edge.
    await expect(getComputedStyle(note).whiteSpace).toBe("normal");
    await expect(note.scrollWidth).toBeLessThanOrEqual(note.clientWidth + 1);
    const status = canvas.getByRole("combobox", { name: /^Status:/ });
    await expect(status).toHaveAccessibleDescription(reason);
    await userEvent.click(status);
    await expect(within(canvasElement.ownerDocument.body).queryByRole("listbox")).toBeNull();
    const statement = canvas.getByRole("button", { name: "Edit Statement" });
    await expect(statement).toHaveAttribute("aria-disabled", "true");
    await expect(statement).toHaveAccessibleDescription(reason);
    await userEvent.click(statement);
    await expect(canvas.queryByRole("textbox", { name: "Statement" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Finish the save" }));
    await waitFor(() => expect(owner).not.toHaveAttribute("aria-disabled"));
    await expect(owner).not.toHaveAccessibleDescription();
    await userEvent.click(owner);
    const ownerField = canvas.getByRole("textbox", { name: "Owner" });
    await expect(ownerField).toHaveFocus();
    await press(ownerField, "Escape");

    // While a paragraph saves, its Edit button keeps focus and says it cannot be used yet.
    await userEvent.click(canvas.getByRole("button", { name: "Edit Statement" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Statement" }), " Weekly.");
    await interact(() => canvas.getByRole("button", { name: "Save Statement" }).click());
    const saving = canvas.getByRole("button", { name: "Edit Statement" });
    await waitFor(() => expect(saving).toHaveFocus());
    await expect(saving).toHaveAttribute("aria-disabled", "true");
    await expect(canvas.getByRole("button", { name: /^Owner:/ })).toHaveAccessibleDescription(
      "Wait for the change to Statement to finish saving.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Finish the save" }));
    await waitFor(() => expect(saving).not.toHaveAttribute("aria-disabled"));
  },
};

const people: readonly EditableOption<string>[] = [
  { value: "p-101", label: "Amara Bell" },
  { value: "p-102", label: "Dana Whitfield" },
  { value: "p-103", label: "Elena Vasquez" },
  { value: "p-104", label: "Hana Lindqvist" },
  { value: "p-105", label: "Marcus Ryde" },
  { value: "p-106", label: "Nadia Fournier" },
  { value: "p-107", label: "Priya Raghavan" },
  { value: "p-108", label: "Sarah Chen" },
  { value: "p-109", label: "Tom Okafor" },
];

const methods: readonly EditableOption<string>[] = [
  { value: "examine", label: "Inspection" },
  { value: "interview", label: "Interview" },
  { value: "test", label: "Test" },
];

function OptionsDemo() {
  const [owner, setOwner] = useState("");
  const [method, setMethod] = useState("");
  return (
    <Stack space="space.100" className="w-layout-list max-w-full">
      <KeyValue.Group>
        <KeyValue label="Owner">
          <EditableSelect
            label="Owner"
            value={owner}
            onValueChange={setOwner}
            options={people}
            emptyLabel="Unassigned"
            render={(_, name) => <Person name={name} />}
            save={() => wait(200)}
          />
        </KeyValue>
        <KeyValue label="Method">
          <EditableSelect
            label="Method"
            value={method}
            onValueChange={setMethod}
            options={methods}
            placeholder="Not chosen"
            save={() => wait(200)}
          />
        </KeyValue>
      </KeyValue.Group>
      <Text size="xsmall" color="color.text.subtle">
        Stored owner: <output aria-label="Stored owner">{owner || "none"}</output> · Stored method:{" "}
        <output aria-label="Stored method">{method || "none"}</output>
      </Text>
    </Stack>
  );
}

/** Stored values are ids and readers see names: `{ value, label }` options search and announce the label and commit the value, and `emptyLabel` offers a first choice that clears it. An empty value at rest is the `placeholder`, the `emptyLabel`, or the muted dash, never a bare chevron. */
export const Options: Story = {
  render: () => <OptionsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const owner = canvas.getByRole("combobox", { name: "Owner: Unassigned" });
    await expect(canvas.getByRole("combobox", { name: "Method: Not chosen" })).toBeVisible();
    await userEvent.click(owner);
    const search = await page.findByRole("combobox", { name: "Owner" });
    await waitFor(() => expect(search).toHaveFocus());
    await userEvent.type(search, "priya");
    const priya = await page.findByRole("option", { name: "Priya Raghavan" });
    await expect(page.queryByRole("option", { name: /p-10/ })).toBeNull();
    await userEvent.click(priya);
    await waitFor(() => expect(owner).toHaveAccessibleName("Owner: Priya Raghavan"));
    await expect(canvas.getByLabelText("Stored owner")).toHaveTextContent("p-107");
    await waitFor(() => expect(owner).not.toHaveAttribute("aria-disabled", "true"));
    await userEvent.click(owner);
    await userEvent.click(await page.findByRole("option", { name: "Unassigned" }));
    await waitFor(() => expect(owner).toHaveAccessibleName("Owner: Unassigned"));
    await expect(canvas.getByLabelText("Stored owner")).toHaveTextContent("none");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());

    // A short list is a Select, with the same labels: it shows the name and stores the id.
    const method = canvas.getByRole("combobox", { name: "Method: Not chosen" });
    await userEvent.click(method);
    await userEvent.click(await page.findByRole("option", { name: "Interview" }));
    await waitFor(() => expect(method).toHaveAccessibleName("Method: Interview"));
    await expect(canvas.getByLabelText("Stored method")).toHaveTextContent("interview");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
  },
};

function DatesDemo() {
  const [due, setDue] = useState("2026-10-14");
  const [planned, setPlanned] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Stack space="space.100" className="w-layout-list max-w-full">
      <KeyValue.Group>
        <KeyValue label="Due">
          <Editable.Date
            label="Due"
            value={due}
            onValueChange={setDue}
            onDraftChange={setDraft}
            placeholder="No due date"
            save={() => wait(200)}
          />
        </KeyValue>
        <KeyValue label="Planned completion">
          <EditableDate
            label="Planned completion"
            value={planned}
            onValueChange={setPlanned}
            placeholder="Not planned"
            min="2026-10-01"
            save={(next) =>
              next === "2026-12-31"
                ? wait(200).then(() =>
                    Promise.reject(new Error("The plan must end before the year closes.")),
                  )
                : wait(200)
            }
          />
        </KeyValue>
      </KeyValue.Group>
      <Text size="xsmall" color="color.text.subtle">
        Stored due: <output aria-label="Stored due">{due || "none"}</output> · Stored plan:{" "}
        <output aria-label="Stored plan">{planned || "none"}</output> · Draft:{" "}
        <output aria-label="Date draft">{draft ?? "None"}</output>
      </Text>
    </Stack>
  );
}

/** A calendar day edited in place, as `Editable.Date`: the value is an ISO day shown in the reader's words. The field reads a typed day ("10/20/2026", "Oct 20") and its button, or Alt+Down, opens the month, where choosing a day commits at once. Text that is not a day, or a day before `min`, keeps the field open with what fixes it; a refused save keeps the day for Try again, as on Editable.Text. */
export const Dates: Story = {
  render: () => <DatesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const stored = canvas.getByLabelText("Stored due");
    // At rest the day is in the reader's words, as a time element holding the ISO day.
    const row = canvas.getByRole("button", { name: "Due: Oct 14, 2026" });
    await expect(row.querySelector("time")).toHaveAttribute("dateTime", "2026-10-14");

    // A typed day commits on Enter, and focus goes back to the row.
    await userEvent.click(row);
    const field = canvas.getByRole("textbox", { name: "Due" });
    await expect(field).toHaveFocus();
    await expect(field).toHaveValue("Oct 14, 2026");
    await userEvent.clear(field);
    await userEvent.type(field, "10/20/2026");
    await expect(canvas.getByLabelText("Date draft")).toHaveTextContent("2026-10-20");
    await press(field, "Enter");
    const saved = await canvas.findByRole("button", { name: "Due: Oct 20, 2026" });
    await expect(saved).toHaveFocus();
    await expect(stored).toHaveTextContent("2026-10-20");
    await waitFor(() => expect(canvas.getByLabelText("Date draft")).toHaveTextContent("None"));

    // Text that is not a day keeps the field open and says what fixes it; Escape puts it back.
    await userEvent.click(saved);
    const again = canvas.getByRole("textbox", { name: "Due" });
    await userEvent.clear(again);
    await userEvent.type(again, "someday");
    await press(again, "Enter");
    await expect(again).toBeInTheDocument();
    await expect(again).toHaveAttribute("aria-invalid", "true");
    await expect(again).toHaveAccessibleDescription(/^Enter a date such as /);
    await press(again, "Escape");
    await expect(await canvas.findByRole("button", { name: "Due: Oct 20, 2026" })).toHaveFocus();
    await expect(stored).toHaveTextContent("2026-10-20");

    // The month: Alt+Down opens it, and a day chosen there commits at once.
    await userEvent.click(canvas.getByRole("button", { name: "Due: Oct 20, 2026" }));
    await press(canvas.getByRole("textbox", { name: "Due" }), "ArrowDown", { altKey: true });
    const month = within(await page.findByRole("dialog", { name: "Choose a date for Due" }));
    await userEvent.click(month.getByRole("button", { name: /October 22, 2026/ }));
    await waitFor(() => expect(stored).toHaveTextContent("2026-10-22"));
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Due: Oct 22, 2026" })).toHaveFocus(),
    );

    // A day before `min` is refused with the earliest day it takes.
    const plan = canvas.getByRole("button", { name: "Planned completion: Not planned" });
    await userEvent.click(plan);
    const planField = canvas.getByRole("textbox", { name: "Planned completion" });
    await userEvent.type(planField, "9/30/2026");
    await press(planField, "Enter");
    await expect(planField).toHaveAccessibleDescription("Enter Oct 1, 2026 or later.");

    // A refused save puts the old value back and keeps the day for Try again or Discard.
    await userEvent.clear(planField);
    await userEvent.type(planField, "12/31/2026");
    await press(planField, "Enter");
    const refused = await canvas.findByRole("button", { name: "Planned completion: Not planned" });
    await waitFor(() =>
      expect(refused).toHaveAccessibleDescription("The plan must end before the year closes."),
    );
    await expect(canvas.getByLabelText("Stored plan")).toHaveTextContent("none");
    await expect(
      canvas.getByRole("button", { name: "Try again to save Planned completion" }),
    ).toBeVisible();
    // Reopening shows the refused day; Escape drops it and the committed value stays.
    await userEvent.click(refused);
    const reopened = canvas.getByRole("textbox", { name: "Planned completion" });
    await expect(reopened).toHaveValue("Dec 31, 2026");
    await press(reopened, "Escape");
    const settled = await canvas.findByRole("button", { name: "Planned completion: Not planned" });
    await expect(settled).toHaveFocus();
    await expect(settled).not.toHaveAccessibleDescription();
  },
};

function DueDatesDemo() {
  const [due, setDue] = useState("2020-03-02");
  const [done, setDone] = useState(false);
  return (
    <Stack space="space.100" className="w-layout-list max-w-full">
      <KeyValue.Group>
        <KeyValue label="Due">
          <Editable.Date
            label="Due"
            value={due}
            onValueChange={setDue}
            due
            complete={done}
            placeholder="No due date"
            save={() => wait(200)}
          />
        </KeyValue>
        <KeyValue label="Planned completion">
          <Editable.Date
            label="Planned completion"
            value="2020-03-02"
            due
            complete
            placeholder="Not planned"
            save={() => wait(200)}
          />
        </KeyValue>
      </KeyValue.Group>
      <Inline>
        <Button size="small" variant="secondary" onClick={() => setDone((value) => !value)}>
          {done ? "Reopen the task" : "Mark the task done"}
        </Button>
      </Inline>
    </Stack>
  );
}

/** A due day with `due`: at rest the row says where the day stands beside it, as DateLabel does in a register, with its icon, tone and words (Overdue, Due today, Due tomorrow, Due in 2 days), judged against the reader's today. The words are part of the row's name. `complete` shows a finished task's day plainly. */
export const DueDates: Story = {
  render: () => <DueDatesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A day before the reader's today reads Overdue, in the row and in its name.
    const row = canvas.getByRole("button", { name: /^Due: Mar 2, 2020\s*, Overdue$/ });
    const state = row.querySelector('[data-slot="editable-date-state"]');
    await expect(state).toHaveAttribute("data-state", "overdue");
    await expect(state).toHaveTextContent("Overdue");
    await expect(row.querySelector("time")).toHaveAttribute("dateTime", "2020-03-02");
    // Done work's day reads plainly.
    await userEvent.click(canvas.getByRole("button", { name: "Mark the task done" }));
    const plain = await canvas.findByRole("button", { name: "Due: Mar 2, 2020" });
    await expect(plain.querySelector('[data-slot="editable-date-state"]')).toBeNull();
    const finished = canvas.getByRole("button", { name: "Planned completion: Mar 2, 2020" });
    await expect(finished.querySelector('[data-slot="editable-date-state"]')).toBeNull();
    // Reopened, it is overdue again.
    await userEvent.click(canvas.getByRole("button", { name: "Reopen the task" }));
    await expect(
      await canvas.findByRole("button", { name: /^Due: Mar 2, 2020\s*, Overdue$/ }),
    ).toBeVisible();
  },
};
