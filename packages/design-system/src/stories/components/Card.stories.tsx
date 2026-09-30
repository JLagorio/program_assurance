import { useId, useState, type MouseEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  FieldDescription,
  Input,
  Table,
} from "../../components";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "padded" },
  args: { size: "medium", ref: fn() },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A real pointer over the element, so CSS `:hover` applies in the browser tests; Storybook itself only dispatches the events. */
async function nativeHover(target: HTMLElement) {
  if (import.meta.env.MODE === "test" && "__vitest_browser__" in globalThis) {
    const browser = await import("vitest/browser");
    await browser.page.elementLocator(target).hover();
    return true;
  }
  await userEvent.hover(target);
  return false;
}

const slotBox = (scope: Element, slot: string) => {
  const element = scope.querySelector(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`No ${slot}`);
  return element.getBoundingClientRect();
};

/**
 * Where a card header put its action (beside the title, or on its own row after the
 * description) and whether the header has the 16rem inside its inset that keeps it beside the
 * title (a card about 18rem wide).
 */
const headerLayout = (card: Element) => {
  const header = card.querySelector('[data-slot="card-header"]');
  if (!header) throw new Error("No card-header");
  const style = getComputedStyle(header);
  const box = header.getBoundingClientRect();
  const contentStart = box.left + parseFloat(style.paddingInlineStart);
  const contentEnd = box.right - parseFloat(style.paddingInlineEnd);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const action = slotBox(card, "card-action");
  return {
    room: contentEnd - contentStart >= 16 * rem,
    beside: action.top < slotBox(card, "card-title").bottom,
    afterDescription: action.top >= slotBox(card, "card-description").bottom,
    atEnd: Math.abs(action.right - contentEnd) < 1,
  };
};

/** A settings card with a short action in its header: the Playground, and the same card on a small phone. */
const reviewPreferences: NonNullable<Story["render"]> = function Example(args) {
  const id = useId();
  const [saved, setSaved] = useState(false);
  const [owner, setOwner] = useState("Dana Whitfield");
  return (
    <Card {...args} role="region" aria-labelledby={id} className="w-layout-list max-w-full">
      <CardHeader>
        <CardTitle>
          <h2 id={id}>Review preferences</h2>
        </CardTitle>
        <CardDescription>Choose who receives the assessment.</CardDescription>
        <CardAction>
          <Button
            size="small"
            variant="link"
            onClick={() => {
              setOwner("Dana Whitfield");
              setSaved(false);
            }}
          >
            Reset
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor={`${id}-owner`}>Owner</FieldLabel>
          <Input
            id={`${id}-owner`}
            value={owner}
            onValueChange={(value) => {
              setOwner(value);
              setSaved(false);
            }}
            aria-describedby={`${id}-help`}
          />
          <FieldDescription id={`${id}-help`}>
            Receives the assessment and review updates.
          </FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="border-t">
        <Button size="small" onClick={() => setSaved(true)}>
          Save preferences
        </Button>
        <span role="status">{saved ? "Preferences saved" : "Ready to save"}</span>
      </CardFooter>
    </Card>
  );
};

