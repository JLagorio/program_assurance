import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUpRight, CircleCheck, TriangleAlert } from "lucide-react";
import { createRef, forwardRef, useState, type ComponentProps, type MouseEvent } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Badge,
  badgeVariants,
  Button,
  Count,
  Id,
  Indicator,
  Table,
  TextLink,
  tones,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix: Grid, Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  args: { children: "Featured", variant: "default" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

/** The Badge whose words these are: a Badge's words sit in its own truncating span. */
const badgeWith = (canvasElement: HTMLElement, text: string) => {
  const badge = within(canvasElement).getByText(text).closest<HTMLElement>('[data-slot="badge"]');
  if (!badge) throw new Error(`No Badge says ${text}`);
  return badge;
};

/** The six reference variants, including actual links and the icon-position selectors. */
export const Matrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid
      rows={variants}
      cols={["text", "link", "leading icon", "trailing icon"] as const}
      render={(variant, composition) => (
        <Badge
          variant={variant}
          render={composition === "link" ? <a href="#badge-details" /> : undefined}
        >
          {composition === "leading icon" && (
            <CircleCheck aria-hidden="true" data-icon="inline-start" />
          )}
          {variant}
          {composition === "trailing icon" && (
            <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          )}
        </Badge>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of variants) {
      const specimens = canvasElement.querySelectorAll(
        `[data-slot="badge"][data-variant="${variant}"]`,
      );
      await expect(specimens).toHaveLength(4);
      await expect(canvas.getByRole("link", { name: variant })).toHaveAttribute(
        "href",
        "#badge-details",
      );
      await expect(specimens[2]?.querySelector("svg")).toHaveAttribute("data-icon", "inline-start");
      await expect(specimens[3]?.querySelector("svg")).toHaveAttribute("data-icon", "inline-end");
      const leadingIcon = specimens[2]?.querySelector("svg");
      const trailingBadge = specimens[3];
      if (!leadingIcon || !trailingBadge) throw new Error("The icon specimens must render");
      await expect(leadingIcon.getBoundingClientRect().width).toBe(12);
      await expect(leadingIcon.getBoundingClientRect().height).toBe(12);
      // The icon's side narrows to 6px: the start for a leading icon, the end for a trailing one,
      // whichever way the page reads.
      await expect(getComputedStyle(leadingIcon.parentElement!).paddingInlineStart).toBe("6px");
      await expect(getComputedStyle(trailingBadge).paddingInlineEnd).toBe("6px");
    }
  },
};

/** A status: the subtle `secondary` treatment in a tone, with the controls. */
export const Playground: Story = {
  args: {
    variant: "secondary",
    tone: "success",
    appearance: "subtle",
    size: "small",
    children: "Verified",
  },
};

const nativeBadges = [
  { id: "badge-preview", label: "Preview", ref: createRef<HTMLSpanElement>(), tone: "brand" },
  { id: "record-status", label: "Draft", ref: createRef<HTMLSpanElement>(), tone: "neutral" },
] as const;

export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Inline space="space.100">
      {nativeBadges.map(({ id, label, ref, tone }) => (
        <Badge
          key={id}
          ref={ref}
          variant={tone === "neutral" ? "secondary" : undefined}
          tone={tone === "neutral" ? tone : undefined}
          id={id}
          title={`${label} availability`}
          lang="en"
          dir="ltr"
          data-example="native-span"
          style={{ verticalAlign: "middle" }}
        >
          {label}
        </Badge>
      ))}
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    for (const { id, label, ref, tone } of nativeBadges) {
      const badge = badgeWith(canvasElement, label);
      await expect(ref.current).toBe(badge);
      await expect(badge.tagName).toBe("SPAN");
      await expect(badge).toHaveAttribute("data-slot", "badge");
      await expect(badge).toHaveAttribute(
        "data-variant",
        tone === "neutral" ? "secondary" : "default",
      );
      await expect(badge).toHaveAttribute("data-tone", tone);
      await expect(badge).toHaveAttribute(
        "data-appearance",
        tone === "neutral" ? "subtle" : "bold",
      );
      await expect(badge).toHaveAttribute("data-size", "small");
      await expect(badge).toHaveAttribute("id", id);
      await expect(badge).toHaveAttribute("title", `${label} availability`);
      await expect(badge).toHaveAttribute("lang", "en");
      await expect(badge).toHaveAttribute("dir", "ltr");
      await expect(badge).toHaveAttribute("data-example", "native-span");
      await expect(badge).toHaveStyle({ verticalAlign: "middle" });
      await expect(badge.tabIndex).toBe(-1);
    }
  },
};

