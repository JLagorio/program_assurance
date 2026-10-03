import { Info, RotateCcw } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  AlertIcon,
  Button,
  TextLink,
  tones,
} from "../../components";
import { Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Alert",
  component: Alert,
  subcomponents: { AlertIcon, AlertTitle, AlertDescription, AlertAction },
  parameters: { layout: "padded" },
  args: { variant: "default" },
  render: (args) => (
    <Alert {...args}>
      <AlertIcon />
      <AlertTitle>Review imported records</AlertTitle>
      <AlertDescription>Two records need an owner before continuing.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    // A neutral Alert is a polite status unless the caller says otherwise.
    const alert = canvasElement.querySelector('[data-slot="alert"]')!;
    await expect(alert).toHaveAttribute("role", "status");
    const icon = alert.querySelector('[data-slot="alert-icon"]');
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    // Beside the neutral Alert's subtle text, its icon is color.icon.subtle, which holds 3:1 on
    // the neutral fill in every mode.
    await expect(icon).toHaveClass("icon-subtle");
  },
};

/** The role follows the tone: danger is an alert, announced at once; every other tone is a polite status. `role` chooses another, `role={undefined}` none. */
export const Variants: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Alert>
        <AlertIcon />
        <AlertTitle>Import ready</AlertTitle>
        <AlertDescription>Review the records before publishing.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertIcon />
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>The file is missing its record identifiers.</AlertDescription>
        <AlertAction>
          <TextLink href="#format">Read the required format</TextLink>
          <Button size="small" iconBefore={<RotateCcw />}>
            Try the import again
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="danger" role={undefined}>
        <AlertIcon />
        <AlertTitle>Said by the page</AlertTitle>
        <AlertDescription>
          The page announces this failure itself, so it has no role.
        </AlertDescription>
      </Alert>
      <Alert role="note">
        <AlertTitle>Draft</AlertTitle>
        <AlertDescription>This revision has not been submitted.</AlertDescription>
      </Alert>
      <Alert tone="success">
        <AlertIcon />
        <AlertTitle>Assessment complete</AlertTitle>
      </Alert>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('[data-slot="alert"]');
    await expect(alerts[0]).toHaveAttribute("role", "status");
    await expect(alerts[1]).toHaveAttribute("role", "alert");
    await expect(alerts[1]).toHaveAttribute("data-tone", "danger");
    await expect(alerts[1]).toHaveAttribute("data-variant", "danger");
    // `danger` is the Ledger spelling of shadcn's `destructive`.
    await expect(alerts[2]).toHaveAttribute("data-tone", "danger");
    await expect(alerts[2]).not.toHaveAttribute("role");
    await expect(alerts[3]).toHaveAttribute("role", "note");
    await expect(alerts[4]).toHaveAttribute("role", "status");
    await expect(alerts[4]!.querySelector('[data-slot="alert-description"]')).toBeNull();
    // The recovery link reads as a link: underlined, not only coloured (WCAG 1.4.1).
    const link = within(alerts[1] as HTMLElement).getByRole("link", {
      name: "Read the required format",
    });
    await expect(getComputedStyle(link).textDecorationLine).toContain("underline");
    await expect(getComputedStyle(link).color).not.toBe(getComputedStyle(alerts[1]!).color);
    // Each tone carries its own glyph, so severity is a shape as well as a colour.
    const glyph = (i: number) =>
      alerts[i]!.querySelector('[data-slot="alert-icon"]')?.getAttribute("class");
    await expect(glyph(0)).toContain("lucide-info");
    await expect(glyph(1)).toContain("lucide-circle-alert");
    await expect(glyph(4)).toContain("lucide-circle-check");
  },
};

export const Tones: Story = {
  tags: ["!manifest"],
  render: () => (
    <Matrix
      rows={tones}
      cols={["Callout"]}
      render={(tone) => (
        <Alert tone={tone} role="note" className="w-layout-list max-w-full">
          <AlertIcon />
          <AlertTitle>Evidence expires in 12 days</AlertTitle>
          <AlertDescription>
            Review the collection period before submitting the assessment.
          </AlertDescription>
        </Alert>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll<HTMLElement>('[data-slot="alert"]');
    await expect(alerts).toHaveLength(tones.length);
    for (const alert of alerts) {
      await expect(alert.querySelector('[data-slot="alert-icon"]')).not.toBeNull();
      // In forced colours the fill is gone, so the Alert keeps a CanvasText edge.
      if (matchMedia("(forced-colors: active)").matches)
        await expect(getComputedStyle(alert).outlineStyle).toBe("solid");
    }
  },
};

/** An unbroken code or hash in the title and description wraps inside the Alert instead of widening the page. */
export const LongContent: Story = {
  name: "Long content",
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Alert variant="destructive">
        <AlertIcon />
        <AlertTitle>Could not publish WS-X90_Expanded_Control_Set_Revision_Seven_Final</AlertTitle>
        <AlertDescription>
          Digest sha256:4f1c9a2b7e0d3c6f8a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071 is already
          published.
        </AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector<HTMLElement>('[data-slot="alert"]')!;
    for (const part of ["alert-title", "alert-description"]) {
      const node = alert.querySelector<HTMLElement>(`[data-slot="${part}"]`)!;
      await expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth + 1);
      await expect(node.getBoundingClientRect().right).toBeLessThanOrEqual(
        alert.getBoundingClientRect().right + 1,
      );
    }
  },
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

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Alert variant="danger">
            <AlertIcon />
            <AlertTitle>Records could not be refreshed</AlertTitle>
            <AlertDescription>Showing the records loaded at 10:42.</AlertDescription>
            <AlertAction>
              <Button size="small">Try again</Button>
            </AlertAction>
          </Alert>
        }
        doText="What happened in a title, what it means in a line, and the way out as one small action beside it. The icon says danger as well as the colour."
        dont={
          <Stack space="space.100">
            <Alert variant="danger" role={undefined}>
              <AlertDescription>
                Something went wrong. Showing the last loaded records. Service unavailable
              </AlertDescription>
            </Alert>
            <Button isFullWidth>Retry loading</Button>
          </Stack>
        }
        dontText="A red bar with the server's words appended, and a page-wide button under it. Colour alone says it failed, and the retry is not part of the message."
      />
      <Pair
        do={
          <Alert role="note">
            <AlertTitle>Viewers cannot edit this program</AlertTitle>
            <AlertDescription>Ask an owner for the editor role.</AlertDescription>
          </Alert>
        }
        doText="A standing note is role note: read in place, never announced."
        dont={
          <Alert variant="danger" role="alert">
            <AlertIcon />
            <AlertTitle>Viewers cannot edit this program</AlertTitle>
          </Alert>
        }
        dontText="A permission note as a danger alert. It interrupts the page title on arrival and reads as a failure when nothing failed."
      />
    </Stack>
  ),
};
