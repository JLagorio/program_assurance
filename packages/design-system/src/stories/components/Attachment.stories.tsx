import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Download, FileText, RotateCcw, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import {
  Attachment,
  AttachmentLink,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
  Spinner,
  Table,
  formatFileSize,
  type AttachmentState,
} from "../../components";

import { announce } from "../../lib/announce";
import { DOWNLOAD_REVOKE_DELAY, downloadText } from "../../lib/download";
import { Box, Stack, Text } from "../../primitives";
import preview from "../_assets/attachment-preview.svg";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Attachment",
  component: Attachment,
  subcomponents: { AttachmentMedia, AttachmentTitle, AttachmentTrigger, AttachmentLink },
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

/** What the page's polite live region said last. */
const heard = () =>
  Array.from(
    document.querySelectorAll('[data-slot="announcer-region"][data-politeness="polite"] > div'),
    (line) => line.textContent ?? "",
  ).at(-1);

export const AttachmentMatrix: Story = {
  tags: ["!manifest"],
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

/** A caller's attributes, class and ref reach each part, and the part's `data-slot` comes last, so a stray attribute never renames the part a selector or a test looks for. */
export const NativeAttributes: Story = {
  render: () => (
    <Attachment data-testid="report" data-slot="report-card" className="max-w-layout-measure">
      <Attachment.Media aria-hidden="true" data-testid="report-media" variant="icon">
        <FileText />
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title title="quarterly-report.pdf">quarterly-report.pdf</Attachment.Title>
        <Attachment.Description>PDF · 2.4 MB</Attachment.Description>
      </Attachment.Content>
    </Attachment>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId("report");
    await expect(card).toHaveAttribute("data-slot", "attachment");
    await expect(card).toHaveClass("max-w-layout-measure");
    const media = canvas.getByTestId("report-media");
    await expect(media).toHaveAttribute("data-slot", "attachment-media");
    await expect(media).toHaveAttribute("data-variant", "icon");
  },
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
          <Attachment.Description>SVG · 2 kB</Attachment.Description>
        </Attachment.Content>
        <Attachment.Link
          href={preview}
          target="_blank"
          rel="noreferrer"
          aria-label="Open evidence-workflow.svg in a new tab"
        />
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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onAttachmentSubmit();
      }}
    >
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
          onOpenChange={(next) => {
            if (!next) {
              setOpen(false);
            }
          }}
        >
          <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
            <DialogHeader>
              <DialogTitle>quarterly-report.pdf</DialogTitle>
              <DialogDescription>Attachment preview</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
              <Text>
                The quarterly report summarizes the evidence collected and the items awaiting
                review.
              </Text>
            </div>
          </DialogContent>
        </Dialog>
      </Stack>
    </form>
  );
}

/** The card opens a preview; its separate remove action leaves the preview closed. */
export const WithActions: Story = {
  render: () => <PreviewExample />,
  play: async ({ canvasElement }) => {
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
      expect(
        action.contains(
          canvasElement.ownerDocument.elementFromPoint(
            rect.x + rect.width / 2,
            rect.y + rect.height / 2,
          ),
        ),
      ).toBe(true);
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

/**
 * Uploading with Progress and a Cancel named for the file; done; an error with a Retry; an
 * unavailable preview. Each result is also said through `announce`, the page's polite status, since
 * `aria-busy` marks work in progress but announces nothing when it ends.
 */
export const UploadStates: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const uploading = canvas.getByText("quarterly-report.pdf").closest('[data-slot="attachment"]')!;
    await expect(uploading).toHaveAttribute("aria-busy", "true");
    await expect(
      canvas.getByRole("progressbar", { name: "Uploading quarterly-report.pdf" }),
    ).toBeInTheDocument();
    const unavailable = canvas.getByRole("button", { name: "Preview restricted-report.pdf" });
    await expect(unavailable).toBeDisabled();
    unavailable.click();
    await expect(onUnavailablePreview).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Retry supporting-evidence.pdf" }));
    await expect(canvas.getByText("Queued for upload")).toBeVisible();
    await waitFor(() => expect(heard()).toBe("Queued supporting-evidence.pdf for upload."));
    // Cancel stops the upload, says so, and hands focus to the action that replaces it.
    await userEvent.click(
      canvas.getByRole("button", { name: "Cancel uploading quarterly-report.pdf" }),
    );
    await expect(uploading).not.toHaveAttribute("aria-busy");
    await expect(canvas.getByText("Upload cancelled")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Upload quarterly-report.pdf again" }),
    ).toHaveFocus();
    await waitFor(() => expect(heard()).toBe("Cancelled the upload of quarterly-report.pdf."));
  },
  render: () => (
    <Stack space="space.150" className="w-layout-list max-w-full">
      <CancelExample />
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
          <Attachment.Description>
            Preview available after access is approved.
          </Attachment.Description>
        </Attachment.Content>
        <Attachment.Trigger
          disabled
          onClick={onUnavailablePreview}
          aria-label="Preview restricted-report.pdf"
        />
      </Attachment>
    </Stack>
  ),
};