export const Playground: Story = {
  render: reviewPreferences,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole("region", { name: "Review preferences" });
    await expect(args.ref).toHaveBeenCalledWith(card);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Review preferences");
    // At whatever width the story renders: with 16rem inside the header's inset (a card about
    // 18rem wide) the action sits at the end of the title's row; in a narrower card it takes its
    // own row after the description, at the end.
    const layout = headerLayout(card);
    await expect(layout).toEqual({
      room: layout.room,
      beside: layout.room,
      afterDescription: !layout.room,
      atEnd: true,
    });
    await userEvent.click(canvas.getByRole("button", { name: "Save preferences" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Preferences saved");
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Ready to save");
  },
};

/** A full-width card on a 340px phone is about 18rem wide, so its short action stays at the end of the title's row. */
export const OnASmallPhone: Story = {
  name: "On a small phone",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: reviewPreferences,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const card = within(canvasElement).getByRole("region", { name: "Review preferences" });
    await expect(headerLayout(card)).toEqual({
      room: true,
      beside: true,
      afterDescription: false,
      atEnd: true,
    });
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-layout-measure flex-col gap-200">
      {(["medium", "small"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle>
              <h3>{size === "small" ? "Small card" : "Medium card"}</h3>
            </CardTitle>
            <CardDescription>
              The same parts, with a smaller inset when space is limited.
            </CardDescription>
          </CardHeader>
          <CardContent>Three artifacts are linked to this assessment.</CardContent>
        </Card>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="card"]')];
    const [medium, small] = cards;
    await expect(medium).toHaveAttribute("data-size", "medium");
    await expect(small).toHaveAttribute("data-size", "small");
    // `small` reduces the block padding and the inline inset of every part.
    const inset = (card: HTMLElement) =>
      parseFloat(getComputedStyle(card.querySelector('[data-slot="card-content"]')!).paddingLeft);
    await expect(parseFloat(getComputedStyle(small!).paddingTop)).toBeLessThan(
      parseFloat(getComputedStyle(medium!).paddingTop),
    );
    await expect(inset(small!)).toBeLessThan(inset(medium!));
  },
};

export const EdgeToEdge: Story = {
  render: () => (
    <Card className="w-layout-list max-w-full gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle>
          <h2>Controls</h2>
        </CardTitle>
      </CardHeader>
      <Table label="Controls">
        <thead>
          <Table.Row>
            <Table.Header>Id</Table.Header>
            <Table.Header>Title</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          <Table.Row>
            <Table.Cell>AC-2</Table.Cell>
            <Table.Cell>Account management</Table.Cell>
          </Table.Row>
        </tbody>
      </Table>
    </Card>
  ),
};

/** In a rail, the header is too narrow to keep a readable title beside its action, so the action takes its own row after the description, at the end; the title and description keep the full width and their words whole. */
export const InARail: Story = {
  name: "In a rail",
  tags: ["narrow"],
  render: () => (
    <Card role="region" aria-label="Linked findings" className="w-layout-rail max-w-full">
      <CardHeader>
        <CardTitle>
          <h2>Linked findings and operational issues</h2>
        </CardTitle>
        <CardDescription>14 findings, by severity</CardDescription>
        <CardAction>
          <Button size="small" variant="subtle" iconBefore={<Plus />}>
            Link a finding
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Three are critical.</CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = within(canvasElement).getByRole("region", { name: "Linked findings" });
    await expect(headerLayout(card)).toEqual({
      room: false,
      beside: false,
      afterDescription: true,
      atEnd: true,
    });
    // The title spans the header, ending where the action ends.
    await expect(Math.round(slotBox(card, "card-title").right)).toBe(
      Math.round(slotBox(card, "card-action").right),
    );
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** A card whose action is wide: the header keeps the title's readable measure (12rem, or the title's own width when shorter) beside the action, and where it cannot, the action takes its own row after the description, at the end, as in a rail, so the title never breaks mid-word. The header measures itself, so a card that is resized follows. */
export const BesideAWideAction: Story = {
  name: "Beside a wide action",
  tags: ["narrow"],
  render: () => {
    const card = (label: string, width: number) => (
      <Card role="region" aria-label={label} className="max-w-full" style={{ width }}>
        <CardHeader>
          <CardTitle>
            <h2>Review preferences</h2>
          </CardTitle>
          <CardDescription>Choose who receives the assessment.</CardDescription>
          <CardAction>
            <Button size="small" variant="link">
              Reset
            </Button>
            <Button size="small" variant="link">
              Assign reviewer
            </Button>
            <Button size="small" variant="link">
              Export evidence
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>Dana Whitfield receives the assessment.</CardContent>
      </Card>
    );
    return (
      <div className="flex flex-col gap-200">
        {card("Narrow card", 360)}
        {card("Wide card", 640)}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    /** Beside the title with the title's measure kept, or on its own row after the description. */
    const readable = (card: HTMLElement) => {
      const layout = headerLayout(card);
      const title = card.querySelector<HTMLElement>('[data-slot="card-title"] h2')!;
      const range = document.createRange();
      range.selectNodeContents(title);
      const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
      const titleWidth = slotBox(card, "card-title").width;
      return {
        beside: layout.beside,
        afterDescription: layout.afterDescription,
        atEnd: layout.atEnd,
        measureKept: lines === 1 || titleWidth >= 12 * rem - 1,
      };
    };
    const narrow = canvas.getByRole("region", { name: "Narrow card" });
    // 360px holds 16rem inside the inset but not the title's measure beside three buttons.
    await expect(readable(narrow)).toEqual({
      beside: false,
      afterDescription: true,
      atEnd: true,
      measureKept: true,
    });
    const wide = canvas.getByRole("region", { name: "Wide card" });
    const settled = readable(wide);
    await expect(settled.measureKept).toBe(true);
    await expect(settled.atEnd).toBe(true);
    await expect(settled.beside).toBe(!settled.afterDescription);
    // Where the frame gives the wide card its 640px, the action sits beside the title; narrowed
    // live, it moves after the description, and back when the card widens again.
    if (wide.getBoundingClientRect().width >= 639) {
      await expect(settled.beside).toBe(true);
      wide.style.width = "360px";
      await waitFor(() => expect(readable(wide).afterDescription).toBe(true));
      wide.style.width = "640px";
      await waitFor(() => expect(readable(wide).beside).toBe(true));
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** A card that is one link: CardTitle's `link` becomes the title's text and stretches over the card, so a click anywhere on it opens the record, the card takes a hover surface, and the ring is drawn inside its edge. The title is the heading through `render`. A linked card holds no other control. */
export const Linked: Story = {
  render: function Example() {
    const [opened, setOpened] = useState("Nothing opened");
    const open = (name: string) => (event: MouseEvent) => {
      event.preventDefault();
      setOpened(`Opened ${name}`);
    };
    return (
      <div className="flex max-w-layout-measure flex-col gap-200">
        <div
          className="grid gap-200"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}
        >
          <Card size="small">
            <CardHeader>
              <CardTitle render={<h3 />} link={<a href="#programs" onClick={open("programs")} />}>
                Programs
              </CardTitle>
              <CardDescription>14 records</CardDescription>
            </CardHeader>
            <CardContent>2 in authorization</CardContent>
          </Card>
          <Card size="small">
            <CardHeader>
              <CardTitle render={<h3 />} link={<a href="#systems" onClick={open("systems")} />}>
                Systems
              </CardTitle>
              <CardDescription>38 records</CardDescription>
            </CardHeader>
            <CardContent>6 with open findings</CardContent>
          </Card>
        </div>
        <span role="status">{opened}</span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("heading", { level: 3, name: "Programs" });
    await expect(heading).toHaveAttribute("data-slot", "card-title");
    const link = within(heading).getByRole("link", { name: "Programs" });
    await expect(link).toHaveAttribute("data-slot", "card-link");
    const card = link.closest<HTMLElement>('[data-slot="card"]')!;
    // The link's overlay covers the card: a point in its content hits the link.
    const content = card.querySelector('[data-slot="card-content"]')!.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(
      content.left + content.width / 2,
      content.top + content.height / 2,
    );
    await expect(hit).toBe(link);
    const overlay = getComputedStyle(link, "::after");
    await expect(Math.abs(parseFloat(overlay.width) - card.clientWidth)).toBeLessThanOrEqual(1);
    await expect(Math.abs(parseFloat(overlay.height) - card.clientHeight)).toBeLessThanOrEqual(1);
    // Hover paints the card's hovered surface, where there is a hover and colours are the kit's.
    const rest = getComputedStyle(card).backgroundColor;
    if (
      (await nativeHover(link)) &&
      matchMedia("(hover: hover)").matches &&
      !matchMedia("(forced-colors: active)").matches
    )
      await waitFor(() => expect(getComputedStyle(card).backgroundColor).not.toBe(rest));
    await userEvent.unhover(link);
    // The keyboard reaches the link, and its ring is inside the card's edge.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(parseFloat(getComputedStyle(link, "::after").outlineOffset)).toBeLessThan(0);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened programs");
    // A click on the second card's content lands on its link.
    const second = canvas.getByRole("link", { name: "Systems" });
    const body = second
      .closest('[data-slot="card"]')!
      .querySelector('[data-slot="card-content"]')!
      .getBoundingClientRect();
    const target = canvasElement.ownerDocument.elementFromPoint(
      body.left + body.width / 2,
      body.top + body.height / 2,
    );
    await expect(target).toBe(second);
    await userEvent.click(target as HTMLElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened systems");
  },
};
