import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Command,
  CommandCount,
  formatShortcut,
  getModifierKey,
  CommandDialog,
  DialogClose,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from "../../components";
const meta = {
  title: "Components/Command",
  component: Command,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Command>;
export default meta;
type Story = StoryObj<typeof meta>;
const inputRef = createRef<HTMLInputElement>();

/** The polite region's current lines, wherever `announce` put them. */
const spoken = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '[data-slot="announcer-region"][data-politeness="polite"]',
    ),
  ]
    .map((region) => region.textContent ?? "")
    .join(" ");

/** The field names the selected row as its active descendant, and that row is in the list. */
async function activeIsSelected(input: HTMLElement) {
  await waitFor(() => {
    const selected = input
      .closest("[cmdk-root]")!
      .querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]');
    expect(selected).not.toBeNull();
    expect(input).toHaveAttribute("aria-activedescendant", selected!.id);
    expect(input.ownerDocument.getElementById(selected!.id)).toBe(selected);
  });
}

function Commands({
  onSelect,
  long = false,
}: {
  onSelect?: (value: string) => void;
  long?: boolean;
}) {
  return (
    <>
      <CommandInput ref={inputRef} aria-label="Search commands" placeholder="Search commands" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Program">
          <CommandItem
            value="assessment"
            keywords={["review"]}
            onSelect={(value) => onSelect?.(value)}
          >
            Schedule assessment<CommandShortcut>A</CommandShortcut>
          </CommandItem>
          <CommandItem value="export" shortcut="Mod+E" onSelect={(value) => onSelect?.(value)}>
            Export report
          </CommandItem>
          <CommandItem value="archive" disabled>
            Archive program
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem value="home" onSelect={(value) => onSelect?.(value)}>
            Go home
          </CommandItem>
          {long &&
            Array.from({ length: 30 }, (_, index) => (
              <CommandItem
                key={index}
                value={`workspace-${index + 1}`}
                onSelect={(value) => onSelect?.(value)}
              >
                Open workspace {index + 1}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
      <CommandFooter>
        <CommandCount />
        {onSelect && (
          <DialogClose render={<Button variant="subtle" size="small" />}>Close</DialogClose>
        )}
      </CommandFooter>
    </>
  );
}
/**
 * The field filters the rows as the reader types. Its `aria-activedescendant` names the selected
 * row on open, after every keystroke and after every arrow, and the count (or the empty sentence)
 * is spoken once the query holds still. A shortcut is drawn at the end of its row and given to the
 * row as `aria-keyshortcuts`, so the row's name is its label. The field's row draws the focus ring.
 */
export const Filtering: Story = {
  render: () => (
    <Command label="Program commands" className="max-w-[480px] border border-default">
      <Commands />
    </Command>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole("combobox", { name: "Program commands" });
    await expect(inputRef.current).toBe(input);
    await expect(canvas.getByRole("listbox", { name: "Results" })).toBeVisible();
    // On open, before any key: the first row is selected and named.
    await activeIsSelected(input);
    // Shortcuts are hidden from the name and said as aria-keyshortcuts.
    await expect(canvas.getByRole("option", { name: "Schedule assessment" })).toBeVisible();
    await expect(canvas.getByRole("option", { name: "Export report" })).toHaveAttribute(
      "aria-keyshortcuts",
      formatShortcut("Mod+E", { modifier: getModifierKey(), as: "aria" }),
    );
    await userEvent.click(input);
    const row = canvasElement.querySelector<HTMLElement>('[data-slot="command-input"]')!;
    await expect(getComputedStyle(row).outlineStyle).toBe("solid");
    // The selected row draws the focus outline over its tint while the field has focus, and
    // gives it up when focus leaves, so the page never shows two rings.
    const selectedRow = () =>
      canvasElement.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]')!;
    await expect(getComputedStyle(selectedRow()).outlineStyle).toBe("solid");
    input.blur();
    await waitFor(() => expect(getComputedStyle(selectedRow()).outlineStyle).toBe("none"));
    input.focus();
    await userEvent.type(input, "review");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await expect(canvas.getByRole("option")).toHaveTextContent("Schedule assessment");
    await activeIsSelected(input);
    await expect(canvas.getByText("1 match")).toBeVisible();
    await waitFor(() => expect(spoken()).toContain("1 match"), { timeout: 3000 });
    await userEvent.clear(input);
    await userEvent.type(input, "exp");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await activeIsSelected(input);
    await userEvent.clear(input);
    await userEvent.type(input, "no such action");
    await waitFor(() => expect(canvas.getByText("No commands found.")).toBeVisible());
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await waitFor(() => expect(spoken()).toContain("No commands found."), { timeout: 3000 });
    await userEvent.clear(input);
    await userEvent.keyboard("{Home}{ArrowDown}");
    await activeIsSelected(input);
    await expect(getComputedStyle(selectedRow()).outlineStyle).toBe("solid");
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("option", { name: "Archive program" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await activeIsSelected(input);
  },
};

/** A CommandCount's own words follow the number, and a word it leaves out is the locale's. */
export const CountWords: Story = {
  name: "Count words",
  render: () => (
    <Command label="Records" className="max-w-[480px] border border-default">
      <CommandInput aria-label="Search records" hint={<CommandCount one="record" />} />
      <CommandList>
        <CommandItem value="alpha">Alpha</CommandItem>
        <CommandItem value="beta">Beta</CommandItem>
      </CommandList>
    </Command>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Records" });
    await expect(canvas.getByText("2 matches")).toBeVisible();
    await expect(input).toHaveAccessibleDescription("2 matches");
    await userEvent.type(input, "alp");
    await waitFor(() => expect(canvas.getByText("1 record")).toBeVisible());
    await expect(input).toHaveAccessibleDescription("1 record");
  },
};
function PaletteDemo({ long = false }: { long?: boolean }) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState("");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Program commands">
        <Command label="Program commands">
          <Commands
            long={long}
            onSelect={(value) => {
              setSelected(value);
              setOpen(false);
            }}
          />
        </Command>
      </CommandDialog>
      <p role="status">{selected || "No command selected"}</p>
    </>
  );
}
/** CommandDialog over the page, named by its `title`. A title of the caller's own is read without the palette's sentence, which is the default title's. */
export const Palette: Story = {
  render: () => <PaletteDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body),
      trigger = canvas.getByRole("button", { name: "Open command palette" });
    await userEvent.click(trigger);
    const dialog = await body.findByRole("dialog", { name: "Program commands" });
    await expect(dialog).not.toHaveAccessibleDescription("Search for a command to run.");
    const popup = within(dialog);
    const input = popup.getByRole("combobox", { name: "Program commands" });
    await waitFor(() => expect(input).toHaveFocus());
    await activeIsSelected(input);
    await userEvent.type(input, "export");
    await waitFor(() => expect(popup.getAllByRole("option")).toHaveLength(1));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("status")).toHaveTextContent("export");
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    const reopened = await body.findByRole("dialog", { name: "Program commands" });
    await userEvent.click(within(reopened).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
/** While CommandLoading shows, the list is busy and CommandEmpty waits: a load in progress never says that nothing matched. */
export const Loading: Story = {
  render: () => (
    <Command label="Remote commands">
      <CommandInput aria-label="Search remote commands" />
      <CommandList aria-busy="true" />
      <CommandLoading label="Loading commands">Searching programs</CommandLoading>
      <CommandEmpty>No commands found.</CommandEmpty>
    </Command>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar", { name: "Loading commands" })).toBeVisible();
    await expect(canvas.getByText("Searching programs")).toBeVisible();
    await expect(canvas.queryByText("No commands found.")).toBeNull();
    // The default Escape hint is decoration, hidden from assistive technology.
    const input = canvas.getByRole("combobox", { name: "Remote commands" });
    await expect(input).not.toHaveAttribute("aria-describedby");
    await expect(
      canvasElement.querySelector('[data-slot="kbd-shortcut"]')!.parentElement,
    ).toHaveAttribute("aria-hidden", "true");
  },
};

/** On a short screen the list scrolls while the search and visible Close remain in view. */
export const ShortViewport: Story = {
  parameters: {
    viewport: {
      options: {
        commandLandscape: { name: "Landscape phone", styles: { width: "844px", height: "390px" } },
      },
    },
  },
  globals: { viewport: { value: "commandLandscape", isRotated: false } },
  render: () => <PaletteDemo long />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);
    const trigger = canvas.getByRole("button", { name: "Open command palette" });
    await userEvent.click(trigger);
    const dialog = await body.findByRole("dialog", { name: "Program commands" });
    const popup = within(dialog);
    const close = popup.getByRole("button", { name: "Close" });
    await waitFor(() => {
      // The top inset gives way to a tenth of a short window, so the rows keep their room.
      expect(dialog.getBoundingClientRect().top).toBeLessThanOrEqual(window.innerHeight / 10 + 1);
      expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
      const box = close.getBoundingClientRect();
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      const target = doc.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      expect(target === close || close.contains(target)).toBe(true);
    });
    popup.getByRole("combobox", { name: "Program commands" }).focus();
    await userEvent.keyboard("{End}{Enter}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("status")).toHaveTextContent("workspace-30");
    await userEvent.click(trigger);
    await userEvent.click(
      within(await body.findByRole("dialog")).getByRole("button", { name: "Close" }),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
