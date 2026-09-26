import { useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, TextLink } from "../../components";
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
 * link in a sentence keeps its words as the touch target, including one that wraps in the narrow
 * column; the standalone links take a hit area at least 24px tall where a pointer is coarse.
 */
export const InProse: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        The finding was raised against{" "}
        <TextLink className="underline" render={<a href="#ctrl" />}>
          AC-2(4)
        </TextLink>{" "}
        and traces to{" "}
        <TextLink className="underline" render={<a href="#req" />}>
          REQ-0118
        </TextLink>
        .
      </Text>
      <div style={{ maxWidth: 240 }}>
        <Text as="p">
          Raised against the access control family, see{" "}
          <TextLink className="underline" render={<a href="#req-trace" />}>
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
    const inSentence = [link("AC-2(4)"), link("REQ-0118"), wrapped];
    const standalone = ["Small", "Medium", "Medium weight", "An anchor from href"].map(link);
    await expect(wrapped.getClientRects().length).toBeGreaterThan(1);
    // A link with its sentence's text beside it takes no touch area; a standalone one does, where
    // a pointer is coarse: at least 24px tall and no wider than its words. A mouse gets none.
    const coarse = matchMedia("(any-pointer: coarse)").matches;
    for (const each of inSentence) {
      await expect(each).toHaveAttribute("data-in-text");
      await expect(getComputedStyle(each, "::before").content).toBe("none");
    }
    for (const each of standalone) {
      await expect(each).not.toHaveAttribute("data-in-text");
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
