import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Attachment,
  Button,
  DropZone,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Progress,
  Spinner,
  formatFileSize,
} from "../../components";
import { announce } from "../../lib/announce";
import { downloadBlob } from "../../lib/download";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/DropZone",
  component: DropZone,
  parameters: { layout: "padded" },
  args: {
    accept: "application/pdf,image/*",
    maxSize: 5_000_000,
    multiple: true,
    disabled: false,
    onSelect: fn(),
    onReject: fn(),
  },
  render: (args) => (
    <Field className="w-layout-list max-w-full">
      <FieldLabel>Supporting files</FieldLabel>
      <DropZone {...args}>
        <FieldDescription>PDF or image, up to 5 MB each.</FieldDescription>
      </DropZone>
    </Field>
  ),
} satisfies Meta<typeof DropZone>;
export default meta;
type Story = StoryObj<typeof meta>;

const zoneOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-slot="drop-zone"]')!;
const inputOf = (root: HTMLElement) =>
  root.querySelector<HTMLInputElement>("[data-file-trigger-input]")!;

/** What the picker hands back when the reader chooses files. */
function choose(input: HTMLInputElement, files: File[]) {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** A drag of files from the desktop: enter, over, then a drop or a leave. */
function drag(
  target: HTMLElement,
  type: "dragenter" | "dragover" | "dragleave" | "drop",
  files: File[],
) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
  target.dispatchEvent(event);
  return event;
}

/** What the page's polite live region said last. */
const heard = () =>
  Array.from(
    document.querySelectorAll('[data-slot="announcer-region"][data-politeness="polite"] > div'),
    (line) => line.textContent ?? "",
  ).at(-1);

const file = (name: string, type: string, bytes = 2_400) =>
  new File([new Uint8Array(bytes)], name, { type });

/**
 * The controls: `accept`, `maxSize`, `multiple`, `disabled`. In a Field, the label names the
 * trigger and the FieldDescription among the children says the constraints and describes it.
 */
export const Playground: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Supporting files Choose files" });
    await expect(trigger).toHaveAccessibleDescription("PDF or image, up to 5 MB each.");
    await expect(canvas.getByText("Drag files here")).toBeVisible();
    // The zone's surface is not a second tab stop: the trigger is the only control.
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
    // For a pointer, a click on the surface opens the picker too; a click on the trigger opens it once.
    const input = inputOf(canvasElement);
    const open = fn();
    input.click = open;
    await userEvent.click(canvas.getByText("Drag files here"));
    await expect(open).toHaveBeenCalledTimes(1);
    await userEvent.click(trigger);
    await expect(open).toHaveBeenCalledTimes(2);
    const report = file("report.pdf", "application/pdf");
    choose(inputOf(canvasElement), [report]);
    await expect(args.onSelect).toHaveBeenCalledWith([report]);
    await expect(args.onReject).not.toHaveBeenCalled();
    await waitFor(() => expect(heard()).toBe("Added report.pdf."));
  },
};

/**
 * Dropped and chosen files go through the same check. A refused file is named with the reason,
 * in the zone as the Field's error: it describes the trigger, marks the Field invalid and is
 * announced with the result, since focus stays on the trigger. Accepted files in the same drop
 * still go through.
 */
export const Validation: Story = {
  args: { onSelect: fn(), onReject: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const zone = zoneOf(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Supporting files Choose files" });
    const photo = file("site.png", "image/png");
    const notes = file("notes.docx", "application/msword");
    const survey = file("survey.pdf", "application/pdf", 6_000_000);
    choose(inputOf(canvasElement), [photo, notes, survey]);
    await expect(args.onSelect).toHaveBeenCalledWith([photo]);
    await expect(args.onReject).toHaveBeenCalledWith([
      expect.objectContaining({ file: notes, reason: "type" }),
      expect.objectContaining({ file: survey, reason: "size" }),
    ]);
    await expect(canvas.getByText("notes.docx is not an accepted file type.")).toBeVisible();
    await expect(canvas.getByText("survey.pdf is larger than 5 MB.")).toBeVisible();
    await expect(zone).toHaveAttribute("data-invalid");
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      "PDF or image, up to 5 MB each. notes.docx is not an accepted file type. survey.pdf is larger than 5 MB.",
    );
    await waitFor(() =>
      expect(heard()).toBe(
        "Added site.png. notes.docx is not an accepted file type. survey.pdf is larger than 5 MB.",
      ),
    );
    // The next choice replaces the result: all accepted, the error and the invalid mark go.
    choose(inputOf(canvasElement), [file("plan.pdf", "application/pdf")]);
    await waitFor(() => expect(zone).not.toHaveAttribute("data-invalid"));
    await expect(canvas.queryByText("notes.docx is not an accepted file type.")).toBeNull();
    await expect(trigger).not.toHaveAttribute("aria-invalid");
  },
};

