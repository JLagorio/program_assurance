import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { AlertTitle, Dot, Alert, Banner } from "../../components";
import { Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: { layout: "padded" },
  args: { tone: "warning", children: "The control catalogue moved to revision 5.2 overnight." },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every tone alone, with an action, and on a phone. A bar narrower than 42rem wraps its message, with the action after the last word; a wider one is one line. */
export const BannerMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Matrix
      rows={["information", "warning", "danger"] as const}
      cols={["message", "with an action", "on a phone, wrapped"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <div style={{ width: col === "on a phone, wrapped" ? 320 : 720 }}>
          <Banner
            tone={tone}
            action={col === "message" ? undefined : <a href="#action">See what changed</a>}
          >
            {col === "on a phone, wrapped"
              ? "The audit window closes in three days; evidence uploads lock after that."
              : "A message about the whole site, one line."}
          </Banner>
        </div>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const banners = canvasElement.querySelectorAll<HTMLElement>('[data-slot="banner"]');
    for (const banner of banners) {
      const message = banner.querySelector<HTMLElement>('[data-slot="banner-message"]')!;
      // Nothing is cut: on a phone the message wraps; on a wide bar this one fits its line.
      await expect(message.scrollWidth).toBeLessThanOrEqual(message.clientWidth + 1);
      await expect(message).not.toHaveAttribute("title");
    }
  },
};

export const Playground: Story = {};

/** The three messages a banner carries: something changed, something is about to, something is lost. */
export const Banners: Story = {
  render: () => (
    <Stack space="space.100">
      <Banner tone="information" action={<a href="#what-changed">See what changed</a>}>
        The control catalogue moved to revision 5.2 overnight.
      </Banner>
      <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
        The audit window closes in three days; evidence uploads lock after that.
      </Banner>
      <Banner tone="danger">
        We have lost the connection to the evidence store. Uploads are not being saved.
      </Banner>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [information, warning] = canvas.getAllByRole("status");
    await expect(information).toHaveTextContent("The control catalogue moved");
    await expect(warning).toHaveTextContent("The audit window closes");
    await expect(canvas.getByRole("alert")).toHaveTextContent("We have lost the connection");
    await expect(within(information!).getByRole("link", { name: "See what changed" })).toHaveClass(
      "underline",
    );
    await expect(information!.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};

const bannerRef = createRef<HTMLDivElement>();
const actionRef = createRef<HTMLButtonElement>();
const bannerClick = fn();
const actionClick = fn();

/** The outer message and the action each take their own native props, refs and handlers; a root click handler hears the action's click. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.100">
      <Banner
        ref={bannerRef}
        id="catalogue-notice"
        role="region"
        aria-label="Catalogue notice"
        data-revision="5.2"
        className="px-300"
        style={{ maxWidth: 720 }}
        onClick={bannerClick}
        tone="information"
        action={
          <button
            ref={actionRef}
            id="catalogue-action"
            type="button"
            className="font-semibold"
            style={{ letterSpacing: "0.01em" }}
            onClick={actionClick}
          >
            See what changed
          </button>
        }
      >
        The control catalogue moved to revision 5.2 overnight.
      </Banner>
      <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
        The audit window closes in three days; evidence uploads lock after that.
      </Banner>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    bannerClick.mockClear();
    actionClick.mockClear();
    const canvas = within(canvasElement);
    const notice = canvas.getByRole("region", { name: "Catalogue notice" });
    const action = within(notice).getByRole("button", { name: "See what changed" });
    await expect(bannerRef.current).toBe(notice);
    await expect(actionRef.current).toBe(action);
    await expect(notice).toHaveAttribute("id", "catalogue-notice");
    await expect(notice).toHaveAttribute("data-revision", "5.2");
    await expect(notice).toHaveClass("px-300");
    await expect(notice).not.toHaveClass("px-200");
    await expect(notice).toHaveStyle({ maxWidth: "720px" });
    await expect(action).toHaveAttribute("id", "catalogue-action");
    await expect(action).toHaveClass("font-semibold", "underline");
    await expect(action.style.letterSpacing).toBe("0.01em");
    await userEvent.click(action);
    await userEvent.keyboard("{Enter}");
    await expect(action).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await expect(action).toHaveFocus();
    await expect(getComputedStyle(action).outlineStyle).toBe("solid");
    // The ring takes the banner's text colour; forced colours replace both with system colours.
    if (!matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(action).outlineColor).toBe(getComputedStyle(action).color);
    await expect(actionClick).toHaveBeenCalledTimes(2);
    await expect(bannerClick).toHaveBeenCalledTimes(2);
    await expect(notice.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};

const long =
  "The audit window closes in three days; evidence uploads lock after that, and findings can no longer be closed.";

/** A message too long for its bar. On a bar 42rem wide or more it is one line, cut with an ellipsis, and the whole message is its title; on a phone it wraps, and the bar grows with it. */
export const LongMessage: Story = {
  name: "Long message",
  render: () => (
    <Stack space="space.200">
      <div style={{ width: 720, maxWidth: "100%" }} data-testid="wide">
        <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
          {long}
        </Banner>
      </div>
      <div style={{ width: 320, maxWidth: "100%" }} data-testid="phone">
        <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
          {long}
        </Banner>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const part = (id: string, slot: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
    const phone = part("phone", "banner");
    // The phone's bar wraps: taller than one 48px line, nothing cut, the action in the flow.
    await expect(phone.getBoundingClientRect().height).toBeGreaterThan(48);
    const phoneMessage = part("phone", "banner-message");
    await expect(phoneMessage.scrollWidth).toBeLessThanOrEqual(phoneMessage.clientWidth + 1);
    await expect(within(phone).getByRole("link", { name: "Ask for an extension" })).toBeVisible();
    // The wide bar is one line; where it cuts the message, the message is its own title.
    const wide = part("wide", "banner");
    const wideMessage = part("wide", "banner-message");
    if (wide.getBoundingClientRect().width >= 672) {
      await expect(wide.getBoundingClientRect().height).toBe(48);
      if (wideMessage.scrollWidth > wideMessage.clientWidth + 1)
        await expect(wideMessage).toHaveAttribute("title", long);
    }
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Banner tone="danger">
            We have lost the connection to the evidence store. Uploads are not being saved.
          </Banner>
        }
        doText="About the whole site: every reader, every screen."
        dont={<Banner tone="warning">CTRL-0412 is due on Friday.</Banner>}
        dontText="About one record. That is an Alert in the record's rail, or a row in a table."
      />
      <Pair
        do={
          <div style={{ maxWidth: 480 }}>
            <Alert tone="success" role="status">
              <AlertTitle>
                <span aria-hidden="true" className="flex h-250 shrink-0 items-center">
                  <Dot tone={"success"} />
                </span>
                <span className="min-w-0 break-words">{"Snapshot submitted"}</span>
              </AlertTitle>
            </Alert>
          </div>
        }
        doText="Feedback after an act is a toast or an Alert; it says what happened."
        dont={<Banner tone="information">Your snapshot was submitted successfully.</Banner>}
        dontText="Feedback in the banner. There is no success banner: a banner is gone when it is no longer true, and feedback is always true."
      />
      <Pair
        do={
          <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
            The audit window closes in three days; evidence uploads lock after that.
          </Banner>
        }
        doText="One line and one action."
        dont={
          <Banner
            tone="warning"
            action={<a href="#renew">Ask for an extension, or read the audit calendar</a>}
          >
            The audit window closes in three days. After that evidence uploads lock, findings cannot
            be closed, and the package snapshot is what the assessor sees.
          </Banner>
        }
        dontText="Two sentences and two actions in one link. A wide bar cuts it and a phone gives it the top of the screen; the reader gets neither."
      />
    </Stack>
  ),
};
