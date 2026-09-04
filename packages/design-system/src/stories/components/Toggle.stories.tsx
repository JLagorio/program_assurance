import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignLeft, Bold, Italic, List, Pin } from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup, IconButton, Separator, Toggle, ToggleGroup } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj;

function Toggles() {
  const [view, setView] = useState<"table" | "board" | "timeline">("table");
  return (
    <Stack space="space.300">
      <Inline space="space.200" alignBlock="center">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold className="size-icon-small" />
        </Toggle>
        <Toggle aria-label="Italic">
          <Italic className="size-icon-small" />
        </Toggle>
        <Toggle aria-label="Pin" size="small">
          <Pin className="size-150" />
          Pinned
        </Toggle>
        <Toggle aria-label="Disabled" disabled>
          <List className="size-icon-small" />
        </Toggle>
        <Separator orientation="vertical" />
        <ToggleGroup
          aria-label="View"
          value={view}
          onChange={setView}
          items={[
            { value: "table", label: "Table" },
            { value: "board", label: "Board" },
            { value: "timeline", label: "Timeline", disabled: true },
          ]}
        />
      </Inline>
      <Inline space="space.200" alignBlock="center">
        <ButtonGroup>
          <Button size="small">Day</Button>
          <Button size="small" isSelected>
            Week
          </Button>
          <Button size="small">Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <IconButton label="Align left" icon={<AlignLeft />} />
          <IconButton label="Bold" icon={<Bold />} />
          <IconButton label="Italic" icon={<Italic />} />
        </ButtonGroup>
      </Inline>
    </Stack>
  );
}

export const TogglesStory: Story = { name: "Toggles", render: () => <Toggles /> };

/** Toggle by size, off, on and disabled. */
export const ToggleMatrix: Story = {
  render: () => (
    <Matrix
      rows={["small", "medium"] as const}
      cols={["off", "on", "off · disabled", "on · disabled", "with a label"] as const}
      rowLabel="size"
      render={(size, s) => (
        <Toggle
          aria-label="Bold"
          size={size}
          pressed={s.startsWith("on")}
          disabled={s.includes("disabled")}
          onPressedChange={() => {}}
        >
          {s === "with a label" ? (
            <>
              <Pin className="size-150" />
              Pinned
            </>
          ) : (
            <Bold className="size-icon-small" />
          )}
        </Toggle>
      )}
    />
  ),
};
