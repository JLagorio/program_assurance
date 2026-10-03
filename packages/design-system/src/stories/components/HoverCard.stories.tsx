import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Glance } from "../..";
import {
  Badge,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Table,
  TextLink,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Grid, Stack, Text } from "../../primitives";

import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const triggerRef = createRef<HTMLAnchorElement>();
const renderedTriggerRef = createRef<HTMLAnchorElement>();
const contentRef = createRef<HTMLDivElement>();
const renderedContentRef = createRef<HTMLDivElement>();
const triggerClick = fn();
const renderedClick = fn();

/** A TextLink trigger, the usual composition, with the card centred under it. */
export const Playground: Story = {
  name: "Basic",
  render: (args) => (
    <div style={{ height: 240 }} className="flex items-center justify-center">
      <HoverCard {...args}>
        <TextLink render={<HoverCardTrigger href="#review-guide" />}>Review guide</TextLink>
        <HoverCardContent>How to prepare evidence and schedule a control review.</HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const trigger = canvas.getByRole("link", { name: "Review guide" });
    await user.tab();
    await expect(trigger).toHaveFocus();
    const card = await body.findByText("How to prepare evidence and schedule a control review.");
    const popup = card.closest<HTMLElement>('[data-slot="hover-card-content"]')!;
    await waitFor(() => expect(popup).toBeVisible());
    // Centred on its trigger with no offset along it, and capped at the room the window leaves.
    await waitFor(() => {
      const box = popup.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      expect(Math.abs(box.left + box.width / 2 - (anchor.left + anchor.width / 2))).toBeLessThan(1);
    });
    await expect(popup.style.maxHeight).toBe("var(--available-height)");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup).not.toBeInTheDocument());
  },
};

