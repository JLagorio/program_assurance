import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { createRef, useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  TextLink,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  args: { label: "Search", icon: <Search /> },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const matrixAction = fn();

const matrixCols = [
  "xxsmall",
  "xsmall",
  "small",
  "medium",
  "selected",
  "loading",
  "disabled",
] as const;
const squareOf = { xxsmall: 20, xsmall: 24, small: 28, medium: 32 } as const;
const sizeOf = (col: (typeof matrixCols)[number]) =>
  col === "xxsmall" || col === "xsmall" || col === "medium" ? col : "small";

/** All variants and sizes, plus selected, loading and disabled states. */
export const IconButtonMatrix: Story = {
  render: () => (
    <Grid
      rows={["secondary", "subtle", "primary"] as const}
      cols={matrixCols}
      render={(variant, col) => (
        <IconButton
          label="Search"
          icon={<Search />}
          variant={variant}
          size={sizeOf(col)}
          isSelected={col === "selected"}
          isLoading={col === "loading"}
          disabled={col === "disabled"}
          data-testid={`${variant}-${col}`}
          onClick={matrixAction}
        />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    matrixAction.mockClear();
    for (const variant of ["secondary", "subtle", "primary"]) {
      for (const col of matrixCols) {
        const button = canvas.getByTestId(`${variant}-${col}`);
        const size = squareOf[sizeOf(col)];
        await expect(button).toHaveAccessibleName("Search");
        await expect(button).toHaveAttribute("type", "button");
        await expect(button.getBoundingClientRect().width).toBe(size);
        await expect(button.getBoundingClientRect().height).toBe(size);
        const icon = button.querySelector("svg")!;
        await expect(getComputedStyle(icon).width).toBe(col === "medium" ? "16px" : "14px");
        const buttonBox = button.getBoundingClientRect();
        const iconBox = icon.getBoundingClientRect();
        await expect(
          Math.abs(iconBox.x + iconBox.width / 2 - buttonBox.x - buttonBox.width / 2),
        ).toBeLessThanOrEqual(0.5);
        await expect(
          Math.abs(iconBox.y + iconBox.height / 2 - buttonBox.y - buttonBox.height / 2),
        ).toBeLessThanOrEqual(0.5);
        if (col !== "loading") await expect(icon).toHaveAttribute("aria-hidden", "true");
      }
      await expect(canvas.getByTestId(`${variant}-selected`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const disabled = canvas.getByTestId(`${variant}-disabled`);
      await expect(disabled).toBeDisabled();
      await userEvent.click(disabled, { pointerEventsCheck: 0 });
      const loading = canvas.getByTestId(`${variant}-loading`);
      await expect(loading).toHaveAttribute("aria-busy", "true");
      await expect(loading).toHaveAttribute("aria-disabled", "true");
      await expect(loading).not.toBeDisabled();
      loading.focus();
      await userEvent.click(loading);
      await userEvent.keyboard("{Enter} ");
      await expect(loading).toHaveFocus();
    }
    await expect(matrixAction).not.toHaveBeenCalled();
  },
};

const searchRef = createRef<HTMLButtonElement>();
const searchAction = fn();
const closeAction = fn();

/** A named tool, a primary split action, and a close control with its tooltip suppressed. */
export const InPlace: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="A toolbar action: its label appears on hover and focus">
        <IconButton
          ref={searchRef}
          id="toolbar-search"
          label="Search"
          icon={<Search />}
          variant="subtle"
          onClick={searchAction}
        />
      </Specimens>
      <Specimens title="A joined action and its options">
        <ButtonGroup aria-label="Export">
          <Button size="small" variant="primary">
            Export
          </Button>
          <IconButton
            size="small"
            variant="primary"
            label="Export options"
            icon={<ChevronDown />}
          />
        </ButtonGroup>
      </Specimens>
      <Specimens title="A close control: a parent can supply its own tooltip">
        <IconButton
          label="Close"
          variant="subtle"
          size="medium"
          icon={<X />}
          isTooltipDisabled
          onClick={closeAction}
        />
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    searchAction.mockClear();
    closeAction.mockClear();
    const search = canvas.getByRole("button", { name: "Search" });
    await expect(searchRef.current).toBe(search);
    await expect(search.tagName).toBe("BUTTON");
    await expect(search).toHaveAttribute("id", "toolbar-search");
    search.focus();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"][data-open]')).toHaveTextContent(
        "Search",
      ),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"][data-open]'),
      ).not.toBeInTheDocument(),
    );
    await userEvent.keyboard("{Enter} ");
    await expect(searchAction).toHaveBeenCalledTimes(2);
    await userEvent.hover(search);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"][data-open]')).toHaveTextContent(
        "Search",
      ),
    );
    await userEvent.unhover(search);
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Export" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Export options" })).toHaveFocus();
    await userEvent.tab();
    const close = canvas.getByRole("button", { name: "Close" });
    await expect(close).toHaveFocus();
    await expect(close).not.toHaveAttribute("aria-describedby");
    await userEvent.keyboard("{Enter}");
    await expect(closeAction).toHaveBeenCalledTimes(1);
    await expect(close).toHaveAccessibleName("Close");
  },
};

