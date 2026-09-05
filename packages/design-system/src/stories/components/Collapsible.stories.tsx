import type { Meta, StoryObj } from "@storybook/react-vite";

import { Collapsible } from "../../components";
import { Empty, Section } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
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

/** In a Group the sections know about each other: Up and Down move between the titles, and each opens on its own. Reference the reader compares, which is why the Inspector's groups are this. */
export const Grouped: Story = {
  render: () => (
    <Box className="w-layout-list">
      <Section title="Details">
        <Collapsible.Group headingLevel={3} className="pt-150">
          <Collapsible title="Ownership" defaultOpen>
            <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
          </Collapsible>
          <Collapsible title="Dates" defaultOpen>
            <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
          </Collapsible>
          <Collapsible title="Scope" count={4}>
            <Text color="color.text.subtle">Four systems inherit it.</Text>
          </Collapsible>
        </Collapsible.Group>
      </Section>
    </Box>
  ),
};

/** `type="single"`: one section at a time, and the open one closes. A set the reader takes one by one. */
export const OneAtATime: Story = {
  render: () => (
    <Collapsible.Group type="single" className="w-layout-list">
      <Collapsible title="Evidence" count={3} defaultOpen>
        <Text color="color.text.subtle">
          Bank reconciliation, approval matrix, walkthrough notes.
        </Text>
      </Collapsible>
      <Collapsible title="History">
        <Text color="color.text.subtle">Opening this closes Evidence: one at a time.</Text>
      </Collapsible>
      <Collapsible title="Related controls" count={2}>
        <Text color="color.text.subtle">CTRL-0418, CTRL-0419.</Text>
      </Collapsible>
    </Collapsible.Group>
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

/** `inset`: on a surface whose rules run edge to edge, the row and the body step in by `space.300`; the first row drops its rule, and a group drops the last. */
export const Inset: Story = {
  render: () => (
    <Box className="w-layout-list rounded-large border border-default bg-surface-raised">
      <Collapsible.Group inset className="border-b-0">
        <Collapsible title="Catalog statement" defaultOpen className="border-t-0">
          <Text color="color.text.subtle">
            Separate the duties of authorising, recording and reconciling payables.
          </Text>
        </Collapsible>
        <Collapsible title="Assessment objectives" count={4}>
          <Text color="color.text.subtle">Four objectives.</Text>
        </Collapsible>
        <Collapsible title="Discussion">
          <Text color="color.text.subtle">Why the control exists.</Text>
        </Collapsible>
      </Collapsible.Group>
    </Box>
  ),
};

/** Closed, open, with a count and disabled, flush on the page and inset on a surface; then the groups, whose titles differ because each body is a region landmark named by its title. */
export const CollapsibleMatrix: Story = {
  render: () => (
    <Stack space="space.400">
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
      <Specimens title="In a group">
        <Stack space="space.300" className="w-layout-list">
          <Collapsible.Group>
            <Collapsible title="Multiple · open" count="2 of 4" defaultOpen>
              <Text color="color.text.subtle">Any number open; the arrows move between the titles.</Text>
            </Collapsible>
            <Collapsible title="Multiple · also open" defaultOpen>
              <Text color="color.text.subtle">Any number open.</Text>
            </Collapsible>
          </Collapsible.Group>
          <Collapsible.Group type="single">
            <Collapsible title="Single · open" count={3} defaultOpen>
              <Text color="color.text.subtle">One at a time.</Text>
            </Collapsible>
            <Collapsible title="Single · closed">
              <Text color="color.text.subtle">Opening this closes the other.</Text>
            </Collapsible>
          </Collapsible.Group>
          <Collapsible.Group headingLevel={3}>
            <Collapsible title="Closed by default">
              <Text color="color.text.subtle">The titles are the overview.</Text>
            </Collapsible>
            <Collapsible title="Disabled in a group" disabled>
              <Text color="color.text.subtle">Cannot open.</Text>
            </Collapsible>
          </Collapsible.Group>
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
          <Collapsible.Group className="w-layout-list">
            <Collapsible title="Ownership, compared" defaultOpen>
              <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
            </Collapsible>
            <Collapsible title="Dates, compared" defaultOpen>
              <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
            </Collapsible>
          </Collapsible.Group>
        }
        doText="Reference the reader compares: a group, so two stay open."
        dont={
          <Collapsible.Group type="single" className="w-layout-list">
            <Collapsible title="Ownership, one at a time" defaultOpen>
              <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
            </Collapsible>
            <Collapsible title="Dates, one at a time">
              <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
            </Collapsible>
          </Collapsible.Group>
        }
        dontText="A single group, so opening the dates closes the owner. The reader flips to compare two lines."
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
