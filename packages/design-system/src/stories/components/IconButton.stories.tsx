import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Search, X } from "lucide-react";
import { createRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button, ButtonGroup, IconButton } from "../../components";
import { Stack } from "../../primitives";
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

/** All variants and sizes, plus selected, loading and disabled states. */
export const IconButtonMatrix: Story = {
  render: () => (
    <Grid
      rows={["secondary", "subtle", "primary"] as const}
      cols={["small", "medium", "selected", "loading", "disabled"] as const}
      render={(variant, col) => (
        <IconButton
          label="Search"
          icon={<Search />}
          variant={variant}
          size={col === "medium" ? "medium" : "small"}
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
      for (const col of ["small", "medium", "selected", "loading", "disabled"]) {
        const button = canvas.getByTestId(`${variant}-${col}`);
        const size = col === "medium" ? 32 : 28;
        await expect(button).toHaveAccessibleName("Search");
        await expect(button).toHaveAttribute("type", "button");
        await expect(button.getBoundingClientRect().width).toBe(size);
        await expect(button.getBoundingClientRect().height).toBe(size);
        const icon = button.querySelector("svg")!;
        await expect(getComputedStyle(icon).width).toBe(col === "medium" ? "16px" : "14px");
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
        <ButtonGroup label="Export">
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
    const page = within(canvasElement.ownerDocument.body);
    searchAction.mockClear();
    closeAction.mockClear();
    const search = canvas.getByRole("button", { name: "Search" });
    await expect(searchRef.current).toBe(search);
    await expect(search.tagName).toBe("BUTTON");
    await expect(search).toHaveAttribute("id", "toolbar-search");
    search.focus();
    await expect(await page.findByRole("tooltip")).toHaveTextContent("Search");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("tooltip")).not.toBeInTheDocument());
    await userEvent.keyboard("{Enter} ");
    await expect(searchAction).toHaveBeenCalledTimes(2);
    await userEvent.hover(search);
    await expect(await page.findByRole("tooltip")).toHaveTextContent("Search");
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

export const Playground: Story = { args: { variant: "secondary", size: "small" } };
