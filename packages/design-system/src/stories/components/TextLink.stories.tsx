import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, TextLink } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/TextLink",
  component: TextLink,
  parameters: { layout: "padded" },
  args: { asChild: false, href: "#record", children: "Open the full record" },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;

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

/** Navigation that reads as text. The child (a router's Link; an anchor here) takes the classes; `asChild={false}` renders an anchor from `href`. */
export const InProse: Story = {
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

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Text>
            Traces to{" "}
            <TextLink asChild={false} href="#req">
              REQ-0118
            </TextLink>
            .
          </Text>
        }
        doText="Navigation reads as text: TextLink around the router's Link."
        dont={
          <Text>
            Traces to <Button variant="link">REQ-0118</Button>.
          </Text>
        }
        dontText="A Button that looks like a link. It is not a link: no href, no open-in-new-tab, no visited state."
      />
      <Pair
        do={
          <TextLink asChild={false} href="#record" weight="medium">
            Open the full record
          </TextLink>
        }
        doText="Standing alone, the link says where it goes, at medium weight."
        dont={
          <TextLink asChild={false} href="#record" weight="medium">
            Click here
          </TextLink>
        }
        dontText="'Click here' says nothing out of context, and a screen reader lists links by their text."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
