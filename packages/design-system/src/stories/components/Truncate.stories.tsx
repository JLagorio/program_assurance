import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, TextLink, Truncate, useIsTruncated } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Truncate",
  component: Truncate,
  parameters: { layout: "padded" },
  args: {
    maxLines: 1,
    children: "Automated temporary and emergency account management for privileged users",
  },
  decorators: [
    (Story) => (
      <Box style={{ maxWidth: 280 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Truncate>;
export default meta;
type Story = StoryObj<typeof meta>;

const longName = "Automated temporary and emergency account management for privileged users";
const statement =
  "Accounts inactive for 90 days are disabled automatically by the identity provider; exceptions need a ticket approved by the system owner and are reviewed every quarter by the assessor.";

/** The tooltip that reveals a cut text, once it has opened. */
const revealed = () =>
  waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
    expect(popup).not.toBeNull();
    return popup!;
  });
const noReveal = async () => {
  // The provider's hover delay is 300ms; wait past it before saying nothing opened.
  await new Promise((resolve) => setTimeout(resolve, 450));
  await expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull();
};
const closed = () =>
  waitFor(() => expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull());

/** One line, two and three, cut in a narrow column; a text that fits stays as it is and reveals nothing. */
export const TruncateMatrix: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Stack space="space.300">
      <Specimens title="maxLines 1 · 2 · 3, in a 240px column">
        {([1, 2, 3] as const).map((lines) => (
          <Box
            key={lines}
            backgroundColor="elevation.surface.sunken"
            padding="space.100"
            className="rounded-medium"
            style={{ width: 240, maxWidth: "100%" }}
          >
            <Text size="small">
              <Truncate maxLines={lines}>{statement}</Truncate>
            </Text>
          </Box>
        ))}
      </Specimens>
      <Specimens title="A name that fits: nothing to reveal">
        <Box style={{ width: 240, maxWidth: "100%" }}>
          <Truncate>Boundary protection</Truncate>
        </Box>
      </Specimens>
      <Specimens title="A record name inside a link">
        <Box style={{ width: 240, maxWidth: "100%" }}>
          <TextLink href="#ac-2">
            <Truncate>{longName}</Truncate>
          </TextLink>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Hovering a cut text shows the whole of it; the tooltip is hidden from a screen reader, which already reads the full text. */
export const RevealsOnHover: Story = {
  render: () => <Truncate data-testid="cut">{longName}</Truncate>,
  play: async ({ canvas }) => {
    const cut = canvas.getByTestId("cut");
    await expect(cut).toHaveAttribute("data-slot", "truncate");
    await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
    await expect(getComputedStyle(cut).textOverflow).toBe("ellipsis");
    await expect(cut).toHaveTextContent(longName);
    await userEvent.hover(cut);
    const popup = await revealed();
    await expect(popup).toHaveTextContent(longName);
    await expect(popup).toHaveAttribute("aria-hidden", "true");
    await userEvent.unhover(cut);
    await closed();
  },
};

/** A text that fits is left alone: no tooltip on hover. */
export const FitsWithoutReveal: Story = {
  render: () => <Truncate data-testid="fits">Boundary protection</Truncate>,
  play: async ({ canvas }) => {
    const fits = canvas.getByTestId("fits");
    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth + 1);
    await userEvent.hover(fits);
    await noReveal();
  },
};

/**
 * A name inside a link reveals when the link takes keyboard focus, so a keyboard reader can see
 * the whole name from the list. Escape and leaving the link close it; a pointer click does not
 * open it.
 */
export const RevealsOnKeyboardFocus: Story = {
  render: () => (
    <Stack space="space.100">
      <TextLink href="#ac-2">
        <Truncate>{longName}</Truncate>
      </TextLink>
      <TextLink href="#ac-3">Access enforcement</TextLink>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: longName });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    const popup = await revealed();
    await expect(popup).toHaveTextContent(longName);
    await userEvent.keyboard("{Escape}");
    await closed();
    await expect(link).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await revealed();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Access enforcement" })).toHaveFocus();
    await closed();
  },
};

/** A control inside a cut value reveals it on keyboard focus: the Truncate is the value, the link is in it. */
export const ControlInside: Story = {
  render: () => (
    <Truncate>
      REQ-001 ·{" "}
      <TextLink href="#req-001">AC enforcement requirement for the tactical edge segment</TextLink>
    </Truncate>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link")).toHaveFocus();
    const popup = await revealed();
    await expect(popup).toHaveTextContent(
      "REQ-001 · AC enforcement requirement for the tactical edge segment",
    );
    await userEvent.tab();
    await closed();
  },
};

