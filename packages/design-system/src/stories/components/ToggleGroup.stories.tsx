import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic } from "lucide-react";

import { ToggleGroup } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj;

/** A group in each size. */
export const ToggleGroupMatrix: Story = {
  render: () => (
    <Specimens title="ToggleGroup">
      <ToggleGroup
        aria-label="Scope"
        items={[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "settled", label: "Settled", disabled: true },
        ]}
        value="open"
        onChange={() => {}}
      />
      <ToggleGroup
        aria-label="Format"
        items={[
          {
            value: "b",
            label: (
              <>
                <Bold className="size-icon-small" />
                <span className="sr-only">Bold</span>
              </>
            ),
          },
          {
            value: "i",
            label: (
              <>
                <Italic className="size-icon-small" />
                <span className="sr-only">Italic</span>
              </>
            ),
          },
        ]}
        value="b"
        onChange={() => {}}
      />
      <ToggleGroup
        aria-label="Requirements"
        items={[
          { value: "all", label: "All", count: 372 },
          { value: "unallocated", label: "Unallocated", count: 14 },
          { value: "verified", label: "Verified", count: 0 },
        ]}
        value="all"
        onChange={() => {}}
      />
    </Specimens>
  ),
};