/**
 * `size="xxsmall"` is the 20px row control: a table or tree row's disclosure and row actions. On
 * a touch screen it keeps a hit area of at least 24px, centred on the button, so the row keeps its
 * height and a finger still lands.
 */
export const InADenseRow: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <Inline space="space.050" alignBlock="center" className="h-control-xsmall">
      <IconButton
        label="Open CTRL-0412"
        icon={<ExternalLink />}
        variant="subtle"
        size="xxsmall"
        isTooltipDisabled
      />
      <Text size="small" className="min-w-0 flex-1 truncate">
        CTRL-0412 Vendor master changes
      </Text>
      <IconButton
        label="Remove CTRL-0412"
        icon={<X />}
        variant="subtle"
        size="xxsmall"
        isTooltipDisabled
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Open CTRL-0412", "Remove CTRL-0412"]) {
      const action = canvas.getByRole("button", { name });
      await expect(action.getBoundingClientRect().width).toBe(20);
      await expect(action.getBoundingClientRect().height).toBe(20);
      await expect(action.querySelector("svg")!.getBoundingClientRect().width).toBe(14);
      await expect(action).toHaveClass("touch-target");
      await expect(getComputedStyle(action).position).toBe("relative");
      if (matchMedia("(any-pointer: coarse)").matches) {
        const area = getComputedStyle(action, "::before");
        await expect(parseFloat(area.width)).toBeGreaterThanOrEqual(24);
        await expect(parseFloat(area.height)).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

const renameSystem = fn();

/**
 * An icon button that opens a menu. Its tooltip shows when focus arrives by Tab. When focus comes
 * back from the menu, closed with Escape or by choosing a command, the tooltip stays shut, so the
 * next Escape reaches whatever holds the button instead of closing a tooltip first.
 */
export const OpensAMenu: Story = {
  render: () => (
    <Inline space="space.100" alignBlock="center">
      <Button size="small">Create system</Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton label="More system actions" icon={<MoreHorizontal />} variant="subtle" />
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={renameSystem}>Rename</DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    renameSystem.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const openTooltip = () =>
      canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"][data-open]');
    const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
    const create = canvas.getByRole("button", { name: "Create system" });
    const more = canvas.getByRole("button", { name: "More system actions" });

    // Arriving by Tab shows the name.
    create.focus();
    await userEvent.tab();
    await expect(more).toHaveFocus();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("More system actions"));

    // Escape closes the menu and focus comes back without the tooltip.
    await userEvent.keyboard("{Enter}");
    await body.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
    await settle();
    await expect(openTooltip()).toBeNull();

    // So does choosing a command.
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body.getByRole("menuitem", { name: "Rename" })).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(renameSystem).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
    await settle();
    await expect(openTooltip()).toBeNull();

    // Leaving and arriving again by Tab shows it, and Escape closes it.
    await userEvent.tab({ shift: true });
    await expect(create).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("More system actions"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTooltip()).toBeNull());
    await expect(more).toHaveFocus();
  },
};

