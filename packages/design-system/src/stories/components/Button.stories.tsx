import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  getModifierKey,
  Input,
  KeyValue,
  LinkButton,
  TextLink,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as direction from "../_lib/direction";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;
const { along } = direction;

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Schedule assessment" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["primary", "secondary", "subtle", "danger", "link"] as const;
const sizes = ["large", "medium", "small", "xsmall"] as const;

/** The variants and sizes, plus disabled, selected, loading and icon placement. */
export const Matrix: Story = {
  tags: ["!manifest"],
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
          await expect(button.getBoundingClientRect().height).toBe([36, 32, 28, 24][index]);
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
    // Forced colours remove the fill and the raised shadow that draw a bounded button's edge, so
    // primary, secondary and danger keep a ButtonText outline; subtle and link have none to keep.
    if (matchMedia("(forced-colors: active)").matches)
      for (const variant of variants) {
        const outline = getComputedStyle(canvas.getByTestId(`${variant}-medium`)).outlineStyle;
        await expect(outline).toBe(variant === "subtle" || variant === "link" ? "none" : "solid");
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

export const Playground: Story = { args: { variant: "primary", size: "medium" } };

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

function RevisionFooter() {
  const [saving, setSaving] = useState<string | null>(null);
  const hold = (name: string) => () => {
    setSaving(name);
    setTimeout(() => setSaving(null), 1500);
  };
  return (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <Button
        variant="primary"
        isLoading={saving === "revision"}
        loadingLabel="Saving requirement revision"
        onClick={hold("revision")}
      >
        Create requirement revision
      </Button>
      <Button
        iconBefore={<Download />}
        isLoading={saving === "export"}
        loadingLabel="Exporting the report"
        onClick={hold("export")}
      >
        Export report
      </Button>
      <Button iconAfter={<ArrowRight />} isLoading={saving === "next"} onClick={hold("next")}>
        Continue to review
      </Button>
    </Inline>
  );
}

const politeRegion = () =>
  document.querySelector<HTMLElement>('[data-slot="announcer-region"][data-politeness="polite"]');

/**
 * Loading never moves the footer: the spinner takes the leading icon's place, else the trailing
 * icon's, else it sits over the label, which keeps its space and stays the name. `loadingLabel`
 * says what started through the page's polite live region, since `aria-busy` alone is silent.
 */
export const LoadingKeepsItsWidth: Story = {
  name: "Loading keeps its width and says so",
  render: () => <RevisionFooter />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, spinnerSide] of [
      ["Create requirement revision", "over"],
      ["Export report", "inline-start"],
      ["Continue to review", "inline-end"],
    ] as const) {
      const button = canvas.getByRole("button", { name });
      const before = button.getBoundingClientRect();
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toHaveFocus();
      await expect(button).toHaveAccessibleName(name);
      const during = button.getBoundingClientRect();
      await expect(during.width).toBe(before.width);
      await expect(during.height).toBe(before.height);
      if (spinnerSide === "over") {
        const spinner = button.querySelector('[data-slot="button-loading-spinner"] svg')!;
        const box = spinner.getBoundingClientRect();
        await expect(Math.abs(box.x + box.width / 2 - (during.x + during.width / 2))).toBeLessThan(
          1,
        );
        await expect(
          getComputedStyle(button.querySelector('[data-slot="button-loading-label"]')!).opacity,
        ).toBe("0");
      } else {
        await expect(
          button.querySelector(`[data-slot="spinner"][data-icon="${spinnerSide}"]`),
        ).not.toBeNull();
      }
      await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"), { timeout: 2500 });
      await expect(button.getBoundingClientRect().width).toBe(before.width);
    }
    await waitFor(() =>
      expect(politeRegion()).toHaveTextContent(/Saving requirement revision.*Exporting the report/),
    );
  },
};

const publishAction = fn();
const openTooltip = () => document.querySelector('[data-slot="tooltip-content"][data-open]');

/**
 * An action that truly cannot run says why. `disabledReason` keeps it in the tab order with
 * `aria-disabled`: the reason is its accessible description, and it shows in a tooltip on hover,
 * on keyboard focus and on a tap. A plain `disabled` button beside it leaves the tab order and
 * explains nothing.
 */