/** A `title` of your own is the reveal: it stays on the element, and no second, drawn tooltip opens. */
export const OwnTitle: Story = {
  render: () => (
    <Truncate data-testid="titled" title="Account management, as the catalog names it">
      {longName}
    </Truncate>
  ),
  play: async ({ canvas }) => {
    const titled = canvas.getByTestId("titled");
    await expect(titled).toHaveAttribute("title", "Account management, as the catalog names it");
    await userEvent.hover(titled);
    await noReveal();
  },
};

/** `fullText` sets what the reveal shows, for a value whose text is not the words to read in full. */
export const FullText: Story = {
  render: () => (
    <Truncate data-testid="short" fullText="AC-2(3) Disable accounts: 90 days of inactivity">
      AC-2(3) Disable accounts after ninety days of inactivity, enforced by the identity provider
    </Truncate>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByTestId("short"));
    const popup = await revealed();
    await expect(popup).toHaveTextContent("AC-2(3) Disable accounts: 90 days of inactivity");
  },
};

/** `render` makes the truncating element another one, here a paragraph, keeping its own display. */
export const RenderedAs: Story = {
  render: () => (
    <Truncate maxLines={2} render={<p className="font-body-small text-subtle" />}>
      {statement}
    </Truncate>
  ),
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector("p")!;
    await expect(paragraph).toHaveAttribute("data-slot", "truncate");
    await expect(paragraph).toHaveAttribute("data-max-lines", "2");
    await expect(paragraph).toHaveClass("font-body-small", "line-clamp-2");
    await expect(paragraph.scrollHeight).toBeGreaterThan(paragraph.clientHeight);
  },
};

function Measured() {
  const ref = useRef<HTMLSpanElement>(null);
  const [wide, setWide] = useState(false);
  const truncated = useIsTruncated(ref);
  return (
    <Stack space="space.100">
      <Box style={{ maxWidth: wide ? "100%" : 120 }}>
        <span ref={ref} className="block truncate">
          Account management for users
        </span>
      </Box>
      <Text size="small" color="color.text.subtle" aria-live="polite">
        {truncated ? "Cut" : "Whole"}
      </Text>
      <Button size="small" variant="secondary" onClick={() => setWide((w) => !w)}>
        {wide ? "Narrow the column" : "Widen the column"}
      </Button>
    </Stack>
  );
}

/** `useIsTruncated` reports whether an element you truncate yourself is cut, and follows its width. */
export const UseIsTruncatedHook: Story = {
  render: () => <Measured />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Cut")).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Widen the column" }));
    await waitFor(() => expect(canvas.getByText("Whole")).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Narrow the column" }));
    await waitFor(() => expect(canvas.getByText("Cut")).toBeInTheDocument());
  },
};

/** Right to left: the ellipsis sits at the logical end. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar">
      <Truncate data-testid="rtl">إدارة الحسابات المؤقتة والطارئة الآلية للمستخدمين ذوي الامتيازات</Truncate>
    </div>
  ),
  play: async ({ canvas }) => {
    const cut = canvas.getByTestId("rtl");
    await expect(getComputedStyle(cut).direction).toBe("rtl");
    await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ maxWidth: 240 }}>
            <Truncate>{longName}</Truncate>
          </Box>
        }
        doText="A name in a row truncates, and the whole of it is a hover or a keyboard focus away."
        dont={
          <Box style={{ maxWidth: 240 }}>
            <span className="block truncate">{longName}</span>
          </Box>
        }
        dontText="A bare `truncate`. The end of the name is gone for anyone who cannot open the record."
      />
      <Pair
        do={
          <Box style={{ maxWidth: 240 }}>
            <Text as="p" size="small">
              {statement}
            </Text>
          </Box>
        }
        doText="A statement wraps. It is read, not scanned."
        dont={
          <Box style={{ maxWidth: 240 }}>
            <Text size="small">
              <Truncate>{statement}</Truncate>
            </Text>
          </Box>
        }
        dontText="A statement cut to a line. A tooltip is for a name that does not fit, not for a paragraph."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

/** A cut name in a table cell's link keeps the link's focus ring whole: one line clips across only. */
export const FocusRingStaysWhole: Story = {
  render: () => (
    <Box style={{ maxWidth: 200 }}>
      <TextLink href="#ac-2">
        <Truncate>{longName}</Truncate>
      </TextLink>
    </Box>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link");
    const cut = within(link).getByText(longName);
    await expect(getComputedStyle(cut).overflowX).toBe("clip");
    await expect(getComputedStyle(cut).overflowY).toBe("visible");
  },
};
