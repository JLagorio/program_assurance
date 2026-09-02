import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Search, Settings, User } from "lucide-react";
import { useState } from "react";

import { Button, Command, Kbd } from "../../components";
import { Inline, Text } from "../../primitives";

const meta = {
  title: "Components/Command",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function Palette({ onSelect = () => undefined }: { onSelect?: (() => void) | undefined }) {
  return (
    <>
      <Command.Input placeholder="Search controls, evidence, people…" />
      <Command.List>
        <Command.Empty>Nothing matches.</Command.Empty>
        <Command.Group heading="Controls">
          <Command.Item onSelect={onSelect} trailing="Finance"><FileText className="size-icon-small icon-subtle" />CTRL-0412 Segregation of duties, payables</Command.Item>
          <Command.Item onSelect={onSelect} trailing="Finance"><FileText className="size-icon-small icon-subtle" />CTRL-0418 Vendor master change approval</Command.Item>
          <Command.Item onSelect={onSelect} trailing="Security"><FileText className="size-icon-small icon-subtle" />CTRL-0450 Privileged access review</Command.Item>
        </Command.Group>
        <Command.Separator />
        <Command.Group heading="People">
          <Command.Item onSelect={onSelect}><User className="size-icon-small icon-subtle" />Dana Whitfield</Command.Item>
          <Command.Item onSelect={onSelect}><User className="size-icon-small icon-subtle" />Priya Natarajan</Command.Item>
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item onSelect={onSelect} trailing={<Kbd>,</Kbd>}><Settings className="size-icon-small icon-subtle" />Settings</Command.Item>
          <Command.Item disabled><Search className="size-icon-small icon-subtle" />Advanced search</Command.Item>
        </Command.Group>
      </Command.List>
      <Command.Footer>
        <Inline space="space.100" alignBlock="center"><Kbd>↑</Kbd><Kbd>↓</Kbd><Text size="xsmall" color="color.text.subtle">to move</Text></Inline>
        <Inline space="space.100" alignBlock="center"><Kbd>↵</Kbd><Text size="xsmall" color="color.text.subtle">to open</Text></Inline>
        <span className="ms-auto"><Command.Count /></span>
      </Command.Footer>
    </>
  );
}

export const Inline_: Story = {
  name: "Inline",
  render: () => (
    <div className="max-w-[560px] rounded-large border border-default shadow-raised">
      <Command>
        <Palette />
      </Command>
    </div>
  ),
};

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open palette <Kbd>⌘K</Kbd></Button>
      <Command.Dialog open={open} onClose={() => setOpen(false)} label="Search">
        <Palette onSelect={() => setOpen(false)} />
      </Command.Dialog>
    </>
  );
}

export const AsDialog: Story = { render: () => <DialogDemo /> };
