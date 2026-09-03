import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Tabs, Badge } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Tabs",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const items = [
  { key: "overview", label: "Overview" },
  { key: "controls", label: "Controls", count: 12 },
  { key: "evidence", label: "Evidence", count: 3 },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings", disabled: true },
];

function Stateful() {
  const [active, setActive] = useState("controls");
  return (
    <Stack space="space.300">
      <Tabs label="Record sections">
        {items.map((it) => (
          <Tabs.Tab
            key={it.key}
            isSelected={active === it.key}
            disabled={it.disabled}
            onClick={() => setActive(it.key)}
            count={it.count || null}
          >
            {it.label}
          </Tabs.Tab>
        ))}
      </Tabs>
      <Text color="color.text.subtle">Showing {active}.</Text>
    </Stack>
  );
}

export const Buttons: Story = { render: () => <Stateful /> };

export const AsLinks: Story = {
  render: () => (
    <Tabs label="Record sections">
      <Tabs.Tab asChild>
        <a href="#overview">Overview</a>
      </Tabs.Tab>
      <Tabs.Tab asChild isSelected>
        <a href="#controls">Controls</a>
      </Tabs.Tab>
      <Tabs.Tab asChild>
        <a href="#evidence">Evidence</a>
      </Tabs.Tab>
    </Tabs>
  ),
};

/** Every state a tab can be in on one rail: plain, selected, with a count, with a badge, disabled, and a link. */
export const TabsMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="States">
        <Tabs label="States">
          <Tabs.Tab>Plain</Tabs.Tab>
          <Tabs.Tab isSelected>Selected</Tabs.Tab>
          <Tabs.Tab count={12}>Count</Tabs.Tab>
          <Tabs.Tab count={0 || null}>Zero hidden</Tabs.Tab>
          <Tabs.Tab
            trailing={
              <Badge tone="warning" size="xsmall">
                Draft
              </Badge>
            }
          >
            Trailing
          </Tabs.Tab>
          <Tabs.Tab disabled>Disabled</Tabs.Tab>
          <Tabs.Tab asChild>
            <a href="#link">Link</a>
          </Tabs.Tab>
        </Tabs>
      </Specimens>
      <Specimens title="Selected with a count">
        <Tabs label="Selected">
          <Tabs.Tab isSelected count={340}>
            Controls
          </Tabs.Tab>
          <Tabs.Tab count={7}>Findings</Tabs.Tab>
        </Tabs>
      </Specimens>
    </Stack>
  ),
};
