import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, FileText, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";
import { fn } from "storybook/test";

import {
  Attachment,
  Button,
  Dialog,
  Progress,
  Spinner,
  type AttachmentState,
} from "../../components";
import { Box, Stack, Text } from "../../primitives";
import preview from "../_assets/attachment-preview.svg";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Attachment",
  component: Attachment,
  parameters: { layout: "padded" },
  args: { state: "done", size: "medium", orientation: "horizontal" },
} satisfies Meta<typeof Attachment>;
export default meta;
type Story = StoryObj<typeof meta>;

const states: AttachmentState[] = ["idle", "uploading", "processing", "error", "done"];
const descriptions: Record<AttachmentState, string> = {
  idle: "PDF · 2.4 MB · Ready to upload",
  uploading: "Uploading · 64%",
  processing: "Checking the document…",
  error: "Upload failed. Try again.",
  done: "PDF · 2.4 MB",
};

export const AttachmentMatrix: Story = {
  render: () => (
    <Matrix
      rows={states}
      cols={["xsmall", "small", "medium"] as const}
      rowLabel="state"
      render={(state, size) => (
        <Attachment state={state} size={size} className="w-layout-rail">
          <Attachment.Media aria-hidden="true">
            {state === "uploading" || state === "processing" ? (
              <Spinner isDecorative />
            ) : (
              <FileText />
            )}
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>quarterly-report.pdf</Attachment.Title>
            <Attachment.Description>{descriptions[state]}</Attachment.Description>
          </Attachment.Content>
        </Attachment>
      )}
    />
  ),
};

/** Each part is optional. Keep both file identity and useful metadata visible. */
export const Playground: Story = {
  render: (args) => (
    <Attachment {...args}>
      <Attachment.Media aria-hidden="true">
        <FileText />
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title>quarterly-report.pdf</Attachment.Title>
        <Attachment.Description>{descriptions[args.state ?? "done"]}</Attachment.Description>
      </Attachment.Content>
    </Attachment>
  ),
};