export const DisabledWithAReason: Story = {
  name: "Disabled with a reason",
  render: () => (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <Button
        variant="primary"
        disabledReason="Add content to this version before publishing it."
        onClick={publishAction}
      >
        Publish version
      </Button>
      <Button variant="subtle" disabledReason="Only an owner can archive a program.">
        Archive
      </Button>
      <Button disabled>Duplicate</Button>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    publishAction.mockClear();
    const publish = canvas.getByRole("button", { name: "Publish version" });
    await expect(publish).toHaveAttribute("aria-disabled", "true");
    await expect(publish).toHaveAttribute("data-disabled");
    await expect(publish).not.toBeDisabled();
    await expect(publish).toHaveAccessibleName("Publish version");
    await expect(publish).toHaveAccessibleDescription(
      "Add content to this version before publishing it.",
    );
    // Keyboard: Tab reaches it, the reason shows, and nothing runs.
    await userEvent.tab();
    await expect(publish).toHaveFocus();
    await waitFor(() =>
      expect(openTooltip()).toHaveTextContent("Add content to this version before publishing it."),
    );
    await userEvent.keyboard("{Enter} ");
    await userEvent.click(publish);
    await expect(publishAction).not.toHaveBeenCalled();
    await expect(publish).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTooltip()).toBeNull());
    // Touch: a tap shows the reason, which a hover-only tooltip never would.
    await userEvent.pointer([{ keys: "[TouchA]", target: publish }]);
    await waitFor(() =>
      expect(openTooltip()).toHaveTextContent("Add content to this version before publishing it."),
    );
    await expect(publishAction).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTooltip()).toBeNull());
    // The subtle one keeps its disabled face under the pointer, and Tab reaches it too.
    const archive = canvas.getByRole("button", { name: "Archive" });
    await expect(archive).toHaveAccessibleDescription("Only an owner can archive a program.");
    await userEvent.tab();
    await expect(archive).toHaveFocus();
    // A plain disabled button is skipped.
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Duplicate" })).not.toHaveFocus();
  },
};

function PublishOnce() {
  const [published, setPublished] = useState(false);
  const [scanned, setScanned] = useState(false);
  return (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <Button
        variant="primary"
        disabledReason={published ? "This version is already published." : undefined}
        onClick={() => setPublished(true)}
      >
        Publish version
      </Button>
      <Button
        disabledReason={scanned ? undefined : "The file is still being scanned."}
        onFocus={() => setTimeout(() => setScanned(true), 50)}
      >
        Download file
      </Button>
    </Inline>
  );
}

/**
 * A reason that arrives or leaves while the button has focus changes nothing about where focus
 * is: publishing makes Publish unavailable and keeps focus on it, with the reason in its tooltip,
 * and a scan that finishes while the reader is on Download leaves them on an enabled Download.
 */
export const ReasonChangesWhileFocused: Story = {
  name: "A reason that changes while focused",
  render: () => <PublishOnce />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const publish = canvas.getByRole("button", { name: "Publish version" });
    await userEvent.tab();
    await expect(publish).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Publish version" })).toHaveAttribute(
        "aria-disabled",
        "true",
      ),
    );
    await expect(canvas.getByRole("button", { name: "Publish version" })).toHaveFocus();
    await waitFor(() =>
      expect(openTooltip()).toHaveTextContent("This version is already published."),
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Download file" })).not.toHaveAttribute(
        "aria-disabled",
      ),
    );
    await expect(canvas.getByRole("button", { name: "Download file" })).toHaveFocus();
  },
};

