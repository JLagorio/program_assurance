import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { useArgs } from "storybook/preview-api";

import { Button, Combobox, Dialog, Field, NativeSelect, useRequired } from "../../components";
import type { ComboboxOption } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const people: ComboboxOption[] = [
  { value: "dw", label: "Dana Whitfield", keywords: "isso", meta: "ISSO" },
  { value: "pn", label: "Priya Natarajan", keywords: "issm", meta: "ISSM" },
  { value: "gh", label: "Grace Hoppel", meta: "Program owner" },
  { value: "tz", label: "Tomasz Zieliński", meta: "Engineer" },
  { value: "mr", label: "Marcus Ryde", meta: "Assessor" },
  { value: "sc", label: "Sarah Chen", meta: "Engineer" },
  { value: "la", label: "Linus Aarto", disabled: true, meta: "On leave" },
];
const controls: ComboboxOption[] = [
  { value: "AC-2", label: "Account management", keywords: "AC-2", meta: "AC-2" },
  { value: "AC-3", label: "Access enforcement", keywords: "AC-3", meta: "AC-3" },
  { value: "AU-2", label: "Event logging", keywords: "AU-2", meta: "AU-2" },
  { value: "CM-6", label: "Configuration settings", keywords: "CM-6", meta: "CM-6" },
  { value: "IA-2", label: "Identification and authentication", keywords: "IA-2", meta: "IA-2" },
  { value: "SC-7", label: "Boundary protection", keywords: "SC-7", meta: "SC-7" },
];
const environments = ["Development", "Test", "Production"];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Owner",
    options: people,
    value: "pn",
    onChange: () => undefined,
    placeholder: "Choose an owner",
  },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
function MatrixCombobox({ state }: { state: State }) {
  const [value, setValue] = useState(state === "rest" ? "" : "pn");
  return (
    <Combobox
      aria-label="Owner"
      options={people}
      value={value}
      onChange={setValue}
      placeholder="Choose an owner"
      disabled={state === "disabled"}
      aria-invalid={state === "invalid"}
    />
  );
}

