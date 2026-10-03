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
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
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
 * The usage to copy: a Command named by its `label`, the field, the list with its empty sentence
 * and its groups of rows, and the count in the footer.
 */
export const Usage: Story = {
  render: () => (
    <Command label="Program commands" className="max-w-layout-measure border border-default">
      <CommandInput placeholder="Search commands" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Program">
          <CommandItem value="assessment">Schedule assessment</CommandItem>
          <CommandItem value="export" shortcut="Mod+E">
            Export report
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem value="home">Go home</CommandItem>
        </CommandGroup>
      </CommandList>
      <CommandFooter>
        <CommandCount />
      </CommandFooter>
    </Command>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Program commands" });
    await expect(canvas.getByRole("listbox", { name: "Results" })).toBeVisible();
    await expect(canvas.getByRole("option", { name: "Export report" })).toHaveAttribute(
      "aria-keyshortcuts",
    );
    // On open the first row is selected, and the field names it.
    await activeIsSelected(input);
    // A filter that removes the selected row leaves the listbox naming the row the field names.
    await userEvent.type(input, "export");
    await waitFor(() =>
      expect(input).toHaveAttribute(
        "aria-activedescendant",
        canvas.getByRole("option", { name: "Export report" }).id,
      ),
    );
    await expect(canvas.getByRole("listbox", { name: "Results" })).toHaveAttribute(
      "aria-activedescendant",
      input.getAttribute("aria-activedescendant") ?? "",
    );
  },
};

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
function NoMatchDemo() {
  const [search, setSearch] = useState("SC-99");
  return (
    <Command label="Controls" className="max-w-[480px] border border-default">
      <CommandInput placeholder="Find a control" value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty noMatch="No controls match. Check the code or clear the search.">
          No controls yet.
        </CommandEmpty>
        <CommandGroup heading="Controls">
          <CommandItem value="AC-2 Account management">AC-2 Account management</CommandItem>
          <CommandItem value="AU-6 Audit review">AU-6 Audit review</CommandItem>
        </CommandGroup>
      </CommandList>
      <CommandFooter>
        <CommandCount />
      </CommandFooter>
    </Command>
  );
}

/**
 * A search that matches nothing shows the empty sentence where the rows were. A listbox must hold
 * an option, so while no row shows (and nothing loads) the list is a plain region with no role or
 * name, still the one the field controls; the listbox returns with its rows.
 */
export const NoMatch: Story = {
  name: "No match",
  render: () => <NoMatchDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Controls" });
    const list = () => canvasElement.querySelector<HTMLElement>("[cmdk-list]")!;
    const sentence = "No controls match. Check the code or clear the search.";
    const noRows = async () => {
      await waitFor(() => expect(canvas.getByText(sentence)).toBeVisible());
      await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      await expect(canvas.queryByRole("listbox")).toBeNull();
      await expect(list()).not.toHaveAttribute("aria-label");
      // The field still controls the list, which says the sentence.
      await expect(input.ownerDocument.getElementById(input.getAttribute("aria-controls")!)).toBe(
        list(),
      );
      await expect(list()).toHaveTextContent(sentence);
      await expect(input).not.toHaveAttribute("aria-activedescendant");
      await expect(canvas.getByText("0 matches")).toBeVisible();
    };
    await noRows();
    await userEvent.clear(input);
    await waitFor(() =>
      expect(
        within(canvas.getByRole("listbox", { name: "Results" })).getAllByRole("option"),
      ).toHaveLength(2),
    );
    await activeIsSelected(input);
    // The story ends on the empty list, so the page's axe check reads that state.
    await userEvent.type(input, "SC-99");
    await noRows();
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

/**
 * The placeholder says what the list holds, and the empty sentence says what was not found and
 * what to try. "No results" under "Search" leaves the reader to guess whether the query or the list
 * is at fault.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Command label="Controls" className="border border-default">
          <CommandInput placeholder="Find a control" />
          <CommandList>
            <CommandEmpty>No controls match. Check the code or clear the search.</CommandEmpty>
            <CommandGroup heading="Controls">
              <CommandItem value="AC-2 Account management">AC-2 Account management</CommandItem>
              <CommandItem value="AU-6 Audit review">AU-6 Audit review</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      }
      doText="The field says what to type, and an empty list says what was not found and what to try."
      dont={
        <Command label="Search" className="border border-default">
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup heading="Items">
              <CommandItem value="AC-2 Account management">AC-2 Account management</CommandItem>
              <CommandItem value="AU-6 Audit review">AU-6 Audit review</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      }
      dontText="Search, Items and No results: nothing says what the list holds or what to do when it is empty."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const controls = canvas.getByRole("combobox", { name: "Controls" });
    await expect(controls).toHaveAttribute("placeholder", "Find a control");
    await userEvent.type(controls, "SC-99");
    await waitFor(() =>
      expect(
        canvas.getByText("No controls match. Check the code or clear the search."),
      ).toBeVisible(),
    );
    const search = canvas.getByRole("combobox", { name: "Search" });
    await userEvent.type(search, "SC-99");
    await waitFor(() => expect(canvas.getByText("No results")).toBeVisible());
    // Both lists show their rows again once the searches are cleared.
    await userEvent.clear(controls);
    await userEvent.clear(search);
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(4));
  },
};