/** Labelled actions in a header and footer, including a destructive confirmation. */
export const Emphasis: Story = {
  tags: ["!manifest"],
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

/** Navigation is a LinkButton, a real anchor; render composes controls that keep button semantics. */
export const AsLink: Story = {
  tags: ["!manifest"],
  name: "Navigation and composition",
  render: () => (
    <Stack space="space.300">
      <Specimens title="Navigation: a LinkButton, an anchor or a router Link through render">
        <LinkButton href="#button-destination" variant="primary" iconAfter={<ArrowRight />}>
          View requirements
        </LinkButton>
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

/** The part keeps its drawn size and, where any pointer is coarse, takes a hit area of at least 24px. */
const expectTouchTarget = async (element: HTMLElement) => {
  await expect(element).toHaveClass("touch-target");
  await expect(getComputedStyle(element).position).not.toBe("static");
  if (matchMedia("(any-pointer: coarse)").matches) {
    const area = getComputedStyle(element, "::before");
    await expect(parseFloat(area.height)).toBeGreaterThanOrEqual(24);
    await expect(parseFloat(area.width)).toBeGreaterThanOrEqual(24);
  }
};

/**
 * A link-styled action is as tall as its text, so a list of conditions keeps its rhythm. On a
 * touch screen it takes an invisible hit area of at least 24px, centred on it; nothing moves.
 */
export const OnTouch: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <Stack space="space.100">
      {[
        ["Success criterion", "Add"],
        ["Linked findings", "Link a finding"],
      ].map(([label, action]) => (
        <Inline key={label} space="space.100" alignBlock="center" spread="space-between">
          <Text size="small">{label}</Text>
          <Button size="small" variant="link">
            {action}
          </Button>
        </Inline>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Add", "Link a finding"]) {
      const action = canvas.getByRole("button", { name });
      await expect(action.getBoundingClientRect().height).toBeLessThan(24);
      await expectTouchTarget(action);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Create risk</Button>
          </Inline>
        }
        doText="One primary for the region, named for what happens; the rest is secondary or subtle."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Button variant="primary">Save draft</Button>
            <Button variant="primary">OK</Button>
          </Inline>
        }
        dontText="Two primaries compete, and OK says nothing to a reader who lands on it."
      />
      <Pair
        do={
          <Button aria-describedby="saved-view-hint" iconAfter={<ChevronDown />}>
            All programs
          </Button>
        }
        doText="The visible words are the name; context goes in a description."
        dont={
          <Button aria-label="Saved questions" iconAfter={<ChevronDown />}>
            All programs
          </Button>
        }
        dontText="An aria-label that replaces the visible words: saying “click All programs” does nothing."
      />
      <Text id="saved-view-hint" size="small" color="color.text.subtle">
        Saved view
      </Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "All programs", description: "Saved view" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Saved questions" })).toHaveTextContent(
      "All programs",
    );
  },
};

/**
 * `truncate` is for a slot narrower than the label: the button narrows to its container and cuts
 * the label with an ellipsis, the whole label stays its name, and a tooltip shows it on keyboard
 * focus and hover while it is cut. A label that fits shows no tooltip.
 */
export const TruncatedLabel: Story = {
  name: "Truncated label in a narrow slot",
  render: () => (
    <div data-testid="slot" style={{ width: 180 }}>
      <Stack space="space.100">
        <Button truncate iconBefore={<Download />}>
          Export every requirement with its evidence
        </Button>
        <Button truncate isFullWidth variant="primary">
          Publish the assessment package for review
        </Button>
        <Button truncate>Export</Button>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slot = canvas.getByTestId("slot").getBoundingClientRect();
    const exportAll = canvas.getByRole("button", {
      name: "Export every requirement with its evidence",
    });
    const publish = canvas.getByRole("button", {
      name: "Publish the assessment package for review",
    });
    for (const button of [exportAll, publish]) {
      const box = button.getBoundingClientRect();
      await expect(box.right).toBeLessThanOrEqual(Math.ceil(slot.right));
      const label = button.querySelector<HTMLElement>('[data-slot="truncate"]')!;
      await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      // The icon keeps its size while the label gives way.
      const icon = button.querySelector("svg");
      if (icon) await expect(Math.round(icon.getBoundingClientRect().width)).toBe(14);
    }
    await expect(Math.round(publish.getBoundingClientRect().width)).toBe(Math.round(slot.width));
    // Keyboard focus shows the whole label while it is cut.
    await userEvent.tab();
    await expect(exportAll).toHaveFocus();
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="truncate-full-text"]'),
      ).toHaveTextContent("Export every requirement with its evidence"),
    );
    await userEvent.keyboard("{Escape}");
    // A label that fits is not cut and opens nothing.
    const fits = canvas.getByRole("button", { name: "Export" });
    const fitsLabel = fits.querySelector<HTMLElement>('[data-slot="truncate"]')!;
    await expect(fitsLabel.scrollWidth).toBeLessThanOrEqual(fitsLabel.clientWidth + 1);
  },
};

