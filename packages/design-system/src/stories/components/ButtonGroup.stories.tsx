import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState } from "react";
import { ChevronDown, Download, Minus, Plus } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  Input,
} from "../../components";
import { Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Export",
    orientation: "horizontal",
    children: (
      <>
        <Button>Export</Button>
        <Button>Print</Button>
      </>
    ),
  },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Orientations: Story = {
  render: () => (
    <Matrix
      rows={["horizontal", "vertical"] as const}
      cols={["small", "medium"] as const}
      render={(orientation, size) => (
        <ButtonGroup orientation={orientation} aria-label="Export">
          <Button size={size}>Export</Button>
          <ButtonGroupSeparator
            orientation={orientation === "horizontal" ? "vertical" : "horizontal"}
            isDecorative
          />
          <Button size={size}>Print</Button>
          <Button size={size} disabled>
            Archive
          </Button>
        </ButtonGroup>
      )}
    />
  ),
};

function CompositionDemo() {
  const id = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const [download, setDownload] = useState("");
  const [labelClicked, setLabelClicked] = useState(false);
  const [renderClicked, setRenderClicked] = useState(false);
  const [zoom, setZoom] = useState(100);
  return (
    <Stack space="space.200">
      <ButtonGroup aria-label="Export">
        <Button iconBefore={<Download />} onClick={() => setDownload("CSV")}>
          Export
        </Button>
        <ButtonGroupSeparator isDecorative />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<IconButton label="Export as" size="medium" icon={<ChevronDown />} />}
          />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDownload("CSV")}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDownload("PDF")}>PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      <ButtonGroup ref={groupRef} aria-label="Retention" data-testid="retention-group">
        <ButtonGroupText
          render={<label ref={labelRef} htmlFor={id} onClick={() => setRenderClicked(true)} />}
          onClick={() => setLabelClicked(true)}
        >
          Days
        </ButtonGroupText>
        <Input id={id} type="number" min={1} defaultValue={30} className="w-800" />
        <ButtonGroupSeparator ref={separatorRef} isDecorative />
        <Button
          onClick={() => {
            if (groupRef.current && labelRef.current?.htmlFor === id && separatorRef.current)
              setDownload("Retention saved");
          }}
        >
          Save
        </Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <IconButton label="Zoom in" icon={<Plus />} onClick={() => setZoom(zoom + 10)} />
        <ButtonGroupText aria-live="polite">{zoom}%</ButtonGroupText>
        <IconButton
          label="Zoom out"
          icon={<Minus />}
          disabled={zoom <= 100}
          onClick={() => setZoom(zoom - 10)}
        />
      </ButtonGroup>
      <p role="status">{download || "Choose an export format."}</p>
      <span hidden data-testid="label-events">
        {String(labelClicked && renderClicked)}
      </span>
    </Stack>
  );
}

export const Composition: Story = {
  render: () => <CompositionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Export as" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "PDF" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("PDF");
    await waitFor(() =>
      expect(screen.queryByRole("menu", { hidden: true })).not.toBeInTheDocument(),
    );
    await userEvent.click(canvas.getByText("Days"));
    await expect(canvas.getByRole("spinbutton", { name: "Days" })).toHaveFocus();
    await expect(canvas.getByTestId("label-events")).toHaveTextContent("true");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Retention saved");
    await expect(canvas.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
    await expect(canvas.getByText("110%")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Zoom out" })).toBeEnabled();
  },
};
