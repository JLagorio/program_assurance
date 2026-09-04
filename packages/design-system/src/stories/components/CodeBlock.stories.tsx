import type { Meta, StoryObj } from "@storybook/react-vite";

import { CodeBlock } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CodeBlock>;
export default meta;
type Story = StoryObj;

const source = `{
  "control": "CTRL-0412",
  "name": "Segregation of duties, payables",
  "owner": "dana.whitfield",
  "frequency": "quarterly",
  "evidence": ["EV-2201", "EV-2202"],
  "verified": "2026-08-12"
}`.split("\n");

export const Code: Story = {
  render: () => <CodeBlock lines={source} start={40} className="max-w-[560px]" />,
};

/** A few lines, numbered from a start line, and a capped height that scrolls. */
export const CodeBlockMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <CodeBlock
        lines={["{", '  "control-id": "ac-2.3",', '  "status": "partially-satisfied"', "}"]}
      />
      <CodeBlock
        start={118}
        lines={["line vty 0 4", " transport input telnet ssh", " login local"]}
      />
      <CodeBlock maxHeight={96} lines={Array.from({ length: 24 }, (_, i) => `row ${i + 1}`)} />
    </Stack>
  ),
};
