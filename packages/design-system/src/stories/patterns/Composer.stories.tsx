import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { interact } from "../_lib/interact";
import { Composer, type ComposerProps } from "../..";
import {
  Avatar,
  AvatarFallback,
  avatarHue,
  avatarInitials,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components";
import { Box, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Composer",
  component: Composer,
  parameters: { layout: "padded" },
  args: { label: "Message", onSubmit: () => undefined },
} satisfies Meta<typeof Composer>;
export default meta;
type Story = StoryObj<typeof meta>;

// This example's adapter owns its # trigger and serialization. Neither is built into Composer.
const getSuggestions: ComposerProps["getSuggestions"] = (text, caret) => {
  const start = text.lastIndexOf("#", caret - 1);
  if (start < 0 || /\s/.test(text.slice(start + 1, caret))) return null;
  return {
    start,
    end: caret,
    items: [
      { id: "topic-1", label: "Planning", insertText: "[topic:1] " },
      { id: "topic-2", label: "Delivery", insertText: "[topic:2] " },
    ].filter((item) =>
      item.label.toLowerCase().includes(text.slice(start + 1, caret).toLowerCase()),
    ),
  };
};

export const ComposerMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Composer label="Message" onSubmit={() => undefined} />
      <Composer
        label="Reply"
        defaultValue="Thanks for the update."
        leading={
          <Avatar
            size="small"
            aria-hidden="true"
            hue={avatarHue("Sam Rivera")}
            title={"Sam Rivera"}
          >
            <AvatarFallback>{avatarInitials("Sam Rivera", 2)}</AvatarFallback>
          </Avatar>
        }
        onSubmit={() => undefined}
      />
      <Composer
        label="Comment"
        submitLabel="Comment"
        defaultValue="Confirm the review cadence with Sam before Friday."
        leading={
          <Avatar
            size="medium"
            variant="bold"
            aria-hidden="true"
            hue={avatarHue("Sam Rivera")}
            title={"Sam Rivera"}
          >
            <AvatarFallback>{avatarInitials("Sam Rivera", 2)}</AvatarFallback>
          </Avatar>
        }
        actions={
          <Button size="small" variant="secondary">
            Task
          </Button>
        }
        onSubmit={() => undefined}
      />
      <Composer
        label="Unavailable composer"
        defaultValue="Draft retained"
        disabled
        onSubmit={() => undefined}
      />
    </Stack>
  ),
};

/** The announcer's lines so far: what a screen reader has heard. */
const heard = (doc: Document) =>
  [...doc.querySelectorAll('[data-slot="announcer-region"]')].map((region) => region.textContent);

