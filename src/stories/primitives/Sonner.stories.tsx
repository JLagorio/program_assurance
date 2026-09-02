import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import { Button, Toaster, toast } from "@/ds/primitives";

const meta = {
  title: "Primitives/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "420px" } } },
  args: { expand: true },
  argTypes: {
    expand: { control: "boolean" },
    position: {
      control: "inline-radio",
      options: ["bottom-right", "bottom-left", "top-right", "top-center"],
    },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fires one of each tone shortly after mount and leaves them up so the stack can be read. */
function Fire() {
  useEffect(() => {
    const t = setTimeout(() => {
      toast.success("Evidence linked", {
        description: "EV-0418 now supports AC-2(3).",
        duration: Infinity,
      });
      toast.warning("Assessment due in 3 days", {
        description: "AC-2(3) · owner D. Reyes",
        duration: Infinity,
      });
      toast.error("Export failed", {
        description: "The OSCAL profile has 2 unresolved imports.",
        duration: Infinity,
        action: { label: "Retry", onClick: () => {} },
      });
    }, 60);
    return () => {
      clearTimeout(t);
      toast.dismiss();
    };
  }, []);
  return null;
}

export const Stack: Story = {
  render: (args) => (
    <div className="h-[400px] p-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success("Evidence linked")}>Success</Button>
        <Button onClick={() => toast.info("Package locked for review")}>Info</Button>
        <Button onClick={() => toast.warning("Assessment due in 3 days")}>Warning</Button>
        <Button
          onClick={() =>
            toast.error("Export failed", {
              description: "The OSCAL profile has 2 unresolved imports.",
            })
          }
        >
          Error
        </Button>
      </div>
      <Toaster {...args} />
      <Fire />
    </div>
  ),
};