/**
 * A drag of files over the zone turns its border solid and its title to what a drop does, so the
 * state does not rest on colour; a drop checks the files as a choice does. Text dragged over it
 * changes nothing.
 */
export const DragAndDrop: Story = {
  name: "Drag and drop",
  args: { multiple: false, onSelect: fn(), onReject: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const zone = zoneOf(canvasElement);
    const scan = file("scan.pdf", "application/pdf");
    drag(zone, "dragenter", [scan]);
    await waitFor(() => expect(zone).toHaveAttribute("data-dragging"));
    await expect(canvas.getByText("Drop the file to add it")).toBeVisible();
    await expect(getComputedStyle(zone).borderStyle).toBe("solid");
    // Moving over a child and back is not a leave.
    drag(canvas.getByText("Drop the file to add it"), "dragenter", [scan]);
    drag(zone, "dragleave", [scan]);
    await expect(zone).toHaveAttribute("data-dragging");
    // Taking the dragover is what lets the drop land here instead of the browser opening the file.
    const over = drag(zone, "dragover", [scan]);
    await expect(over.defaultPrevented).toBe(true);
    drag(zone, "drop", [scan]);
    await waitFor(() => expect(zone).not.toHaveAttribute("data-dragging"));
    await expect(canvas.getByText("Drag a file here")).toBeVisible();
    await expect(args.onSelect).toHaveBeenCalledWith([scan]);
    // One file at a time: two dropped together are both refused, with one message.
    const pair = [scan, file("scan-2.pdf", "application/pdf")];
    drag(zone, "dragenter", pair);
    drag(zone, "drop", pair);
    await expect(args.onReject).toHaveBeenCalledWith([
      expect.objectContaining({ reason: "count" }),
      expect.objectContaining({ reason: "count" }),
    ]);
    await expect(canvas.getAllByText("Add one file at a time.")).toHaveLength(1);
    // A drag of text is not a drag of files.
    const text = new DataTransfer();
    text.setData("text/plain", "not a file");
    zone.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: text }),
    );
    await expect(zone).not.toHaveAttribute("data-dragging");
  },
};

/**
 * The zone while files are dragged over it, held there so the accessibility check reads its
 * colours: the title and the hint on the selected surface, in both modes.
 */
export const Dragging: Story = {
  args: { onSelect: fn(), onReject: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zone = zoneOf(canvasElement);
    drag(zone, "dragenter", [file("scan.pdf", "application/pdf")]);
    await waitFor(() => expect(zone).toHaveAttribute("data-dragging"));
    await expect(canvas.getByText("Drop the files to add them")).toBeVisible();
    await expect(getComputedStyle(zone).borderStyle).toBe("solid");
    await expect(canvas.getByText("PDF or image, up to 5 MB each.")).toBeVisible();
  },
};

const onAnyFile = fn();

/**
 * Outside a Field the trigger is named by its own words, and a refusal still describes it and
 * marks it invalid. The second zone accepts the any-file wildcard, which takes every file, as it
 * does on the file input.
 */
