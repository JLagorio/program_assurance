import {
  FieldLabel,
  FieldDescription,
  FieldError,
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
import { useVirtualizer } from "@tanstack/react-virtual";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useCallback, useId, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * The parts with nothing wired by hand: a Field names the input, the chevron and the list. The
 * chevron is not a tab stop (the arrow keys open the list from the input), and typing highlights
 * the first match, so Enter chooses it. While the list is open, Base UI hides the rest of the page
 * from assistive technology; nothing it hides inside the field can take focus.
 */
export const Defaults: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Choose a framework" />
          <ComboboxContent>
            <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      <Inline>
        <Button variant="secondary">Next step</Button>
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Framework" });
    // The chevron is Base UI's trigger: named by the label, out of the tab order, its own slot.
    const chevron = canvas.getByRole("button", { name: "Framework" });
    await expect(chevron).toHaveAttribute("data-slot", "combobox-trigger");
    await expect(chevron).toHaveAttribute("tabindex", "-1");
    input.focus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Next step" })).toHaveFocus();
    // Type, then Enter: the first match is highlighted, so Enter chooses it.
    await userEvent.click(input);
    await userEvent.type(input, "vu");
    const list = await page.findByRole("listbox", { name: "Framework" });
    await waitFor(() =>
      expect(within(list).getByRole("option", { name: "Vue" })).toHaveAttribute("data-highlighted"),
    );
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Vue");
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
    // The popup is as wide as the field.
    await userEvent.clear(input);
    await userEvent.type(input, "s");
    const open = await page.findByRole("listbox", { name: "Framework" });
    const group = input.closest<HTMLElement>('[data-slot="input-group"]')!;
    const popup = open.closest<HTMLElement>('[data-slot="combobox-content"]')!;
    await waitFor(() =>
      expect(Math.round(popup.getBoundingClientRect().width)).toBe(
        Math.round(group.getBoundingClientRect().width),
      ),
    );
    await expect(within(open).getAllByRole("option")).toHaveLength(2);
    const field = input.closest<HTMLElement>('[data-slot="field"]')!;
    const tabbable = Array.from(
      field.querySelectorAll<HTMLElement>(
        '[aria-hidden="true"] button, [aria-hidden="true"] input',
      ),
    ).filter((element) => element.tabIndex >= 0 && !element.hasAttribute("disabled"));
    await expect(tabbable).toEqual([]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
  },
};

/** An editable input with its own clear and trigger controls in the addon. */
export const Searchable: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Combobox items={frameworks}>
          <ComboboxInput showTrigger={false} placeholder="Choose a framework">
            <InputGroupAddon align="inline-end">
              <ComboboxClear aria-label="Clear framework" />
              <ComboboxTrigger aria-label="Show frameworks" />
            </InputGroupAddon>
          </ComboboxInput>
          <ComboboxContent>
            <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Search and choose a framework.</FieldDescription>
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
    await waitFor(() => expect(page.getByText("No frameworks found.")).toBeVisible());
    await userEvent.keyboard("{Escape}");
  },
};

/** Chips with their default remove buttons, each named after its chip. */
export const Multiple: Story = {
  render: function MultipleExample() {
    const anchor = useComboboxAnchor();
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel>Frameworks</FieldLabel>
          <Combobox<string, true> items={frameworks} multiple defaultValue={["React"]}>
            <ComboboxChips ref={anchor}>
              <ComboboxValue>
                {(values: string[]) =>
                  values.map((value) => <ComboboxChip key={value}>{value}</ComboboxChip>)
                }
              </ComboboxValue>
              <ComboboxChipsInput placeholder="Add a framework" />
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription>Choose all that apply.</FieldDescription>
        </Field>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Frameworks" });
    await userEvent.type(input, "vue");
    // The list is as wide as the chips it hangs from, and named by the label.
    const list = await page.findByRole("listbox", { name: "Frameworks" });
    const chips = input.closest<HTMLElement>('[data-slot="combobox-chips"]')!;
    const popup = list.closest<HTMLElement>('[data-slot="combobox-content"]')!;
    await waitFor(() =>
      expect(Math.round(popup.getBoundingClientRect().width)).toBe(
        Math.round(chips.getBoundingClientRect().width),
      ),
    );
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
        description: "Security operations",
        unavailable: "Unavailable during maintenance",
      },
    ],
  },
];
type Team = (typeof teamGroups)[number]["items"][number];

/**
 * Groups with the Select's section headings and hairlines, and options with a description line.
 * An unavailable option says why in its description line, readable on the disabled row.
 */
