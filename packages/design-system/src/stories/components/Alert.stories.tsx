import { Info } from "lucide-react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, Button, TextLink, toneClasses, tones } from "../../components";
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
  play: async ({ canvasElement }) => {
    const { expect } = await import("storybook/test");
    for (const alert of canvasElement.querySelectorAll('[data-slot="alert"]')) {
      await expect(alert).toHaveAttribute("role", alert.getAttribute("data-tone") === "danger" ? "alert" : "status");
    }
  },
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
                <TextLink size="small" className={`${toneClasses[tone].text} underline`}>
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
            <TextLink className="text-warning underline" size="small">
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
  play: async ({ canvasElement }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Evidence expired");
    const draft = canvas.getByRole("note");
    await expect(draft).toHaveTextContent("Draft");
    await expect(draft.querySelector('[aria-hidden="true"]')).toBeNull();
    const titleOnly = canvas.getByText("Assessment complete").closest('[data-slot="alert"]')!;
    await expect(titleOnly.querySelector('[data-slot="alert-description"]')).toBeNull();
  },
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Alert tone="danger" title="Evidence expired">
        The bank reconciliation for July no longer covers the period.
      </Alert>
      <Alert tone="success" title="Assessment complete" />
      <Alert tone="information">
        Rows marked suspect keep their determination and are flagged for the assessor.
      </Alert>
      <Alert tone="neutral" role="note" title="Draft" icon={null}>
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
              <TextLink className="text-danger underline" size="small">
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
        dontText="These actions offer conflicting responses to expired evidence. Keep the recovery path clear; dismissal must not conceal a blocking condition."
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

const noticeRefs = { root: fn(), title: fn(), description: fn(), action: fn() };
function NotificationNotice() {
  const [enabled, setEnabled] = useState(false);
  return (
    <Alert
      ref={noticeRefs.root}
      aria-labelledby="notifications-title"
      aria-describedby="notifications-description"
      tone={enabled ? "success" : "information"}
      role="status"
      className="w-layout-list max-w-full"
    >
      <Alert.Title ref={noticeRefs.title} id="notifications-title">
        <Info aria-hidden="true" className="size-icon-medium shrink-0" />
        {enabled ? "Notifications enabled" : "Notifications are paused"}
      </Alert.Title>
      <Alert.Description ref={noticeRefs.description} id="notifications-description">
        {enabled
          ? "You’ll receive updates when evidence needs your attention."
          : "Turn on notifications to hear when evidence needs your attention."}
      </Alert.Description>
      <Alert.Action ref={noticeRefs.action}>
        <Button size="small" onClick={() => setEnabled(!enabled)}>
          {enabled ? "Pause notifications" : "Enable notifications"}
        </Button>
      </Alert.Action>
    </Alert>
  );
}

/** Compose an action directly; the application owns its behavior and feedback. */
export const WithAction: Story = {
  render: () => <NotificationNotice />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const notice = canvas.getByRole("status");
    await expect(notice).toHaveAccessibleName("Notifications are paused");
    await expect(notice).toHaveAccessibleDescription("Turn on notifications to hear when evidence needs your attention.");
    await expect(noticeRefs.root).toHaveBeenCalledWith(notice);
    for (const part of ["title", "description", "action"] as const)
      await expect(noticeRefs[part]).toHaveBeenCalledWith(notice.querySelector(`[data-slot="alert-${part}"]`));
    await expect(canvas.getByRole("button", { name: "Enable notifications" })).not.toHaveClass("underline");
    await userEvent.click(canvas.getByRole("button", { name: "Enable notifications" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Notifications enabled");
    await userEvent.click(canvas.getByRole("button", { name: "Pause notifications" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Notifications are paused");
  },
};