/** Default positioning and a logical side under RTL; native render props and refs remain usable. */
export const HoverCardMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid
      // Two columns where they fit; one in a narrow frame, so a link wraps between its words.
      templateColumns="repeat(auto-fit, minmax(min(12rem, 100%), 1fr))"
      gap="space.400"
      style={{ padding: 100, minHeight: 280 }}
    >
      <HoverCard defaultOpen>
        <HoverCardTrigger
          ref={triggerRef}
          render={
            <a
              ref={renderedTriggerRef}
              href="#review-guide"
              title="Read the review guide"
              onClick={renderedClick}
            />
          }
          onClick={triggerClick}
          className="text-brand hover:underline"
        >
          Review guide
        </HoverCardTrigger>
        <HoverCardContent
          ref={contentRef}
          data-testid="review-guide-preview"
          render={
            <div ref={renderedContentRef} className="tabular-nums" style={{ minHeight: 72 }} />
          }
          className={(state) => (state.open ? "font-medium" : "font-regular")}
          style={(state) => ({ outlineOffset: state.open ? 4 : 2 })}
        >
          How to prepare evidence and schedule a control review.
        </HoverCardContent>
      </HoverCard>
      <LedgerProvider direction="rtl">
        <HoverCard defaultOpen>
          <HoverCardTrigger href="#review-calendar" className="text-brand hover:underline">
            Review calendar
          </HoverCardTrigger>
          <HoverCardContent
            side="inline-end"
            align="start"
            alignOffset={0}
            style={{ width: 220 }}
            data-testid="review-calendar-preview"
          >
            Upcoming review dates and program milestones.
          </HoverCardContent>
        </HoverCard>
      </LedgerProvider>
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    triggerClick.mockClear();
    renderedClick.mockClear();
    const trigger = canvas.getByRole("link", { name: "Review guide" });
    const content = await body.findByTestId("review-guide-preview");
    await expect(triggerRef.current).toBe(trigger);
    await expect(renderedTriggerRef.current).toBe(trigger);
    await expect(trigger).toHaveAttribute("href", "#review-guide");
    await expect(trigger).toHaveAttribute("title", "Read the review guide");
    await expect(trigger).toHaveAttribute("data-slot", "hover-card-trigger");
    await expect(contentRef.current).toBe(content);
    await expect(renderedContentRef.current).toBe(content);
    await expect(content).toHaveAttribute("data-slot", "hover-card-content");
    await expect(content).toHaveAttribute("data-side", "bottom");
    await expect(content).toHaveAttribute("data-align", "center");
    await expect(content).toHaveAttribute("tabindex", "-1");
    await expect(content).toHaveClass("font-medium", "tabular-nums");
    await expect(content).toHaveStyle({ minHeight: "72px", outlineOffset: "4px" });
    await expect(canvasElement).not.toContainElement(content);
    await waitFor(() => expect(content.getBoundingClientRect().width).toBe(256));
    const rtl = await body.findByTestId("review-calendar-preview");
    const rtlTrigger = canvas.getByRole("link", { name: "Review calendar" });
    // A bare trigger draws the kit's focus ring, not the browser's.
    rtlTrigger.focus({ focusVisible: true } as FocusOptions);
    await waitFor(() => expect(getComputedStyle(rtlTrigger).outlineStyle).toBe("solid"));
    rtlTrigger.blur();
    // Inline-end is the left in RTL. Where the window leaves no room there (a phone, a narrow
    // frame), the card flips to stay on screen instead.
    if (rtlTrigger.getBoundingClientRect().left >= rtl.getBoundingClientRect().width + 32) {
      await waitFor(() =>
        expect(rtl.getBoundingClientRect().right).toBeLessThanOrEqual(
          rtlTrigger.getBoundingClientRect().left,
        ),
      );
    } else {
      await waitFor(() => expect(rtl.getBoundingClientRect().left).toBeGreaterThanOrEqual(0));
      await expect(rtl.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    }
    const navigation = fn();
    const observeNavigation = (event: MouseEvent) => {
      if (event.target instanceof Node && trigger.contains(event.target)) {
        navigation(event.defaultPrevented);
        event.preventDefault();
      }
    };
    canvasElement.ownerDocument.addEventListener("click", observeNavigation);
    try {
      await userEvent.click(trigger);
      await expect(navigation).toHaveBeenLastCalledWith(false);
      await expect(triggerClick).toHaveBeenCalledTimes(1);
      await expect(renderedClick).toHaveBeenCalledTimes(1);
      await userEvent.keyboard("{Enter}");
      await expect(navigation).toHaveBeenCalledTimes(2);
      await expect(navigation).toHaveBeenLastCalledWith(false);
      await expect(triggerClick).toHaveBeenCalledTimes(2);
      await expect(renderedClick).toHaveBeenCalledTimes(2);
    } finally {
      canvasElement.ownerDocument.removeEventListener("click", observeNavigation);
    }
  },
};

