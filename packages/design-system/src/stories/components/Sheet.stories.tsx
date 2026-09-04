import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Sheet } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj;

function SheetStates() {
  const [open, setOpen] = useState<"end" | "start" | "wide" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Sheet">
        <Button variant="secondary" onClick={() => setOpen("end")}>
          From the end
        </Button>
        <Button variant="secondary" onClick={() => setOpen("start")}>
          From the start
        </Button>
        <Button variant="secondary" onClick={() => setOpen("wide")}>
          Wide with a footer
        </Button>
      </Specimens>
      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title="AC-2(3) Disable accounts"
        subtitle="Access control · Moderate"
        side={open === "start" ? "start" : "end"}
        width={open === "wide" ? 640 : 420}
        footer={
          open === "wide" ? (
            <Button variant="primary" onClick={() => setOpen(null)}>
              Save
            </Button>
          ) : undefined
        }
      >
        <Text>Body of a sheet from the {open}.</Text>
      </Sheet>
    </Stack>
  );
}
/** Either side, and wide with a footer. Open one. */
export const SheetMatrix: Story = { render: () => <SheetStates /> };
