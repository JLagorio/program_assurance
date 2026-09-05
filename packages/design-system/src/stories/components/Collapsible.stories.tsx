import type { Meta, StoryObj } from "@storybook/react-vite";

import { Collapsible } from "../../components";
import { Empty, Section } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { layout: "padded" },
  args: { title: "Discussion", children: "Present, addressable, closed." },
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The reference under a control: the statement a reader checks now and then, the objectives, the discussion. Closed, except the one they came for. */
export const Collapsibles: Story = {
  render: () => (
    <Stack space="space.0" className="w-layout-list">
      <Collapsible title="Catalog statement" defaultOpen>
        <Text color="color.text.subtle">
          Separate the duties of authorising, recording and reconciling payables so no individual
          can complete a transaction alone.
        </Text>
      </Collapsible>
      <Collapsible title="Assessment objectives" count={4}>
        <Text color="color.text.subtle">Four objectives, closed by default.</Text>
      </Collapsible>
      <Collapsible title="Discussion">
        <Text color="color.text.subtle">Present, addressable, closed.</Text>
      </Collapsible>
    </Stack>
  ),
};

/** `headingLevel`: under a Section's h2 the rows are h3s, so the rail is in the page's outline and a screen reader's heading list. */
export const Headings: Story = {
  render: () => (
    <Box className="w-layout-list">
      <Section title="Catalog" description="The control as the catalogue states it.">
        <Stack space="space.0" className="pt-150">
          <Collapsible title="Statement" headingLevel={3} defaultOpen>
            <Text color="color.text.subtle">
              Separate the duties of authorising, recording and reconciling payables.
            </Text>
          </Collapsible>
          <Collapsible title="Assessment objectives" headingLevel={3} count={4}>
            <Text color="color.text.subtle">Four objectives.</Text>
          </Collapsible>
          <Collapsible title="Discussion" headingLevel={3}>
            <Text color="color.text.subtle">Why the control exists.</Text>
          </Collapsible>
        </Stack>
      </Section>
    </Box>
  ),
};

/** `inset`: on a surface whose rules run edge to edge, the row and the body step in by `space.300`; the first row drops its rule. */
export const Inset: Story = {
  render: () => (
    <Box className="w-layout-list rounded-large border border-default bg-surface-raised">
      <Collapsible title="Catalog statement" inset defaultOpen className="border-t-0">
        <Text color="color.text.subtle">
          Separate the duties of authorising, recording and reconciling payables.
        </Text>
      </Collapsible>
      <Collapsible title="Assessment objectives" inset count={4}>
        <Text color="color.text.subtle">Four objectives.</Text>
      </Collapsible>
      <Collapsible title="Discussion" inset>
        <Text color="color.text.subtle">Why the control exists.</Text>
      </Collapsible>
    </Box>
  ),
};

/** Closed, open, with a count and disabled, flush on the page and inset on a surface. */
export const CollapsibleMatrix: Story = {
  render: () => (
    <Matrix
      rows={["closed", "open", "with a count", "disabled"] as const}
      cols={["flush", "inset"] as const}
      rowLabel="state"
      render={(row, col) => (
        <Box
          style={{ width: 320 }}
          className={
            col === "inset" ? "rounded-large border border-default bg-surface-raised" : undefined
          }
        >
          <Collapsible
            title={row === "with a count" ? "Assessment objectives" : "Discussion"}
            count={row === "with a count" ? 4 : null}
            defaultOpen={row === "open"}
            disabled={row === "disabled"}
            inset={col === "inset"}
            className={col === "inset" ? "border-t-0" : undefined}
          >
            <Text color="color.text.subtle">The body, from the rule to space.200 under it.</Text>
          </Collapsible>
        </Box>
      )}
    />
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box className="w-layout-list">
            <Section title="Implementation" count={3}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                The three implementation statements, open, an h2 in the outline.
              </Text>
            </Section>
          </Box>
        }
        doText="The record's work is a Section: open, a heading, read by every reader."
        dont={
          <Box className="w-layout-list">
            <Collapsible title="Implementation" count={3}>
              <Text color="color.text.subtle">The three implementation statements.</Text>
            </Collapsible>
          </Box>
        }
        dontText="The work folded. A reader who did not click never sees it. A Collapsible is for reference, which is read now and then."
      />
      <Pair
        do={
          <Stack space="space.0" className="w-layout-list">
            <Collapsible title="Assessment objectives" count={4}>
              <Text color="color.text.subtle">Four objectives.</Text>
            </Collapsible>
            <Collapsible title="Discussion">
              <Text color="color.text.subtle">Why the control exists.</Text>
            </Collapsible>
          </Stack>
        }
        doText="Flat: every section one click away, the chevrons in one column."
        dont={
          <Box className="w-layout-list">
            <Collapsible title="Catalog" defaultOpen>
              <Stack space="space.0">
                <Collapsible title="Assessment objectives" count={4} inset>
                  <Text color="color.text.subtle">Four objectives.</Text>
                </Collapsible>
                <Collapsible title="Discussion" inset>
                  <Text color="color.text.subtle">Why the control exists.</Text>
                </Collapsible>
              </Stack>
            </Collapsible>
          </Box>
        }
        dontText="A fold inside a fold: two clicks to a paragraph and the chevrons stack. Flatten it, or a Tree for a hierarchy."
      />
      <Pair
        do={
          <Box className="w-layout-list">
            <Collapsible title="Related controls" defaultOpen>
              <Empty
                title="No related controls"
                description="Controls that share this one's evidence or system appear here."
                size="compact"
              />
            </Collapsible>
          </Box>
        }
        doText="Nothing inside: an Empty says what would be here and what fills it."
        dont={
          <Box className="w-layout-list">
            <Collapsible title="Related controls" defaultOpen>
              <Text color="color.text.subtle">None</Text>
            </Collapsible>
          </Box>
        }
        dontText="A grey word. The reader opened it for something and gets a shrug."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
