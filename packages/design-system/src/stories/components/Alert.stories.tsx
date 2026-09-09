import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  Button,
  Dot,
  tones,
} from "../../components";
import { Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  args: {
    variant: "default",
    children: (
      <>
        <AlertTitle>Review imported records</AlertTitle>
        <AlertDescription>Two records need an owner before continuing.</AlertDescription>
      </>
    ),
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Shadcn variants and caller-selected announcement semantics. */
export const Variants: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Alert>
        <Info aria-hidden />
        <AlertTitle>Import ready</AlertTitle>
        <AlertDescription>Review the records before publishing.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle aria-hidden />
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>The file is missing its record identifiers.</AlertDescription>
        <AlertAction>
          <a href="#format">Read the required format</a>
        </AlertAction>
      </Alert>
      <Alert role="note">
        <AlertTitle>Draft</AlertTitle>
        <AlertDescription>This revision has not been submitted.</AlertDescription>
      </Alert>
      <Alert role="status" tone="success">
        <AlertTitle>Assessment complete</AlertTitle>
      </Alert>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('[data-slot="alert"]');
    await expect(alerts[0]).toHaveAttribute("role", "alert");
    await expect(alerts[1]).toHaveAttribute("data-tone", "danger");
    await expect(alerts[2]).toHaveAttribute("role", "note");
    await expect(alerts[3]!.querySelector('[data-slot="alert-description"]')).toBeNull();
  },
};

export const Tones: Story = {
  render: () => (
    <Matrix
      rows={tones}
      cols={["Callout"]}
      render={(tone) => (
        <Alert tone={tone} role="note" className="w-layout-list max-w-full">
          <AlertTitle>
            <Dot tone={tone} />
            Evidence expires in 12 days
          </AlertTitle>
          <AlertDescription>
            Review the collection period before submitting the assessment.
          </AlertDescription>
        </Alert>
      )}
    />
  ),
};

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
      <AlertTitle ref={noticeRefs.title} id="notifications-title">
        <Info aria-hidden="true" className="size-icon-medium shrink-0" />
        {enabled ? "Notifications enabled" : "Notifications are paused"}
      </AlertTitle>
      <AlertDescription ref={noticeRefs.description} id="notifications-description">
        {enabled
          ? "You’ll receive updates when evidence needs your attention."
          : "Turn on notifications to hear when evidence needs your attention."}
      </AlertDescription>
      <AlertAction ref={noticeRefs.action}>
        <Button size="small" onClick={() => setEnabled(!enabled)}>
          {enabled ? "Pause notifications" : "Enable notifications"}
        </Button>
      </AlertAction>
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
    await expect(notice).toHaveAccessibleDescription(
      "Turn on notifications to hear when evidence needs your attention.",
    );
    await expect(noticeRefs.root).toHaveBeenCalledWith(notice);
    for (const part of ["title", "description", "action"] as const)
      await expect(noticeRefs[part]).toHaveBeenCalledWith(
        notice.querySelector(`[data-slot="alert-${part}"]`),
      );
    await expect(canvas.getByRole("button", { name: "Enable notifications" })).not.toHaveClass(
      "underline",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Enable notifications" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Notifications enabled");
    await userEvent.click(canvas.getByRole("button", { name: "Pause notifications" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Notifications are paused");
  },
};
