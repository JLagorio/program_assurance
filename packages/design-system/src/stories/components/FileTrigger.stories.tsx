import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Attachment,
  Button,
  ButtonGroup,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileTrigger,
  Input,
  formatFileSize,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Components/FileTrigger",
  component: FileTrigger,
  parameters: { layout: "padded" },
  args: {
    accept: "application/pdf,image/*",
    multiple: false,
    variant: "secondary",
    size: "medium",
    onSelect: fn(),
  },
} satisfies Meta<typeof FileTrigger>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The hidden input a FileTrigger opens. */
const inputOf = (root: HTMLElement) =>
  root.querySelector<HTMLInputElement>("[data-file-trigger-input]")!;
const inputsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLInputElement>("[data-file-trigger-input]"));

/** Stands in for the picker: the next `click()` on the input is recorded instead of opening it. */
function interceptPicker(input: HTMLInputElement) {
  const open = fn();
  input.click = open;
  return open;
}

/** What the picker hands back when the reader chooses files. */
function choose(input: HTMLInputElement, files: File[]) {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const pdf = (name: string, bytes = 2_400) =>
  new File([new Uint8Array(bytes)], name, { type: "application/pdf" });

/** The controls: `accept`, `multiple`, and every Button prop. The picker opens on Enter, Space and a click. */
export const Playground: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Choose a file" });
    const input = inputOf(canvasElement);
    // The native input is in the document but takes no space, no focus and no accessible role.
    await expect(input).not.toBeVisible();
    await expect(input).toHaveAttribute("accept", "application/pdf,image/*");
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
    const open = interceptPicker(input);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect(open).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(" ");
    await expect(open).toHaveBeenCalledTimes(2);
    const file = pdf("signed-agreement.pdf");
    choose(input, [file]);
    await expect(args.onSelect).toHaveBeenCalledWith([file]);
    // The input is emptied after each choice, so the same file can be chosen again.
    await expect(input.value).toBe("");
    await expect(button).toHaveFocus();
  },
};

/**
 * In a Field the button is the Field's control. The FieldLabel names it before its own words, the
 * FieldDescription and FieldError describe it, `required` is spoken as "(required)" in its name,
 * `invalid` reaches it as `aria-invalid`, and a click on the label opens the picker.
 */
export const InAField: Story = {
  name: "In a Field",
  render: () => (
    <Stack space="space.300" className="w-layout-list max-w-full">
      <Field required>
        <FieldLabel>Signed agreement</FieldLabel>
        <Inline>
          <FileTrigger accept="application/pdf" iconBefore={<Paperclip />} />
        </Inline>
        <FieldDescription>PDF, up to 10 MB.</FieldDescription>
      </Field>
      <Field invalid required>
        <FieldLabel>Site photographs</FieldLabel>
        <Inline>
          <FileTrigger accept="image/*" multiple iconBefore={<Paperclip />} />
        </Inline>
        <FieldDescription>JPEG or PNG images.</FieldDescription>
        <FieldError>Add at least one photograph.</FieldError>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const agreement = canvas.getByRole("button", {
      name: "Signed agreement (required) Choose a file",
    });
    await expect(agreement).toHaveAccessibleDescription("PDF, up to 10 MB.");
    await expect(agreement).not.toHaveAttribute("aria-invalid");
    const photos = canvas.getByRole("button", {
      name: "Site photographs (required) Choose files",
    });
    await expect(photos).toHaveAttribute("aria-invalid", "true");
    await expect(photos).toHaveAccessibleDescription(
      "JPEG or PNG images. Add at least one photograph.",
    );
    // The label points at the button, so a click on it opens the picker, as a native file input's does.
    const label = canvas.getByText("Signed agreement").closest("label")!;
    await expect(label).toHaveAttribute("for", agreement.id);
    const [agreementInput] = inputsOf(canvasElement);
    const open = interceptPicker(agreementInput!);
    await userEvent.click(label);
    await expect(open).toHaveBeenCalledTimes(1);
  },
};

type Chosen = { id: number; file: File };

function ChosenFiles() {
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [status, setStatus] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const next = useRef(1);
  return (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Attachments</FieldLabel>
        <Inline>
          <FileTrigger
            ref={trigger}
            multiple
            iconBefore={<Paperclip />}
            onSelect={(files) => {
              setChosen((list) => [
                ...list,
                ...files.map((file) => ({ id: next.current++, file })),
              ]);
              setStatus(
                files.length === 1 ? `Added ${files[0]!.name}.` : `Added ${files.length} files.`,
              );
            }}
          >
            Add files
          </FileTrigger>
        </Inline>
      </Field>
      {chosen.length ? (
        <Stack as="ul" role="list" aria-label="Chosen files" space="space.100">
          {chosen.map(({ id, file }) => (
            <li key={id}>
              <Attachment size="small" className="w-full">
                <Attachment.Media aria-hidden="true">
                  <FileText />
                </Attachment.Media>
                <Attachment.Content>
                  <Attachment.Title>{file.name}</Attachment.Title>
                  <Attachment.Description>{formatFileSize(file.size)}</Attachment.Description>
                </Attachment.Content>
                <Attachment.Actions>
                  <Attachment.Action
                    label={`Remove ${file.name}`}
                    icon={<X />}
                    onClick={() => {
                      setChosen((list) => list.filter((item) => item.id !== id));
                      setStatus(`Removed ${file.name}.`);
                      // The removed row took focus with it; the trigger is the surviving control.
                      trigger.current?.focus();
                    }}
                  />
                </Attachment.Actions>
              </Attachment>
            </li>
          ))}
        </Stack>
      ) : null}
      <Text role="status" size="small" color="color.text.subtle">
        {status}
      </Text>
    </Stack>
  );
}