/** The lines an element's words sit on, top to bottom, as the page draws them. */
const lineBoxes = (el: Element) => {
  const range = el.ownerDocument.createRange();
  range.selectNodeContents(el);
  const lines: DOMRect[] = [];
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width < 0.5 || rect.height < 0.5) continue;
    if (!lines.some((line) => Math.abs(line.top - rect.top) < rect.height / 2)) lines.push(rect);
  }
  return lines;
};

const takeStep = fn();

/** A record's Details rail: a `default` label column and a value about 130px wide. */
function DetailsRail() {
  const [reading, setReading] = useState(false);
  return (
    <div data-testid="rail" style={{ width: 247 }}>
      <KeyValue.Group>
        <KeyValue label="Control status">Not assessed</KeyValue>
        <KeyValue label="Next step" wrap>
          <Button
            variant="link"
            isLoading={reading}
            onClick={() => {
              takeStep();
              setReading(true);
            }}
          >
            Add to assessment campaign
          </Button>
        </KeyValue>
        <KeyValue label="Evidence" wrap>
          <Button variant="link" disabledReason="Map a requirement to the control first.">
            Link evidence to a requirement
          </Button>
        </KeyValue>
        <KeyValue label="Enhances" wrap>
          <TextLink href="#account-management">AC-2 · Account Management</TextLink>
        </KeyValue>
      </KeyValue.Group>
    </div>
  );
}

/**
 * A link-styled action wraps like the text around it, as a TextLink does. In a rail's value, about
 * 130px wide, a step longer than the value goes on to the next line whole, its lines from the
 * value's start: nothing is cut and nothing paints past the value. Unavailable, it wraps the same
 * and says why; pressed, it keeps its box, its name and the focus while its work runs. Where the
 * text around it stays on one line, a table cell that cuts its value, it stays on one line too.
 */
export const LinkWraps: Story = {
  name: "Link wraps in a narrow value",
  render: () => <DetailsRail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    takeStep.mockClear();
    const step = canvas.getByRole("button", { name: "Add to assessment campaign" });
    const unavailable = canvas.getByRole("button", { name: "Link evidence to a requirement" });
    const link = canvas.getByRole("link", { name: "AC-2 · Account Management" });
    // The value is narrower than the step's words.
    await expect(step.closest("dd")!.getBoundingClientRect().width).toBeLessThan(140);
    for (const words of [step, unavailable, link]) {
      const value = words.closest("dd")!;
      const lines = lineBoxes(words);
      // More than one line, whole: every line starts at the value's start and ends inside it.
      await expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        await expect(Math.abs(along(words, line).start - along(value).start)).toBeLessThanOrEqual(
          1,
        );
        await expect(along(words, line).end).toBeLessThanOrEqual(along(value).end + 0.5);
      }
      await expect(along(words).end).toBeLessThanOrEqual(along(value).end + 0.5);
      await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth + 1);
    }
    for (const button of [step, unavailable]) {
      await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
      await expectTouchTarget(button);
    }
    // Unavailable, it stays in the tab order and says why.
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).toHaveAccessibleDescription(
      "Map a requirement to the control first.",
    );
    // Pressed, it keeps its box and its name while its work runs, and the focus stays on it.
    const before = step.getBoundingClientRect();
    await userEvent.click(step);
    await expect(takeStep).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(step).toHaveAttribute("aria-busy", "true"));
    const after = step.getBoundingClientRect();
    await expect(after.width).toBe(before.width);
    await expect(after.height).toBe(before.height);
    await expect(step).toHaveAccessibleName("Add to assessment campaign");
    await expect(step).toHaveFocus();
  },
};

/** The platform's shortcut modifier as user-event spells it: Command on Apple platforms, Control elsewhere. */
const modKey = () => (getModifierKey() === "meta" ? "Meta" : "Control");

/**
 * A signature, not an act. `intent="sign"` draws the button in ink at 36px, a signature mark before
 * the label and the signer's name after a rule, and reads them as one name ("Approve security plan as
 * R. Calloway"). Command+Enter (Control+Enter off Apple platforms) presses it from anywhere on the
 * page, which `aria-keyshortcuts` says; a bare Enter never does, and a field that takes text keeps
 * the keys for itself.
 */