function CancelExample() {
  const [cancelled, setCancelled] = useState(false);
  const again = useRef<HTMLButtonElement>(null);
  return (
    <Attachment state={cancelled ? "idle" : "uploading"} className="w-full">
      <Attachment.Media aria-hidden="true">
        {cancelled ? <FileText /> : <Spinner isDecorative />}
      </Attachment.Media>
      <Attachment.Content>
        <Attachment.Title>quarterly-report.pdf</Attachment.Title>
        <Attachment.Description>
          {cancelled ? "Upload cancelled" : "Uploading · 64%"}
        </Attachment.Description>
        {cancelled ? null : (
          <Progress value={64} size="small" aria-label="Uploading quarterly-report.pdf" />
        )}
      </Attachment.Content>
      <Attachment.Actions>
        {cancelled ? (
          <Attachment.Action
            ref={again}
            label="Upload quarterly-report.pdf again"
            icon={<Upload />}
            onClick={() => setCancelled(false)}
          />
        ) : (
          <Attachment.Action
            label="Cancel uploading quarterly-report.pdf"
            icon={<X />}
            onClick={() => {
              setCancelled(true);
              announce("Cancelled the upload of quarterly-report.pdf.");
              // The Cancel button goes with the upload; its replacement takes focus.
              requestAnimationFrame(() => again.current?.focus());
            }}
          />
        )}
      </Attachment.Actions>
    </Attachment>
  );
}

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
          onClick={() => {
            setRetried(true);
            announce("Queued supporting-evidence.pdf for upload.");
          }}
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
            <Attachment.Link
              href={preview}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${name}`}
            />
          </Attachment>
        ))}
      </Attachment.Group>
    </Box>
  ),
  play: async ({ canvasElement }) => {
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

const scans = [
  "acas-vulnerability-scan-ws-x90-2026-09-01.pdf",
  "acas-vulnerability-scan-ws-x90-2026-09-15.pdf",
];

/**
 * A name too long for the card is cut in the middle: the extension and the characters before it
 * stay, so two scans that differ only in their date stay apart. The whole name is read once, and
 * the Link's `title` shows it on hover. On a right-to-left page a name keeps its own direction.
 */
export const LongNames: Story = {
  name: "Long names",
  render: () => (
    <Stack space="space.100" className="w-layout-rail max-w-full">
      {scans.map((name) => (
        <Attachment key={name} size="small" className="w-full">
          <Attachment.Media aria-hidden="true">
            <FileText />
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>{name}</Attachment.Title>
            <Attachment.Description>PDF · 1.2 MB</Attachment.Description>
          </Attachment.Content>
          <Attachment.Link
            href={preview}
            target="_blank"
            rel="noreferrer"
            title={name}
            aria-label={`Open ${name} in a new tab`}
          />
        </Attachment>
      ))}
      <Attachment size="small" className="w-full">
        <Attachment.Media aria-hidden="true">
          <FileText />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title truncate="end">{scans[0]}</Attachment.Title>
          <Attachment.Description>truncate="end" loses the date</Attachment.Description>
        </Attachment.Content>
      </Attachment>
      <Box dir="rtl">
        <Attachment size="small" className="w-full">
          <Attachment.Media aria-hidden="true">
            <FileText />
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>{scans[1]}</Attachment.Title>
            <Attachment.Description>PDF · 1.2 MB</Attachment.Description>
          </Attachment.Content>
        </Attachment>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, date] of [
      [scans[0]!, "2026-09-01.pdf"],
      [scans[1]!, "2026-09-15.pdf"],
    ] as const) {
      const card = canvas
        .getByRole("link", { name: `Open ${name} in a new tab` })
        .closest<HTMLElement>('[data-slot="attachment"]')!;
      const tail = within(card).getByText(date);
      await expect(tail).toBeVisible();
      await expect(tail.getBoundingClientRect().right).toBeLessThanOrEqual(
        card.getBoundingClientRect().right,
      );
      // The start is cut with an ellipsis; the whole name is in the card's text once, unbroken.
      const head = tail.previousElementSibling as HTMLElement;
      await expect(head.scrollWidth).toBeGreaterThan(head.clientWidth);
      await expect(within(card).getByText(name)).toHaveClass("sr-only");
      await expect(tail.parentElement).toHaveAttribute("aria-hidden", "true");
      // Copying the selected title gives the name once, as written: not the spoken copy as well,
      // and no line break between the two visible pieces.
      const selection = window.getSelection()!;
      selection.selectAllChildren(card.querySelector('[data-slot="attachment-title"]')!);
      const copy = new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });
      tail.dispatchEvent(copy);
      await expect(copy.defaultPrevented).toBe(true);
      await expect(copy.clipboardData!.getData("text/plain")).toBe(name);
      selection.removeAllRanges();
    }
    // On a right-to-left page an English name keeps its own direction: the kept end is on the right.
    const rtl = canvasElement.querySelector<HTMLElement>('[dir="rtl"] [data-truncate="middle"]')!;
    const [rtlHead, rtlTail] = Array.from(
      rtl.querySelectorAll<HTMLElement>('[aria-hidden="true"] > span'),
    );
    await expect(rtlTail!.textContent).toBe("2026-09-15.pdf");
    await expect(rtlTail!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      rtlHead!.getBoundingClientRect().right - 1,
    );
  },
};

const onDownloadLink = fn();

/**
 * `Attachment.Link` is the card-wide link: an anchor with the Trigger's overlay, for a file the
 * server holds (`href` and `download`) or a router link through `render`. For a file the page
 * builds, a Trigger calls `downloadText` or `downloadBlob`, which revoke the object URL well after
 * the click. The card takes the hover surface while either is hovered.
 */
export const LinksAndDownloads: Story = {
  name: "Links and downloads",
  render: () => (
    <Stack space="space.150" className="w-layout-list max-w-full">
      <Attachment className="w-full">
        <Attachment.Media aria-hidden="true">
          <FileText />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>evidence-workflow.svg</Attachment.Title>
          <Attachment.Description>SVG · 2 kB</Attachment.Description>
        </Attachment.Content>
        <Attachment.Link
          href={preview}
          download="evidence-workflow.svg"
          aria-label="Download evidence-workflow.svg"
          onClick={(event) => {
            event.preventDefault();
            onDownloadLink();
          }}
        />
        <Attachment.Actions>
          <Attachment.Action label="Remove evidence-workflow.svg" icon={<X />} />
        </Attachment.Actions>
      </Attachment>
      <Attachment className="w-full">
        <Attachment.Media aria-hidden="true">
          <Download />
        </Attachment.Media>
        <Attachment.Content>
          <Attachment.Title>review-findings.csv</Attachment.Title>
          <Attachment.Description>CSV · built from the table on this page</Attachment.Description>
        </Attachment.Content>
        <Attachment.Trigger
          aria-label="Download review-findings.csv"
          onClick={() =>
            downloadText("Name,Status\nAccess review,Open\n", "review-findings.csv", {
              type: "text/csv;charset=utf-8",
              bom: true,
            })
          }
        />
      </Attachment>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Download evidence-workflow.svg" });
    await expect(link).toHaveAttribute("data-slot", "attachment-link");
    await expect(link).toHaveAttribute("download", "evidence-workflow.svg");
    await expect(link).toHaveAttribute("href", preview);
    await userEvent.click(link);
    await expect(onDownloadLink).toHaveBeenCalledTimes(1);
    // The remove action sits above the link and stays its own target.
    const remove = canvas.getByRole("button", { name: "Remove evidence-workflow.svg" });
    const rect = remove.getBoundingClientRect();
    await expect(
      remove.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)),
    ).toBe(true);

    const create = spyOn(URL, "createObjectURL");
    const revoke = spyOn(URL, "revokeObjectURL");
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    try {
      await userEvent.click(canvas.getByRole("button", { name: "Download review-findings.csv" }));
      await expect(click).toHaveBeenCalledTimes(1);
      const anchor = click.mock.contexts[0] as HTMLAnchorElement;
      await expect(anchor.download).toBe("review-findings.csv");
      // The anchor leaves the document at once; the URL stays readable until well after the click.
      await expect(anchor.isConnected).toBe(false);
      await expect(create).toHaveBeenCalledTimes(1);
      const blob = create.mock.calls[0]![0] as Blob;
      await expect(blob.type).toBe("text/csv;charset=utf-8");
      await expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 3)).toEqual(
        new Uint8Array([0xef, 0xbb, 0xbf]),
      );
      await expect(revoke).not.toHaveBeenCalled();
      await expect(DOWNLOAD_REVOKE_DELAY).toBeGreaterThanOrEqual(10_000);
    } finally {
      create.mockRestore();
      revoke.mockRestore();
      click.mockRestore();
    }
  },
};

const sizes = [0, 512, 1_500, 840_000, 2_400_000, 50_000_000, 999_950, 3_200_000_000];

/**
 * `formatFileSize` says a byte count the way a reader does, in decimal units and the locale's
 * numerals: the size in an Attachment's Description and the limit in a DropZone's message.
 */
export const FileSizes: Story = {
  name: "File sizes",
  render: () => (
    <Box className="w-layout-list max-w-full">
      <Table>
        <thead>
          <tr>
            <Table.Header>Bytes</Table.Header>
            <Table.Header>en-US</Table.Header>
            <Table.Header>de-DE</Table.Header>
          </tr>
        </thead>
        <tbody>
          {sizes.map((bytes) => (
            <Table.Row key={bytes}>
              <Table.Cell>{bytes}</Table.Cell>
              <Table.Cell>{formatFileSize(bytes)}</Table.Cell>
              <Table.Cell>{formatFileSize(bytes, { locale: "de-DE" })}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Box>
  ),
  play: async () => {
    await expect(formatFileSize(0)).toBe("0 bytes");
    await expect(formatFileSize(1)).toBe("1 byte");
    await expect(formatFileSize(512)).toBe("512 bytes");
    await expect(formatFileSize(1_500)).toBe("1.5 kB");
    await expect(formatFileSize(840_000)).toBe("840 kB");
    await expect(formatFileSize(2_400_000)).toBe("2.4 MB");
    await expect(formatFileSize(50_000_000)).toBe("50 MB");
    // A value that would round to 1,000 of one unit is one of the next.
    await expect(formatFileSize(999_950)).toBe("1 MB");
    await expect(formatFileSize(2_400_000, { locale: "de-DE" })).toBe("2,4 MB");
    await expect(formatFileSize(Number.NaN)).toBe("0 bytes");
  },
};

/** A failure says so in words; a danger border alone says nothing to a reader who cannot see it or tell the colour. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Attachment state="error" className="w-full">
          <Attachment.Media aria-hidden="true">
            <FileText />
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>site-survey.pdf</Attachment.Title>
            <Attachment.Description>
              Could not upload. The connection was lost.
            </Attachment.Description>
          </Attachment.Content>
          <Attachment.Actions>
            <Attachment.Action label="Retry site-survey.pdf" icon={<RotateCcw />} />
            <Attachment.Action label="Remove site-survey.pdf" icon={<X />} />
          </Attachment.Actions>
        </Attachment>
      }
      doText="The reason in the Description, and a Retry and a Remove named for the file."
      dont={
        <Attachment state="error" className="w-full">
          <Attachment.Media aria-hidden="true">
            <FileText />
          </Attachment.Media>
          <Attachment.Content>
            <Attachment.Title>site-survey.pdf</Attachment.Title>
            <Attachment.Description>PDF · 1.2 MB</Attachment.Description>
          </Attachment.Content>
        </Attachment>
      }
      dontText="The error state with the usual metadata: only the red border says it failed."
    />
  ),
};