export const Groups: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Team</FieldLabel>
        <Combobox<Team>
          items={teamGroups}
          itemToStringLabel={(team) => team.label}
          itemToStringValue={(team) => team.id}
          isItemEqualToValue={(a, b) => a.id === b.id}
        >
          <ComboboxInput placeholder="Choose a team" />
          <ComboboxContent>
            <ComboboxEmpty>No teams found.</ComboboxEmpty>
            <ComboboxList>
              {(group: (typeof teamGroups)[number], index: number) => (
                <ComboboxGroup key={group.label} items={group.items}>
                  {index > 0 && <ComboboxSeparator />}
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                  <ComboboxCollection>
                    {(team: Team) => (
                      <ComboboxItem
                        key={team.id}
                        value={team}
                        description={team.description}
                        disabledReason={"unavailable" in team ? team.unavailable : undefined}
                      >
                        {team.label}
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
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox", { name: "Team" }));
    await waitFor(() => expect(page.getByRole("group", { name: "Engineering" })).toBeVisible());
    const platform = page.getByRole("option", { name: "Platform" });
    await expect(platform).toHaveAccessibleDescription("Infrastructure and developer tools");
    const security = page.getByRole("option", { name: "Security" });
    await expect(security).toHaveAttribute("aria-disabled", "true");
    await expect(security).toHaveAccessibleDescription("Unavailable during maintenance");
    // The separator is a visible hairline (presentational inside a listbox), and the heading is
    // the Select's.
    const separator = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '[data-slot="combobox-separator"]',
    )!;
    const line = getComputedStyle(separator);
    await expect(line.borderTopWidth).toBe("1px");
    await expect(line.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    const heading = page.getByText("Operations");
    await expect(getComputedStyle(heading).textTransform).toBe("uppercase");
    await userEvent.click(platform);
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
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent width="medium" className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
            <DialogDescription>Choose the framework used by this project.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Field>
              <FieldLabel>Project framework</FieldLabel>
              <Combobox items={frameworks}>
                <ComboboxInput placeholder="Choose a framework" />
                <ComboboxContent>
                  <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                  <ComboboxList>
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
              <FieldLabel>Deployment framework</FieldLabel>
              <Combobox<string> items={["React"]} defaultValue="React" readOnly>
                <ComboboxInput />
              </Combobox>
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * In a dialog, opened as soon as the dialog is: the list takes the field's layout width, not its
 * width in the dialog's entrance scale, so filtering while the dialog arrives resizes nothing.
 * Escape closes the list before the dialog.
 */
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
    const group = input.closest<HTMLElement>('[data-slot="input-group"]')!;
    const popup = option.closest<HTMLElement>('[data-slot="combobox-content"]')!;
    // The layout width, which the dialog's entrance scale does not change.
    await expect(Math.abs(parseFloat(popup.style.width) - group.offsetWidth)).toBeLessThan(1);
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
    // With the list closed, Escape clears the value.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue(""));
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
            <ComboboxInput
              id={`${fieldId}-record-6`}
              aria-labelledby={`${fieldId}-record-6-label`}
              aria-required={true}
              aria-describedby={`${fieldId}-record-6-message`}
              render={<input data-testid="native-input" />}
            />
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
                      <ComboboxChipRemove aria-label={`Remove the ${value} tag`} />
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
            <ComboboxInput
              id={`${fieldId}-environment-8`}
              aria-labelledby={`${fieldId}-environment-8-label`}
              aria-describedby={`${fieldId}-environment-8-message`}
            />
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
            <ComboboxInput
              id={`${fieldId}-framework-9`}
              aria-labelledby={`${fieldId}-framework-9-label`}
              aria-describedby={`${fieldId}-framework-9-message`}
            />
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

/** Explicit ids and ARIA still win over the Field's, and an explicit remove name over the default. */
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
    await expect(canvas.getByRole("button", { name: "Remove the Internal tag" })).toBeVisible();
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

/** Set by the play function to keep the request in flight while it checks the loading state. */
let holdFrameworks: Promise<void> | null = null;
const fetchFrameworks = fn(async (query: string) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (holdFrameworks) await holdFrameworks;
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
      <Field>
        <FieldLabel>Framework</FieldLabel>
        <Combobox<string>
          items={items}
          filter={null}
          inputValue={query}
          onInputValueChange={setQuery}
          value={value}
          onValueChange={setValue}
        >
          <ComboboxInput placeholder="Search frameworks" />
          <ComboboxContent>
            <ComboboxStatus>{loading ? "Loading frameworks…" : null}</ComboboxStatus>
            <ComboboxEmpty>{loading ? null : "No frameworks found."}</ComboboxEmpty>
            <ComboboxList aria-busy={loading || undefined}>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Results are loaded as you type.</FieldDescription>
      </Field>
    </div>
  );
}

/**
 * Remote results: the server filters (`filter={null}`), the status says the list is loading and the
 * list is busy until the answer arrives; stale responses are ignored by the application.
 */
export const AsyncResults: Story = {
  render: () => <AsyncFrameworkExample />,
  beforeEach: () => () => {
    holdFrameworks = null;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Framework" });
    let release = () => {};
    holdFrameworks = new Promise<void>((resolve) => {
      release = resolve;
    });
    await userEvent.type(input, "vue");
    await waitFor(() => expect(fetchFrameworks).toHaveBeenCalledWith("vue"));
    // While the request runs, the status says so, the list is busy and nothing reads as no results.
    const loading = await page.findByText("Loading frameworks…");
    await expect(loading).toHaveAttribute("role", "status");
    await expect(page.getByRole("listbox", { name: "Framework" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.queryByText("No frameworks found.")).toBeNull();
    holdFrameworks = null;
    release();
    const option = await page.findByRole("option", { name: "Vue" });
    await waitFor(() => expect(page.queryByText("Loading frameworks…")).toBeNull());
    await expect(page.getByRole("listbox", { name: "Framework" })).not.toHaveAttribute("aria-busy");
    await userEvent.click(option);
    await expect(input).toHaveValue("Vue");
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};

let searchFails = true;
const searchOwners = fn(async (query: string) => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (searchFails) throw new Error("Network unavailable");
  return ["Dana Whitlock", "Priya Natarajan", "Sam Okafor"].filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
});

function FailedSearchExample() {
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    status: "loading" | "ready" | "failed";
    items: string[];
  }>({ status: "loading", items: [] });
  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, status: "loading" }));
    searchOwners(query).then(
      (items) => active && setState({ status: "ready", items }),
      () => active && setState({ status: "failed", items: [] }),
    );
    return () => {
      active = false;
    };
  }, [query, attempt]);
  return (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Owner</FieldLabel>
        <Combobox<string>
          items={state.items}
          filter={null}
          inputValue={query}
          onInputValueChange={setQuery}
        >
          <ComboboxInput placeholder="Search people" />
          <ComboboxContent>
            <ComboboxStatus>
              {state.status === "loading"
                ? "Loading people…"
                : state.status === "failed"
                  ? "The search could not load people."
                  : null}
            </ComboboxStatus>
            {state.status === "failed" ? (
              <div className="px-150 pb-150">
                <Button size="small" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </Button>
              </div>
            ) : null}
            <ComboboxEmpty>{state.status === "ready" ? "No people found." : null}</ComboboxEmpty>
            <ComboboxList aria-busy={state.status === "loading" || undefined}>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}

