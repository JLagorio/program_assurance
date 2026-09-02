import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Download, Plus, Search, Settings } from "lucide-react";

import { Button, IconButton } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Schedule assessment" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["primary", "secondary", "subtle", "danger", "warning", "link"] as const;
const sizes = ["medium", "small", "xsmall"] as const;

export const Matrix: Story = {
  render: () => (
    <Stack space="space.300">
      {variants.map((v) => (
        <Inline key={v} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">{v}</Text>
          {sizes.map((s) => (
            <Button key={s} variant={v} size={s}>Schedule assessment</Button>
          ))}
          <Button variant={v} disabled>Disabled</Button>
          <Button variant={v} isSelected>Selected</Button>
          <Button variant={v}><Plus className="size-icon-small" />With icon</Button>
        </Inline>
      ))}
    </Stack>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <IconButton label="Search"><Search className="size-icon-small" /></IconButton>
      <IconButton label="Settings" variant="subtle"><Settings className="size-icon-small" /></IconButton>
      <IconButton label="Download" size="medium"><Download className="size-icon-medium" /></IconButton>
      <IconButton label="Filters" isSelected><Settings className="size-icon-small" /></IconButton>
      <IconButton label="Disabled" disabled><Search className="size-icon-small" /></IconButton>
    </Inline>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Button asChild variant="primary"><a href="#top">A link that looks like a button</a></Button>
      <Button asChild variant="link"><a href="#top">A link that looks like a link</a></Button>
      <Button variant="secondary">Open<ChevronDown className="size-icon-small" /></Button>
    </Inline>
  ),
};

export const Playground: Story = { args: { variant: "primary", size: "medium" } };