export const WithoutAField: Story = {
  name: "Without a Field",
  args: { onSelect: fn(), onReject: fn() },
  render: (args) => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <DropZone
        {...args}
        accept=".csv"
        maxSize={1_000_000}
        multiple={false}
        triggerLabel="Choose a CSV file"
      >
        <Text size="small" color="color.text.subtle">
          A CSV file, up to 1 MB.
        </Text>
      </DropZone>
      <DropZone accept="*/*" onSelect={onAnyFile} triggerLabel="Choose any file" />
    </Stack>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const [csvZone, anyZone] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="drop-zone"]'),
    );
    const trigger = canvas.getByRole("button", { name: "Choose a CSV file" });
    await expect(trigger).not.toHaveAttribute("aria-invalid");
    choose(inputOf(csvZone!), [file("register.csv", "text/csv", 2_000_000)]);
    await expect(args.onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "size" })]);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription("register.csv is larger than 1 MB.");
    const register = file("register.csv", "text/csv", 400_000);
    choose(inputOf(csvZone!), [register]);
    await expect(args.onSelect).toHaveBeenCalledWith([register]);
    await expect(trigger).not.toHaveAttribute("aria-invalid");
    await expect(trigger).not.toHaveAttribute("aria-describedby");

    const notes = file("notes.docx", "application/msword");
    choose(inputOf(anyZone!), [notes]);
    await expect(onAnyFile).toHaveBeenCalledWith([notes]);
    await expect(canvas.getByRole("button", { name: "Choose any file" })).not.toHaveAttribute(
      "aria-invalid",
    );
  },
};

/**
 * `disabled`, on the zone or its Field, refuses drops without letting the browser open the file and
 * disables the trigger. The zone's words stay legible; its border, icon and cursor say it is
 * unavailable.
 */
export const Disabled: Story = {
  args: { disabled: true, onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const zone = zoneOf(canvasElement);
    await expect(zone).toHaveAttribute("data-disabled");
    await expect(
      canvas.getByRole("button", { name: "Supporting files Choose files" }),
    ).toBeDisabled();
    const scan = file("scan.pdf", "application/pdf");
    drag(zone, "dragenter", [scan]);
    await expect(zone).not.toHaveAttribute("data-dragging");
    // The zone still takes the drag and the drop, so the browser does not open the file, and
    // does nothing with it.
    const over = drag(zone, "dragover", [scan]);
    await expect(over.defaultPrevented).toBe(true);
    const dropped = drag(zone, "drop", [scan]);
    await expect(dropped.defaultPrevented).toBe(true);
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

type Upload = {
  id: number;
  file: File;
  attempt: number;
  state: "uploading" | "error" | "done";
  progress: number;
  message?: string | undefined;
};

/** A stand-in upload service: 25% a step; a name starting "unstable" fails half way on its first attempt. */
function useFakeUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const running = timers.current;
    return () => running.forEach((timer) => clearTimeout(timer));
  }, []);
  const patch = (id: number, change: Partial<Upload>) =>
    setUploads((list) =>
      list.map((upload) => (upload.id === id ? { ...upload, ...change } : upload)),
    );
  const run = (id: number, file: File, attempt: number) => {
    let progress = 0;
    const step = () => {
      progress += 25;
      if (file.name.startsWith("unstable") && attempt === 1 && progress >= 50) {
        timers.current.delete(id);
        patch(id, { state: "error", message: "The connection was lost. Retry the upload." });
        announce(`Could not upload ${file.name}.`);
        return;
      }
      if (progress >= 100) {
        timers.current.delete(id);
        patch(id, { state: "done", progress: 100 });
        announce(`Uploaded ${file.name}.`);
        return;
      }
      patch(id, { progress });
      timers.current.set(id, setTimeout(step, 60));
    };
    timers.current.set(id, setTimeout(step, 60));
  };
  const stop = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  };
  return { uploads, setUploads, patch, run, stop };
}

const onAttach = fn();