/**
 * A failed search says so in the popup, with Try again beside it, instead of reading as no
 * results. Tab reaches Try again from the input; the next answer replaces the message.
 */
export const FailedSearch: Story = {
  render: () => <FailedSearchExample />,
  beforeEach: () => {
    searchFails = true;
    searchOwners.mockClear();
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Owner" });
    await userEvent.type(input, "pri");
    const status = await page.findByText("The search could not load people.");
    await expect(status.closest('[role="status"]')).not.toBeNull();
    await expect(page.queryByText("No people found.")).toBeNull();
    searchFails = false;
    await userEvent.tab();
    const retry = page.getByRole("button", { name: "Try again" });
    await expect(retry).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(await page.findByRole("option", { name: "Priya Natarajan" })).toBeVisible();
    await waitFor(() => expect(page.queryByText("The search could not load people.")).toBeNull());
  },
};

const controlFamilies = ["AC", "AU", "CM", "IA", "IR", "RA", "SC", "SI", "SR", "PM"];
const catalog = Array.from({ length: 1000 }, (_, index) => {
  const family = controlFamilies[index % controlFamilies.length]!;
  return `${family}-${Math.floor(index / controlFamilies.length) + 1} · Control ${index + 1}`;
});
const matches = (item: string, query: string) =>
  item.toLowerCase().includes(query.trim().toLowerCase());

function LimitedExample() {
  const [query, setQuery] = useState("");
  const total = useMemo(() => catalog.filter((item) => matches(item, query)).length, [query]);
  return (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Control</FieldLabel>
        <Combobox<string> items={catalog} limit={50} filter={matches} onInputValueChange={setQuery}>
          <ComboboxInput placeholder="Search 1,000 controls" />
          <ComboboxContent>
            <ComboboxEmpty>No controls found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxStatus total={total} />
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}

/**
 * A thousand options with `limit`: the list mounts the first fifty, the status says how many of the
 * matches it shows, and typing narrows until every match fits and the count goes.
 */
export const LongList: Story = {
  render: () => <LimitedExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Control" });
    await userEvent.click(input);
    const list = await page.findByRole("listbox", { name: "Control" });
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(50));
    const status = await page.findByText("Showing 50 of 1,000. Type to narrow the list.");
    await expect(status).toHaveAttribute("role", "status");
    await userEvent.type(input, "AC");
    await expect(
      await page.findByText("Showing 50 of 100. Type to narrow the list."),
    ).toBeInTheDocument();
    // "AC-1" matches AC-1, AC-10 to AC-19 and AC-100: twelve, all shown, so the count goes.
    await userEvent.type(input, "-1");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(12));
    await expect(page.queryByText(/Showing \d+ of/)).toBeNull();
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("AC-1 · Control 1");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
  },
};