const rows = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    owner: "Dana Whitfield",
    preview: true,
  },
  {
    id: "CTRL-0418",
    name: "Vendor master change approval",
    owner: "Dana Whitfield",
    preview: true,
  },
  { id: "CTRL-0450", name: "Privileged access review", owner: "Priya Natarajan", preview: false },
];
/** The id remains a link; pointer and keyboard previews share the same destination facts. */
export const OnAnId: Story = {
  name: "On an id",
  render: () => (
    <div style={{ maxWidth: 600, minHeight: 320 }}>
      <Stack space="space.200">
        <Text weight="medium">Control register</Text>
        <HoverCard<(typeof rows)[number]>
          onOpenChange={(open, details) => {
            if (open && details.trigger?.getAttribute("data-preview") === "unavailable")
              details.cancel();
          }}
        >
          {({ payload }) => (
            <>
              <Table label="Controls">
                <thead>
                  <Table.Row>
                    <Table.Header width={120}>Id</Table.Header>
                    <Table.Header minWidth={220}>Control</Table.Header>
                    <Table.Header width={160}>Owner</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <Table.Row key={row.id}>
                      <Table.Cell>
                        <TextLink
                          render={
                            <HoverCardTrigger
                              href={`#${row.id}`}
                              payload={row}
                              data-preview={row.preview ? "available" : "unavailable"}
                              delay={80}
                              closeDelay={80}
                            />
                          }
                        >
                          {row.id}
                        </TextLink>
                      </Table.Cell>
                      <Table.Cell
                        title={row.preview ? row.name : `${row.name}. Open the record for details.`}
                      >
                        {row.name}
                        {!row.preview ? (
                          <>
                            {" "}
                            <Text size="small" color="color.text.subtle">
                              Open the record for details.
                            </Text>
                          </>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>{row.owner}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
              <HoverCardContent
                style={{ width: 300 }}
                data-testid={payload ? `preview-${payload.id}` : undefined}
              >
                {payload ? (
                  <Glance
                    id={payload.id}
                    title={payload.name}
                    meta={`Finance · ${payload.owner}`}
                    status={
                      <Badge variant="secondary" tone="success">
                        Verified
                      </Badge>
                    }
                    facts={[{ label: "Next review", value: "14 Sep 2026" }]}
                  />
                ) : null}
              </HoverCardContent>
            </>
          )}
        </HoverCard>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("link", { name: "CTRL-0412" });
    const away = canvas.getByText("Control register");
    const moveTo = async (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      await user.pointer({
        target,
        coords: { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 },
      });
    };
    await moveTo(trigger);
    const popup = await body.findByTestId("preview-CTRL-0412");
    await waitFor(() => expect(popup).toBeVisible());
    // The card records the overlay surface as the current one for what sits on it.
    const surface = popup.closest<HTMLElement>('[data-slot="hover-card-content"]');
    await expect(surface?.style.getPropertyValue("--ds-utility-elevation-surface-current")).toBe(
      "var(--ds-elevation-surface-overlay)",
    );
    await moveTo(popup);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await expect(popup).toBeVisible();
    await moveTo(away);
    await waitFor(() => expect(body.queryByTestId("preview-CTRL-0412")).not.toBeInTheDocument());
    await user.tab();
    trigger.focus();
    await waitFor(() => expect(body.getByTestId("preview-CTRL-0412")).toBeVisible());
    await expect(trigger).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByTestId("preview-CTRL-0412")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await user.tab();
    const second = canvas.getByRole("link", { name: "CTRL-0418" });
    await expect(second).toHaveFocus();
    await waitFor(() => expect(body.getByTestId("preview-CTRL-0418")).toBeVisible());
    await expect(body.getByTestId("preview-CTRL-0418")).toHaveTextContent(
      "Vendor master change approval",
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByTestId("preview-CTRL-0418")).not.toBeInTheDocument());
    // A row with nothing to preview cancels the open: focus reaches its link and no card follows,
    // several times the 80ms the others take.
    await user.tab();
    await expect(canvas.getByRole("link", { name: "CTRL-0450" })).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(body.queryByTestId("preview-CTRL-0450")).not.toBeInTheDocument();
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="hover-card-content"]'),
    ).toBeNull();
    await moveTo(away);
  },
};

/**
 * The trigger is a link to the record, so a keyboard reaches it and a touch follows it, and the card
 * only adds a peek. Plain text that holds the card is reached by a pointer alone, and an action in
 * the card is out of reach for everyone else.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <HoverCard>
          <TextLink render={<HoverCardTrigger href="#ctrl-0412" />}>CTRL-0412</TextLink>
          <HoverCardContent>
            <Stack space="space.050">
              <Text weight="semibold">Account management</Text>
              <Text size="small">Implemented · Owner Dana Whitfield</Text>
            </Stack>
          </HoverCardContent>
        </HoverCard>
      }
      doText="A link to the record holds the card: the peek adds to a destination every reader can reach."
      dont={
        <HoverCard>
          <HoverCardTrigger>CTRL-0450</HoverCardTrigger>
          <HoverCardContent>
            <Stack space="space.100">
              <Text weight="semibold">Audit review</Text>
              <Button size="small">Assign to me</Button>
            </Stack>
          </HoverCardContent>
        </HoverCard>
      }
      dontText="Plain text holds the card and the card holds an action: a keyboard or a touch never opens it."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "CTRL-0412" });
    await expect(link).toHaveAttribute("href", "#ctrl-0412");
    link.focus();
    await expect(link).toHaveFocus();
    link.blur();
    // The text that holds the other card is no link and takes no focus.
    const text = canvas.getByText("CTRL-0450");
    await expect(canvas.queryByRole("link", { name: "CTRL-0450" })).toBeNull();
    text.focus();
    await expect(text).not.toHaveFocus();
  },
};
