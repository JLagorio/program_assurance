import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Button, Command, Id, Kbd } from "@/ds/primitives";
import { behindPage, evidence } from "../_lib/fixtures";

const meta = {
  title: "Primitives/Command",
  component: Command,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "480px" } } },
  args: { children: null },
  argTypes: { children: { control: false }, className: { control: false } },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const commands = [
  { group: "Control", items: ["Assign owner", "Request evidence", "Mark not applicable"] },
  { group: "Navigate", items: ["Open program", "Open SCTM", "Open POA&M"] },
];

/** Inline, no overlay: Input with the esc hint, grouped items, a shortcut as trailing, a footer. */
export const Inline: Story = {
  render: () => (
    <div className="max-w-[560px] overflow-hidden rounded-xl border border-border shadow-pop">
      <Command>
        <Command.Input placeholder="Type a command…" />
        <Command.List>
          <Command.Empty>No commands match.</Command.Empty>
          {commands.map((g) => (
            <Command.Group key={g.group} heading={g.group}>
              {g.items.map((c, i) => (
                <Command.Item key={c} value={c} trailing={i === 0 ? "⌘E" : undefined}>
                  {c}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <Command.Footer>
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </Command.Footer>
      </Command>
    </div>
  ),
};

function PickerDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>
          Link evidence <Kbd>⌘K</Kbd>
        </Button>
      </div>
      <Command.Dialog open={open} onClose={() => setOpen(false)} label="Link evidence" width="lg">
        <Command.Input
          placeholder="Search evidence by id, title or kind"
          hint={<Command.Count />}
        />
        <Command.List className="max-h-[46vh]">
          <Command.Empty>Nothing matches.</Command.Empty>
          {evidence.map((e) => (
            <Command.Item
              key={e.id}
              value={`${e.id} ${e.title} ${e.kind}`}
              onSelect={() => setOpen(false)}
              className="h-auto py-2"
            >
              <Id className="text-muted-foreground">{e.id}</Id>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{e.title}</span>
                <span className="block truncate text-[11.5px] text-muted-foreground">{e.kind}</span>
              </span>
              <Badge size="xs" tone={parseInt(e.age, 10) > 30 ? "warning" : "neutral"}>
                {e.age}
              </Badge>
            </Command.Item>
          ))}
        </Command.List>
        <Command.Footer>
          <span>↑↓ navigate</span>
          <span>↵ link</span>
          <span>esc close</span>
        </Command.Footer>
      </Command.Dialog>
    </>
  );
}

/** A record picker as a Command.Dialog: Id, title and meta per row, a Badge, the live match count as the input hint. */
export const Picker: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [behindPage],
  render: () => <PickerDemo />,
};