// Router adapters forward props and refs to the real anchor.
const DemoRouterLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<"a">, "href"> & { to: string }
>(function DemoRouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} {...props} />;
});

const renderRefs = {
  badge: createRef<HTMLSpanElement>(),
  adapter: createRef<HTMLAnchorElement>(),
};
const renderCalls = {
  badge: fn(),
  adapter: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
};

export const RenderLink: Story = {
  tags: ["!manifest"],
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Badge variant="secondary">Available</Badge>
      <Badge
        ref={renderRefs.badge}
        variant="outline"
        title="Browse program details"
        data-example="router-badge"
        className="align-middle"
        style={{ marginInlineStart: "var(--ds-space-100)" }}
        onClick={renderCalls.badge}
        render={
          <DemoRouterLink
            ref={renderRefs.adapter}
            to="#program-details"
            data-router="demo"
            className="self-center"
            style={{ verticalAlign: "middle" }}
            onClick={renderCalls.adapter}
          />
        }
      >
        Program details
        <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
      </Badge>
      <Badge variant="link" render={<a href="#all-programs" />}>
        All programs
      </Badge>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Program details" });
    renderCalls.badge.mockClear();
    renderCalls.adapter.mockClear();
    await expect(renderRefs.badge.current).toBe(link);
    await expect(renderRefs.adapter.current).toBe(link);
    await expect(link.tagName).toBe("A");
    await expect(link).toHaveAttribute("href", "#program-details");
    await expect(link).toHaveAttribute("title", "Browse program details");
    await expect(link).toHaveAttribute("data-example", "router-badge");
    await expect(link).toHaveAttribute("data-router", "demo");
    await expect(link).toHaveAttribute("data-slot", "badge");
    await expect(link).toHaveAttribute("data-variant", "outline");
    await expect(link).toHaveClass("align-middle", "self-center");
    await expect(link).toHaveStyle({ verticalAlign: "middle", marginInlineStart: "8px" });
    // A badge that links takes a 24px hit area on a touch screen and stops clipping so it can
    // reach past the pill; a label badge stays unpositioned and clipped.
    await expect(link).toHaveStyle({ position: "relative", overflow: "visible" });
    await expect(badgeWith(canvasElement, "Available")).toHaveStyle({
      position: "static",
      overflow: "hidden",
    });
    await userEvent.click(link);
    await expect(renderCalls.badge).toHaveBeenCalledTimes(1);
    await expect(renderCalls.adapter).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "All programs" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(link).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(renderCalls.badge).toHaveBeenCalledTimes(2);
    await expect(renderCalls.adapter).toHaveBeenCalledTimes(2);
  },
};

function ConditionalIconExample() {
  const [verified, setVerified] = useState(false);
  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <Badge variant="secondary" data-example="conditional-icon">
          {verified && <CircleCheck aria-hidden="true" data-icon="inline-start" />}
          {verified ? "Verified source" : "Unverified source"}
        </Badge>
        <Badge variant="outline">
          Documentation
          <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
        </Badge>
      </Inline>
      <Button onClick={() => setVerified((value) => !value)}>
        {verified ? "Reset verification" : "Verify source"}
      </Button>
    </Stack>
  );
}

export const ConditionalIcons: Story = {
  render: () => <ConditionalIconExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = badgeWith(canvasElement, "Unverified source");
    await expect(badge.querySelector("svg")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Verify source" }));
    await expect(badge).toHaveTextContent("Verified source");
    await expect(badge.querySelector("svg")).toHaveAttribute("data-icon", "inline-start");
    await expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Reset verification" }));
    await expect(badge).toHaveTextContent("Unverified source");
    await expect(badge.querySelector("svg")).toBeNull();
  },
};

/** badgeVariants is a public class recipe; consumers supply the element and semantics. */
export const Recipe: Story = {
  tags: ["!manifest"],
  render: () => (
    <Specimens title="The exported recipe on native spans">
      {variants.map((variant) => (
        <span key={variant} className={badgeVariants({ variant })} data-recipe-variant={variant}>
          {variant}
        </span>
      ))}
      <span
        className={badgeVariants({ variant: "secondary", tone: "success", size: "xsmall" })}
        data-example="semantic-recipe"
      >
        Verified
      </span>
    </Specimens>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of variants) {
      const example = canvasElement.querySelector(`[data-recipe-variant="${variant}"]`);
      await expect(example).toHaveTextContent(variant);
      await expect(example).toHaveClass("inline-flex");
    }
    const status = canvasElement.querySelector('[data-example="semantic-recipe"]');
    await expect(status).toHaveTextContent("Verified");
    await expect(status?.getBoundingClientRect().height).toBe(16);
  },
};

