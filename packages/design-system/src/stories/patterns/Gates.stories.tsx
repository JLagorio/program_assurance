import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Gates } from "../..";
import { Button, Progress, ProgressValue, TextLink } from "../../components";

import { Box, Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Gates",
  component: Gates,
  parameters: { layout: "padded" },
  args: { children: <Gates.Item met label="Owner" /> },
} satisfies Meta<typeof Gates>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Met and unmet in both unmet tones; bare, with a reason, with a reason and an action. */
export const GatesMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Matrix
      rows={["met", "unmet · warning", "unmet · danger"] as const}
      cols={["label", "reason", "action"] as const}
      rowLabel="state"
      render={(row, col) => (
        <Box style={{ maxWidth: 260 }}>
          <Gates>
            <Gates.Item
              met={row === "met"}
              tone={row.endsWith("danger") ? "danger" : "warning"}
              label="Success criterion"
              reason={col === "label" ? undefined : "Nothing decides that it is met."}
              action={
                col === "action" ? (
                  <Button size="small" variant="link">
                    Add success criterion
                  </Button>
                ) : undefined
              }
            />
          </Gates>
        </Box>
      )}
    />
  ),
};

/** What a requirement still needs: two met, two not, one with the action that meets it. */
export const GatesStory: Story = {
  name: "Gates",
  render: () => (
    <Stack space="space.100" className="max-w-[420px]">
      <Gates>
        <Gates.Item met label="Owner" />
        <Gates.Item met label="One shall" />
        <Gates.Item
          met={false}
          label="Success criterion"
          reason="Nothing decides that it is met."
          action={
            <Button size="small" variant="link">
              Add success criterion
            </Button>
          }
        />
        <Gates.Item
          met={false}
          tone="danger"
          label="Source with rationale"
          reason="SI-7(1) gives no reason."
        />
      </Gates>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = within(canvas.getByRole("list")).getAllByRole("listitem");
    await expect(items).toHaveLength(4);
    // The state is spoken before each label; the check and the Dot are not read.
    await expect(items[0]).toHaveTextContent(/^Met: Owner$/);
    await expect(items[2]).toHaveTextContent(/^Not met: Success criterion/);
    await expect(canvasElement.querySelectorAll("svg:not([aria-hidden='true'])")).toHaveLength(0);
    // The action is the one stop, named for the gate it meets.
    await expect(within(items[2]!).getByRole("button")).toHaveAccessibleName(
      "Add success criterion",
    );
    await expect(within(items[3]!).queryByRole("button")).toBeNull();
  },
};

/** A phase whose exit criteria are all met: every row a check, muted, with the one finding worth reading. */
export const AllMet: Story = {
  render: () => (
    <Stack space="space.100" className="max-w-[420px]">
      <Gates>
        <Gates.Item met label="Entry criteria met" />
        <Gates.Item met label="Every scenario executed" />
        <Gates.Item
          met
          label="Every attestation signed"
          reason="Signed by Dana Whitfield on 28 Aug; the ISSM's signature is on the record."
        />
        <Gates.Item met label="Findings filed against the register" />
      </Gates>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    await expect(items).toHaveLength(4);
    for (const item of items) await expect(item).toHaveTextContent(/^Met: /);
  },
};

/** The submit gates of a revision, in a rail: a title with the unmet count, then the list. */
export const InRail: Story = {
  render: () => (
    <Box style={{ maxWidth: 300 }}>
      <Stack space="space.100">
        <Inline space="space.100" alignBlock="baseline">
          <Text weight="medium" id="submit-gates">
            Submit gates
          </Text>
          <Text size="small" color="color.text.subtle">
            2 unmet
          </Text>
        </Inline>
        <Gates aria-labelledby="submit-gates">
          <Gates.Item met label="Baseline chosen" reason="Moderate, from the categorization." />
          <Gates.Item met label="Every tailoring decision has a reason" />
          <Gates.Item
            met={false}
            label="Contested overlays resolved"
            reason="Two overlays disagree on AC-2(3)."
            action={
              <TextLink size="small" render={<a href="#overlays" />}>
                Resolve overlays
              </TextLink>
            }
          />
          <Gates.Item
            met={false}
            tone="danger"
            label="Program categorization in force"
            reason="The PM has not signed the categorization."
          />
        </Gates>
      </Stack>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The heading above names the list, so a screen reader announces "Submit gates, list, 4 items".
    const list = canvas.getByRole("list", { name: "Submit gates" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    await expect(within(list).getByRole("link", { name: "Resolve overlays" })).toHaveAttribute(
      "href",
      "#overlays",
    );
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Gates>
            <Gates.Item met label="Owner" />
            <Gates.Item met label="One shall" />
            <Gates.Item
              met={false}
              label="Success criterion"
              reason="Nothing decides that it is met."
            />
          </Gates>
        }
        doText="The reason under the unmet gate only. A met gate is a check and its label."
        dont={
          <Gates>
            <Gates.Item met label="Owner" reason="Dana Whitfield is the owner." />
            <Gates.Item met label="One shall" reason="The statement contains one shall." />
            <Gates.Item
              met={false}
              label="Success criterion"
              reason="Nothing decides that it is met."
            />
          </Gates>
        }
        dontText="A reason under every gate. The one that matters is buried in three that do not."
      />
      <Pair
        do={
          <Gates>
            <Gates.Item met label="Owner" />
            <Gates.Item met label="One shall" />
            <Gates.Item
              met={false}
              label="Success criterion"
              reason="Nothing decides that it is met."
            />
            <Gates.Item
              met={false}
              label="Source with rationale"
              reason="SI-7(1) gives no reason."
            />
          </Gates>
        }
        doText="A list: the reader sees which two, and why."
        dont={
          <Box style={{ maxWidth: 260 }}>
            <Stack space="space.075">
              <Progress
                value={50}
                tone="warning"
                aria-label="Gates met"
                aria-valuetext="2 of 4 met"
                className="flex-nowrap [&_[data-slot=progress-track]]:order-first [&_[data-slot=progress-track]]:min-w-0 [&_[data-slot=progress-track]]:flex-1"
              >
                <ProgressValue children={() => "2 of 4 met"} />
              </Progress>
            </Stack>
          </Box>
        }
        dontText="A score. Half of the gates met says nothing about which half, or what to do."
      />
      <Pair
        do={
          <Gates>
            <Gates.Item
              met={false}
              label="Success criterion"
              reason="Nothing decides that it is met."
              action={
                <Button size="small" variant="link">
                  Add success criterion
                </Button>
              }
            />
            <Gates.Item
              met={false}
              label="Source with rationale"
              reason="SI-7(1) gives no reason."
            />
          </Gates>
        }
        doText="One link action named for its gate, on the gate the reader can meet from here."
        dont={
          <Gates>
            <Gates.Item
              met={false}
              label="Success criterion"
              reason="Nothing decides that it is met."
              action={
                <Button size="small" variant="primary">
                  Add criterion
                </Button>
              }
            />
            <Gates.Item
              met={false}
              label="Source with rationale"
              reason="SI-7(1) gives no reason."
              action={
                <Button size="small" variant="primary">
                  Edit source
                </Button>
              }
            />
          </Gates>
        }
        dontText="A primary button per gate. The list is a status, not a toolbar; the page's primary is elsewhere."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