/** A `#` adapter: Up and Down choose, Enter or Tab inserts, Escape closes the list. The list floats in the kit's positioner, and each list and each move is announced. */
export const Suggestions: Story = {
  args: {
    // The adapter owns its # trigger and what each topic inserts; Composer owns neither.
    getSuggestions: (text, caret) => {
      const start = text.lastIndexOf("#", caret - 1);
      if (start < 0 || /\s/.test(text.slice(start + 1, caret))) return null;
      const query = text.slice(start + 1, caret).toLowerCase();
      return {
        start,
        end: caret,
        items: [
          { id: "topic-1", label: "Planning", insertText: "[topic:1] " },
          { id: "topic-2", label: "Delivery", insertText: "[topic:2] " },
        ].filter((item) => item.label.toLowerCase().includes(query)),
      };
    },
    hint: "Type # to insert a topic.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const page = within(doc.body);
    const field = canvas.getByRole("textbox", { name: "Message" });
    await expect(field).toHaveAttribute("aria-haspopup", "listbox");
    await userEvent.type(field, "See #");
    const list = await page.findByRole("listbox", { name: "Suggestions" });
    // It fades in, so it is visible once its entry has begun.
    await waitFor(() => expect(list).toBeVisible());
    // Portaled, so no clipping ancestor of the composer can cut it.
    await expect(canvasElement.contains(list)).toBe(false);
    await expect(field).toHaveAttribute("aria-controls", list.id);
    await waitFor(() =>
      expect(heard(doc).join(" ")).toContain(
        "2 suggestions. Up and Down to choose, Enter or Tab to insert.",
      ),
    );
    await userEvent.keyboard("{ArrowDown}");
    const delivery = page.getByRole("option", { name: "Delivery" });
    await expect(delivery).toHaveAttribute("aria-selected", "true");
    await expect(delivery).toHaveAttribute("data-highlighted");
    await expect(field).toHaveAttribute("aria-activedescendant", delivery.id);
    await waitFor(() => expect(heard(doc).join(" ")).toContain("Delivery, 2 of 2"));
    await userEvent.keyboard("{Enter}");
    await expect(field).toHaveValue("See [topic:2] ");
    await expect(field).toHaveFocus();
    await userEvent.type(field, "#");
    await page.findByRole("listbox", { name: "Suggestions" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
    await expect(field).toHaveValue("See [topic:2] #");
    await userEvent.type(field, "P");
    await page.findByRole("option", { name: "Planning" });
    await userEvent.keyboard("{Tab}");
    await expect(field).toHaveValue("See [topic:2] [topic:1] ");
    await userEvent.type(field, "#");
    await userEvent.click(await page.findByRole("option", { name: "Planning" }));
    await expect(field).toHaveValue("See [topic:2] [topic:1] [topic:1] ");
    await expect(field).toHaveFocus();
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());

    // Shift+Tab leaves the field as it always does: nothing is inserted, and the list closes.
    await userEvent.type(field, "#");
    await page.findByRole("listbox", { name: "Suggestions" });
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect(field).not.toHaveFocus();
    await expect(field).toHaveValue("See [topic:2] [topic:1] [topic:1] #");
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
  },
};

/** At the foot of a panel that clips its content: the list is portaled, so the panel cannot cut it, and it opens above the field where the window ends below it, never taller than the room it has. */
export const SuggestionsAtTheEdge: Story = {
  tags: ["!manifest"],
  parameters: { layout: "fullscreen" },
  render: () => (
    <Box className="flex h-screen flex-col justify-end overflow-hidden p-200">
      <Composer
        label="Reply"
        getSuggestions={getSuggestions}
        hint="Type # to insert a topic."
        onSubmit={() => undefined}
      />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const field = canvas.getByRole("textbox", { name: "Reply" });
    await userEvent.type(field, "#");
    const list = await page.findByRole("listbox", { name: "Suggestions" });
    await waitFor(() => {
      const listBox = list.getBoundingClientRect();
      const fieldBox = field.getBoundingClientRect();
      expect(listBox.bottom).toBeLessThanOrEqual(fieldBox.top + 1);
      expect(listBox.top).toBeGreaterThanOrEqual(0);
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
  },
};

/** In a Dialog: the portaled list belongs to the dialog, so choosing an option leaves the dialog open, and Escape closes the list before the dialog. */
export const SuggestionsInDialog: Story = {
  tags: ["!manifest"],
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Add a note</DialogTrigger>
      <DialogContent width="medium">
        <DialogHeader>
          <DialogTitle>Note</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Composer label="Note" getSuggestions={getSuggestions} onSubmit={() => undefined} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add a note" }));
    const dialog = await page.findByRole("dialog", { name: "Note" });
    const field = within(dialog).getByRole("textbox", { name: "Note" });
    await userEvent.type(field, "#");
    await userEvent.click(await page.findByRole("option", { name: "Delivery" }));
    await expect(field).toHaveValue("[topic:2] ");
    await expect(dialog).toBeVisible();
    await userEvent.type(field, "#");
    await page.findByRole("listbox", { name: "Suggestions" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
    await expect(dialog).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  },
};

function SaveExample() {
  const [value, setValue] = useState("Draft one");
  const [calls, setCalls] = useState(0);
  const pending = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  return (
    <Stack space="space.200">
      <Composer
        label="Recoverable draft"
        value={value}
        onValueChange={setValue}
        onSubmit={() => {
          setCalls((count) => count + 1);
          return new Promise<void>((resolve, reject) => {
            pending.current = { resolve, reject: () => reject(new Error("Unavailable")) };
          });
        }}
      />
      <Text>Submissions: {calls}</Text>
      <Button onClick={() => pending.current?.resolve()}>Resolve send</Button>
      <Button onClick={() => pending.current?.reject()}>Reject send</Button>
      <Button onClick={() => setValue("Newer draft")}>Replace draft</Button>
    </Stack>
  );
}

/** A rejected send keeps the draft and says so under the field, which it describes, and at once to a screen reader. A newer controlled draft survives an older request. After a send lands, focus is back in the field for the next message. */
export const SaveRecovery: Story = {
  render: () => <SaveExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const field = canvas.getByRole("textbox", { name: "Recoverable draft" });
    // The keyboard hint is for a keyboard: where any pointer is coarse it is left out.
    if (matchMedia("(any-pointer: coarse)").matches)
      await expect(canvas.queryByText("Ctrl/⌘ + Enter to send")).toBeNull();
    else await expect(field).toHaveAccessibleDescription("Ctrl/⌘ + Enter to send");
    await userEvent.click(field);
    await userEvent.keyboard("{Control>}{Enter}{Enter}{/Control}");
    await expect(canvas.getByText("Submissions: 1")).toBeVisible();
    await expect(field).toHaveAttribute("readonly");
    await userEvent.click(canvas.getByRole("button", { name: "Reject send" }));
    await expect(await canvas.findByText("Could not send. Try again.")).toBeVisible();
    await expect(field).toHaveAccessibleDescription(/Could not send\. Try again\./);
    await waitFor(() => expect(heard(doc).join(" ")).toContain("Could not send. Try again."));
    await expect(field).toHaveValue("Draft one");
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await userEvent.click(canvas.getByRole("button", { name: "Replace draft" }));
    await userEvent.click(canvas.getByRole("button", { name: "Resolve send" }));
    await waitFor(() => expect(field).not.toHaveAttribute("readonly"));
    await expect(field).toHaveValue("Newer draft");

    // Send from the keyboard: once it lands, the draft clears, Send is unavailable, and focus is
    // back in the field rather than lost with it.
    const send = canvas.getByRole("button", { name: "Send" });
    await interact(() => send.focus());
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Submissions: 3")).toBeVisible();
    await interact(() => canvas.getByRole("button", { name: "Resolve send" }).click());
    await waitFor(() => expect(field).toHaveValue(""));
    await waitFor(() => expect(field).toHaveFocus());
  },
};

/** `errorMessage` as a function of the rejection shows the server's reason. */
export const ServerReason: Story = {
  render: () => (
    <Composer
      label="Comment"
      defaultValue="Looks good to me."
      onSubmit={() => Promise.reject(new Error("The task is closed to comments."))}
      errorMessage={(error) =>
        error instanceof Error ? `Not sent: ${error.message}` : "Not sent."
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await expect(
      await canvas.findByText("Not sent: The task is closed to comments."),
    ).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: "Comment" })).toHaveValue("Looks good to me.");
  },
};

export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={<Composer label="Reply" hint="Saved when Send succeeds." onSubmit={() => undefined} />}
      doText="Describe the actual save boundary and preserve a failed draft."
      dont={
        <Composer
          label="Misleading reply"
          hint="Everything is saved automatically."
          onSubmit={() => undefined}
        />
      }
      dontText="Do not promise autosave when the composer only submits on request."
    />
  ),
};
export const Playground: Story = {};

export const SynchronousReplacement: Story = {
  render: function Example() {
    const [value, setValue] = useState("First draft");
    return (
      <Composer
        label="Immediate replacement"
        value={value}
        onValueChange={setValue}
        onSubmit={() => setValue("Next draft")}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Immediate replacement" })).toHaveValue(
        "Next draft",
      ),
    );
  },
};