export const States: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Specimens title="Tab to each anchor to review focus and hover treatments">
        {variants.map((variant) => (
          <Badge key={variant} variant={variant} render={<a href="#badge-state" />}>
            {variant}
          </Badge>
        ))}
      </Specimens>
      <Specimens title="Caller-provided invalid state">
        <Badge variant="outline" aria-invalid="true">
          Invalid reference
        </Badge>
        <Badge variant="destructive" aria-invalid="true" render={<a href="#invalid-reference" />}>
          Review invalid reference
        </Badge>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalidLabel = badgeWith(canvasElement, "Invalid reference");
    const dangerColor = getComputedStyle(invalidLabel).borderColor;
    const destructive = canvas.getByRole("link", { name: "destructive" });
    const invalidLink = canvas.getByRole("link", { name: "Review invalid reference" });
    for (const link of [destructive, invalidLink]) {
      link.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(link).toHaveFocus();
      await waitFor(async () => {
        await expect(getComputedStyle(link).outlineStyle).toBe("solid");
        await expect(getComputedStyle(link).outlineWidth).toBe("2px");
        await expect(getComputedStyle(link).outlineOffset).toBe("2px");
        await expect(getComputedStyle(link).outlineColor).toBe(dangerColor);
      });
    }
  },
};

export const DenseAndLongContent: Story = {
  render: () => (
    <div className="max-w-full" style={{ width: 400 }}>
      <Stack space="space.150">
        <Text size="small" color="color.text.subtle">
          Source categories
        </Text>
        <Inline space="space.100" rowSpace="space.100" shouldWrap>
          <Badge variant="secondary">Inspection</Badge>
          <Badge variant="secondary">Test</Badge>
          <Badge variant="outline">Independent verification evidence</Badge>
          <Badge variant="secondary">Analysis</Badge>
        </Inline>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const longLabel = within(canvasElement).getByText("Independent verification evidence");
    await expect(longLabel).toBeVisible();
    await expect(getComputedStyle(longLabel).whiteSpace).toBe("nowrap");
    await expect(longLabel.scrollWidth).toBeLessThanOrEqual(longLabel.clientWidth);
  },
};

/** A tone without a variant is a status: the secondary treatment, the subtle fill in that tone. Bold is asked for, with `appearance="bold"` or `variant="default"`, never reached by accident. */
export const ToneWithoutVariant: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      <Badge tone="warning">Withdrawn</Badge>
      <Badge variant="secondary" tone="warning">
        Due soon
      </Badge>
      <Badge tone="danger" appearance="bold">
        Overdue
      </Badge>
      <Badge variant="default" tone="success">
        Featured
      </Badge>
      <Badge>Plain</Badge>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const badge = (text: string) => badgeWith(canvasElement, text);
    const alone = badge("Withdrawn");
    await expect(alone).toHaveAttribute("data-variant", "secondary");
    await expect(alone).toHaveAttribute("data-appearance", "subtle");
    // The same paint as the secondary badge in the same tone.
    await expect(alone.className).toBe(badge("Due soon").className);
    await expect(badge("Overdue")).toHaveAttribute("data-appearance", "bold");
    const explicit = badge("Featured");
    await expect(explicit).toHaveAttribute("data-variant", "default");
    await expect(explicit).toHaveAttribute("data-appearance", "bold");
    const plain = badge("Plain");
    await expect(plain).toHaveAttribute("data-tone", "brand");
    await expect(plain).toHaveAttribute("data-appearance", "bold");
    await expect(badgeVariants({ tone: "warning" })).toBe(
      badgeVariants({ variant: "secondary", tone: "warning" }),
    );
  },
};

export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={
        <Badge variant="outline" render={<a href="#evidence" />}>
          Evidence
        </Badge>
      }
      doText="A destination uses a real anchor through render."
      dont={
        <Badge variant="outline" onClick={() => undefined}>
          Evidence
        </Badge>
      }
      dontText="A span with a click handler has no native link or keyboard behavior."
    />
  ),
};

