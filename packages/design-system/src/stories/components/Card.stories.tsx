import { useId, useState } from "react";
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
  args: { size: "default", ref: fn() },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

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
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle>
              <h3>{size === "sm" ? "Small card" : "Default card"}</h3>
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
