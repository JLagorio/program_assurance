import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button, buttonVariants } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Schedule assessment" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["primary", "secondary", "subtle", "danger", "link"] as const;
const sizes = ["medium", "small", "xsmall"] as const;

/** The variants and sizes, plus disabled, selected, loading and icon placement. */
export const Matrix: Story = {
  tags: ["matrix"],
  render: () => (
    <Stack space="space.300">
      {variants.map((variant) => (
        <Specimens key={variant} title={variant}>
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size} data-testid={`${variant}-${size}`}>
              {size}
            </Button>
          ))}
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} isSelected>
            Selected
          </Button>
          <Button variant={variant} isLoading>
            Saving
          </Button>
          <Button variant={variant} iconBefore={<Plus />}>
            Add control
          </Button>
          <Button variant={variant} iconAfter={<ChevronDown />}>
            Views
          </Button>
        </Specimens>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      const buttons = sizes.map((size) => canvas.getByTestId(`${variant}-${size}`));
      for (const [index, button] of buttons.entries()) {
        await expect(button).toHaveAttribute("type", "button");
        await expect(button).toHaveAttribute("data-slot", "button");
        if (variant !== "link") {
          await expect(button.getBoundingClientRect().height).toBe([32, 28, 24][index]);
          await expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
        }
      }
      await expect(buttons[0]!.getBoundingClientRect().right).toBeLessThanOrEqual(
        buttons[1]!.getBoundingClientRect().left,
      );
    }
    for (const button of canvas.getAllByRole("button", { name: "Disabled" }))
      await expect(button).toBeDisabled();
    for (const button of canvas.getAllByRole("button", { name: "Selected" }))
      await expect(button).toHaveAttribute("aria-pressed", "true");
    for (const button of canvas.getAllByRole("button", { name: "Saving" })) {
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).not.toBeDisabled();
    }
    for (const button of canvas.getAllByRole("button", { name: /^(Add control|Views)$/ })) {
      const icon = button.querySelector("svg")!;
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      await expect(icon.getBoundingClientRect().width).toBe(14);
    }
  },
};

const previewRef = createRef<HTMLButtonElement>();
const previewAction = fn();
const submitAction = fn();
const submitClick = fn();

function LoadingDemo() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <form
      aria-label="Assessment actions"
      style={{ width: 320 }}
      onSubmit={(event) => {
        event.preventDefault();
        submitAction();
        setSaving(true);
        setTimeout(() => {
          setSaving(false);
          setSaved(true);
        }, 1800);
      }}
    >
      <Stack space="space.100">
        <Button
          type="submit"
          name="intent"
          value="submit"
          variant="primary"
          isFullWidth
          isLoading={saving}
          onClick={submitClick}
        >
          Submit package
        </Button>
        <Button
          ref={previewRef}
          id="preview-package"
          title="Preview package"
          onClick={previewAction}
          iconBefore={<Download />}
        >
          Preview package
        </Button>
        <Text role="status">
          {saving ? "Submitting package…" : saved ? "Package submitted." : "Ready to submit."}
        </Text>
      </Stack>
    </form>
  );
}

/** The submit action keeps its name and focus while pending; a default button does not submit. */
export const Loading: Story = {
  render: () => <LoadingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    previewAction.mockClear();
    submitAction.mockClear();
    submitClick.mockClear();
    const preview = canvas.getByRole("button", { name: "Preview package" });
    const submit = canvas.getByRole("button", { name: "Submit package" });
    await expect(previewRef.current).toBe(preview);
    await expect(preview).toHaveAttribute("id", "preview-package");
    await expect(preview).toHaveAttribute("type", "button");
    await userEvent.click(preview);
    await userEvent.keyboard("{Enter} ");
    await expect(previewAction).toHaveBeenCalledTimes(3);
    await expect(submitAction).not.toHaveBeenCalled();
    await expect(submit).toHaveAttribute("type", "submit");
    await expect(submit).toHaveAttribute("name", "intent");
    await expect(submit).toHaveAttribute("value", "submit");
    await expect(submit.getBoundingClientRect().width).toBe(320);
    await userEvent.click(submit);
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(submit).toHaveAttribute("aria-disabled", "true");
    await expect(submit).not.toBeDisabled();
    await expect(submit).toHaveFocus();
    await expect(submit).toHaveAccessibleName("Submit package");
    await userEvent.click(submit);
    await userEvent.keyboard("{Enter} ");
    await expect(submitClick).toHaveBeenCalledTimes(1);
    await expect(submitAction).toHaveBeenCalledTimes(1);
    await waitFor(
      () => expect(canvas.getByRole("status")).toHaveTextContent("Package submitted."),
      { timeout: 2500 },
    );
    await expect(submit).not.toHaveAttribute("aria-busy");
    await expect(submit).toHaveFocus();
  },
};

