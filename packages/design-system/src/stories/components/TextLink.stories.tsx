import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, TextLink, Truncate } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/TextLink",
  component: TextLink,
  parameters: { layout: "padded" },
  args: { href: "#record", children: "Open the full record" },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Inherited, small and medium sizes by weight; a TextLink beside a Button link, which is an action and not navigation. */
export const TextLinkMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Grid
        rows={["inherit", "small", "medium"] as const}
        cols={["regular", "medium"] as const}
        rowLabel="size"
        render={(size, weight) => (
          <TextLink href="#x" size={size === "inherit" ? undefined : size} weight={weight}>
            Open the full record
          </TextLink>
        )}
      />
      <Specimens title="TextLink beside Button link">
        <TextLink href="#x">Navigation: TextLink</TextLink>
        <Button variant="link">Action: Button link</Button>
      </Specimens>
    </Stack>
  ),
};

/**
 * Navigation that reads as text. Native href and Base UI render both preserve anchor behavior. A
 * link in a sentence is underlined at rest, so it never differs from the words beside it by colour
 * alone, also in small subtle text, where the link colour is barely 1.5:1 against the words; it
 * keeps its words as the touch target, including one that wraps in the narrow column. The
 * standalone links underline on hover and take a hit area at least 24px tall where a pointer is
 * coarse.
 */
export const InProse: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        The finding was raised against <TextLink render={<a href="#ctrl" />}>AC-2(4)</TextLink> and
        traces to <TextLink render={<a href="#req" />}>REQ-0118</TextLink>.
      </Text>
      <Text as="p" size="small" color="color.text.subtle">
        Version 5.1.1 · Published OSCAL catalog ·{" "}
        <TextLink render={<a href="#catalog" />}>Open catalog</TextLink>
      </Text>
      <div style={{ maxWidth: 240 }}>
        <Text as="p">
          Raised against the access control family, see{" "}
          <TextLink render={<a href="#req-trace" />}>
            REQ-0118 Account management for privileged users
          </TextLink>{" "}
          for the full trace.
        </Text>
      </div>
      <Inline space="space.300" alignBlock="baseline">
        <TextLink size="small" render={<a href="#a" />}>
          Small
        </TextLink>
        <TextLink size="medium" render={<a href="#b" />}>
          Medium
        </TextLink>
        <TextLink weight="medium" render={<a href="#c" />}>
          Medium weight
        </TextLink>
        <TextLink href="#d">An anchor from href</TextLink>
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = (name: string) => canvas.getByRole("link", { name });
    const wrapped = link("REQ-0118 Account management for privileged users");
    const inSentence = [link("AC-2(4)"), link("REQ-0118"), link("Open catalog"), wrapped];
    const standalone = ["Small", "Medium", "Medium weight", "An anchor from href"].map(link);
    await expect(wrapped.getClientRects().length).toBeGreaterThan(1);
    // A link with its sentence's text beside it takes no touch area; a standalone one does, where
    // a pointer is coarse: at least 24px tall and no wider than its words. A mouse gets none.
    const coarse = matchMedia("(any-pointer: coarse)").matches;
    for (const each of inSentence) {
      await expect(each).toHaveAttribute("data-in-text");
      await expect(getComputedStyle(each).textDecorationLine).toBe("underline");
      await expect(getComputedStyle(each, "::before").content).toBe("none");
    }
    for (const each of standalone) {
      await expect(each).not.toHaveAttribute("data-in-text");
      await expect(getComputedStyle(each).textDecorationLine).toBe("none");
      await expect(each).toHaveClass("touch-target-block");
      await expect(getComputedStyle(each).position).toBe("relative");
      const area = getComputedStyle(each, "::before");
      if (!coarse) {
        await expect(area.content).toBe("none");
        continue;
      }
      await expect(parseFloat(area.height)).toBeGreaterThanOrEqual(24);
      await expect(parseFloat(area.width)).toBeLessThanOrEqual(
        each.getBoundingClientRect().width + 0.5,
      );
    }
    // None of the words around the wrapped link, on any of its lines, resolves to it.
    const words = document.createRange();
    const stray: string[] = [];
    for (const node of Array.from(wrapped.parentElement!.childNodes)) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      words.selectNodeContents(node);
      for (const r of Array.from(words.getClientRects()))
        for (let x = r.left + 1; x < r.right - 1; x += 2)
          for (let y = r.top + 1; y < r.bottom - 1; y += 2)
            if (document.elementFromPoint(x, y) === wrapped)
              stray.push(`${Math.round(x)},${Math.round(y)}`);
    }
    await expect(stray).toEqual([]);
  },
};

