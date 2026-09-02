import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { CodeBlock } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  args: { start: 1, maxHeight: 560, lines: [] },
  argTypes: {
    start: { control: "number" },
    maxHeight: { control: "number" },
    lines: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const source = `{
  "component-definition": {
    "uuid": "8f1c2a7e-3d4b-4c0e-9b2a-6f5d1e0a7c31",
    "metadata": {
      "title": "Program Assurance — Evidence export",
      "last-modified": "2026-09-02T14:05:00Z",
      "version": "1.4.0",
      "oscal-version": "1.1.2"
    },
    "components": [
      {
        "uuid": "1b2c3d4e-5f60-4718-8a9b-0c1d2e3f4a5b",
        "type": "software",
        "title": "Identity service",
        "control-implementations": [
          {
            "source": "https://csrc.nist.gov/oscal/800-53/rev5",
            "implemented-requirements": [
              { "control-id": "ac-2", "status": "implemented" },
              { "control-id": "ac-6.1", "status": "partial" }
            ]
          }
        ]
      }
    ]
  }
}`;

/** Keys stay foreground, strings go muted, punctuation goes lighter. The caller owns highlighting. */
function JsonLine({ line }: { line: string }): ReactNode {
  const parts = line.split(/("[^"]*")/);
  return parts.map((p, i) =>
    p.startsWith('"') ? (
      <span
        key={i}
        className={
          i === 1 && line.trimStart().startsWith('"') && line.includes(":")
            ? "text-foreground"
            : "text-muted-foreground"
        }
      >
        {p}
      </span>
    ) : (
      <span key={i} className="text-muted-foreground/70">
        {p}
      </span>
    ),
  );
}

const lines = source.split("\n").map((l) => <JsonLine line={l} />);

export const Playground: Story = {
  args: { lines },
  render: (args) => (
    <div className="max-w-[720px]">
      <CodeBlock {...args} />
    </div>
  ),
};

/** A window into a longer file: numbering starts where the slice starts. */
export const Window: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-2">
      <CodeBlock start={212} maxHeight={200} lines={lines.slice(8, 20)} />
      <Spec>
        gutter width follows the widest number · sticky on sideways scroll · mono 11.5/1.55
      </Spec>
    </div>
  ),
};

/** Long lines scroll sideways under a gutter that stays put. */
export const Wide: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[520px]">
      <CodeBlock
        lines={[
          <JsonLine line='{ "control-id": "ac-2", "status": "implemented", "remarks": "Reviewed 12 Aug 2026 against the account inventory export; no orphaned accounts found in the identity service tenant." }' />,
          <JsonLine line='{ "control-id": "ac-6.1", "status": "partial", "remarks": "Privileged role assignments reviewed; two service principals await re-certification." }' />,
          <JsonLine line='{ "control-id": "au-6", "status": "planned" }' />,
        ]}
      />
    </div>
  ),
};