/** Labelled actions in a header and footer, including a destructive confirmation. */
export const Emphasis: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="A page header">
        <Button variant="primary" iconBefore={<Plus />}>
          New program
        </Button>
        <Button iconBefore={<Download />}>Export</Button>
        <Button iconAfter={<ChevronDown />}>Views</Button>
      </Specimens>
      <Specimens title="A confirmation footer">
        <Button variant="subtle">Cancel</Button>
        <Button variant="danger" iconBefore={<Trash2 />}>
          Delete program
        </Button>
      </Specimens>
    </Stack>
  ),
};

const renderedRef = createRef<HTMLButtonElement>();
const childRef = createRef<HTMLButtonElement>();
const renderedAction = fn();
const childAction = fn();
const blockedAction = fn();

/** Real links use the shared recipe; render composes controls that keep button semantics. */
export const AsLink: Story = {
  name: "Navigation and composition",
  render: () => (
    <Stack space="space.300">
      <Specimens title="Navigation: an anchor or router Link with buttonVariants">
        <a href="#button-destination" className={buttonVariants({ variant: "primary" })}>
          View requirements <ArrowRight aria-hidden className="size-icon-small" />
        </a>
      </Specimens>
      <Specimens title="Composition: render an existing action control">
        <Button
          ref={renderedRef}
          id="rendered-action"
          onClick={renderedAction}
          className={(state) => (state.disabled ? "cursor-not-allowed" : "self-start")}
          style={(state) => ({ minWidth: state.disabled ? 160 : 120 })}
          render={
            <button
              ref={childRef}
              className="align-middle"
              style={{ textDecorationLine: "underline" }}
              onClick={childAction}
            />
          }
        >
          Apply filter
        </Button>
        <Button
          disabled
          className={(state) => (state.disabled ? "cursor-not-allowed" : "self-start")}
          style={(state) => ({ minWidth: state.disabled ? 160 : 120 })}
          render={(props, state) => (
            <button
              {...props}
              data-render-disabled={String(state.disabled)}
              onClick={blockedAction}
            />
          )}
        >
          Unavailable action
        </Button>
        <Button isLoading nativeButton={false} render={<div onClick={blockedAction} />}>
          Updating results
        </Button>
      </Specimens>
      <Text id="button-destination">Requirements overview</Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    renderedAction.mockClear();
    childAction.mockClear();
    blockedAction.mockClear();
    const link = canvas.getByRole("link", { name: "View requirements" });
    await expect(link.tagName).toBe("A");
    await expect(link).toHaveAttribute("href", "#button-destination");
    await expect(link).not.toHaveAttribute("role", "button");
    const action = canvas.getByRole("button", { name: "Apply filter" });
    await expect(renderedRef.current).toBe(action);
    await expect(childRef.current).toBe(action);
    await expect(action.tagName).toBe("BUTTON");
    await expect(action).toHaveAttribute("id", "rendered-action");
    await expect(action).toHaveClass("align-middle", "self-start");
    await expect(action).toHaveStyle({ minWidth: "120px", textDecorationLine: "underline" });
    await userEvent.click(action);
    await userEvent.keyboard("{Enter} ");
    await expect(renderedAction).toHaveBeenCalledTimes(3);
    await expect(childAction).toHaveBeenCalledTimes(3);
    const disabled = canvas.getByRole("button", { name: "Unavailable action" });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute("data-render-disabled", "true");
    await expect(disabled).toHaveClass("cursor-not-allowed");
    await expect(disabled).toHaveStyle({ minWidth: "160px" });
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    const loading = canvas.getByRole("button", { name: "Updating results" });
    await expect(loading.tagName).toBe("DIV");
    await expect(loading).toHaveAttribute("aria-disabled", "true");
    loading.focus();
    await userEvent.click(loading);
    await userEvent.keyboard("{Enter} ");
    await expect(loading).toHaveFocus();
    await expect(blockedAction).not.toHaveBeenCalled();
  },
};

export const Playground: Story = { args: { variant: "primary", size: "medium" } };
