import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Drawer } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj;

function DrawerStates() {
  const [open, setOpen] = useState<"plain" | "footer" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Drawer">
        <Button variant="secondary" onClick={() => setOpen("plain")}>
          Plain
        </Button>
        <Button variant="secondary" onClick={() => setOpen("footer")}>
          With a footer
        </Button>
      </Specimens>
      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title="Filters"
        description="A drawer rises from the bottom; it is the small-screen form of a Sheet."
        footer={
          open === "footer" ? (
            <Button variant="primary" onClick={() => setOpen(null)}>
              Apply
            </Button>
          ) : undefined
        }
      >
        <Text>Body of the drawer.</Text>
      </Drawer>
    </Stack>
  );
}
/** Plain and with a footer. Open one. */
export const DrawerMatrix: Story = { render: () => <DrawerStates /> };
