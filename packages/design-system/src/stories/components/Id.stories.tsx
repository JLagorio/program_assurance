import type { Meta, StoryObj } from "@storybook/react-vite";

import { Id, TextLink } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Id",
  component: Id,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Id>;
export default meta;
type Story = StoryObj;

/** An Id in text, in a link, and the list with many and with none. */
export const IdMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        Finding <Id>FND-2231</Id> rolls up to <Id>RSK-0021</Id>.
      </Text>
      <Text>
        Inside a link it is blue because the link is:{" "}
        <TextLink>
          <a href="#f">
            <Id>FND-2231</Id>
          </a>
        </TextLink>
        .
      </Text>
      <Id.List ids={["AC-2", "AC-2(1)", "AC-2(3)", "AC-3", "AC-6(1)", "AC-7", "AC-11", "AC-17"]} />
      <Id.List ids={[]} />
      <Id.List ids={[]} empty="No controls" />
    </Stack>
  ),
};