/** Every state down the side; type directly in the field to filter its options. */
export const ComboboxMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 240 }}>
          {col === "bare" ? (
            <MatrixCombobox state={state} />
          ) : (
            <Field
              label="Owner"
              isRequired
              hint={state === "invalid" ? undefined : "Who answers for the control."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <MatrixCombobox state={state} />
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** The editable field with its options open and the chosen one checked. */
export const Open: Story = {
  render: function OpenExample() {
    const [value, setValue] = useState("pn");
    return (
      <div style={{ width: 280, height: 380 }}>
        <Field label="Owner">
          <Combobox
            options={people}
            value={value}
            onChange={setValue}
            placeholder="Choose an owner"
            defaultOpen
          />
        </Field>
      </div>
    );
  },
};

/** `medium` in a form, `small` in a toolbar beside small Buttons. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="medium (32px): in a form">
        <div style={{ width: 280 }}>
          <Field label="Control">
            <Combobox
              options={controls}
              value="AC-2"
              onChange={() => undefined}
              placeholder="Choose a control"
            />
          </Field>
        </div>
      </Specimens>
      <Specimens title="small (28px): a toolbar's filter">
        <Inline space="space.100" alignBlock="center">
          <Button size="small" variant="secondary" iconBefore={<SlidersHorizontal />}>
            Filter
          </Button>
          <Combobox
            size="small"
            width={200}
            aria-label="Owner"
            options={people}
            value=""
            onChange={() => undefined}
            placeholder="Any owner"
          />
          <div style={{ width: 160 }}>
            <NativeSelect size="small" aria-label="Environment" defaultValue="">
              <option value="">Any environment</option>
              {environments.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </NativeSelect>
          </div>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

const ownerInputRef = fn();

function FormDemo() {
  const [owner, setOwner] = useState("");
  const [control, setControl] = useState("");
  const req = useRequired({ owner, control });
  return (
    <form
      id="assignment-form"
      style={{ width: 360 }}
      onSubmit={(event) => {
        event.preventDefault();
        req.check();
      }}
    >
      <Stack space="space.200">
        <Field
          label="Owner"
          isRequired
          hint="Who answers for the control."
          error={req.errorFor("owner")}
        >
          <Combobox
            name="owner"
            ref={ownerInputRef}
            options={people}
            value={owner}
            onChange={setOwner}
            placeholder="Choose an owner"
          />
        </Field>
        <Field
          label="Control"
          isRequired
          hint="Type the id or the name."
          error={req.errorFor("control")}
        >
          <Combobox
            name="control"
            options={controls}
            value={control}
            onChange={setControl}
            placeholder="Choose a control"
          />
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button type="submit" variant="primary">
            Assign
          </Button>
        </Inline>
      </Stack>
    </form>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Assign with a field unchosen. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Owner" });
    await expect(ownerInputRef).toHaveBeenCalledWith(input);
    await expect(input.tagName).toBe("INPUT");
    await expect(input).toHaveAccessibleDescription("Who answers for the control.");
    const group = input.closest('[data-slot="combobox-input-group"]')!;
    await expect(group.getBoundingClientRect().height).toBeCloseTo(32, 0);
    await userEvent.click(input);
    const list = await page.findByRole("listbox", { name: "Owner" });
    const popup = list.closest('[data-slot="combobox-content"]')!;
    await expect(popup.querySelector("input")).toBeNull();
    await waitFor(() =>
      expect(popup.getBoundingClientRect().width).toBeCloseTo(
        group.getBoundingClientRect().width,
        0,
      ),
    );
    await expect(page.getByRole("option", { name: /Linus Aarto/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.type(input, "isso");
    await expect(page.queryByRole("option", { name: /Priya/ })).toBeNull();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(input).toHaveValue("Dana Whitfield");
    await expect(input).toHaveFocus();
    await expect(new FormData(canvasElement.querySelector("form")!).getAll("owner")).toEqual([
      "dw",
    ]);
    await userEvent.clear(input);
    await userEvent.type(input, "nothing-matches");
    await expect(await page.findByText("Nothing matches")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <NativeSelect defaultValue="Production">
                {environments.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        }
        doText="Three words are a NativeSelect. There is nothing to search."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <Combobox
                value="Production"
                onChange={() => undefined}
                options={environments.map((e) => ({ value: e, label: e }))}
              />
            </Field>
          </div>
        }
        dontText="A search box over three options. The reader is asked to type for a list they can see whole."
      />
      <Pair
        do={
          <div style={{ width: 280 }}>
            <Field label="Control">
              <Combobox
                value="AC-2"
                onChange={() => undefined}
                options={controls}
                placeholder="Choose a control"
              />
            </Field>
          </div>
        }
        doText="The meta is a word or an id at the end of the row; the keywords let the reader type either."
        dont={
          <div style={{ width: 280 }}>
            <Field label="Control">
              <Combobox
                value="AC-2"
                onChange={() => undefined}
                options={controls.map((c) => ({
                  ...c,
                  meta: `${c.meta} · Moderate baseline · 3 systems · last assessed May`,
                }))}
                placeholder="Choose a control"
              />
            </Field>
          </div>
        }
        dontText="A sentence of facts in the meta. The row is a choice, not a record; the facts live on the record's page."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                options={people}
                placeholder="Choose an owner"
              />
            </Field>
          </div>
        }
        doText="The placeholder says what to choose. Type in that same field to search."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                options={people}
                placeholder="Select..."
              />
            </Field>
          </div>
        }
        dontText='"Select..." does not say what the answer is.'
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: function PlaygroundExample(args) {
    const [, updateArgs] = useArgs();
    return (
      <Combobox
        {...args}
        onChange={(value) => {
          updateArgs({ value });
        }}
      />
    );
  },
};

const frameworks = ["React", "Vue", "Svelte", "Angular", "Solid"];

/** An editable input and optional controls, built from the Base UI parts. */
export const Searchable: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field label="Framework" hint="Search and choose a framework.">
        <Combobox.Root items={frameworks} autoHighlight>
          <Combobox.InputGroup>
            <Combobox.Input placeholder="Choose a framework" />
            <Combobox.Clear aria-label="Clear framework" />
            <Combobox.Trigger aria-label="Show frameworks" />
          </Combobox.InputGroup>
          <Combobox.Content>
            <Combobox.Empty>No frameworks found.</Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox.Root>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Framework" });
    await expect(input).toHaveAccessibleDescription("Search and choose a framework.");
    await userEvent.type(input, "svel");
    await expect(await page.findByRole("option", { name: "Svelte" })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Svelte");
    await expect(input).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Clear framework" }));
    await expect(input).toHaveValue("");
    await userEvent.type(input, "nothing-matches");
    await expect(await page.findByText("No frameworks found.")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field label="Frameworks" hint="Choose all that apply.">
        <Combobox.Root<string, true> items={frameworks} multiple defaultValue={["React"]}>
          <Combobox.Chips>
            <Combobox.Value>
              {(values: string[]) =>
                values.map((value) => (
                  <Combobox.Chip key={value}>
                    <span>{value}</span>
                    <Combobox.ChipRemove aria-label={`Remove ${value}`} />
                  </Combobox.Chip>
                ))
              }
            </Combobox.Value>
            <Combobox.Input placeholder="Add a framework" />
          </Combobox.Chips>
          <Combobox.Content>
            <Combobox.Empty>No frameworks found.</Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox.Root>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Frameworks" });
    await userEvent.type(input, "vue");
    await userEvent.click(await page.findByRole("option", { name: "Vue" }));
    await expect(canvas.getByRole("button", { name: "Remove React" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Remove Vue" })).toBeVisible();
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
    await userEvent.click(canvas.getByRole("button", { name: "Remove React" }));
    await expect(canvas.queryByRole("button", { name: "Remove React" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Remove Vue" })).toBeVisible();
    input.focus();
    await userEvent.keyboard("{Backspace}");
    await expect(canvas.queryByRole("button", { name: "Remove Vue" })).toBeNull();
  },
};

const teamGroups = [
  {
    label: "Engineering",
    items: [
      { id: "platform", label: "Platform", description: "Infrastructure and developer tools" },
      { id: "product", label: "Product", description: "Product experience" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "support", label: "Support", description: "Customer operations" },
      {
        id: "security",
        label: "Security",
        description: "Unavailable during maintenance",
        disabled: true,
      },
    ],
  },
];
type Team = (typeof teamGroups)[number]["items"][number];

export const Groups: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field label="Team">
        <Combobox.Root<Team>
          items={teamGroups}
          itemToStringLabel={(team) => team.label}
          itemToStringValue={(team) => team.id}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <Combobox.InputGroup>
            <Combobox.Input placeholder="Choose a team" />
            <Combobox.Trigger aria-label="Show teams" />
          </Combobox.InputGroup>
          <Combobox.Content>
            <Combobox.Empty>No teams found.</Combobox.Empty>
            <Combobox.List>
              {(group: (typeof teamGroups)[number], index: number) => (
                <Combobox.Group key={group.label} items={group.items}>
                  {index > 0 && <Combobox.Separator />}
                  <Combobox.GroupLabel>{group.label}</Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(team: Team) => (
                      <Combobox.Item
                        key={team.id}
                        value={team}
                        disabled={"disabled" in team && team.disabled}
                      >
                        <span className="flex flex-col gap-025">
                          <span>{team.label}</span>
                          <span className="font-body-small text-subtle">{team.description}</span>
                        </span>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox.Root>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Show teams" }));
    await waitFor(() => expect(page.getByRole("group", { name: "Engineering" })).toBeVisible());
    await expect(page.getByRole("option", { name: /Security/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(page.getByRole("option", { name: /Platform/ }));
    await expect(canvas.getByRole("combobox", { name: "Team" })).toHaveValue("Platform");
  },
};

function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Choose a framework</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Project settings"
        description="Choose the framework used by this project."
      >
        <Field label="Project framework">
          <Combobox.Root items={frameworks}>
            <Combobox.InputGroup>
              <Combobox.Input placeholder="Choose a framework" />
              <Combobox.Trigger aria-label="Show project frameworks" />
            </Combobox.InputGroup>
            <Combobox.Content>
              <Combobox.Empty>No frameworks found.</Combobox.Empty>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </Field>
        <Field label="Deployment framework">
          <Combobox.Root<string> items={["React"]} defaultValue="React" readOnly>
            <Combobox.InputGroup>
              <Combobox.Input />
            </Combobox.InputGroup>
          </Combobox.Root>
        </Field>
      </Dialog>
    </>
  );
}

export const InDialog: Story = {
  render: () => <DialogExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Choose a framework" }));
    await waitFor(() =>
      expect(page.getByRole("dialog", { name: "Project settings" })).toBeVisible(),
    );
    const input = page.getByRole("combobox", { name: "Project framework" });
    await userEvent.type(input, "vue");
    const option = await page.findByRole("option", { name: "Vue" });
    await waitFor(() => {
      const rect = option.getBoundingClientRect();
      const hit = canvasElement.ownerDocument.elementFromPoint(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
      );
      expect(option.contains(hit)).toBe(true);
    });
    await userEvent.click(option);
    await expect(page.getByRole("dialog", { name: "Project settings" })).toBeVisible();
    await expect(input).toHaveValue("Vue");
    await userEvent.click(input);
    await userEvent.keyboard("{Escape}");
    await expect(page.getByRole("dialog", { name: "Project settings" })).toBeVisible();
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
    await userEvent.keyboard("{Escape}");
    await expect(input).toHaveValue("");
    page.getByRole("combobox", { name: "Deployment framework" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose a framework" })).toHaveFocus();
  },
};

/** Native serialization and reset, including distinct records with the same display name. */
const formRecords = [
  { id: "a", label: "Alex Morgan" },
  { id: "b", label: "Alex Morgan" },
  { id: "c", label: "Unavailable" },
];
function NativeFormExample() {
  const [framework, setFramework] = useState<string | null>("React");
  return (
    <form
      id="native-combo-form"
      className="w-layout-list max-w-full"
      onSubmit={(event) => event.preventDefault()}
    >
      <Stack space="space.200">
        <Field label="Record" isRequired hint="Two directory records can share a display name.">
          <Combobox.Root<(typeof formRecords)[number]>
            items={formRecords}
            name="record"
            defaultValue={{ id: "a", label: "Alex Morgan" }}
            itemToStringLabel={(item) => item.label}
            itemToStringValue={(item) => item.id}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <Combobox.InputGroup>
              <Combobox.Input render={<input data-testid="native-input" />} />
              <Combobox.Trigger aria-label="Show records" />
            </Combobox.InputGroup>
            <Combobox.Content keepMounted>
              <Combobox.Empty>No records found.</Combobox.Empty>
              <Combobox.List>
                {(item: (typeof formRecords)[number]) => (
                  <Combobox.Item key={item.id} value={item} disabled={item.id === "c"}>
                    {item.label} · {item.id}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </Field>
        <Field label="Tags">
          <Combobox.Root<string, true>
            items={["Internal", "Reviewed", "Published"]}
            multiple
            defaultValue={["Internal", "Reviewed"]}
            name="tags"
          >
            <Combobox.Chips>
              <Combobox.Value>
                {(values: string[]) =>
                  values.map((value) => (
                    <Combobox.Chip key={value}>
                      {value}
                      <Combobox.ChipRemove aria-label={`Remove ${value}`} />
                    </Combobox.Chip>
                  ))
                }
              </Combobox.Value>
              <Combobox.Input placeholder="Add a tag" />
            </Combobox.Chips>
            <Combobox.Content>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </Field>
        <Field label="Environment" hint="Set by the project administrator.">
          <Combobox.Root<string>
            items={["Production", "Staging"]}
            defaultValue="Production"
            readOnly
            name="readonly"
          >
            <Combobox.InputGroup>
              <Combobox.Input />
            </Combobox.InputGroup>
          </Combobox.Root>
        </Field>
        <Field
          label="Framework"
          hint="Controlled selection stays owned by the application when the form resets."
        >
          <Combobox.Root<string>
            items={frameworks}
            value={framework}
            onValueChange={setFramework}
            name="controlled"
          >
            <Combobox.InputGroup>
              <Combobox.Input />
              <Combobox.Trigger aria-label="Show frameworks" />
            </Combobox.InputGroup>
            <Combobox.Content>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </Field>
        <Inline>
          <Button type="reset">Reset choices</Button>
        </Inline>
      </Stack>
    </form>
  );
}

export const NativeForms: Story = {
  render: () => <NativeFormExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Record" });
    await expect(input).toHaveAttribute("data-testid", "native-input");
    await expect(input).toHaveAttribute("aria-required", "true");
    await expect(canvasElement.querySelectorAll(`[id="${input.id}"]`)).toHaveLength(1);
    await expect(page.queryByRole("listbox")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Show records" }));
    await expect(await page.findByRole("option", { name: "Alex Morgan · a" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(page.getByRole("option", { name: "Alex Morgan · b" }));
    const form = canvasElement.querySelector("form")!;
    await expect(new FormData(form).get("record")).toBe("b");
    await expect(new FormData(form).getAll("tags")).toEqual(["Internal", "Reviewed"]);
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    await userEvent.click(canvas.getByRole("button", { name: "Reset choices" }));
    await expect(new FormData(form).get("record")).toBe("b");
    await userEvent.click(canvas.getByRole("button", { name: "Reset choices" }));
    await waitFor(() => expect(new FormData(form).get("record")).toBe("a"));
    await expect(new FormData(form).get("controlled")).toBe("React");
    await expect(input).toHaveValue("Alex Morgan");
    const readonly = canvas.getByRole("combobox", { name: "Environment" });
    await expect(readonly).toHaveAttribute("readonly");
    await userEvent.type(readonly, "Staging");
    await expect(readonly).toHaveValue("Production");
    await expect(new FormData(form).get("readonly")).toBe("Production");
  },
};

const fetchFrameworks = fn(async (query: string) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return frameworks.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
});

function AsyncFrameworkExample() {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchFrameworks(query).then((results) => {
      if (active) {
        setItems(results);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);
  return (
    <div className="w-layout-list max-w-full">
      <Field label="Framework" hint="Results are loaded as you type.">
        <Combobox.Root<string>
          items={items}
          filter={null}
          inputValue={query}
          onInputValueChange={setQuery}
          value={value}
          onValueChange={setValue}
        >
          <Combobox.InputGroup>
            <Combobox.Input placeholder="Search frameworks" />
            <Combobox.Trigger aria-label="Show frameworks" />
          </Combobox.InputGroup>
          <Combobox.Content>
            <Combobox.Status>{loading ? "Loading frameworks…" : null}</Combobox.Status>
            <Combobox.Empty>{loading ? null : "No frameworks found."}</Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Content>
        </Combobox.Root>
      </Field>
    </div>
  );
}

/** Simulated remote results; stale responses are ignored by the application. */
export const AsyncResults: Story = {
  render: () => <AsyncFrameworkExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Framework" });
    await userEvent.type(input, "vue");
    await waitFor(() => expect(fetchFrameworks).toHaveBeenCalledWith("vue"));
    await userEvent.click(await page.findByRole("option", { name: "Vue" }));
    await expect(input).toHaveValue("Vue");
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};
