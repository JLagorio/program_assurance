import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, Button, TextLink, tones } from "../../components";
import { Box, Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  args: {
    tone: "warning",
    title: "3 controls are due this week",
    children: "Verification for CTRL-0412, CTRL-0418 and CTRL-0450 is due by Friday.",
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every tone as a note, titled, and with an action. */
export const AlertMatrix: Story = {
  render: () => (
    <Matrix
      rows={tones}
      cols={["note", "titled", "with an action"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <Box style={{ width: 320 }}>
          <Alert
            tone={tone}
            title={col === "note" ? undefined : "Evidence expires in 12 days"}
            action={
              col === "with an action" ? (
                <TextLink size="small">
                  <a href="#evidence">Open the evidence</a>
                </TextLink>
              ) : undefined
            }
          >
            {col === "note"
              ? "Three artifacts were collected more than a year ago."
              : "Three artifacts on this control were collected more than a year ago."}
          </Alert>
        </Box>
      )}
    />
  ),
};

/** As wide as what it is about: a rail's width in a rail, the table's width above a table. */
export const Placement: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ width: 280 }}>
        <Alert tone="danger" title="Evidence expired">
          The bank reconciliation for July no longer covers the period.
        </Alert>
      </Box>
      <Box style={{ width: 640 }}>
        <Alert
          tone="warning"
          title="PKG-0031 is not shippable"
          action={
            <TextLink size="small">
              <a href="#gaps">Show the 14 gaps</a>
            </TextLink>
          }
        >
          14 of 212 in-scope CCIs have a traceability gap and 2 generated artifacts are out of date
          with the snapshot.
        </Alert>
      </Box>
    </Stack>
  ),
};

/** Feedback and a note read differently: the first is a title that says what happened, the second a body alone. */
export const Kinds: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-[560px]">
      <Alert tone="danger" title="Evidence expired">
        The bank reconciliation for July no longer covers the period.
      </Alert>
      <Alert tone="success" title="Assessment complete" />
      <Alert tone="information">
        Rows marked suspect keep their determination and are flagged for the assessor.
      </Alert>
      <Alert tone="neutral" title="Draft">
        This revision has not been submitted. Nothing here is in force.
      </Alert>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Alert tone="warning" title="PKG-0031 is not shippable">
            14 of 212 in-scope CCIs have a traceability gap.
          </Alert>
        }
        doText="The title says what is wrong, in the record's terms."
        dont={
          <Alert tone="warning" title="Warning">
            There is a problem with this package. Please check the gaps and try again.
          </Alert>
        }
        dontText="The title names the tone, which the colour already says, and the body says nothing the reader can act on."
      />
      <Pair
        do={
          <Alert
            tone="danger"
            title="Evidence expired"
            action={
              <TextLink size="small">
                <a href="#evidence">Replace the artifact</a>
              </TextLink>
            }
          >
            The bank reconciliation for July no longer covers the period.
          </Alert>
        }
        doText="One action, the thing that resolves it, as a link."
        dont={
          <Alert
            tone="danger"
            title="Evidence expired"
            action={
              <span className="flex gap-100">
                <Button size="small" variant="primary">
                  Replace
                </Button>
                <Button size="small">Snooze</Button>
                <Button size="small" variant="subtle">
                  Dismiss
                </Button>
              </span>
            }
          >
            The bank reconciliation for July no longer covers the period.
          </Alert>
        }
        dontText="Three buttons and a dismiss. An alert is not a dialog; it goes when it is no longer true."
      />
      <Pair
        do={
          <Alert tone="warning" title="3 controls are due this week">
            Verification for CTRL-0412, CTRL-0418 and CTRL-0450 is due by Friday.
          </Alert>
        }
        doText="One alert above the table, about the rows under it."
        dont={
          <Stack space="space.100">
            <Alert tone="warning" title="CTRL-0412 is due Friday" />
            <Alert tone="warning" title="CTRL-0418 is due Friday" />
            <Alert tone="warning" title="CTRL-0450 is due Friday" />
          </Stack>
        }
        dontText="One per row. A stack of alerts is a table drawn badly."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