function VirtualizedExample() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => catalog.filter((item) => matches(item, query)), [query]);
  const scrollElement = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    enabled: open,
    count: filtered.length,
    getScrollElement: () => scrollElement.current,
    estimateSize: () => 28,
    overscan: 12,
    useFlushSync: false,
  });
  const listRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElement.current = element;
      if (element) virtualizer.measure();
    },
    [virtualizer],
  );
  return (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Control</FieldLabel>
        <Combobox<string>
          virtualized
          items={catalog}
          filteredItems={filtered}
          open={open}
          onOpenChange={setOpen}
          inputValue={query}
          onInputValueChange={setQuery}
          onItemHighlighted={(item, { reason, index }) => {
            if (item === undefined || reason === "pointer") return;
            queueMicrotask(() => virtualizer.scrollToIndex(index, { align: "auto" }));
          }}
        >
          <ComboboxInput placeholder="Search 1,000 controls" />
          <ComboboxContent>
            <ComboboxEmpty>No controls found.</ComboboxEmpty>
            <ComboboxList ref={listRef}>
              {filtered.length > 0 ? (
                <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                  {virtualizer.getVirtualItems().map((row) => {
                    const item = filtered[row.index]!;
                    return (
                      <ComboboxItem
                        key={row.key}
                        index={row.index}
                        data-index={row.index}
                        ref={virtualizer.measureElement}
                        value={item}
                        aria-setsize={filtered.length}
                        aria-posinset={row.index + 1}
                        className="absolute inset-x-0 top-0"
                        style={{ transform: `translateY(${row.start}px)` }}
                      >
                        {item}
                      </ComboboxItem>
                    );
                  })}
                </div>
              ) : null}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}

/**
 * A thousand options virtualized with `@tanstack/react-virtual`: Root takes `virtualized` and the
 * filtered items, ComboboxList is the scroll element (its ref goes to the virtualizer), and each
 * item says its `index` and its place in the set. The arrow keys walk the whole set (Up from the
 * first option wraps to the last), and a list this long keeps its native scrollbar in place of
 * the hover arrows.
 */
export const Virtualized: Story = {
  render: () => <VirtualizedExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole("combobox", { name: "Control" });
    await userEvent.click(input);
    const list = await page.findByRole("listbox", { name: "Control" });
    await waitFor(() => expect(within(list).getAllByRole("option").length).toBeGreaterThan(5));
    // Only the rows in view (and the overscan) are mounted.
    await expect(within(list).getAllByRole("option").length).toBeLessThan(60);
    await expect(within(list).getAllByRole("option")[0]).toHaveAttribute("aria-setsize", "1000");
    await waitFor(() => expect(list.scrollHeight).toBeGreaterThan(list.clientHeight * 10));
    await expect(list).not.toHaveAttribute("data-scroller-arrows");
    await userEvent.keyboard("{ArrowDown}{ArrowUp}");
    const last = await page.findByRole("option", { name: "PM-100 · Control 1000" });
    await waitFor(() => expect(last).toHaveAttribute("data-highlighted"));
    await expect(last).toHaveAttribute("aria-posinset", "1000");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("PM-100 · Control 1000");
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
  },
};

const boundPeople = [
  { value: "dana", label: "Dana Whitlock" },
  { value: "priya", label: "Priya Natarajan" },
];

/**
 * In a Field the input needs no ids: the label names it, the hint and the error describe it, and
 * the Field's `invalid`, `required` and `disabled` reach it.
 */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Assessor</FieldLabel>
        <Combobox items={boundPeople}>
          <ComboboxInput placeholder="Choose a person" />
          <ComboboxContent>
            <ComboboxEmpty>No matches.</ComboboxEmpty>
            <ComboboxList>
              {(item: (typeof boundPeople)[number]) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>Someone outside the program team.</FieldDescription>
        <FieldError>Choose an assessor.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Owner</FieldLabel>
        <Combobox items={boundPeople} defaultValue={boundPeople[0]}>
          <ComboboxInput />
        </Combobox>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const assessor = canvas.getByRole("combobox", { name: "Assessor" });
    await expect(assessor).toHaveAttribute("aria-invalid", "true");
    await expect(assessor).toHaveAttribute("aria-required", "true");
    await expect(assessor).toHaveAccessibleDescription(
      "Someone outside the program team. Choose an assessor.",
    );
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toBeDisabled();
    await userEvent.type(assessor, "Pri");
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: "Priya Natarajan",
      }),
    );
    await expect(assessor).toHaveValue("Priya Natarajan");
  },
};