function ControlPicker() {
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Choose a control</DialogTrigger>
      <DialogContent initialFocus={searchRef}>
        <DialogHeader>
          <DialogTitle>Choose a control</DialogTitle>
        </DialogHeader>
        <Stack space="space.150" className="p-250">
          <Input ref={searchRef} aria-label="Search controls" />
          <Inline space="space.050" alignBlock="center">
            <Text className="min-w-0 flex-1 truncate">CTRL-0412 Vendor master changes</Text>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label="More control actions"
                    icon={<MoreHorizontal />}
                    variant="subtle"
                  />
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <IconButton
              label="Show more fields"
              icon={<ChevronDown />}
              variant="subtle"
              aria-expanded={expanded}
              aria-controls="ctrl-0412-fields"
              onClick={() => setExpanded(!expanded)}
            />
          </Inline>
          <Stack id="ctrl-0412-fields" space="space.050" hidden={!expanded}>
            <Text size="small">Owner: Finance operations</Text>
            <TextLink href="#ctrl-0412">Open CTRL-0412</TextLink>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inside a dialog, a disclosure's expanded content sits in the same dialog, so focus that comes
 * back from it arrives like any other and shows the name. A menu the button opens is still a popup:
 * focus that returns from it leaves the tooltip shut, and the next Escape closes the dialog.
 */
export const InADialog: Story = {
  render: () => <ControlPicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const openTooltip = () =>
      canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"][data-open]');
    const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
    const trigger = canvas.getByRole("button", { name: "Choose a control" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = within(await body.findByRole("dialog", { name: "Choose a control" }));
    await waitFor(() =>
      expect(dialog.getByRole("textbox", { name: "Search controls" })).toHaveFocus(),
    );
    const actions = dialog.getByRole("button", { name: "More control actions" });
    const fields = dialog.getByRole("button", { name: "Show more fields" });

    // Arriving by Tab shows each name.
    await userEvent.tab();
    await expect(actions).toHaveFocus();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("More control actions"));
    await userEvent.tab();
    await expect(fields).toHaveFocus();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("Show more fields"));

    // Expanded, Tab into the revealed fields and back: the name shows again.
    await expect(dialog.queryByRole("link", { name: "Open CTRL-0412" })).toBeNull();
    await userEvent.keyboard("{Enter}");
    await expect(fields).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    await expect(dialog.getByRole("link", { name: "Open CTRL-0412" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(fields).toHaveFocus();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("Show more fields"));

    // Still expanded, leaving the other way and arriving again shows it too.
    await userEvent.tab({ shift: true });
    await expect(actions).toHaveFocus();
    await userEvent.tab();
    await expect(fields).toHaveFocus();
    await waitFor(() => expect(openTooltip()).toHaveTextContent("Show more fields"));

    // The menu is a popup: coming back from it leaves the tooltip shut.
    await userEvent.tab({ shift: true });
    await expect(actions).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await body.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(actions).toHaveFocus());
    await settle();
    await expect(openTooltip()).toBeNull();

    // So the next Escape closes the dialog.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const exportAction = fn();
const openTip = () => document.querySelector('[data-slot="tooltip-content"][data-open]');

/**
 * An icon-only action that cannot run names itself and says why in one tooltip: the label, then
 * the reason. It stays in the tab order with `aria-disabled`, the reason is its accessible
 * description, and a tap opens the tooltip too. With `isTooltipDisabled` the reason still shows.
 */
export const DisabledWithAReason: Story = {
  name: "Disabled with a reason",
  render: () => (
    <Inline space="space.100" alignBlock="center">
      <IconButton
        label="Export"
        icon={<Download />}
        disabledReason="Nothing to export until a control is added."
        onClick={exportAction}
      />
      <IconButton
        label="Remove"
        icon={<X />}
        variant="subtle"
        isTooltipDisabled
        disabledReason="A published control cannot be removed."
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    exportAction.mockClear();
    const exporter = canvas.getByRole("button", { name: "Export" });
    await expect(exporter).toHaveAttribute("aria-disabled", "true");
    await expect(exporter).not.toBeDisabled();
    await expect(exporter).toHaveAccessibleDescription(
      "Nothing to export until a control is added.",
    );
    await userEvent.tab();
    await expect(exporter).toHaveFocus();
    await waitFor(() => expect(openTip()).toHaveTextContent("Export"));
    await expect(openTip()).toHaveTextContent("Nothing to export until a control is added.");
    await userEvent.keyboard("{Enter} ");
    await expect(exportAction).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
    const remove = canvas.getByRole("button", { name: "Remove" });
    await userEvent.tab();
    await expect(remove).toHaveFocus();
    await waitFor(() =>
      expect(openTip()).toHaveTextContent("A published control cannot be removed."),
    );
    await expect(openTip()).not.toHaveTextContent("Remove");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
  },
};

function ExportWhenReady() {
  const [ready, setReady] = useState(false);
  return (
    <IconButton
      label="Export"
      icon={<Download />}
      disabledReason={ready ? undefined : "Nothing to export until a control is added."}
      onFocus={() => setTimeout(() => setReady(true), 50)}
      onClick={exportAction}
    />
  );
}

/**
 * The tooltip that carries a reason is a different tree from the label's own, so the button is
 * rebuilt when a reason comes or goes; focus stays on it through the change.
 */
export const ReasonChangesWhileFocused: Story = {
  name: "A reason that changes while focused",
  render: () => <ExportWhenReady />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    exportAction.mockClear();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Export" })).toHaveFocus();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Export" })).not.toHaveAttribute("aria-disabled"),
    );
    await expect(canvas.getByRole("button", { name: "Export" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(exportAction).toHaveBeenCalledTimes(1);
  },
};

function RecordStepper() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const last = 2;
  return (
    <Stack
      space="space.100"
      // As a panel or a side nav does: Escape that nothing inside has handled closes the surface.
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) setDismissed(true);
      }}
    >
      <Inline space="space.100" alignBlock="center">
        <IconButton
          label="Previous record"
          icon={<ChevronLeft />}
          variant="subtle"
          disabled={index === 0}
          focusableWhenDisabled
          onClick={() => setIndex(index - 1)}
        />
        <IconButton
          label="Next record"
          icon={<ChevronRight />}
          variant="subtle"
          disabled={index === last}
          focusableWhenDisabled
          onClick={() => setIndex(index + 1)}
        />
        <Text size="small">
          {index + 1} of {last + 1}
        </Text>
        <IconButton label="Archive" icon={<Archive />} variant="subtle" disabled />
      </Inline>
      <Text size="small" color="color.text.subtle" data-testid="surface">
        {dismissed ? "Escape closed the surface" : "The surface is open"}
      </Text>
    </Stack>
  );
}

