import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { FindBar, Stack, Text } from "../..";
const meta = {
  title: "Patterns/FindBar",
  component: FindBar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FindBar>;
export default meta;
type Story = StoryObj;
export const Navigation: Story = {
  render: function Navigation() {
    const [query, setQuery] = useState("report"),
      [index, setIndex] = useState(0),
      [closed, setClosed] = useState(false);
    return (
      <Stack>
        <FindBar
          query={query}
          onQueryChange={setQuery}
          count={query ? 3 : 0}
          index={query ? index : null}
          onNavigate={setIndex}
          onClose={() => setClosed(true)}
        />
        <Text>{closed ? "Find dismissed" : "Reading"}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole("textbox", { name: "Find" });
    await userEvent.click(input);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 3");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    await expect(canvas.getByRole("status")).toHaveTextContent("1 of 3");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await expect(canvas.getByRole("status")).toHaveTextContent("1 of 3");
    await userEvent.click(canvas.getByRole("button", { name: "Previous match" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("3 of 3");
    await userEvent.clear(input);
    await expect(canvas.getByRole("button", { name: "Next match" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("Find dismissed")).toBeVisible();
  },
};
export const Searching: Story = {
  render: () => (
    <FindBar
      query="pending"
      onQueryChange={() => {}}
      count={2}
      index={0}
      onNavigate={() => {}}
      loading
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Loading");
    await expect(within(canvasElement).getByRole("button", { name: "Next match" })).toBeDisabled();
  },
};
