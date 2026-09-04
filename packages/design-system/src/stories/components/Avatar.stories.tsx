import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, Person } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj;

export const Inlines: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Avatar name="Dana Whitfield" />
      <Avatar name="Priya Natarajan" size="xsmall" />
      <Avatar.Stack
        names={[
          "Dana Whitfield",
          "Priya Natarajan",
          "Marcus Oyelaran",
          "Lee Anand",
          "Sam Reyes",
          "Noor Haddad",
        ]}
      />
    </Inline>
  ),
};

/** Both sizes, a Person, and a stack that overflows. */
export const AvatarMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["xsmall", "small"] as const}
        cols={["one word", "two words", "initials of three"] as const}
        rowLabel="size"
        render={(size, col) => (
          <Avatar
            name={
              col === "one word"
                ? "Dana"
                : col === "two words"
                  ? "Dana Whitlock"
                  : "Dana W. Whitlock"
            }
            size={size}
          />
        )}
      />
      <Specimens title="Person and Stack">
        <Person name="Dana Whitlock" />
        <Avatar.Stack names={["Dana Whitlock", "Grace Hoppel", "Linus Aarto"]} />
        <Avatar.Stack
          names={[
            "Dana Whitlock",
            "Grace Hoppel",
            "Linus Aarto",
            "Marcus Ryde",
            "Priya Raghavan",
            "Sarah Chen",
          ]}
          max={4}
        />
      </Specimens>
    </Stack>
  ),
};