const labels = {
  neutral: "Draft",
  information: "In review",
  success: "Verified",
  warning: "Due soon",
  danger: "Overdue",
} as const;

/** Every tone as subtle, bold, xsmall and with an icon. */
export const SemanticMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid
      rows={tones}
      cols={["subtle", "bold", "xsmall", "with an icon"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <Badge
          variant="secondary"
          tone={tone}
          appearance={col === "bold" ? "bold" : "subtle"}
          size={col === "xsmall" ? "xsmall" : "small"}
          icon={
            col === "with an icon" ? (
              tone === "danger" || tone === "warning" ? (
                <TriangleAlert aria-hidden="true" className="size-150" />
              ) : (
                <CircleCheck aria-hidden="true" className="size-150" />
              )
            ) : undefined
          }
        >
          {labels[tone]}
        </Badge>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const tone of tones) {
      const badges = canvasElement.querySelectorAll(`[data-slot="badge"][data-tone="${tone}"]`);
      await expect(badges).toHaveLength(4);
      for (const badge of badges) {
        await expect(badge).toHaveTextContent(labels[tone]);
        await expect(badge).not.toHaveAttribute("tone");
        await expect(badge).not.toHaveAttribute("appearance");
        await expect(badge).not.toHaveAttribute("size");
      }
      await expect(badges[0]).toHaveAttribute("data-appearance", "subtle");
      await expect(badges[1]).toHaveAttribute("data-appearance", "bold");
      await expect(badges[2]).toHaveAttribute("data-size", "xsmall");
      await expect(badges[0]?.getBoundingClientRect().height).toBe(20);
      await expect(badges[2]?.getBoundingClientRect().height).toBe(16);
      await expect(badges[3]?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  },
};

/** The same Badge recipe combines treatment, palette, and density. */
export const SemanticVariants: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid
      rows={tones}
      cols={variants}
      rowLabel="tone"
      render={(tone, variant) => (
        <Badge
          variant={variant}
          tone={tone}
          size="xsmall"
          icon={<CircleCheck aria-hidden="true" />}
          render={
            variant === "outline" || variant === "link" ? <a href="#status-details" /> : undefined
          }
        >
          {labels[tone]} {variant}
        </Badge>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const specimens = canvasElement.querySelectorAll('[data-slot="badge"]');
    await expect(specimens).toHaveLength(30);
    const radii = new Set(Array.from(specimens, (badge) => getComputedStyle(badge).borderRadius));
    await expect(radii.size).toBe(1);
    for (const badge of specimens) {
      await expect(badge.getBoundingClientRect().height).toBe(16);
      await expect(badge.querySelector('[data-icon="inline-start"]')).toBeInTheDocument();
      await expect(badge.querySelector("svg")?.getBoundingClientRect().width).toBe(12);
    }
    const outline = canvas.getByRole("link", { name: "Verified outline" });
    const link = canvas.getByRole("link", { name: "Verified link" });
    await expect(outline).toHaveAttribute("href", "#status-details");
    await expect(link).toHaveAttribute("href", "#status-details");
    await expect(getComputedStyle(outline).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(link).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(outline).color).toBe(getComputedStyle(link).color);
  },
};

const rows = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    status: "Verified",
    tone: "success",
    severity: "Low",
    sev: "neutral",
    findings: 0,
  },
  {
    id: "CTRL-0418",
    name: "Privileged access review",
    status: "Due soon",
    tone: "warning",
    severity: "Medium",
    sev: "warning",
    findings: 2,
  },
  {
    id: "CTRL-0450",
    name: "Change approval before release",
    status: "Overdue",
    tone: "danger",
    severity: "High",
    sev: "danger",
    findings: 5,
  },
  {
    id: "CTRL-0463",
    name: "Assessment of the payables interface",
    status: "Other than satisfied",
    tone: "danger",
    severity: "Medium",
    sev: "warning",
    findings: 1,
  },
] as const;

