import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Composer, type ComposerProps } from "../..";
import { Avatar, AvatarFallback, avatarHue, avatarInitials, Button } from "../../components";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

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

export const Suggestions: Story = {
  args: { getSuggestions, hint: "Type # to insert a topic." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.type(field, "See #");
    await expect(canvas.getByRole("listbox", { name: "Suggestions" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(field).toHaveValue("See [topic:2] ");
    await expect(field).toHaveFocus();
    await userEvent.type(field, "#");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await expect(field).toHaveValue("See [topic:2] #");
    await userEvent.type(field, "P");
    await userEvent.keyboard("{Tab}");
    await expect(field).toHaveValue("See [topic:2] [topic:1] ");
    await userEvent.type(field, "#");
    await userEvent.click(canvas.getByRole("option", { name: "Planning" }));
    await expect(field).toHaveValue("See [topic:2] [topic:1] [topic:1] ");
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

export const SaveRecovery: Story = {
  render: () => <SaveExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Recoverable draft" });
    await userEvent.click(field);
    await userEvent.keyboard("{Control>}{Enter}{Enter}{/Control}");
    await expect(canvas.getByText("Submissions: 1")).toBeVisible();
    await expect(field).toHaveAttribute("readonly");
    await userEvent.click(canvas.getByRole("button", { name: "Reject send" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Could not send. Try again.");
    await expect(field).toHaveValue("Draft one");
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await userEvent.click(canvas.getByRole("button", { name: "Replace draft" }));
    await userEvent.click(canvas.getByRole("button", { name: "Resolve send" }));
    await waitFor(() => expect(field).not.toHaveAttribute("readonly"));
    await expect(field).toHaveValue("Newer draft");
    await userEvent.click(canvas.getByRole("button", { name: "Send" }));
    await userEvent.click(canvas.getByRole("button", { name: "Resolve send" }));
    await waitFor(() => expect(field).toHaveValue(""));
    await expect(canvas.getByText("Submissions: 3")).toBeVisible();
  },
};

export const Dont: Story = {
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
