import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Count, Tabs } from "../../components";
import { Stack, Text } from "../../primitives";

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
          <Tabs.Tab key={it.key} isSelected={active === it.key} disabled={it.disabled} onClick={() => setActive(it.key)} trailing={it.count ? <Count value={it.count} /> : undefined}>
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
      <Tabs.Tab asChild><a href="#overview">Overview</a></Tabs.Tab>
      <Tabs.Tab asChild isSelected><a href="#controls">Controls</a></Tabs.Tab>
      <Tabs.Tab asChild><a href="#evidence">Evidence</a></Tabs.Tab>
    </Tabs>
  ),
};
