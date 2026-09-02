import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Drawer, Field, NativeSelect, Textarea } from "@/ds/primitives";
import { behindPage, people } from "../_lib/fixtures";

const noop = () => {};

const meta = {
  title: "Primitives/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "560px" } },
  },
  decorators: [behindPage],
  args: {
    open: true,
    onClose: noop,
    title: "Assign this control",
    description: "The owner gets the queue item and the ISSO is copied.",
    children: null,
  },
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
    onClose: { control: false },
    children: { control: false },
    footer: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rises from the bottom with a drag handle: a short form and a footer. Drag down or press Escape to close. */
export const Open: Story = {
  args: {
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Assign</Button>
      </>
    ),
    children: (
      <div className="space-y-4">
        <Field label="Owner">
          <NativeSelect defaultValue="D. Reyes">
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Note" hint="Shown in the activity feed.">
          <Textarea placeholder="Why this person" />
        </Field>
      </div>
    ),
  },
};
