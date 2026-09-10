import { expect, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useId, act, useState } from "react";

import {
  FieldLabel,
  Badge,
  Button,
  Editable,
  Fact,
  Field,
  Input,
  KeyValue,
  Table,
  type EditableTextProps,
  type Tone,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Editable",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

// Storybook's userEvent wrapper disables the act environment during async work.
// Drive these promise-settlement cases with awaited native events in a single act scope.
const interact = async (event: () => void) => {
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => {
      event();
    });
  } finally {
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
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
    <Stack space="space.050" className="w-layout-list">
      <KeyValue label="Name">
        <Editable.Text
          label="Name"
          value={name}
          onChange={setName}
          save={() => wait(700)}
          validate={(v) => (v.trim() ? null : "A name is required.")}
        />
      </KeyValue>
      <KeyValue label="Owner">
        <Editable.Text
          label="Owner"
          value={owner}
          onChange={setOwner}
          placeholder="Unassigned"
          save={() => wait(700)}
        />
      </KeyValue>
      <KeyValue label="Status">
        <Editable.Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={statuses}
          save={() => wait(500)}
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
  render: () => <RailDemo />,
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
    await userEvent.type(canvas.getByRole("textbox", { name: "Owner" }), "Dana Whitfield");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /Owner: Dana Whitfield/ })).toBeVisible();
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
    <Stack space="space.050" className="w-layout-list">
      <KeyValue label="Owner">
        <Editable.Select<Member>
          label="Owner"
          value={owner}
          onChange={setOwner}
          options={roster}
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
          onChange={setReviewer}
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

/** A roster: past eight options the Select is a searched list of names, nothing else in it. */
export const Roster: Story = {
  render: () => <RosterDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const owner = canvas.getByRole("combobox", { name: /Owner: Marcus Ryde/ });
    await userEvent.click(owner);
    let search = await page.findByRole("combobox", { name: "Owner" });
    await expect(search).toHaveFocus();
    await userEvent.type(search, "No matching person");
    await expect(await page.findByText("Nothing matches")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(owner).toHaveFocus());
    await expect(owner).toHaveTextContent("Marcus Ryde");
    await userEvent.keyboard("{Enter}");
    search = await page.findByRole("combobox", { name: "Owner" });
    await expect(search).toHaveValue("");
    await userEvent.type(search, "Priya");
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
                onChange={(next) => set(r.id, { next })}
                save={() => wait(500)}
              />
            </Table.Cell>
            <Table.Cell>
              <Editable.Select
                label="Assessment"
                options={statuses}
                value={r.status}
                onChange={(status) => set(r.id, { status })}
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
export const InTable: Story = { render: () => <TableDemo /> };

function ValidationDemo() {
  const [acronym, setAcronym] = useState("ATLAS");
  return (
    <Stack space="space.050" className="w-layout-list">
      <KeyValue label="Acronym">
        <Editable.Text
          label="Acronym"
          value={acronym}
          onChange={setAcronym}
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

/** `validate` runs as the reader types and blocks the commit with a message under the field. Escape puts the old value back. */
export const Validation: Story = { render: () => <ValidationDemo /> };

function FailingDemo() {
  const [owner, setOwner] = useState("Dana Whitfield");
  return (
    <Stack space="space.050" className="w-layout-list">
      <KeyValue label="Owner">
        <Editable.Text
          label="Owner"
          value={owner}
          onChange={setOwner}
          save={() =>
            wait(700).then(() => Promise.reject(new Error("The owner must be on the programme.")))
          }
        />
      </KeyValue>
      <Text size="xsmall" color="color.text.subtlest">
        The value shows at once; when the save is refused it goes back, and the reason stays under
        it.
      </Text>
    </Stack>
  );
}

/** The commit is optimistic. A rejected `save` rolls the value back and shows the error's message. */
export const Failing: Story = { render: () => <FailingDemo /> };

function States() {
  const [name, setName] = useState("Northwind payroll");
  const [empty, setEmpty] = useState("");
  const [hinted, setHinted] = useState("");
  const [failing, setFailing] = useState("Saves never land");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Stack space="space.050" className="w-layout-list">
      <KeyValue label="Text">
        <Editable.Text label="Text" value={name} onChange={setName} save={() => wait(600)} />
      </KeyValue>
      <KeyValue label="Empty">
        <Editable.Text label="Empty" value={empty} onChange={setEmpty} save={() => wait(600)} />
      </KeyValue>
      <KeyValue label="Placeholder">
        <Editable.Text
          label="Placeholder"
          value={hinted}
          onChange={setHinted}
          placeholder="Add a name"
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Invalid">
        <Editable.Text
          label="Invalid"
          value={name}
          onChange={setName}
          validate={(v) => (v.length < 4 ? "At least four characters." : null)}
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Save fails">
        <Editable.Text
          label="Save fails"
          value={failing}
          onChange={setFailing}
          save={() => wait(400).then(() => Promise.reject(new Error("Offline")))}
        />
      </KeyValue>
      <KeyValue label="Select">
        <Editable.Select
          label="Select"
          options={statuses}
          value={status}
          onChange={setStatus}
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
  return <Editable.Text label="Owner" value={owner} onChange={setOwner} save={() => wait(500)} />;
}

function Dashes() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <Pair
      do={
        <Box className="w-layout-list">
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={a}
              onChange={setA}
              placeholder="Unassigned"
              save={() => wait(300)}
            />
          </KeyValue>
        </Box>
      }
      doText="Empty says what is missing, as a noun: Unassigned. Nothing said, the row shows the muted dash."
      dont={
        <Box className="w-layout-list">
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={b}
              onChange={setB}
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
        <Box className="w-layout-list">
          <KeyValue label="Status">
            <Editable.Select
              label="Status"
              options={statuses}
              value={a}
              onChange={setA}
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
        <Box className="w-layout-list">
          <KeyValue label="Status">
            <Editable.Text label="Status" value={b} onChange={setB} save={() => wait(300)} />
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
        <Stack space="space.200" className="w-layout-list">
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
          <Inline space="space.100" alignInline="end">
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Create finding</Button>
          </Inline>
        </Stack>
      }
      doText="A record that does not exist yet is a form: Fields, a primary that creates it, and the check on submit."
      dont={
        <Stack space="space.050" className="w-layout-list">
          <KeyValue label="Title">
            <Editable.Text
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="What was found"
              save={() => wait(300)}
            />
          </KeyValue>
          <KeyValue label="Owner">
            <Editable.Text
              label="Owner"
              value={owner}
              onChange={setOwner}
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
    <Box className="w-layout-list">
      <KeyValue label={label}>
        <Editable.Text
          label={label}
          value={value}
          onChange={setValue}
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
          onChange={setValue}
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
