import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, TextLink } from "../../components";
import { FootBar, PageHeader } from "../../layout";
import { Inline, Stack } from "../../primitives";

const meta = {
  title: "Layout/FootBar",
  component: FootBar,
  parameters: { layout: "padded" },
  args: { summary: "58 of 58 recorded", detail: "5 controls not satisfied" },
  render: (args) => (
    <FootBar
      {...args}
      actions={
        <Button variant="primary" size="large">
          Send to lead
        </Button>
      }
    />
  ),
} satisfies Meta<typeof FootBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What the live regions hold now, one entry a line. */
const lines = (canvasElement: HTMLElement, politeness: "polite" | "assertive") =>
  [
    ...canvasElement.ownerDocument.querySelectorAll(
      `[data-slot="announcer-region"][data-politeness="${politeness}"] > div`,
    ),
  ].map((line) => line.textContent ?? "");

/** What is judged and what it found at the start, the one act at the end, at the 60px of `dimension.layout.footer`. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="foot-bar"]')!;
    await expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    await expect(canvas.getByText("58 of 58 recorded")).toBeVisible();
    await expect(canvas.getByText("5 controls not satisfied")).toBeVisible();
    const act = canvas.getByRole("button", { name: "Send to lead" });
    await expect(act).toHaveAttribute("data-button-variant", "primary");
    // The act stands at the bar's end.
    await expect(act.getBoundingClientRect().right).toBeGreaterThan(
      canvas.getByText("5 controls not satisfied").getBoundingClientRect().right,
    );
  },
};

/** The bar's forms: work left (what is left, as links, and the act waiting with its reason), ready, the act under way, a failure that keeps the draft, the act sent and waiting on someone, and a signature. Each is the same bar; only what it holds changes. */
export const States: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <FootBar
        data-testid="Work left"
        summary="56 of 58 recorded"
        reason={
          <>
            To judge
            <TextLink href="#ia-2-12">IA-2(12)</TextLink>
            <TextLink href="#sc-28-3">SC-28(3)</TextLink>
          </>
        }
        actions={
          <Button variant="primary" size="large" disabledReason="2 objectives are left to judge.">
            Send to lead
          </Button>
        }
      />
      <FootBar
        data-testid="Ready"
        summary="58 of 58 recorded"
        detail="5 controls not satisfied"
        actions={
          <Button variant="primary" size="large">
            Send to lead
          </Button>
        }
      />
      <FootBar
        data-testid="Sending"
        summary="58 of 58 recorded"
        detail="5 controls not satisfied"
        actions={
          <Button variant="primary" size="large" isLoading loadingLabel="Sending">
            Send to lead
          </Button>
        }
      />
      <FootBar
        data-testid="Failed"
        failed
        summary="Not sent"
        detail="58 determinations kept as a draft"
        actions={
          <Button variant="primary" size="large">
            Send again
          </Button>
        }
      />
      <FootBar
        data-testid="Sent"
        summary="58 of 58 recorded"
        detail="5 controls not satisfied"
        actions={
          <PageHeader.Slot
            waitingOn={{
              name: "D. Okafor",
              role: "lead assessor",
              since: "2026-11-14T15:00:00Z",
              onRemind: () => {},
            }}
          />
        }
      />
      <FootBar
        data-testid="A signature"
        summary="Signing as R. Calloway, authorizing official"
        actions={
          <>
            <Button size="large">Return</Button>
            <Button intent="sign" signer="R. Calloway">
              Approve security plan
            </Button>
          </>
        }
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = (name: string) => within(within(canvasElement).getByTestId(name));
    // Work left: each record left is a link, and the act stays in its place with its reason.
    const left = bar("Work left");
    await expect(left.getByRole("link", { name: "IA-2(12)" })).toHaveAttribute("href", "#ia-2-12");
    await expect(left.getByRole("button", { name: "Send to lead" })).toHaveAccessibleDescription(
      "2 objectives are left to judge.",
    );
    // Under way, the act keeps its place and says so.
    await expect(bar("Sending").getByRole("button", { name: "Send to lead" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    // A failure is drawn in the danger tone with its icon, and the draft is said to be kept.
    const failed = canvasElement.querySelector<HTMLElement>('[data-testid="Failed"]')!;
    await expect(failed).toHaveAttribute("data-failed");
    await expect(failed.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(bar("Failed").getByText("58 determinations kept as a draft")).toBeVisible();
    // Sent, the bar waits on the lead with Remind.
    await expect(bar("Sent").getByText("Waiting on D. Okafor")).toBeVisible();
    await expect(bar("Sent").getByRole("button", { name: "Remind" })).toBeVisible();
    // A signature: Return beside the sign button, which names its signer.
    await expect(
      bar("A signature").getByRole("button", { name: "Approve security plan as R. Calloway" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: "Return" })).toHaveLength(1);
  },
};

/** The count is said whenever it changes, so a reader who judges by key hears it move without looking down; a failure is said at once. */
function Counting() {
  const [recorded, setRecorded] = useState(56);
  const [failed, setFailed] = useState(false);
  return (
    <Stack space="space.200">
      <Inline space="space.100">
        <Button onClick={() => setRecorded((n) => Math.min(58, n + 1))}>Record one</Button>
        <Button onClick={() => setFailed(true)}>Fail the send</Button>
      </Inline>
      <FootBar
        failed={failed}
        summary={failed ? "Not sent" : `${recorded} of 58 recorded`}
        detail={failed ? "58 determinations kept as a draft" : undefined}
        actions={
          <Button variant="primary" size="large">
            {failed ? "Send again" : "Send to lead"}
          </Button>
        }
      />
    </Stack>
  );
}

/** The bar's count is read as it moves, politely, and a failure is read at once. Nothing is said as the bar first draws. */
export const CountsRead: Story = {
  name: "Counts read",
  tags: ["!manifest"],
  render: () => <Counting />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(lines(canvasElement, "polite")).not.toContain("56 of 58 recorded");
    await userEvent.click(canvas.getByRole("button", { name: "Record one" }));
    await expect(canvas.getByText("57 of 58 recorded")).toBeVisible();
    await waitFor(() => expect(lines(canvasElement, "polite")).toContain("57 of 58 recorded"));
    await userEvent.click(canvas.getByRole("button", { name: "Fail the send" }));
    await waitFor(() =>
      expect(lines(canvasElement, "assertive")).toContain(
        "Not sent, 58 determinations kept as a draft",
      ),
    );
  },
};
