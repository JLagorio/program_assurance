import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Download,
  Redo,
  Undo,
} from "lucide-react";

import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "padded" },
  args: {
    label: "Approve",
    children: (
      <>
        <Button>Approve</Button>
        <IconButton label="More" size="medium" icon={<ChevronDown />} />
      </>
    ),
  },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Groups by variant and size with a disabled member; a split button with its menu; icon buttons; a primary split. */
export const ButtonGroupMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["secondary", "subtle"] as const}
        cols={["small", "medium"] as const}
        render={(variant, size) => (
          <ButtonGroup label="Export">
            <Button variant={variant} size={size}>
              Export
            </Button>
            <Button variant={variant} size={size} disabled={size === "medium"}>
              Print
            </Button>
            <IconButton label="More" variant={variant} size={size} icon={<ChevronDown />} />
          </ButtonGroup>
        )}
      />
      <Specimens title="A split button, icon buttons, a primary split">
        <ButtonGroup label="Export">
          <Button size="small" iconBefore={<Download />}>
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<IconButton label="Export as" size="small" icon={<ChevronDown />} />}
            />
            <DropdownMenuContent align="end" style={{ width: 200 }}>
              <DropdownMenuItem onClick={() => {}}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>OSCAL JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
        <ButtonGroup label="Align">
          <IconButton label="Align left" icon={<AlignLeft />} />
          <IconButton label="Align centre" icon={<AlignCenter />} />
          <IconButton label="Align right" icon={<AlignRight />} />
        </ButtonGroup>
        <ButtonGroup label="History">
          <IconButton label="Undo" icon={<Undo />} />
          <IconButton label="Redo" icon={<Redo />} disabled />
        </ButtonGroup>
        <ButtonGroup label="Approve">
          <Button variant="primary">Approve tailored baseline</Button>
          <IconButton label="More" variant="primary" size="medium" icon={<ChevronDown />} />
        </ButtonGroup>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ToggleGroup aria-label="Period" defaultValue={["week"]}>
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
        }
        doText="A choice among views is a ToggleGroup."
        dont={
          <ButtonGroup>
            <Button size="small">Day</Button>
            <Button size="small" isSelected>
              Week
            </Button>
            <Button size="small">Month</Button>
          </ButtonGroup>
        }
        dontText="Selected buttons joined into a segmented control. Buttons act; nothing here acts, one is chosen."
      />
      <Pair
        do={
          <ButtonGroup label="Export">
            <Button size="small">Export</Button>
            <IconButton label="Export as" size="small" icon={<ChevronDown />} />
          </ButtonGroup>
        }
        doText="One size, one variant: the group is one control."
        dont={
          <ButtonGroup>
            <Button variant="primary">Export</Button>
            <Button size="small" variant="subtle">
              Print
            </Button>
            <IconButton label="More" icon={<ChevronDown />} />
          </ButtonGroup>
        }
        dontText="Three sizes and variants joined. The corners meet but nothing else does."
      />
      <Pair
        do={
          <Inline space="space.100">
            <Button variant="primary">Approve</Button>
            <Button>Reject</Button>
          </Inline>
        }
        doText="Actions that are not one control stand apart: an Inline with space.100, the primary first."
        dont={
          <ButtonGroup>
            <Button variant="primary">Approve</Button>
            <Button variant="primary">Reject</Button>
          </ButtonGroup>
        }
        dontText="Two decisions joined as one, both primary. One high-emphasis button in a group."
      />
      <Pair
        do={
          <ButtonGroup label="Record">
            <Button size="small">Edit</Button>
            <Button size="small">Duplicate</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<IconButton label="More" size="small" icon={<ChevronDown />} />}
              />
              <DropdownMenuContent align="end" style={{ width: 200 }}>
                <DropdownMenuItem onClick={() => {}}>Move</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Export</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => {}}>
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        }
        doText="Two or three, and a menu for the rest."
        dont={
          <ButtonGroup>
            <Button size="small">Edit</Button>
            <Button size="small">Duplicate</Button>
            <Button size="small">Move</Button>
            <Button size="small">Export</Button>
            <Button size="small">Archive</Button>
          </ButtonGroup>
        }
        dontText="Five joined. Past three the group is a toolbar, and the reader scans a row of equal words for the one that matters."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
