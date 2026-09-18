import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Command,
  CommandCount,
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
          <CommandItem value="export" onSelect={(value) => onSelect?.(value)}>
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
    await userEvent.type(input, "review");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await expect(canvas.getByRole("option")).toHaveTextContent("Schedule assessment");
    await userEvent.clear(input);
    await userEvent.type(input, "no such action");
    await waitFor(() => expect(canvas.getByText("No commands found.")).toBeVisible());
    await userEvent.clear(input);
    await userEvent.keyboard("{Home}{ArrowDown}{ArrowDown}");
    await expect(canvas.getByRole("option", { name: "Archive program" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
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
export const Palette: Story = {
  render: () => <PaletteDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body),
      trigger = canvas.getByRole("button", { name: "Open command palette" });
    await userEvent.click(trigger);
    const popup = within(await body.findByRole("dialog", { name: "Program commands" }));
    const input = popup.getByRole("combobox", { name: "Program commands" });
    await waitFor(() => expect(input).toHaveFocus());
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
export const Loading: Story = {
  render: () => (
    <Command label="Remote commands">
      <CommandInput aria-label="Search remote commands" />
      <CommandList aria-busy="true" />
      <CommandLoading label="Loading commands">Searching programs</CommandLoading>
    </Command>
  ),
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
