import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, List, Pin, Underline } from "lucide-react";

import { IconButton, Separator, Switch, Toggle, ToggleGroup } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  args: { "aria-label": "Bold", icon: <Bold /> },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every size, off and on, disabled, and with a label; then a toolbar of them beside the controls they sit level with. */
export const ToggleMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["xsmall", "small", "medium"] as const}
        cols={["off", "on", "off · disabled", "on · disabled", "with a label"] as const}
        rowLabel="size"
        render={(size, s) => (
          <Toggle
            aria-label={s === "with a label" ? undefined : "Bold"}
            size={size}
            icon={s === "with a label" ? <Pin /> : <Bold />}
            pressed={s.startsWith("on")}
            disabled={s.includes("disabled")}
            onPressedChange={() => {}}
          >
            {s === "with a label" ? "Pinned" : null}
          </Toggle>
        )}
      />
      <Specimens title="In a toolbar: toggles, a separator, a group, an icon button, all small">
        <Inline space="space.050" alignBlock="center">
          <Toggle aria-label="Bold" icon={<Bold />} defaultPressed />
          <Toggle aria-label="Italic" icon={<Italic />} />
          <Toggle aria-label="Underline" icon={<Underline />} />
          <Separator orientation="vertical" />
          <ToggleGroup
            aria-label="View"
            value="table"
            onChange={() => {}}
            items={[
              { value: "table", label: "Table" },
              { value: "board", label: "Board" },
            ]}
          />
          <Separator orientation="vertical" />
          <Toggle icon={<Pin />}>Pinned</Toggle>
          <IconButton variant="subtle" label="List" icon={<List />} />
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.050">
            <Toggle aria-label="Bold" icon={<Bold />} defaultPressed />
            <Toggle aria-label="Italic" icon={<Italic />} />
          </Inline>
        }
        doText="A toggle acts at once and in place: bold is on, the text is bold."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Toggle>Email me on every change</Toggle>
          </Inline>
        }
        dontText="A setting that takes effect later, or applies to more than what is in front of the reader, is a Switch."
      />
      <Pair
        do={
          <ToggleGroup
            aria-label="View"
            value="table"
            onChange={() => {}}
            items={[
              { value: "table", label: "Table" },
              { value: "board", label: "Board" },
              { value: "timeline", label: "Timeline" },
            ]}
          />
        }
        doText="Views that exclude each other are a ToggleGroup: exactly one is on."
        dont={
          <Inline space="space.050">
            <Toggle defaultPressed>Table</Toggle>
            <Toggle>Board</Toggle>
            <Toggle>Timeline</Toggle>
          </Inline>
        }
        dontText="Three toggles for one choice. Each can be on or off alone, so the reader can turn every view off, or two on."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Toggle aria-label="Pin to the top" icon={<Pin />} />
            <Text size="small" color="color.text.subtle">
              aria-label="Pin to the top"
            </Text>
          </Inline>
        }
        doText="An icon alone is named: the screen reader hears what it does, on or off."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Toggle icon={<Pin />} />
            <Text size="small" color="color.text.subtle">
              no name
            </Text>
          </Inline>
        }
        dontText="A nameless toggle. It reads as “toggle button, pressed”, and nothing more."
      />
      <Pair
        do={<Switch>Email me on every change</Switch>}
        doText="The Switch, for the record."
        dont={<Toggle size="medium">On</Toggle>}
        dontText="A toggle labelled with its state. The label is what it does; the state is how it looks."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
