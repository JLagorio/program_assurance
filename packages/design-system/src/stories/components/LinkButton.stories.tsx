import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, ExternalLink, FileText, Plus } from "lucide-react";
import { createRef, forwardRef, useState, type ComponentProps, type MouseEvent } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button, LinkButton, LinkIconButton, TextLink } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/LinkButton",
  component: LinkButton,
  parameters: { layout: "padded" },
  args: { children: "View requirements", href: "#requirements" },
} satisfies Meta<typeof LinkButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["primary", "secondary", "subtle", "danger"] as const;
const sizes = ["medium", "small", "xsmall"] as const;
const openTip = () => document.querySelector('[data-slot="tooltip-content"][data-open]');

/** The four variants in the three sizes, with icons on either side. Each one is an anchor. */
export const Matrix: Story = {
  tags: ["matrix"],
  render: () => (
    <Stack space="space.300">
      {variants.map((variant) => (
        <Specimens key={variant} title={variant}>
          {sizes.map((size) => (
            <LinkButton
              key={size}
              href={`#${variant}-${size}`}
              variant={variant}
              size={size}
              data-testid={`${variant}-${size}`}
            >
              {size}
            </LinkButton>
          ))}
          <LinkButton href="#new" variant={variant} iconBefore={<Plus />}>
            New program
          </LinkButton>
          <LinkButton href="#next" variant={variant} iconAfter={<ArrowRight />}>
            Continue to review
          </LinkButton>
        </Specimens>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      for (const [index, size] of sizes.entries()) {
        const link = canvas.getByTestId(`${variant}-${size}`);
        await expect(link.tagName).toBe("A");
        await expect(link).toHaveAttribute("href", `#${variant}-${size}`);
        await expect(link).toHaveAttribute("data-slot", "link-button");
        await expect(link).not.toHaveAttribute("role");
        await expect(link.getBoundingClientRect().height).toBe([32, 28, 24][index]);
      }
    }
    for (const link of canvas.getAllByRole("link", {
      name: /^(New program|Continue to review)$/,
    })) {
      const icon = link.querySelector("svg")!;
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      await expect(icon.getBoundingClientRect().width).toBe(14);
    }
    // The icon side takes the smaller inset, as on Button.
    const before = canvas.getAllByRole("link", { name: "New program" })[0]!;
    const after = canvas.getAllByRole("link", { name: "Continue to review" })[0]!;
    await expect(getComputedStyle(before).paddingInlineStart).toBe("8px");
    await expect(getComputedStyle(before).paddingInlineEnd).toBe("12px");
    await expect(getComputedStyle(after).paddingInlineEnd).toBe("8px");
  },
};

// A router adapter forwards the props and the ref it receives to its anchor, as a router's Link
// does. This one keeps the demonstration in the canvas.
const DemoRouterLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<"a">, "href"> & { to: string }
>(function DemoRouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} {...props} />;
});

const routerCalls = {
  link: fn(),
  adapter: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
};
const routerRef = createRef<HTMLAnchorElement>();

/**
 * A router link comes in through `render`. The anchor keeps the router's href and handlers and
 * LinkButton's look; nothing is a Base UI Button, so no native-button error reaches the console.
 */
export const RouterLink: Story = {
  render: () => (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <LinkButton
        ref={routerRef}
        variant="primary"
        iconBefore={<Plus />}
        onClick={routerCalls.link}
        render={<DemoRouterLink to="#programs-new" onClick={routerCalls.adapter} />}
      >
        Create program
      </LinkButton>
      <LinkButton render={<DemoRouterLink to="#my-work" onClick={routerCalls.adapter} />}>
        Open my work
      </LinkButton>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    routerCalls.link.mockClear();
    routerCalls.adapter.mockClear();
    const create = canvas.getByRole("link", { name: "Create program" });
    await expect(routerRef.current).toBe(create);
    await expect(create.tagName).toBe("A");
    await expect(create).toHaveAttribute("href", "#programs-new");
    await expect(create).not.toHaveAttribute("role");
    await expect(create).not.toHaveAttribute("type");
    await userEvent.click(create);
    await expect(routerCalls.link).toHaveBeenCalledTimes(1);
    await expect(routerCalls.adapter).toHaveBeenCalledTimes(1);
    create.focus();
    await userEvent.keyboard("{Enter}");
    await expect(routerCalls.adapter).toHaveBeenCalledTimes(2);
    // Space scrolls a page; it never follows a link, and LinkButton does not make it.
    await userEvent.keyboard(" ");
    await expect(routerCalls.adapter).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Open my work" })).toHaveFocus();
  },
};

/**
 * LinkIconButton is the icon-only form: a required `label` names it and shows in its tooltip on
 * hover and focus. Opening a record in a new tab is the usual case.
 */