/** In a table: the status is the row's one pill at `xsmall`; severity is an Indicator; a count is a Count. A status longer than its 112px column, the RMF "Other than satisfied", stays in its cell, ends in an ellipsis and shows whole on hover while it is cut, in the table's one reveal rather than a tooltip of its own. */
export const InRows: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Table label="Controls">
        <thead>
          <tr>
            <Table.Header width={96}>Id</Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header width={112}>Status</Table.Header>
            <Table.Header width={104}>Severity</Table.Header>
            <Table.Header width={88}>Findings</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <Id>{r.id}</Id>
              </Table.Cell>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>
                <Badge variant="secondary" size="xsmall" tone={r.tone}>
                  {r.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Indicator tone={r.sev}>{r.severity}</Indicator>
              </Table.Cell>
              <Table.Cell>{r.findings ? <Count value={r.findings} /> : null}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const long = badgeWith(canvasElement, "Other than satisfied");
    const words = within(long).getByText("Other than satisfied");
    const cell = long.closest("td")!.getBoundingClientRect();
    // The pill stays in its cell, and says that its words are cut.
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(cell.right + 0.5);
    await expect(words.scrollWidth).toBeGreaterThan(words.clientWidth);
    await expect(getComputedStyle(words).textOverflow).toBe("ellipsis");
    // The whole status is still what a screen reader reads, and the pointer can see it: in the
    // table's one reveal, since a Badge in a table's cell mounts no tooltip of its own.
    await expect(long).toHaveTextContent("Other than satisfied");
    await expect(words.closest('[data-slot="truncate"]')).toHaveAttribute("data-reveal", "cell");
    await userEvent.hover(words);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="table-cell-reveal"]')).toHaveTextContent(
        "Other than satisfied",
      ),
    );
    await userEvent.unhover(words);
    // A status that fits is not cut and reveals nothing.
    const fits = within(badgeWith(canvasElement, "Verified")).getByText("Verified");
    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth);
  },
};

/**
 * The rules that would repaint an element while the pointer is over it. A play cannot move the real
 * pointer, so it matches each `:hover` rule against the element instead.
 */
function hoverRules(el: Element): string[] {
  const found: string[] = [];
  // A nested rule's `&` is its parent's selector.
  const walk = (rules: CSSRuleList, parent: string | null) => {
    for (const rule of Array.from(rules)) {
      let selector = parent;
      if (rule instanceof CSSStyleRule) {
        selector = parent
          ? rule.selectorText.replace(/&/g, `:is(${parent})`)
          : rule.selectorText.replace(/&/g, ":scope");
        // `:hover` as a pseudo-class, not the escaped `\:hover` inside a class name.
        if (/(?<!\\):hover/.test(selector)) {
          try {
            if (el.matches(selector.replace(/(?<!\\):hover/g, ""))) found.push(selector);
          } catch {
            // A selector the engine cannot test on its own is no rule for this element.
          }
        }
      }
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules, selector);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, null);
    } catch {
      // A stylesheet from another origin cannot be read and holds no kit rule.
    }
  }
  return found;
}

/** Only a badge that is a link or a button answers the pointer. A ghost or link label on a span keeps its fill and its underline under the pointer; the same treatments on an anchor take the hover. A brand badge link draws its words in `color.text.selected` on the hovered fill, which holds 4.5:1 where `color.text.brand` would not. */
export const HoverOnlyWhenInteractive: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.200">
      <Specimens title="Labels: no hover">
        <Badge variant="ghost">Ghost label</Badge>
        <Badge variant="link">Link label</Badge>
        <Badge variant="secondary">Subtle label</Badge>
      </Specimens>
      <Specimens title="Links: hover">
        <Badge variant="ghost" render={<a href="#ghost" />}>
          Ghost link
        </Badge>
        <Badge variant="link" render={<a href="#link" />}>
          Link link
        </Badge>
        <Badge variant="outline" tone="brand" render={<a href="#brand" />}>
          Brand outline link
        </Badge>
        <Badge variant="secondary" tone="brand" render={<button type="button" />}>
          Brand subtle button
        </Badge>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const label of ["Ghost label", "Link label", "Subtle label"])
      await expect(hoverRules(badgeWith(canvasElement, label))).toEqual([]);
    const ghost = hoverRules(canvas.getByRole("link", { name: "Ghost link" }));
    await expect(ghost.some((rule) => rule.includes("bg-neutral"))).toBe(true);
    const link = hoverRules(canvas.getByRole("link", { name: "Link link" }));
    await expect(link.some((rule) => rule.includes("underline"))).toBe(true);
    for (const brand of [
      canvas.getByRole("link", { name: "Brand outline link" }),
      canvas.getByRole("button", { name: "Brand subtle button" }),
    ]) {
      const rules = hoverRules(brand);
      await expect(rules.some((rule) => rule.includes("bg-brand-subtlest-hovered"))).toBe(true);
      await expect(rules.some((rule) => rule.includes("text-selected"))).toBe(true);
    }
  },
};