/**
 * The files go where the caller puts them: here, Attachment rows with a Remove named for each
 * file, focus back on the trigger after a removal, and a status line. Choosing a removed file
 * again adds it again.
 */
export const ChosenFilesAsAttachments: Story = {
  name: "Chosen files as Attachments",
  render: () => <ChosenFiles />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Attachments Add files" });
    const input = inputOf(canvasElement);
    choose(input, [pdf("plan.pdf", 840_000), pdf("minutes.pdf", 2_400_000)]);
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    await expect(canvas.getByRole("status")).toHaveTextContent("Added 2 files.");
    await expect(canvas.getByText("840 kB")).toBeVisible();
    await expect(canvas.getByText("2.4 MB")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Remove plan.pdf" }));
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent("Removed plan.pdf.");
    choose(input, [pdf("plan.pdf", 840_000)]);
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
  },
};

const onBlockedSelect = fn();

/**
 * `isLoading` keeps the button focusable while a choice is being read; `disabledReason` keeps it
 * reachable and says why; `disabled`, on the trigger or its Field, takes it out.
 */
export const States: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Inline space="space.100" rowSpace="space.100" shouldWrap>
        <FileTrigger isLoading onSelect={onBlockedSelect}>
          Reading file
        </FileTrigger>
        <FileTrigger
          disabledReason="An editor or an owner can add files."
          onSelect={onBlockedSelect}
        />
        <FileTrigger variant="primary" multiple />
        <FileTrigger variant="subtle" size="small" iconBefore={<Paperclip />}>
          Attach
        </FileTrigger>
      </Inline>
      <Field disabled>
        <FieldLabel>Archived evidence</FieldLabel>
        <Inline>
          <FileTrigger onSelect={onBlockedSelect} />
        </Inline>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [loadingInput, reasonInput, , , fieldInput] = inputsOf(canvasElement);
    const loading = canvas.getByRole("button", { name: "Reading file" });
    await expect(loading).toHaveAttribute("aria-busy", "true");
    const loadingOpen = interceptPicker(loadingInput!);
    loading.focus();
    await userEvent.keyboard("{Enter}");
    await expect(loadingOpen).not.toHaveBeenCalled();
    await expect(loading).toHaveFocus();
    const reasoned = canvas.getByRole("button", { name: "Choose a file" });
    await expect(reasoned).toHaveAccessibleDescription("An editor or an owner can add files.");
    const reasonOpen = interceptPicker(reasonInput!);
    await userEvent.click(reasoned);
    await expect(reasonOpen).not.toHaveBeenCalled();
    const archived = canvas.getByRole("button", { name: "Archived evidence Choose a file" });
    await expect(archived).toBeDisabled();
    await expect(fieldInput).toBeDisabled();
    await expect(onBlockedSelect).not.toHaveBeenCalled();
  },
};

/**
 * A FileTrigger is a segment like any Button in a ButtonGroup: its hidden input is not counted, so
 * the trigger at the end keeps its rounded end corners and the one in the middle keeps them square.
 */
export const InAButtonGroup: Story = {
  name: "In a button group",
  render: () => (
    <Stack space="space.200">
      <ButtonGroup aria-label="Add a document">
        <Button>Choose from the library</Button>
        <FileTrigger accept="application/pdf">Upload a file</FileTrigger>
      </ButtonGroup>
      <ButtonGroup aria-label="Add a photo">
        <FileTrigger accept="image/*">Upload a photo</FileTrigger>
        <Button>Take a photo</Button>
      </ButtonGroup>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const last = getComputedStyle(canvas.getByRole("button", { name: "Upload a file" }));
    await expect(parseFloat(last.borderStartEndRadius)).toBeGreaterThan(0);
    await expect(parseFloat(last.borderEndEndRadius)).toBeGreaterThan(0);
    await expect(parseFloat(last.borderStartStartRadius)).toBe(0);
    const first = getComputedStyle(canvas.getByRole("button", { name: "Upload a photo" }));
    await expect(parseFloat(first.borderStartStartRadius)).toBeGreaterThan(0);
    await expect(parseFloat(first.borderStartEndRadius)).toBe(0);
    // The segment after it joins it: no rounded start and no doubled border.
    const next = getComputedStyle(canvas.getByRole("button", { name: "Take a photo" }));
    await expect(parseFloat(next.borderStartStartRadius)).toBe(0);
    await expect(parseFloat(next.borderEndEndRadius)).toBeGreaterThan(0);
  },
};

/** A native file input styled as a field reads as one line of text, and its button is not a Ledger button. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Field>
          <FieldLabel>Report</FieldLabel>
          <Inline>
            <FileTrigger accept="application/pdf" />
          </Inline>
          <FieldDescription>PDF, up to 10 MB.</FieldDescription>
        </Field>
      }
      doText="A FileTrigger: a real button, named by the field, with the constraints beside it."
      dont={
        <Field>
          <FieldLabel>Report</FieldLabel>
          <Input type="file" accept="application/pdf" />
        </Field>
      }
      dontText="An Input with type file: the browser's button loses its frame and the control reads as text."
    />
  ),
};