function UploadFlowExample() {
  const { uploads, setUploads, patch, run, stop } = useFakeUploads();
  const [problem, setProblem] = useState<string>();
  const [attached, setAttached] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const next = useRef(1);
  const remove = (upload: Upload, said: string) => {
    stop(upload.id);
    setUploads((list) => list.filter((item) => item.id !== upload.id));
    announce(said);
    // The row took focus with it; the trigger is the control that survives.
    trigger.current?.focus();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const failed = uploads.find((upload) => upload.state === "error");
    const issue = !uploads.length
      ? "Add at least one file."
      : uploads.some((upload) => upload.state === "uploading")
        ? "Wait until every file has uploaded."
        : failed
          ? `Retry or remove ${failed.file.name} before you attach the files.`
          : undefined;
    setProblem(issue);
    if (issue) {
      trigger.current?.focus();
      return;
    }
    setAttached(true);
    onAttach(uploads.map((upload) => upload.file.name));
    announce(`Attached ${uploads.length} files.`);
  };
  return (
    <form noValidate onSubmit={submit} className="w-layout-list max-w-full">
      <Stack space="space.300">
        {/* No `invalid` of its own: a FieldError that shows, the caller's or the zone's, marks the Field. */}
        <Field required>
          <FieldLabel>Supporting files</FieldLabel>
          <DropZone
            accept="application/pdf,image/*"
            maxSize={5_000_000}
            multiple
            triggerRef={trigger}
            onSelect={(files) => {
              setProblem(undefined);
              setAttached(false);
              const added = files.map((file) => ({
                id: next.current++,
                file,
                attempt: 1,
                state: "uploading" as const,
                progress: 0,
              }));
              setUploads((list) => [...list, ...added]);
              for (const upload of added) run(upload.id, upload.file, 1);
            }}
          >
            <FieldDescription>PDF or image, up to 5 MB each.</FieldDescription>
          </DropZone>
          {problem ? <FieldError>{problem}</FieldError> : null}
        </Field>
        {uploads.length ? (
          <Stack as="ul" role="list" aria-label="Files" space="space.100">
            {uploads.map((upload) => {
              const { file } = upload;
              return (
                <li key={upload.id}>
                  <Attachment state={upload.state} className="w-full">
                    <Attachment.Media aria-hidden="true">
                      {upload.state === "uploading" ? <Spinner isDecorative /> : <FileText />}
                    </Attachment.Media>
                    <Attachment.Content>
                      <Attachment.Title>{file.name}</Attachment.Title>
                      <Attachment.Description>
                        {upload.state === "uploading"
                          ? `Uploading · ${upload.progress}%`
                          : upload.state === "error"
                            ? upload.message
                            : `${file.type === "application/pdf" ? "PDF" : "Image"} · ${formatFileSize(file.size)}`}
                      </Attachment.Description>
                      {upload.state === "uploading" ? (
                        <Progress
                          size="small"
                          value={upload.progress}
                          aria-label={`Uploading ${file.name}`}
                        />
                      ) : null}
                    </Attachment.Content>
                    {upload.state === "done" ? (
                      <Attachment.Trigger
                        aria-label={`Download ${file.name}`}
                        onClick={() => downloadBlob(file, file.name)}
                      />
                    ) : null}
                    <Attachment.Actions>
                      {upload.state === "uploading" ? (
                        <Attachment.Action
                          label={`Cancel uploading ${file.name}`}
                          icon={<X />}
                          onClick={() => remove(upload, `Cancelled ${file.name}.`)}
                        />
                      ) : null}
                      {upload.state === "error" ? (
                        <Attachment.Action
                          label={`Retry ${file.name}`}
                          icon={<RotateCcw />}
                          onClick={() => {
                            const attempt = upload.attempt + 1;
                            patch(upload.id, {
                              state: "uploading",
                              progress: 0,
                              attempt,
                              message: undefined,
                            });
                            run(upload.id, file, attempt);
                          }}
                        />
                      ) : null}
                      {upload.state !== "uploading" ? (
                        <Attachment.Action
                          label={`Remove ${file.name}`}
                          icon={<X />}
                          onClick={() => remove(upload, `Removed ${file.name}.`)}
                        />
                      ) : null}
                    </Attachment.Actions>
                  </Attachment>
                </li>
              );
            })}
          </Stack>
        ) : null}
        <Inline space="space.150" alignBlock="center" rowSpace="space.100" shouldWrap>
          <Button type="submit" variant="primary">
            Attach files
          </Button>
          {attached ? <Text color="color.text.subtle">Files attached.</Text> : null}
        </Inline>
      </Stack>
    </form>
  );
}