/** A category is neutral and differs by its word; a status is a tone. The two read differently side by side. */
export const Categories: Story = {
  render: () => (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="start">
        <Box className="shrink-0" paddingBlock="space.025" style={{ width: 96 }}>
          <Text size="small" color="color.text.subtle">
            Method
          </Text>
        </Box>
        <Inline space="space.100" rowSpace="space.100" shouldWrap className="min-w-0 flex-1">
          {["Inspection", "Test", "Analysis", "Demonstration"].map((m) => (
            <Badge variant="secondary" tone="neutral" key={m}>
              {m}
            </Badge>
          ))}
        </Inline>
      </Inline>
      <Inline space="space.100" alignBlock="start">
        <Box className="shrink-0" paddingBlock="space.025" style={{ width: 96 }}>
          <Text size="small" color="color.text.subtle">
            Determination
          </Text>
        </Box>
        <Inline space="space.100" rowSpace="space.100" shouldWrap className="min-w-0 flex-1">
          <Badge variant="secondary" tone="success">
            Satisfied
          </Badge>
          <Badge variant="secondary" tone="warning">
            Partial
          </Badge>
          <Badge variant="secondary" tone="danger">
            Other than satisfied
          </Badge>
          <Badge variant="secondary" tone="neutral">
            Not assessed
          </Badge>
        </Inline>
      </Inline>
    </Stack>
  ),
};

/** The one status that must win is bold; the rest of the view stays subtle. */
export const OneBold: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Text weight="medium">CTRL-0450 Change approval before release</Text>
      <Badge variant="secondary" tone="danger" appearance="bold">
        Overdue
      </Badge>
      <Badge variant="secondary" tone="neutral">
        Moderate
      </Badge>
      <Badge variant="secondary" tone="neutral">
        Inherited
      </Badge>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const StatusGuidance: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Badge variant="secondary" tone="success">
            Verified
          </Badge>
        }
        doText="One or two words: the state."
        dont={
          <Badge variant="secondary" tone="success">
            Verified by Dana Whitfield on 28 Aug
          </Badge>
        }
        dontText="A sentence in a pill. Who and when are facts for the record, not the status."
      />
      <Pair
        do={
          <Inline space="space.100" rowSpace="space.100" shouldWrap>
            <Badge variant="secondary" tone="danger" appearance="bold">
              Overdue
            </Badge>
            <Badge variant="secondary" tone="warning">
              Due soon
            </Badge>
            <Badge variant="secondary" tone="success">
              Verified
            </Badge>
          </Inline>
        }
        doText="One bold status in the view, the one that must win."
        dont={
          <Inline space="space.100" rowSpace="space.100" shouldWrap>
            <Badge variant="secondary" tone="danger" appearance="bold">
              Overdue
            </Badge>
            <Badge variant="secondary" tone="warning" appearance="bold">
              Due soon
            </Badge>
            <Badge variant="secondary" tone="success" appearance="bold">
              Verified
            </Badge>
          </Inline>
        }
        dontText="Everything bold. Nothing wins, and the page is a wall of colour."
      />
      <Pair
        do={
          <Inline space="space.100" rowSpace="space.100" shouldWrap>
            <Badge variant="secondary" tone="neutral">
              Inspection
            </Badge>
            <Badge variant="secondary" tone="neutral">
              Test
            </Badge>
            <Badge variant="secondary" tone="neutral">
              Analysis
            </Badge>
          </Inline>
        }
        doText="Categories are neutral; the word tells them apart."
        dont={
          <Inline space="space.100" rowSpace="space.100" shouldWrap>
            <Badge variant="secondary" tone="information">
              Inspection
            </Badge>
            <Badge variant="secondary" tone="success">
              Test
            </Badge>
            <Badge variant="secondary" tone="warning">
              Analysis
            </Badge>
          </Inline>
        }
        dontText="A colour per category: here a tone is a status, and a reader would look for what is wrong with Analysis."
      />
      <Pair
        do={<TextLink render={<a href="#component" />}>SVC-PAY-01</TextLink>}
        doText="Something that takes the reader somewhere is a link."
        dont={
          <Badge
            variant="secondary"
            tone="neutral"
            onClick={() => undefined}
            className="cursor-pointer"
          >
            SVC-PAY-01
          </Badge>
        }
        dontText="A span with a click handler has no native keyboard behavior. Render a real anchor for navigation."
      />
    </Stack>
  ),
};