export const Sign: Story = {
  args: { onClick: fn() },
  render: (args) => (
    <Stack space="space.200" alignInline="start">
      <Button intent="sign" signer="R. Calloway" onClick={args.onClick}>
        Approve security plan
      </Button>
      <Input aria-label="Note for the record" />
      <Button>Open conditions</Button>
    </Stack>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const signed = args.onClick as ReturnType<typeof fn>;
    signed.mockClear();
    const sign = canvas.getByRole("button", { name: "Approve security plan as R. Calloway" });
    await expect(sign).toHaveAttribute("data-button-variant", "sign");
    await expect(sign.getBoundingClientRect().height).toBe(36);
    await expect(sign).toHaveAttribute(
      "aria-keyshortcuts",
      getModifierKey() === "meta" ? "Meta+Enter" : "Control+Enter",
    );
    // The signer comes after the label, and the mark before it is decoration.
    const signer = sign.querySelector('[data-slot="button-signer"]')!;
    await expect(signer).toHaveTextContent("R. Calloway");
    await expect(signer.getBoundingClientRect().left).toBeGreaterThan(
      sign.querySelector("svg")!.getBoundingClientRect().right,
    );
    await expect(sign.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    // The ink fill is not a secondary's raised surface; in forced colours it keeps its edge.
    if (matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(sign).outlineStyle).toBe("solid");
    else
      await expect(getComputedStyle(sign).backgroundColor).not.toBe(
        getComputedStyle(canvas.getByRole("button", { name: "Open conditions" })).backgroundColor,
      );
    // A bare Enter on another control presses that control and never signs.
    const other = canvas.getByRole("button", { name: "Open conditions" });
    other.focus();
    await userEvent.keyboard("{Enter}");
    await expect(signed).not.toHaveBeenCalled();
    // With nothing focused, a bare Enter signs nothing either.
    other.blur();
    await userEvent.keyboard("{Enter}");
    await expect(signed).not.toHaveBeenCalled();
    // Command+Enter (Control+Enter elsewhere) signs, from anywhere on the page, once.
    const mod = modKey();
    other.focus();
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signed).toHaveBeenCalledTimes(1);
    await expect(other).toHaveFocus();
    sign.focus();
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signed).toHaveBeenCalledTimes(2);
    // Another modifier with it is another shortcut.
    other.focus();
    await userEvent.keyboard(`{Shift>}{${mod}>}{Enter}{/${mod}}{/Shift}`);
    await expect(signed).toHaveBeenCalledTimes(2);
    // A field that takes text keeps its Command+Enter.
    await userEvent.click(canvas.getByRole("textbox", { name: "Note for the record" }));
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signed).toHaveBeenCalledTimes(2);
  },
};

const signedOnPage = fn();
const signedInDialog = fn();

/** The page's sign opens its confirmation; the confirmation's own sign records it. */
function SignConfirmation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        intent="sign"
        signer="R. Calloway"
        onClick={() => {
          signedOnPage();
          setOpen(true);
        }}
      >
        Approve security plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent width="medium">
          <DialogHeader>
            <DialogTitle>Approve security plan</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Field orientation="horizontal">
              <Checkbox defaultChecked />
              <FieldLabel>I approve this plan with its 2 conditions</FieldLabel>
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
            <Button
              intent="sign"
              signer="R. Calloway"
              onClick={() => {
                signedInDialog();
                setOpen(false);
              }}
            >
              Approve security plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * A sign over a sign: the page's opens the confirmation, whose own sign records the signature. While
 * the dialog is open, Command+Enter presses the dialog's sign and never the page's behind it; a
 * checkbox does not take text, so the keys still sign from it.
 */
export const SignOverADialog: Story = {
  tags: ["!manifest"],
  name: "Sign over a dialog",
  render: () => <SignConfirmation />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    signedOnPage.mockClear();
    signedInDialog.mockClear();
    const mod = modKey();
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signedOnPage).toHaveBeenCalledTimes(1);
    const dialog = await within(document.body).findByRole("dialog", {
      name: "Approve security plan",
    });
    const checkbox = within(dialog).getByRole("checkbox", {
      name: "I approve this plan with its 2 conditions",
    });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    checkbox.focus();
    await userEvent.keyboard(`{${mod}>}{Enter}{/${mod}}`);
    await expect(signedInDialog).toHaveBeenCalledTimes(1);
    await expect(signedOnPage).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(
      canvas.getByRole("button", { name: "Approve security plan as R. Calloway" }),
    ).toBeVisible();
  },
};