/**
 * The whole flow. Accepted files become Attachment rows that upload with Progress and a Cancel;
 * a failure keeps the row with the reason, a Retry and a Remove, each named for the file; a done
 * row downloads. The primary stays enabled and says what is missing on submit; every result is
 * announced, and a removal returns focus to the trigger.
 */
export const UploadFlow: Story = {
  name: "Upload flow",
  render: () => <UploadFlowExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", {
      name: "Supporting files (required) Choose files",
    });
    const submit = canvas.getByRole("button", { name: "Attach files" });
    // Nothing added: the primary is enabled and says what is missing.
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await expect(canvas.getByText("Add at least one file.")).toBeVisible();
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      "PDF or image, up to 5 MB each. Add at least one file.",
    );

    choose(inputOf(canvasElement), [
      file("plan.pdf", "application/pdf", 840_000),
      file("unstable-scan.png", "image/png"),
    ]);
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    await expect(canvas.queryByText("Add at least one file.")).toBeNull();
    await expect(
      canvas.getByRole("progressbar", { name: "Uploading plan.pdf" }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Cancel uploading plan.pdf" })).toBeVisible();

    // Submitting while files upload says to wait.
    await userEvent.click(submit);
    await expect(canvas.getByText("Wait until every file has uploaded.")).toBeVisible();

    const done = await canvas.findByRole(
      "button",
      { name: "Download plan.pdf" },
      { timeout: 3000 },
    );
    await expect(canvas.getByText("PDF · 840 kB")).toBeVisible();
    const retry = await canvas.findByRole(
      "button",
      { name: "Retry unstable-scan.png" },
      { timeout: 3000 },
    );
    await expect(canvas.getByText("The connection was lost. Retry the upload.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Remove unstable-scan.png" })).toBeVisible();
    await expect(done.closest('[data-slot="attachment"]')).not.toHaveAttribute("aria-busy");

    await userEvent.click(retry);
    await canvas.findByRole("button", { name: "Download unstable-scan.png" }, { timeout: 3000 });
    await waitFor(() => expect(heard()).toBe("Uploaded unstable-scan.png."));

    await userEvent.click(canvas.getByRole("button", { name: "Remove plan.pdf" }));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(heard()).toBe("Removed plan.pdf."));

    await userEvent.click(submit);
    await expect(onAttach).toHaveBeenCalledWith(["unstable-scan.png"]);
    await expect(canvas.getByText("Files attached.")).toBeVisible();
  },
};

/** The zone keeps its shape in a narrow column: the title, the hint, the trigger and a refusal wrap inside it. */
export const Narrow: Story = {
  args: { onReject: fn() },
  render: (args) => (
    <Field className="w-layout-rail max-w-full">
      <FieldLabel>Photo</FieldLabel>
      <DropZone {...args} multiple={false} accept="image/*" maxSize={2_000_000}>
        <FieldDescription>PNG or JPEG, up to 2 MB.</FieldDescription>
      </DropZone>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    choose(inputOf(canvasElement), [file("large.png", "image/png", 3_000_000)]);
    await expect(canvas.getByText("large.png is larger than 2 MB.")).toBeVisible();
    const zone = zoneOf(canvasElement);
    await expect(zone.scrollWidth).toBeLessThanOrEqual(zone.clientWidth);
  },
};

/** The primary stays enabled and reports what is missing on submit; a primary disabled until a file is chosen says nothing about why. */
export const DoDont: Story = {
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Stack space="space.200">
          <Field>
            <FieldLabel>Report</FieldLabel>
            <DropZone accept="application/pdf">
              <FieldDescription>PDF only.</FieldDescription>
            </DropZone>
          </Field>
          <Inline>
            <Button variant="primary">Attach report</Button>
          </Inline>
        </Stack>
      }
      doText="An enabled primary that checks on submit and names what is missing."
      dont={
        <Stack space="space.200">
          <Field>
            <FieldLabel>Report</FieldLabel>
            <DropZone accept="application/pdf">
              <FieldDescription>PDF only.</FieldDescription>
            </DropZone>
          </Field>
          <Inline>
            <Button variant="primary" disabled>
              Attach report
            </Button>
          </Inline>
        </Stack>
      }
      dontText="A primary disabled until a file is chosen: the reader cannot learn what it waits for."
    />
  ),
};