export const Images: Story = {
  render: () => (
    <Attachment.Group aria-label="Image attachments" role="group" tabIndex={0}>
      <Attachment orientation="vertical">
        <Attachment.Media variant="image">
          <img src={preview} alt="Evidence workflow from collection through review to archive" />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>evidence-workflow.svg</Attachment.Title>
          <Attachment.Description>SVG · 2 KB</Attachment.Description>
        </Attachment.Content>
        <Attachment.Trigger asChild>
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            aria-label="Open evidence-workflow.svg in a new tab"
          />
        </Attachment.Trigger>
      </Attachment>
      <Attachment>
        <Attachment.Media variant="image">
          <img src={preview} alt="" />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>evidence-workflow.svg</Attachment.Title>
          <Attachment.Description>Compact image preview · 2 KB</Attachment.Description>
        </Attachment.Content>
      </Attachment>
    </Attachment.Group>
  ),
  play: async ({ canvasElement }) => {
    const { expect, within, waitFor } = await import("storybook/test");
    const image = within(canvasElement).getByRole("img", {
      name: "Evidence workflow from collection through review to archive",
    }) as HTMLImageElement;
    await waitFor(() => expect(image.complete && image.naturalWidth > 0).toBe(true));
    const media = image.parentElement!;
    const card = media.parentElement!;
    await expect(media.clientWidth).toBeGreaterThan(200);
    await expect(Math.abs(media.clientWidth - media.clientHeight)).toBeLessThanOrEqual(1);
    await expect(media.scrollWidth).toBeLessThanOrEqual(media.clientWidth);
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

const onAttachmentSubmit = fn();
const onUnavailablePreview = fn();

function PreviewExample() {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const focusRestoredFile = useRef(false);
  return (
    <form onSubmit={event => { event.preventDefault(); onAttachmentSubmit(); }}>
    <Stack space="space.200" className="w-layout-list max-w-full">
      {!removed ? (
        <Attachment className="w-full">
          <Attachment.Media aria-hidden="true">
            <FileText />
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>quarterly-report.pdf</Attachment.Title>
            <Attachment.Description>PDF · 2.4 MB</Attachment.Description>
          </Attachment.Content>
          <Attachment.Trigger
            ref={(node) => {
              if (node && focusRestoredFile.current) {
                node.focus();
                focusRestoredFile.current = false;
              }
            }}
            aria-label="Preview quarterly-report.pdf"
            onClick={() => setOpen(true)}
          />
          <Attachment.Actions>
            <Attachment.Action
              label="Remove quarterly-report.pdf"
              icon={<X />}
              onClick={() => setRemoved(true)}
            />
          </Attachment.Actions>
        </Attachment>
      ) : (
        <Stack space="space.100">
          <Text role="status">Attachment removed.</Text>
          <Box>
            <Button
              autoFocus
              onClick={() => {
                focusRestoredFile.current = true;
                setRemoved(false);
              }}
            >
              Undo removal
            </Button>
          </Box>
        </Stack>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="quarterly-report.pdf"
        description="Attachment preview"
      >
        <Text>
          The quarterly report summarizes the evidence collected and the items awaiting review.
        </Text>
      </Dialog>
    </Stack>
    </form>
  );
}

/** The card opens a preview; its separate remove action leaves the preview closed. */
export const WithActions: Story = {
  render: () => <PreviewExample />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Preview quarterly-report.pdf" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(page.getByRole("dialog", { name: "quarterly-report.pdf" })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(onAttachmentSubmit).not.toHaveBeenCalled();
    await expect(canvasElement.querySelector("button button, a button, button a")).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Remove quarterly-report.pdf" })).toHaveFocus();
    const action = canvas.getByRole("button", { name: "Remove quarterly-report.pdf" });
    await waitFor(() => {
      const rect = action.getBoundingClientRect();
      expect(action.contains(canvasElement.ownerDocument.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))).toBe(true);
    });
    await userEvent.keyboard(" ");
    await expect(onAttachmentSubmit).not.toHaveBeenCalled();
    await expect(page.queryByRole("dialog")).toBeNull();
    await expect(canvas.getByRole("status")).toHaveTextContent("Attachment removed.");
    await expect(canvas.getByRole("button", { name: "Undo removal" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Undo removal" }));
    await expect(
      canvas.getByRole("button", { name: "Preview quarterly-report.pdf" }),
    ).toHaveFocus();
  },
};

export const UploadStates: Story = {
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const uploading = canvas.getByText("quarterly-report.pdf").closest('[data-slot="attachment"]')!;
    await expect(uploading).toHaveAttribute("aria-busy", "true");
    const unavailable = canvas.getByRole("link", { name: "Preview restricted-report.pdf" });
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).toHaveAttribute("tabindex", "-1");
    await userEvent.click(unavailable);
    unavailable.focus();
    await userEvent.keyboard("{Enter}");
    await expect(onUnavailablePreview).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Retry supporting-evidence.pdf" }));
    await expect(canvas.getByText("Queued for upload")).toBeVisible();
  },
  render: () => (
    <Stack space="space.150" className="w-layout-list max-w-full">
      <Attachment state="uploading" className="w-full">
        <Attachment.Media aria-hidden="true">
          <Spinner isDecorative />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>quarterly-report.pdf</Attachment.Title>
          <Attachment.Description>Uploading · 64%</Attachment.Description>
          <Progress value={64} size="small" label="Uploading quarterly-report.pdf" />
        </Attachment.Content>
      </Attachment>
      <Attachment state="done" className="w-full">
        <Attachment.Media aria-hidden="true">
          <Check />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>review-notes.pdf</Attachment.Title>
          <Attachment.Description>Uploaded · 840 KB</Attachment.Description>
        </Attachment.Content>
      </Attachment>
      <RetryExample />
      <Attachment className="w-full">
        <Attachment.Content>
          <Attachment.Title>restricted-report.pdf</Attachment.Title>
          <Attachment.Description>Preview available after access is approved.</Attachment.Description>
        </Attachment.Content>
        <Attachment.Trigger asChild disabled onClick={onUnavailablePreview}>
          <a href="#restricted-report" aria-label="Preview restricted-report.pdf" />
        </Attachment.Trigger>
      </Attachment>
    </Stack>
  ),
};

function RetryExample() {
  const [retried, setRetried] = useState(false);
  return (
    <Attachment state={retried ? "idle" : "error"} className="w-full">
      <Attachment.Media aria-hidden="true">
        <FileText />
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title>supporting-evidence.pdf</Attachment.Title>
        <Attachment.Description>
          {retried ? "Queued for upload" : "Connection lost. Retry the upload."}
        </Attachment.Description>
      </Attachment.Content>
      <Attachment.Actions>
        <Attachment.Action
          label="Retry supporting-evidence.pdf"
          icon={<RotateCcw />}
          isLoading={retried}
          onClick={() => setRetried(true)}
        />
      </Attachment.Actions>
    </Attachment>
  );
}

export const Group: Story = {
  render: () => (
    <Box className="w-layout-list max-w-full">
      <Attachment.Group role="group" aria-label="Supporting documents">
        {["evidence-workflow.svg", "review-process.svg", "archive-flow.svg"].map((name) => (
          <Attachment key={name} size="small" className="w-layout-rail">
            <Attachment.Media aria-hidden="true">
              <FileText />
            </Attachment.Media>
            <Attachment.Content>
              <Attachment.Title>{name}</Attachment.Title>
              <Attachment.Description>Open document</Attachment.Description>
            </Attachment.Content>
            <Attachment.Trigger asChild>
              <a href={preview} target="_blank" rel="noreferrer" aria-label={`Open ${name}`} />
            </Attachment.Trigger>
          </Attachment>
        ))}
      </Attachment.Group>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Supporting documents" });
    canvas.getByRole("link", { name: "Open evidence-workflow.svg" }).focus();
    await userEvent.tab();
    await userEvent.tab();
    const last = canvas.getByRole("link", { name: "Open archive-flow.svg" });
    await expect(last).toHaveFocus();
    await expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(
      group.getBoundingClientRect().right,
    );
  },
};
