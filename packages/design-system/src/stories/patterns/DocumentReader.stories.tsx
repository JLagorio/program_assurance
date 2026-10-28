import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import {
  DocumentReader,
  DocumentPage,
  DocumentSelectionToolbar,
  Stack,
  Text,
  type DocumentSelection,
} from "../..";
const meta = {
  title: "Patterns/DocumentReader",
  component: DocumentReader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DocumentReader>;
export default meta;
type Story = StoryObj;
const quote =
  "The recovery exercise completed successfully. Every critical service resumed within the agreed recovery window.";
function Example({ anchors = false, region = false }: { anchors?: boolean; region?: boolean }) {
  const [page, setPage] = useState(1),
    [zoom, setZoom] = useState(1),
    [selection, setSelection] = useState<DocumentSelection | null>(null),
    [status, setStatus] = useState("");
  return (
    <Stack space="space.100">
      {selection && (
        <DocumentSelectionToolbar
          selection={selection}
          onCite={() => setStatus("Citation requested")}
          onDiscuss={() => setStatus("Discussion requested")}
          onCopyLink={() => setStatus("Passage link requested")}
          onClear={() => setSelection(null)}
        />
      )}
      <DocumentReader
        label="Recovery report"
        page={page}
        pageCount={3}
        onPageChange={setPage}
        zoom={zoom}
        onZoomChange={setZoom}
        aside={
          anchors ? <Text>Choose the highlighted passage to open its discussion.</Text> : undefined
        }
      >
        <DocumentPage
          page={page}
          width={600}
          height={420}
          zoom={zoom}
          mode={region ? "region" : "text"}
          onSelectionChange={setSelection}
          anchors={
            anchors
              ? [
                  {
                    id: "review",
                    label: "Review the recovery result",
                    rectangle: { x: 0.06, y: 0.35, width: 0.8, height: 0.16 },
                    active: true,
                  },
                ]
              : []
          }
          onAnchorActivate={() => setStatus("Recovery discussion opened")}
        >
          <div className="p-300">
            <Stack space="space.200">
              <Text weight="semibold">Recovery exercise · Page {page}</Text>
              <Text>{quote}</Text>
              <Text>
                This document is a renderer-neutral example. A host supplies a canvas and selectable
                text, images, or an HTML document.
              </Text>
            </Stack>
          </div>
        </DocumentPage>
      </DocumentReader>
      <Text role="status">{status || "Ready"}</Text>
    </Stack>
  );
}
export const Reading: Story = {
  render: function Reading() {
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    return (
      <DocumentReader
        label="Recovery report"
        page={page}
        pageCount={3}
        onPageChange={setPage}
        zoom={zoom}
        onZoomChange={setZoom}
      >
        <DocumentPage page={page} width={600} height={420} zoom={zoom}>
          <div className="p-300">
            <Stack space="space.200">
              <Text weight="semibold">Recovery exercise · Page {page}</Text>
              <Text>
                The recovery exercise completed successfully. Every critical service resumed within
                the agreed recovery window.
              </Text>
              <Text>
                The host supplies the document renderer; the reader supplies page navigation, zoom
                and accessible passage controls.
              </Text>
            </Stack>
          </div>
        </DocumentPage>
      </DocumentReader>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Next page" }));
    await expect(c.getByText("Recovery exercise · Page 2")).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Zoom in" }));
    await expect(c.getByText("125%")).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Fit page width" }));
    await expect(c.getByText("100%")).toBeVisible();
    const input = c.getByRole("spinbutton", { name: "Page number" });
    await userEvent.clear(input);
    await userEvent.type(input, "3{Enter}");
    await expect(c.getByRole("button", { name: "Next page" })).toBeDisabled();
  },
};
export const TextSelection: Story = {
  tags: ["!manifest"],
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const text = c.getByText(quote);
    const range = document.createRange();
    range.selectNodeContents(text);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    await fireEvent.pointerUp(text, { button: 0 });
    await expect(c.getByRole("group", { name: "Selected passage actions" })).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Cite selection" }));
    await expect(c.getByRole("status")).toHaveTextContent("Citation requested");
    await userEvent.click(c.getByRole("button", { name: "Clear selection" }));
    await expect(c.queryByRole("group", { name: "Selected passage actions" })).toBeNull();
    window.getSelection()?.removeAllRanges();
  },
};
export const AnchoredDiscussion: Story = {
  tags: ["!manifest"],
  render: () => <Example anchors />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const anchor = c.getByRole("button", { name: "Review the recovery result" });
    await expect(anchor).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(anchor);
    await expect(c.getByRole("status")).toHaveTextContent("Recovery discussion opened");
  },
};
export const RegionSelection: Story = {
  tags: ["!manifest"],
  render: () => <Example region />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="document-page"]')!;
    const box = page.getBoundingClientRect();
    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: page,
        coords: { x: box.x + box.width * 0.1, y: box.y + box.height * 0.15 },
      },
      { target: page, coords: { x: box.x + box.width * 0.65, y: box.y + box.height * 0.35 } },
      { keys: "[/MouseLeft]", target: page },
    ]);
    await expect(c.getByRole("button", { name: "Discuss selection" })).toBeVisible();
  },
};
