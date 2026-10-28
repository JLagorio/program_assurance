import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button, Id, Prose } from "../../components";
import { ReviewThread, type ReviewThreadEntry } from "../../patterns/review-thread";
import { Composer } from "../../patterns/composer";
import { Inline, Text } from "../../primitives";

const meta = {
  title: "Patterns/ReviewThread",
  component: ReviewThread,
  parameters: { layout: "padded" },
  args: {
    historyLabel: "Discussion history",
    status: "Open",
    messages: [
      {
        id: "comment-1",
        author: "Sam Rivera",
        dateTime: "2026-10-14T15:00:00Z",
        body: <Prose>Can we clarify the retention period?</Prose>,
      },
    ],
  },
} satisfies Meta<typeof ReviewThread>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => (
    <ReviewThread
      {...args}
      context={<Prose label="Quoted context">Records are retained for seven years.</Prose>}
      composer={
        <Composer label="Reply to this discussion" submitLabel="Reply" onSubmit={() => {}} />
      }
    />
  ),
};

const nativeRef = createRef<HTMLDivElement>();
function Discussion() {
  const [resolved, setResolved] = useState(false);
  const [draft, setDraft] = useState("");
  const [parent, setParent] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [messages, setMessages] = useState<ReviewThreadEntry[]>([
    {
      id: "comment-1",
      author: "Sam Rivera",
      body: <Prose>Can we clarify the retention period?</Prose>,
    },
  ]);
  const attempted = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  return (
    <ReviewThread
      ref={nativeRef}
      data-testid="thread"
      historyLabel="Discussion history"
      status={resolved ? "Resolved" : "Open"}
      statusAction={{
        label: resolved ? "Reopen discussion" : "Resolve discussion",
        onSelect: () => setResolved((value) => !value),
      }}
      context={<Prose label="Quoted context">Records are retained for seven years.</Prose>}
      replyTarget={
        parent
          ? {
              label: `Replying to ${parent}`,
              cancel: { label: "Cancel reply target", onSelect: () => setParent(null) },
            }
          : undefined
      }
      composer={
        <Composer
          ref={composerRef}
          label="Reply to this discussion"
          submitLabel="Reply"
          value={draft}
          onValueChange={setDraft}
          errorMessage="The connection failed. Your reply is preserved; retry."
          onSubmit={async (body) => {
            if (!attempted.current) {
              attempted.current = true;
              throw new Error("Disconnected");
            }
            setMessages((current) => [
              ...current,
              {
                id: `reply-${current.length}`,
                author: "Alex Chen",
                meta: parent ? `Reply to ${parent}` : undefined,
                body: <Prose>{body}</Prose>,
              },
            ]);
            setParent(null);
            setPage(0);
          }}
        />
      }
      messages={
        page
          ? [
              {
                id: "older",
                author: "Morgan Gray",
                body: <Prose>Earlier discussion context.</Prose>,
              },
            ]
          : messages.map((entry) => ({
              ...entry,
              reply: {
                label: "Reply",
                accessibleLabel: `Reply to ${entry.author}`,
                onSelect: () => {
                  setParent(String(entry.author));
                  composerRef.current?.focus();
                },
              },
            }))
      }
      footer={
        <Inline space="space.100" shouldWrap>
          <Button variant="subtle" size="small" onClick={() => setPage((value) => (value ? 0 : 1))}>
            {page ? "Newer messages" : "Earlier messages"}
          </Button>
          <Text size="small">Page {page + 1} of 2</Text>
        </Inline>
      }
    />
  );
}

export const RepliesAndResolution: Story = {
  tags: ["!manifest"],
  render: () => <Discussion />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const field = canvas.getByRole("textbox", { name: "Reply to this discussion" });
    await expect(nativeRef.current).toBe(canvas.getByTestId("thread"));
    await user.click(canvas.getByRole("button", { name: "Reply to Sam Rivera" }));
    await expect(field).toHaveFocus();
    await expect(canvas.getByText("Replying to Sam Rivera")).toBeVisible();
    await user.type(field, "Keep the documented period.");
    await user.click(canvas.getByRole("button", { name: "Cancel reply target" }));
    await expect(field).toHaveValue("Keep the documented period.");
    await user.click(canvas.getByRole("button", { name: "Reply to Sam Rivera" }));
    await user.click(canvas.getByRole("button", { name: "Reply" }));
    await expect(
      await canvas.findByText("The connection failed. Your reply is preserved; retry."),
    ).toHaveTextContent("Your reply is preserved");
    await expect(field).toHaveValue("Keep the documented period.");
    await user.click(canvas.getByRole("button", { name: "Reply" }));
    await waitFor(() => expect(field).toHaveValue(""));
    await expect(field).toHaveFocus();
    await expect(canvas.getByText("Reply to Sam Rivera", { exact: true })).toBeVisible();
    await user.type(field, "Another draft");
    await user.click(canvas.getByRole("button", { name: "Earlier messages" }));
    await expect(canvas.getByText("Earlier discussion context.")).toBeVisible();
    await expect(field).toHaveValue("Another draft");
    await user.click(canvas.getByRole("button", { name: "Newer messages" }));
    await user.click(canvas.getByRole("button", { name: "Resolve discussion" }));
    await expect(canvas.getByText("Resolved", { exact: true })).toBeVisible();
    await expect(field).toHaveValue("Another draft");
    await user.click(canvas.getByRole("button", { name: "Reopen discussion" }));
    await expect(canvas.getByText("Open", { exact: true })).toBeVisible();
  },
};

export const ReadOnlyAndEvents: Story = {
  args: {
    status: "Resolved",
    messages: [
      { id: "comment", author: "Sam Rivera", body: <Prose>The period is seven years.</Prose> },
      {
        id: "resolved",
        author: "Alex Chen",
        meta: "Resolved",
        body: <Prose>The source confirms this.</Prose>,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("textbox")).not.toBeInTheDocument();
    await expect(
      within(canvas.getByRole("list", { name: "Discussion history" })).getAllByRole("listitem"),
    ).toHaveLength(2);
  },
};

export const Pending: Story = {
  args: {
    statusAction: { label: "Resolve discussion", onSelect: () => {}, pending: true },
    composer: (
      <Composer
        label="Reply to this discussion"
        defaultValue="A retained reply"
        disabled
        onSubmit={() => {}}
      />
    ),
    messages: [
      {
        id: "comment",
        author: "Sam Rivera",
        body: <Prose>The period is seven years.</Prose>,
        reply: {
          label: "Reply",
          accessibleLabel: "Reply to Sam Rivera",
          onSelect: () => {},
          disabled: true,
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Resolve discussion" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.getByRole("textbox")).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Reply to Sam Rivera" })).toBeDisabled();
  },
};

export const LongContent: Story = {
  args: {
    context: (
      <Prose label="Quoted context">
        An unusually long source identifier: <Id className="break-all">{"a".repeat(80)}</Id>.
      </Prose>
    ),
    messages: [
      {
        id: "long",
        author: "Alexandra Maria Fernandez representing the international documentation committee",
        meta: "Reply to the earlier discussion about retaining the original source during migration",
        body: (
          <Prose>
            Die Aufbewahrungsfrist für die Dokumentation bleibt unverändert. The original document
            and this discussion are independently preserved.
          </Prose>
        ),
      },
    ],
  },
};