export const IconOnly: Story = {
  name: "LinkIconButton",
  render: () => (
    <Inline space="space.100" alignBlock="center">
      <LinkIconButton
        href="#ctrl-0412"
        target="_blank"
        rel="noreferrer"
        label="Open CTRL-0412 in a new tab"
        icon={<ExternalLink />}
        variant="subtle"
      />
      <LinkIconButton href="#report" label="Open the report" icon={<FileText />} size="medium" />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole("link", { name: "Open CTRL-0412 in a new tab" });
    await expect(open).toHaveAttribute("href", "#ctrl-0412");
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(open).toHaveAttribute("data-slot", "link-icon-button");
    await expect(open.getBoundingClientRect().width).toBe(28);
    await expect(open.getBoundingClientRect().height).toBe(28);
    await expect(open).toHaveClass("touch-target");
    await userEvent.tab();
    await expect(open).toHaveFocus();
    await waitFor(() => expect(openTip()).toHaveTextContent("Open CTRL-0412 in a new tab"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
    const report = canvas.getByRole("link", { name: "Open the report" });
    await expect(report.getBoundingClientRect().width).toBe(32);
    await expect(getComputedStyle(report.querySelector("svg")!).width).toBe("16px");
  },
};

const unavailable = fn();

/**
 * A destination that is not ready says why. `disabledReason` takes the href away and keeps the
 * link in the tab order as a disabled link; the reason is its description and shows in a tooltip
 * on hover, focus and a tap. The router link in `render` is not rendered while it is set.
 */
export const DisabledWithAReason: Story = {
  name: "Disabled with a reason",
  render: () => (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <LinkButton
        variant="primary"
        iconAfter={<ArrowRight />}
        disabledReason="The report is ready once the assessment closes."
        onClick={unavailable}
        render={<DemoRouterLink to="#report" onClick={unavailable} />}
      >
        View report
      </LinkButton>
      <LinkIconButton
        label="Open the evidence file"
        icon={<FileText />}
        href="#evidence"
        disabledReason="The file is still being scanned."
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    unavailable.mockClear();
    const report = canvas.getByRole("link", { name: "View report" });
    await expect(report.tagName).toBe("A");
    await expect(report).not.toHaveAttribute("href");
    await expect(report).toHaveAttribute("aria-disabled", "true");
    await expect(report).toHaveAccessibleDescription(
      "The report is ready once the assessment closes.",
    );
    await userEvent.tab();
    await expect(report).toHaveFocus();
    await waitFor(() =>
      expect(openTip()).toHaveTextContent("The report is ready once the assessment closes."),
    );
    await userEvent.click(report);
    await userEvent.keyboard("{Enter}");
    await expect(unavailable).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
    await userEvent.pointer([{ keys: "[TouchA]", target: report }]);
    await waitFor(() =>
      expect(openTip()).toHaveTextContent("The report is ready once the assessment closes."),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openTip()).toBeNull());
    const file = canvas.getByRole("link", { name: "Open the evidence file" });
    await expect(file).not.toHaveAttribute("href");
    await expect(file).toHaveAccessibleDescription("The file is still being scanned.");
    await userEvent.tab();
    await expect(file).toHaveFocus();
    await waitFor(() => expect(openTip()).toHaveTextContent("Open the evidence file"));
    await expect(openTip()).toHaveTextContent("The file is still being scanned.");
  },
};

const followReport = fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault());

function ReportWhenReady() {
  const [ready, setReady] = useState(false);
  return (
    <LinkButton
      disabledReason={ready ? undefined : "The report is ready once the assessment closes."}
      onFocus={() => setTimeout(() => setReady(true), 50)}
      render={<DemoRouterLink to="#report" onClick={followReport} />}
    >
      View report
    </LinkButton>
  );
}

/**
 * A destination that becomes available while the reader is on it keeps their focus: the link
 * gets its href and the router link back, and focus stays on it.
 */
export const ReasonChangesWhileFocused: Story = {
  name: "A reason that changes while focused",
  render: () => <ReportWhenReady />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    followReport.mockClear();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "View report" })).toHaveFocus();
    await waitFor(() =>
      expect(canvas.getByRole("link", { name: "View report" })).toHaveAttribute("href", "#report"),
    );
    const report = canvas.getByRole("link", { name: "View report" });
    await expect(report).toHaveFocus();
    await expect(report).not.toHaveAttribute("aria-disabled");
    await userEvent.keyboard("{Enter}");
    await expect(followReport).toHaveBeenCalledTimes(1);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <LinkButton href="#requirements" variant="primary">
            View requirements
          </LinkButton>
        }
        doText="Navigation is a LinkButton: a real anchor the reader can open in a new tab."
        dont={
          <Button variant="primary" onClick={() => undefined}>
            View requirements
          </Button>
        }
        dontText="A Button that navigates from onClick has no href, so it cannot be middle-clicked, copied or opened in a new tab."
      />
      <Pair
        do={
          <Text size="small">
            The control maps to <TextLink href="#ac-2">AC-2</TextLink> in the baseline.
          </Text>
        }
        doText="A link inside a sentence is a TextLink."
        dont={
          <Text size="small">
            The control maps to{" "}
            <LinkButton href="#ac-2" size="xsmall">
              AC-2
            </LinkButton>{" "}
            in the baseline.
          </Text>
        }
        dontText="A button-shaped link breaks the line and outweighs the words around it."
      />
    </Stack>
  ),
};

export const Playground: Story = { args: { variant: "primary", size: "medium" } };
