import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../../components";
import { announce, Announcer, type AnnouncePoliteness } from "../../lib/announce";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

type Args = { message: string; politeness: AnnouncePoliteness };

const meta = {
  title: "Components/Announcer",
  parameters: { layout: "padded" },
  args: { message: "Changes saved", politeness: "polite" },
  argTypes: {
    message: { control: "text", description: "What `announce` says." },
    politeness: {
      control: "inline-radio",
      options: ["polite", "assertive"],
      description: "The region it goes to.",
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;

/** The lines currently in a region: what a screen reader was just told. */
const lines = (root: ParentNode, politeness: AnnouncePoliteness) =>
  Array.from(
    root.querySelectorAll(`[data-slot="announcer-region"][data-politeness="${politeness}"] > div`),
    (line) => line.textContent,
  );

/** A visible copy of what was said, so the story shows what a screen reader hears. */
function Transcript({ heard }: { heard: string[] }) {
  return (
    <Stack space="space.050">
      <Text size="small" color="color.text.subtle">
        Heard, newest last
      </Text>
      {heard.length ? (
        heard.map((line, i) => <Text key={i}>{line}</Text>)
      ) : (
        <Text color="color.text.subtle">Nothing yet</Text>
      )}
    </Stack>
  );
}

/**
 * One Announcer, mounted once, and `announce` from anywhere. Saying the same words again is heard
 * again: each message is a new line in the region, and each line leaves after a few seconds.
 */
export const Playground: Story = {
  render: function Render({
    message,
    politeness,
  }: {
    message: string;
    politeness: AnnouncePoliteness;
  }) {
    const [heard, setHeard] = useState<string[]>([]);
    return (
      <Stack space="space.200">
        <Announcer />
        <Inline space="space.100">
          <Button
            onClick={() => {
              announce(message, { politeness });
              setHeard((was) => [...was, message]);
            }}
          >
            Announce
          </Button>
        </Inline>
        <Transcript heard={heard} />
      </Stack>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    // The regions exist before any message does, so assistive technology has registered them.
    const polite = canvasElement.querySelector('[data-politeness="polite"]');
    const assertive = canvasElement.querySelector('[data-politeness="assertive"]');
    await expect(polite).toHaveAttribute("aria-live", "polite");
    await expect(polite).toHaveAttribute("role", "log");
    await expect(assertive).toHaveAttribute("aria-live", "assertive");
    await expect(lines(canvasElement, "polite")).toEqual([]);
    const button = canvas.getByRole("button", { name: "Announce" });
    await userEvent.click(button);
    await expect(lines(canvasElement, "polite")).toEqual(["Changes saved"]);
    // The same words twice are two lines, so the second is heard too.
    await userEvent.click(button);
    await expect(lines(canvasElement, "polite")).toEqual(["Changes saved", "Changes saved"]);
    await expect(lines(canvasElement, "assertive")).toEqual([]);
    // Visually hidden: nothing of the regions takes space on the page.
    const announcer = canvasElement.querySelector<HTMLElement>('[data-slot="announcer"]');
    await expect(announcer?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

/**
 * Polite for an outcome the reader can take in when they pause: a save, a result count. Assertive
 * interrupts, so it is for the one failure that stops the task.
 */
export const Politeness: Story = {
  render: function Render() {
    const [heard, setHeard] = useState<string[]>([]);
    const say = (message: string, politeness: AnnouncePoliteness) => {
      announce(message, { politeness });
      setHeard((was) => [...was, `${message} (${politeness})`]);
    };
    return (
      <Stack space="space.200">
        <Announcer />
        <Inline space="space.100" shouldWrap>
          <Button onClick={() => say("3 of 24 records", "polite")}>Search</Button>
          <Button onClick={() => say("The file could not be uploaded. Try again.", "assertive")}>
            Upload a file that fails
          </Button>
        </Inline>
        <Transcript heard={heard} />
      </Stack>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Search" }));
    await userEvent.click(canvas.getByRole("button", { name: "Upload a file that fails" }));
    await expect(lines(canvasElement, "polite")).toEqual(["3 of 24 records"]);
    await expect(lines(canvasElement, "assertive")).toEqual([
      "The file could not be uploaded. Try again.",
    ]);
  },
};

/**
 * Without a mounted Announcer, `announce` creates the regions at the end of the body and speaks
 * once they have settled, so a part can announce before the product mounts one. On the server it
 * does nothing.
 */
export const WithoutAnAnnouncer: Story = {
  name: "Without an Announcer",
  args: { message: "Filters cleared" },
  beforeEach: () => () => {
    for (const el of document.querySelectorAll('[data-slot="announcer"][data-fallback]'))
      el.remove();
  },
  render: function Render({
    message,
    politeness,
  }: {
    message: string;
    politeness: AnnouncePoliteness;
  }) {
    const [heard, setHeard] = useState<string[]>([]);
    return (
      <Stack space="space.200">
        <Inline space="space.100">
          <Button
            onClick={() => {
              announce(message, { politeness });
              setHeard((was) => [...was, message]);
            }}
          >
            Clear filters
          </Button>
        </Inline>
        <Transcript heard={heard} />
      </Stack>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="announcer"]')).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    const fallback = await waitFor(() => {
      const el = document.body.querySelector<HTMLElement>(
        ':scope > [data-slot="announcer"][data-fallback]',
      );
      expect(el).not.toBeNull();
      return el!;
    });
    await waitFor(() => expect(lines(fallback, "polite")).toEqual(["Filters cleared"]));
    // Blank messages are dropped rather than announced as silence.
    announce("   ");
    await expect(lines(fallback, "polite")).toEqual(["Filters cleared"]);
  },
};

/** A modal dialog hides the page from assistive technology but keeps its live regions exposed, so a message sent from inside the dialog is still heard. */
export const InADialog: Story = {
  name: "In a dialog",
  render: function Render() {
    return (
      <>
        <Announcer />
        <Dialog>
          <DialogTrigger render={<Button />}>Rename the view</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename the view</DialogTitle>
              <DialogDescription>The new name is announced when it is saved.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
              <Button variant="primary" onClick={() => announce("View renamed")}>
                Rename view
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Rename the view" }));
    const dialog = await body.findByRole("dialog", { name: "Rename the view" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Rename view" }));
    await expect(lines(canvasElement, "polite")).toEqual(["View renamed"]);
    // Nothing between the region and the document is hidden or inert while the dialog is open.
    const region = canvasElement.querySelector<HTMLElement>('[data-politeness="polite"]');
    for (let el = region; el; el = el.parentElement) {
      await expect(el).not.toHaveAttribute("aria-hidden", "true");
      await expect(el.inert).toBe(false);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** Announce the outcome once, in words. A status element inserted with its text already inside is often not read, and one alert per field fires several at once. */
export const Dont: Story = {
  tags: ["!manifest"],
  name: "Don't",
  render: function Render() {
    return (
      <Pair
        do={
          <Stack space="space.150">
            <Announcer />
            <Input aria-label="Title" placeholder="Title" />
            <Inline space="space.100">
              <Button onClick={() => announce("2 fields need attention")}>Check the form</Button>
            </Inline>
          </Stack>
        }
        doText="One polite summary through announce, after the check has run."
        dont={
          <Stack space="space.150">
            <Text color="color.text.danger">Title is required.</Text>
            <Text color="color.text.danger">Owner is required.</Text>
          </Stack>
        }
        dontText="A role=alert on every error, each inserted with its text: several interruptions at once, or none."
      />
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Check the form" }));
    await expect(lines(canvasElement, "polite")).toEqual(["2 fields need attention"]);
  },
};
