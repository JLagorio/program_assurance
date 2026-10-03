import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";

import { CopyButton, Id, KeyValue } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/CopyButton",
  component: CopyButton,
  parameters: { layout: "padded" },
  args: { text: "npm run local:start" },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const openTip = () => document.querySelector('[data-slot="tooltip-content"][data-open]');
const status = (root: HTMLElement) =>
  root.ownerDocument.querySelector<HTMLElement>('[data-copy-button-status=""]')!;

/**
 * The play stubs the clipboard so the check is deterministic; the story afterwards writes to the
 * real one.
 */
function stubClipboard(result: "resolve" | "reject" = "resolve") {
  return spyOn(navigator.clipboard, "writeText").mockImplementation(() =>
    result === "resolve"
      ? Promise.resolve()
      : Promise.reject(new DOMException("Write permission denied.", "NotAllowedError")),
  );
}

const copied = fn();

/**
 * The labelled form: "Copy" beside something the reader will paste. After a click the icon becomes
 * a check, "Copied" shows in a tooltip for two seconds and a polite status says it; the label and
 * the width stay as they were.
 */
export const Labelled: Story = {
  args: { onCopied: fn() },
  render: (args) => (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <Text as="span" size="small">
        <Id>npm run local:start</Id>
      </Text>
      <CopyButton text="npm run local:start" size="small" onCopied={args.onCopied} />
    </Inline>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const write = stubClipboard();
    try {
      const button = canvas.getByRole("button", { name: "Copy" });
      await expect(button).toHaveAttribute("data-slot", "copy-button");
      // The typeface swaps in when it loads; measure the width once it has.
      await document.fonts.ready;
      const width = button.getBoundingClientRect().width;
      // Its name is on screen, so hover and focus open no tooltip.
      await userEvent.hover(button);
      await expect(openTip()).toBeNull();
      await userEvent.click(button);
      await waitFor(() => expect(args.onCopied).toHaveBeenCalledWith("npm run local:start"));
      await expect(write).toHaveBeenCalledWith("npm run local:start");
      await waitFor(() => expect(openTip()).toHaveTextContent("Copied"));
      await expect(status(canvasElement)).toHaveTextContent("Copied");
      await expect(status(canvasElement)).toHaveAttribute("role", "status");
      await expect(button).toHaveAccessibleName("Copy");
      await expect(button.getBoundingClientRect().width).toBe(width);
      await expect(button).toHaveFocus();
      // A second copy while the first result shows is a new status line, so it is heard again.
      const firstLine = status(canvasElement).firstElementChild;
      await userEvent.click(button);
      await waitFor(() => expect(args.onCopied).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(status(canvasElement).firstElementChild).not.toBe(firstLine));
      await expect(status(canvasElement)).toHaveTextContent("Copied");
      // The result goes away by itself.
      await waitFor(() => expect(openTip()).toBeNull(), { timeout: 3000 });
      await expect(status(canvasElement)).toHaveTextContent("");
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * The icon-only form, beside an identifier: `label` names what is copied and shows on hover and
 * focus, then "Copied" takes its place for a moment.
 */
export const IdCopy: Story = {
  tags: ["!manifest"],
  name: "Copy an id",
  render: () => (
    <Stack space="space.200" className="max-w-layout-measure">
      <Specimens title="Beside an identifier in a line">
        <Inline space="space.050" alignBlock="center">
          <Text as="span" size="small">
            <Id>CTRL-0412</Id>
          </Text>
          <CopyButton text="CTRL-0412" label="Copy ID" variant="subtle" onCopied={copied} />
        </Inline>
      </Specimens>
      <Specimens title="In a details row">
        <KeyValue label="Record id" wrap>
          <Inline space="space.050" alignBlock="center">
            <Id className="break-all">7f3c9a2e-41b8-4d0f-9e6a-2c51d8b0f4a7</Id>
            <CopyButton
              text="7f3c9a2e-41b8-4d0f-9e6a-2c51d8b0f4a7"
              label="Copy record id"
              variant="subtle"
            />
          </Inline>
        </KeyValue>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    copied.mockClear();
    const write = stubClipboard();
    try {
      const button = canvas.getByRole("button", { name: "Copy ID" });
      await expect(button.getBoundingClientRect().width).toBe(28);
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await waitFor(() => expect(openTip()).toHaveTextContent("Copy ID"));
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(openTip()).toHaveTextContent("Copied"));
      await expect(copied).toHaveBeenCalledWith("CTRL-0412");
      await expect(button).toHaveAccessibleName("Copy ID");
      await expect(button).toHaveFocus();
      await expect(canvas.getByRole("button", { name: "Copy record id" })).toBeInTheDocument();
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * When the browser refuses the write (no permission, an insecure page), the button says so: an
 * alert icon, "Could not copy" in the tooltip for four seconds, the status message, and
 * `onCopyError`. The reader never pastes stale contents thinking they copied.
 */
export const CopyFails: Story = {
  name: "When copying fails",
  args: { onCopyError: fn() },
  render: (args) => (
    <Inline space="space.100" alignBlock="center">
      <CopyButton text="CTRL-0412" label="Copy ID" onCopyError={args.onCopyError} />
      <CopyButton text="npm run local:start" onCopyError={args.onCopyError} />
    </Inline>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const write = stubClipboard("reject");
    try {
      const icon = canvas.getByRole("button", { name: "Copy ID" });
      await userEvent.click(icon);
      await waitFor(() => expect(openTip()).toHaveTextContent("Could not copy"));
      await expect(args.onCopyError).toHaveBeenCalledTimes(1);
      await expect(args.onCopyError).toHaveBeenCalledWith(expect.any(DOMException));
      await expect(icon.querySelector("svg")).toHaveClass("icon-danger");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(openTip()).toBeNull());
      const labelled = canvas.getByRole("button", { name: "Copy" });
      await userEvent.click(labelled);
      await waitFor(() => expect(openTip()).toHaveTextContent("Could not copy"));
      await expect(args.onCopyError).toHaveBeenCalledTimes(2);
      await waitFor(() =>
        expect(
          [...canvasElement.ownerDocument.querySelectorAll('[data-copy-button-status=""]')].some(
            (region) => region.textContent === "Could not copy",
          ),
        ).toBe(true),
      );
    } finally {
      write.mockRestore();
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
          <Inline space="space.050" alignBlock="center">
            <Id>CTRL-0412</Id>
            <CopyButton text="CTRL-0412" label="Copy ID" variant="subtle" />
          </Inline>
        }
        doText="Name what is copied: several Copy buttons on one screen need names a screen reader can tell apart."
        dont={
          <Inline space="space.050" alignBlock="center">
            <Id>CTRL-0412</Id>
            <CopyButton text="CTRL-0412" label="Copy" variant="subtle" />
          </Inline>
        }
        dontText="A bare Copy beside every identifier leaves a list of identical buttons."
      />
      <Pair
        do={<CopyButton text="https://example.test/programs/atlas" size="small" />}
        doText="The label says the operation and stays put; the result shows in the tooltip and the status message."
        dont={
          <CopyButton text="https://example.test/programs/atlas" size="small" variant="primary" />
        }
        dontText="A primary Copy competes with the page's main action. Copying is secondary or subtle."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { text: "npm run local:start", variant: "secondary", size: "medium" },
};
