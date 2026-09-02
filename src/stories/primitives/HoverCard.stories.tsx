import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { Badge, HoverCard, Id } from "@/ds/primitives";
import { cn } from "@/lib/utils";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  args: { side: "bottom", align: "start", width: 280, delay: 400, content: null, children: null },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    width: { control: "number" },
    delay: { control: "number" },
    defaultOpen: { control: "boolean" },
    content: { control: false },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function Peek() {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">Account management</div>
          <div className="text-12 text-muted-foreground">Access Control · NIST 800-53 r5</div>
        </div>
        <Badge tone="success" size="xs">
          Satisfied
        </Badge>
      </div>
      <dl className="grid grid-cols-[72px_1fr] gap-y-1 text-12">
        <dt className="text-muted-foreground">Owner</dt>
        <dd>R. Okafor</dd>
        <dt className="text-muted-foreground">Assessed</dt>
        <dd>12 Aug 2026 · Examine</dd>
        <dt className="text-muted-foreground">Evidence</dt>
        <dd className="tnum">12 items, newest 3d</dd>
      </dl>
    </div>
  );
}

/** The trigger must take a ref and spread its props: Radix attaches the hover, focus and
    anchor handlers to whatever it renders. */
function Trigger({ children, className, ...props }: ComponentProps<"span">) {
  return (
    <span
      tabIndex={0}
      className={cn(
        "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className,
      )}
      {...props}
    >
      <Id className="underline decoration-border-strong decoration-dotted underline-offset-2">
        {children}
      </Id>
    </span>
  );
}

export const Playground: Story = {
  render: (args) => (
    <p className="max-w-[520px] text-13">
      The finding traces to{" "}
      <HoverCard {...args} content={<Peek />}>
        <Trigger>AC-2</Trigger>
      </HoverCard>{" "}
      and shares evidence with the account-review procedure. Hover or focus the id.
    </p>
  ),
};

/** Held open for the record: the card is a peek, not a place to act. */
export const Open: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-2 pb-[180px]">
      <p className="text-13">
        Peek at{" "}
        <HoverCard content={<Peek />} defaultOpen>
          <Trigger>AC-2</Trigger>
        </HoverCard>
      </p>
      <Spec>popover surface · shadow-pop · 280px · opens after 400ms, closes after 120ms</Spec>
    </div>
  ),
};