/**
 * `newTab` opens the destination in a new tab and says so: an external-link icon after the last
 * word, joined to it so a wrapping link never leaves the icon alone on a line, and "(opens in a new
 * tab)" read after the name. It sets `target="_blank"` and `rel="noopener noreferrer"`, which a
 * `target` or `rel` of the caller's replaces. A router link through `render` takes it the same way.
 */
export const NewTab: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        The baseline is defined in{" "}
        <TextLink href="https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" newTab>
          NIST SP 800-53 Rev 5
        </TextLink>
        .
      </Text>
      <TextLink newTab render={<a href="#catalog" />}>
        Open catalog
      </TextLink>
      <div style={{ maxWidth: 180 }}>
        <TextLink newTab href="#controls">
          Open the whole catalog of security controls
        </TextLink>
      </div>
      <TextLink newTab href="#named" target="catalog-window" rel="noopener">
        Open in the catalog window
      </TextLink>
      <div style={{ width: 160 }}>
        <Truncate data-testid="row-field">
          <TextLink newTab href="#source">
            Privileged account inventory export
          </TextLink>
        </Truncate>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inText = canvas.getByRole("link", { name: "NIST SP 800-53 Rev 5 (opens in a new tab)" });
    const routed = canvas.getByRole("link", { name: "Open catalog (opens in a new tab)" });
    const wrapped = canvas.getByRole("link", {
      name: "Open the whole catalog of security controls (opens in a new tab)",
    });
    for (const link of [inText, routed, wrapped]) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const icon = link.querySelector('[data-slot="icon"]')!;
      await expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    await expect(inText).toHaveAttribute("data-in-text");
    await expect(routed).toHaveAttribute("href", "#catalog");
    // The icon sits on the link's last line, beside its last word.
    const lines = Array.from(wrapped.getClientRects());
    await expect(lines.length).toBeGreaterThan(1);
    const last = lines.at(-1)!;
    const icon = wrapped.querySelector('[data-slot="icon"]')!.getBoundingClientRect();
    await expect(icon.top).toBeGreaterThanOrEqual(last.top - 1);
    await expect(icon.bottom).toBeLessThanOrEqual(last.bottom + 1);
    // A target and a rel of the caller's win.
    const named = canvas.getByRole("link", { name: "Open in the catalog window (opens in a new tab)" });
    await expect(named).toHaveAttribute("target", "catalog-window");
    await expect(named).toHaveAttribute("rel", "noopener");
    // In a row field the Truncate goes around the link, so the words and the icon are cut on one
    // line together, and the whole name is a hover or a focus away.
    const field = canvas.getByTestId("row-field");
    const row = canvas.getByRole("link", {
      name: "Privileged account inventory export (opens in a new tab)",
    });
    await expect(row.getClientRects()).toHaveLength(1);
    await expect(field.scrollWidth).toBeGreaterThan(field.clientWidth);
    await expect(getComputedStyle(field).textOverflow).toBe("ellipsis");
    row.focus();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toHaveTextContent(
        "Privileged account inventory export",
      ),
    );
    row.blur();
  },
};

export const Playground: Story = {};

/** Both refs and event handlers are composed onto the same native anchor. */
export const RenderComposition: Story = {
  render: function Example() {
    const outer = useRef<HTMLAnchorElement>(null);
    const inner = useRef<HTMLAnchorElement>(null);
    const [calls, setCalls] = useState("");
    return (
      <Stack>
        <TextLink
          ref={outer}
          onClick={() => setCalls((value) => value + " outer")}
          render={
            <a
              ref={inner}
              href="#record"
              onClick={(event) => {
                event.preventDefault();
                setCalls((value) => value + " inner");
              }}
            />
          }
        >
          Open record
        </TextLink>
        <Button
          onClick={() => {
            if (outer.current === inner.current) outer.current?.focus();
          }}
        >
          Focus link
        </Button>
        <Text role="status">{calls || "Ready"}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Open record" });
    await expect(link).toHaveAttribute("href", "#record");
    await expect(link.querySelector("a")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Focus link" }));
    await expect(link).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("status")).toHaveTextContent("Ready");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("inner outer");
  },
};
