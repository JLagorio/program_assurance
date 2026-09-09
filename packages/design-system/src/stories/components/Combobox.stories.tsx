import {
  FieldLabel,
  FieldDescription,
  InputGroupAddon,
  ComboboxClear,
  ComboboxTrigger,
  Button,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChipsInput,
  ComboboxValue,
  ComboboxStatus,
  useComboboxAnchor,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useId, useEffect, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Inline, Stack } from "../../primitives";

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

const frameworks = ["React", "Vue", "Svelte", "Angular", "Solid"];

/** An editable input and optional controls, built from the Base UI parts. */
export const Searchable: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel id={`${fieldId}-framework-1-label`} htmlFor={`${fieldId}-framework-1`}>
            {"Framework"}
          </FieldLabel>
          <Combobox items={frameworks} autoHighlight>
            <>
              <ComboboxInput
                id={`${fieldId}-framework-1`}
                aria-labelledby={`${fieldId}-framework-1-label`}
                aria-describedby={`${fieldId}-framework-1-message`}
                showTrigger={false}
                placeholder="Choose a framework"
              >
                <InputGroupAddon align="inline-end">
                  <ComboboxClear aria-label="Clear framework" />
                  <ComboboxTrigger aria-label="Show frameworks" />
                </InputGroupAddon>
              </ComboboxInput>
            </>
            <ComboboxContent>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-framework-1-label`}>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription id={`${fieldId}-framework-1-message`}>
            {"Search and choose a framework."}
          </FieldDescription>
        </Field>
      </div>
    );
  },
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
    await waitFor(() => expect(page.getByText("No frameworks found.")).toBeVisible());
    await userEvent.keyboard("{Escape}");
  },
};

export const Multiple: Story = {
  render: function MultipleExample() {
    const fieldId = useId();

    const anchor = useComboboxAnchor();
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel id={`${fieldId}-frameworks-2-label`} htmlFor={`${fieldId}-frameworks-2`}>
            {"Frameworks"}
          </FieldLabel>
          <Combobox<string, true> items={frameworks} multiple defaultValue={["React"]}>
            <ComboboxChips ref={anchor}>
              <ComboboxValue>
                {(values: string[]) =>
                  values.map((value) => (
                    <ComboboxChip key={value} showRemove={false}>
                      <span>{value}</span>
                      <ComboboxChipRemove aria-label={`Remove ${value}`} />
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput
                id={`${fieldId}-frameworks-2`}
                aria-labelledby={`${fieldId}-frameworks-2-label`}
                aria-describedby={`${fieldId}-frameworks-2-message`}
                placeholder="Add a framework"
              />
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-frameworks-2-label`}>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription id={`${fieldId}-frameworks-2-message`}>
            {"Choose all that apply."}
          </FieldDescription>
        </Field>
      </div>
    );
  },
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
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel id={`${fieldId}-team-3-label`} htmlFor={`${fieldId}-team-3`}>
            {"Team"}
          </FieldLabel>
          <Combobox<Team>
            items={teamGroups}
            itemToStringLabel={(team) => team.label}
            itemToStringValue={(team) => team.id}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <>
              <ComboboxInput
                id={`${fieldId}-team-3`}
                aria-labelledby={`${fieldId}-team-3-label`}
                placeholder="Choose a team"
              />
            </>
            <ComboboxContent>
              <ComboboxEmpty>No teams found.</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-team-3-label`}>
                {(group: (typeof teamGroups)[number], index: number) => (
                  <ComboboxGroup key={group.label} items={group.items}>
                    {index > 0 && <ComboboxSeparator />}
                    <ComboboxLabel>{group.label}</ComboboxLabel>
                    <ComboboxCollection>
                      {(team: Team) => (
                        <ComboboxItem
                          key={team.id}
                          value={team}
                          disabled={"disabled" in team && team.disabled}
                        >
                          <span className="flex flex-col gap-025">
                            <span>{team.label}</span>
                            <span className="font-body-small text-subtle">{team.description}</span>
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox", { name: "Team" }));
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
  const fieldId = useId();

  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Choose a framework</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
            <DialogDescription>Choose the framework used by this project.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Field>
              <FieldLabel
                id={`${fieldId}-project-framework-4-label`}
                htmlFor={`${fieldId}-project-framework-4`}
              >
                {"Project framework"}
              </FieldLabel>
              <Combobox items={frameworks}>
                <>
                  <ComboboxInput
                    id={`${fieldId}-project-framework-4`}
                    aria-labelledby={`${fieldId}-project-framework-4-label`}
                    placeholder="Choose a framework"
                  />
                </>
                <ComboboxContent>
                  <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                  <ComboboxList aria-labelledby={`${fieldId}-project-framework-4-label`}>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <FieldLabel
                id={`${fieldId}-deployment-framework-5-label`}
                htmlFor={`${fieldId}-deployment-framework-5`}
              >
                {"Deployment framework"}
              </FieldLabel>
              <Combobox<string> items={["React"]} defaultValue="React" readOnly>
                <>
                  <ComboboxInput
                    id={`${fieldId}-deployment-framework-5`}
                    aria-labelledby={`${fieldId}-deployment-framework-5-label`}
                  />
                </>
              </Combobox>
            </Field>
          </div>
        </DialogContent>
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
  const fieldId = useId();

  const anchor = useComboboxAnchor();
  const [framework, setFramework] = useState<string | null>("React");
  const [record, setRecord] = useState<(typeof formRecords)[number] | null>(formRecords[0]!);
  const [tags, setTags] = useState(["Internal", "Reviewed"]);
  return (
    <form
      id="native-combo-form"
      className="w-layout-list max-w-full"
      onSubmit={(event) => event.preventDefault()}
      onReset={(event) => {
        const native = event.nativeEvent;
        queueMicrotask(() => {
          if (!native.defaultPrevented) {
            setRecord(formRecords[0]!);
            setTags(["Internal", "Reviewed"]);
          }
        });
      }}
    >
      <Stack space="space.200">
        <Field>
          <FieldLabel id={`${fieldId}-record-6-label`} htmlFor={`${fieldId}-record-6`}>
            {"Record"}
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          </FieldLabel>
          <Combobox<(typeof formRecords)[number]>
            items={formRecords}
            name="record"
            value={record}
            onValueChange={setRecord}
            itemToStringLabel={(item) => item.label}
            itemToStringValue={(item) => item.id}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <>
              <ComboboxInput
                id={`${fieldId}-record-6`}
                aria-labelledby={`${fieldId}-record-6-label`}
                aria-required={true}
                aria-describedby={`${fieldId}-record-6-message`}
                render={<input data-testid="native-input" />}
              />
            </>
            <ComboboxContent keepMounted>
              <ComboboxEmpty>No records found.</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-record-6-label`}>
                {(item: (typeof formRecords)[number]) => (
                  <ComboboxItem key={item.id} value={item} disabled={item.id === "c"}>
                    {item.label} · {item.id}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription id={`${fieldId}-record-6-message`}>
            {"Two directory records can share a display name."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-tags-7-label`} htmlFor={`${fieldId}-tags-7`}>
            {"Tags"}
          </FieldLabel>
          <Combobox<string, true>
            items={["Internal", "Reviewed", "Published"]}
            multiple
            value={tags}
            onValueChange={setTags}
            name="tags"
          >
            <ComboboxChips ref={anchor}>
              <ComboboxValue>
                {(values: string[]) =>
                  values.map((value) => (
                    <ComboboxChip key={value} showRemove={false}>
                      {value}
                      <ComboboxChipRemove aria-label={`Remove ${value}`} />
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput
                id={`${fieldId}-tags-7`}
                aria-labelledby={`${fieldId}-tags-7-label`}
                placeholder="Add a tag"
              />
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxList aria-labelledby={`${fieldId}-tags-7-label`}>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-environment-8-label`} htmlFor={`${fieldId}-environment-8`}>
            {"Environment"}
          </FieldLabel>
          <Combobox<string>
            items={["Production", "Staging"]}
            defaultValue="Production"
            readOnly
            name="readonly"
          >
            <>
              <ComboboxInput
                id={`${fieldId}-environment-8`}
                aria-labelledby={`${fieldId}-environment-8-label`}
                aria-describedby={`${fieldId}-environment-8-message`}
              />
            </>
          </Combobox>
          <FieldDescription id={`${fieldId}-environment-8-message`}>
            {"Set by the project administrator."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-framework-9-label`} htmlFor={`${fieldId}-framework-9`}>
            {"Framework"}
          </FieldLabel>
          <Combobox<string>
            items={frameworks}
            value={framework}
            onValueChange={setFramework}
            name="controlled"
          >
            <>
              <ComboboxInput
                id={`${fieldId}-framework-9`}
                aria-labelledby={`${fieldId}-framework-9-label`}
                aria-describedby={`${fieldId}-framework-9-message`}
              />
            </>
            <ComboboxContent>
              <ComboboxList aria-labelledby={`${fieldId}-framework-9-label`}>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription id={`${fieldId}-framework-9-message`}>
            {"Controlled selection stays owned by the application when the form resets."}
          </FieldDescription>
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
    await userEvent.click(canvas.getByRole("combobox", { name: "Record" }));
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
  const fieldId = useId();

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
      <Field>
        <FieldLabel id={`${fieldId}-framework-10-label`} htmlFor={`${fieldId}-framework-10`}>
          {"Framework"}
        </FieldLabel>
        <Combobox<string>
          items={items}
          filter={null}
          inputValue={query}
          onInputValueChange={setQuery}
          value={value}
          onValueChange={setValue}
        >
          <>
            <ComboboxInput
              id={`${fieldId}-framework-10`}
              aria-labelledby={`${fieldId}-framework-10-label`}
              aria-describedby={`${fieldId}-framework-10-message`}
              placeholder="Search frameworks"
            />
          </>
          <ComboboxContent>
            <ComboboxStatus>{loading ? "Loading frameworks…" : null}</ComboboxStatus>
            <ComboboxEmpty>{loading ? null : "No frameworks found."}</ComboboxEmpty>
            <ComboboxList aria-labelledby={`${fieldId}-framework-10-label`}>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription id={`${fieldId}-framework-10-message`}>
          {"Results are loaded as you type."}
        </FieldDescription>
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