/**
 * A disabled icon-only control's tooltip is its only visible label. With `focusableWhenDisabled`
 * it stays in the tab order with `aria-disabled` and its tooltip still shows on hover and on
 * keyboard focus. A control that becomes disabled while it has focus, such as Next at the last
 * record, keeps focus, so pressing Enter again does nothing instead of walking backwards. Only
 * activation is blocked: Escape closes an open tooltip first, then reaches the surface around the
 * control, as a panel's or a side nav's Escape must. A plain `disabled` IconButton leaves the tab
 * order.
 */
export const DisabledButReachable: Story = {
  name: "Disabled but reachable",
  render: () => <RecordStepper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "Previous record" });
    const next = canvas.getByRole("button", { name: "Next record" });
    // At the first record Previous is unavailable but reachable, and its tooltip names it.
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).not.toBeDisabled();
    await userEvent.tab();
    await expect(previous).toHaveFocus();
    await waitFor(() => expect(openTip()).toHaveTextContent("Previous record"));
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("1 of 3")).toBeVisible();
    // Next to the end: focus stays on Next, and Enter there does nothing more.
    await userEvent.tab();
    await expect(next).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("3 of 3")).toBeVisible();
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("3 of 3")).toBeVisible();
    await expect(next).toHaveFocus();
    // The pointer still finds the label of an unavailable control. Escape closes that tooltip and
    // goes no further; the next one reaches the surface around the control, as a panel's or a side
    // nav's Escape must.
    await userEvent.hover(next);
    await waitFor(() => expect(openTip()).toHaveTextContent("Next record"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
    await expect(canvas.getByTestId("surface")).toHaveTextContent("The surface is open");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByTestId("surface")).toHaveTextContent("Escape closed the surface");
    await expect(next).toHaveFocus();
    await userEvent.unhover(next);
    // A plain disabled control leaves the tab order.
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Archive" })).not.toHaveFocus();
    await expect(canvas.getByRole("button", { name: "Archive" })).toBeDisabled();
  },
};

export const Playground: Story = { args: { variant: "secondary", size: "small" } };
