import type { Meta, StoryObj } from "@storybook/react-vite";

import { CodeBlock, Textarea } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

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
}`;

const lines = source.split("\n");

const log = [
  "2026-09-05T08:14:02Z ingest  evidence EV-2201 accepted: bank reconciliation, July; sha256 9f1c…e2a0; 1.2 MB; linked to CTRL-0412 by dana.whitfield after the review that closed finding F-0088",
  "2026-09-05T08:14:03Z ingest  evidence EV-2202 accepted: approval matrix; sha256 41b7…03cd; 84 kB",
  "2026-09-05T08:14:05Z verify  CTRL-0412 marked Verified; next assessment 2026-11-12",
];

/** A document as it is serialised, from the line it starts at, with a Copy at the top end. The caller passes the lines; here they are the source split. */
export const Code: Story = {
  render: () => <CodeBlock lines={lines} start={40} copy={source} label="control.json" className="max-w-layout-measure" />,
};

/** The caller owns highlighting: each line is rendered nodes, here the keys in the brand colour and the strings subtle. */
export const Highlighted: Story = {
  render: () => (
    <CodeBlock
      label="control.json"
      className="max-w-layout-measure"
      lines={lines.map((line) => {
        const m = line.match(/^(\s*)"([^"]+)":\s(.*)$/);
        if (!m) return line;
        return (
          <>
            {m[1]}
            <span className="text-brand">"{m[2]}"</span>: <span className="text-subtle">{m[3]}</span>
          </>
        );
      })}
    />
  ),
};

/** `wrap`: long lines fold at the block's edge instead of scrolling sideways, for a log or a value with no columns to keep. */
export const Wrapped: Story = {
  render: () => <CodeBlock lines={log} wrap label="Ingest log" className="max-w-layout-measure" />,
};

/** `maxHeight`: past it the block scrolls inside itself and the gutter scrolls with the lines. */
export const Capped: Story = {
  render: () => (
    <CodeBlock
      maxHeight={160}
      label="Roster"
      className="max-w-layout-measure"
      lines={Array.from({ length: 40 }, (_, i) => `user${String(i + 1).padStart(3, "0")}  admin=${i % 7 === 0 ? "yes" : "no"}  last-login=2026-08-${String((i % 28) + 1).padStart(2, "0")}`)}
    />
  ),
};

/** A few lines; from a start line; wide lines scrolling sideways with the gutter held; wrapped; capped; with a Copy. */
export const CodeBlockMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Specimens title="short · from a line · wide">
        <Stack space="space.200" className="w-full">
          <CodeBlock lines={["{", '  "control-id": "ac-2.3",', '  "status": "partially-satisfied"', "}"]} />
          <CodeBlock start={118} lines={["line vty 0 4", " transport input telnet ssh", " login local"]} />
          <CodeBlock lines={log} label="Ingest log" />
        </Stack>
      </Specimens>
      <Specimens title="wrapped · capped · with a Copy">
        <Stack space="space.200" className="w-full">
          <CodeBlock lines={log.slice(0, 1)} wrap label="Ingest log" />
          <CodeBlock maxHeight={96} lines={Array.from({ length: 24 }, (_, i) => `row ${i + 1}`)} />
          <CodeBlock lines={lines.slice(0, 4)} copy={lines.slice(0, 4).join("\n")} label="control.json" />
        </Stack>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<CodeBlock lines={lines.slice(0, 4)} label="control.json" />}
        doText="Source shown as source: a gutter, the code face, a Copy when the reader will paste it."
        dont={
          <Box className="w-full">
            <Textarea readOnly defaultValue={lines.slice(0, 4).join("\n")} rows={4} aria-label="control.json" />
          </Box>
        }
        dontText="Code in a read-only Textarea. It looks like a field the reader cannot use, wraps the lines and has no numbers."
      />
      <Pair
        do={
          <Text as="p" color="color.text.subtle">
            The control requires that no individual can authorise, record and reconcile a payable alone.
          </Text>
        }
        doText="Prose is Text. A paragraph reads as a paragraph."
        dont={<CodeBlock wrap lines={["The control requires that no individual can authorise, record and reconcile a payable alone."]} />}
        dontText="A sentence in a code block. The gutter numbers a paragraph and the code face makes it harder to read."
      />
    </Stack>
  ),
};

export const Playground: StoryObj<typeof meta> = {
  args: { lines, start: 1, maxHeight: 560, wrap: false, copy: source, label: "control.json" },
  render: (args) => <CodeBlock {...args} className="max-w-layout-measure" />,
};
