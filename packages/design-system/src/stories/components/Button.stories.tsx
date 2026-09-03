import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Download, Plus, Search, Settings } from "lucide-react";

import { Button, IconButton, TextLink } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";

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
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {v}
          </Text>
          {sizes.map((s) => (
            <Button key={s} variant={v} size={s}>
              Schedule assessment
            </Button>
          ))}
          <Button variant={v} disabled>
            Disabled
          </Button>
          <Button variant={v} isSelected>
            Selected
          </Button>
          <Button variant={v}>
            <Plus className="size-icon-small" />
            With icon
          </Button>
        </Inline>
      ))}
    </Stack>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <IconButton label="Search">
        <Search className="size-icon-small" />
      </IconButton>
      <IconButton label="Settings" variant="subtle">
        <Settings className="size-icon-small" />
      </IconButton>
      <IconButton label="Download" size="medium">
        <Download className="size-icon-medium" />
      </IconButton>
      <IconButton label="Filters" isSelected>
        <Settings className="size-icon-small" />
      </IconButton>
      <IconButton label="Disabled" disabled>
        <Search className="size-icon-small" />
      </IconButton>
    </Inline>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Button asChild variant="primary">
        <a href="#top">A link that looks like a button</a>
      </Button>
      <TextLink>
        <a href="#top">A link that reads as text</a>
      </TextLink>
      <Button variant="secondary">
        Open
        <ChevronDown className="size-icon-small" />
      </Button>
    </Inline>
  ),
};

/** Navigation that reads as text. The child (a router's Link; an anchor here) takes the classes; `asChild={false}` renders an anchor from `href`. */
export const TextLinks: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        The finding was raised against{" "}
        <TextLink>
          <a href="#ctrl">AC-2(4)</a>
        </TextLink>{" "}
        and traces to{" "}
        <TextLink>
          <a href="#req">REQ-0118</a>
        </TextLink>
        .
      </Text>
      <Inline space="space.300" alignBlock="baseline">
        <TextLink size="small">
          <a href="#a">Small</a>
        </TextLink>
        <TextLink size="medium">
          <a href="#b">Medium</a>
        </TextLink>
        <TextLink weight="medium">
          <a href="#c">Medium weight</a>
        </TextLink>
        <TextLink asChild={false} href="#d">
          An anchor from href
        </TextLink>
      </Inline>
    </Stack>
  ),
};

/** Inherited, small and medium sizes by weight; a TextLink beside a Button link, which is an action and not navigation. */
export const TextLinkMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Grid
        rows={["inherit", "small", "medium"] as const}
        cols={["regular", "medium"] as const}
        rowLabel="size"
        render={(size, weight) => (
          <TextLink
            asChild={false}
            href="#x"
            size={size === "inherit" ? undefined : size}
            weight={weight}
          >
            Open the full record
          </TextLink>
        )}
      />
      <Specimens title="TextLink beside Button link">
        <TextLink asChild={false} href="#x">
          Navigation: TextLink
        </TextLink>
        <Button variant="link">Action: Button link</Button>
      </Specimens>
    </Stack>
  ),
};

export const Playground: Story = { args: { variant: "primary", size: "medium" } };
