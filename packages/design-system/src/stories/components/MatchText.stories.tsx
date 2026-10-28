import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { MatchText } from "../..";
const meta = {
  title: "Components/MatchText",
  component: MatchText,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MatchText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LiteralTerms: Story = {
  args: { text: "Review AC-2(1), ac-2(1), and <script> safely.", query: ["AC-2(1)", "<script>"] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("mark")).toHaveLength(3);
    await expect(canvasElement.querySelector("script")).toBeNull();
    await expect(canvasElement).toHaveTextContent("Review AC-2(1), ac-2(1), and <script> safely.");
  },
};
export const CaseSensitive: Story = {
  args: { text: "Alpha alpha ALPHA", query: "Alpha", matchCase: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("mark")).toHaveLength(1);
  },
};
export const EmptyQuery: Story = {
  args: { text: "The complete text is preserved without a match.", query: "" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("mark")).toBeNull();
  },
};
