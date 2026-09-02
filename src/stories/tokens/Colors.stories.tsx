import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, Dot } from "@/ds/primitives";
import type { Tone } from "@/ds/primitives";

import { Group, Sheet, Swatch } from "../_lib/tokens";

const meta = {
  title: "Tokens/Colors",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {
  render: () => (
    <Sheet
      title="Colors"
      lede="White canvas, one blue, soft semantic fills. Values are live — flip the Theme toolbar to compare sheets."
    >
      <Group title="Surfaces" note="canvas, panes, fills">
        <Swatch token="--background" />
        <Swatch token="--card" />
        <Swatch token="--surface-2" />
        <Swatch token="--subtle" />
        <Swatch token="--muted" />
        <Swatch token="--surface-hover" />
      </Group>

      <Group title="Ink" note="text" cols={4}>
        <Swatch token="--foreground" />
        <Swatch token="--secondary-foreground" />
        <Swatch token="--muted-foreground" />
        <Swatch token="--primary-foreground" note="on primary" />
      </Group>

      <Group title="Lines" note="always 1px" cols={4}>
        <Swatch token="--border-subtle" />
        <Swatch token="--border" />
        <Swatch token="--border-strong" />
        <Swatch token="--input" />
      </Group>

      <Group title="Blue" note="the only accent hue" cols={6}>
        <Swatch token="--primary" />
        <Swatch token="--primary-soft" />
        <Swatch token="--primary-hover" note="hover / pressed" />
        <Swatch token="--ring" />
        <Swatch token="--sidebar-accent" />
        <Swatch token="--sidebar-accent-foreground" />
      </Group>

      <Group title="Status" note="solid + soft pairs" cols={8}>
        <Swatch token="--success" />
        <Swatch token="--success-soft" />
        <Swatch token="--warning" />
        <Swatch token="--warning-soft" />
        <Swatch token="--danger" />
        <Swatch token="--danger-soft" />
        <Swatch token="--info" />
        <Swatch token="--info-soft" />
      </Group>
    </Sheet>
  ),
};

const tones: { tone: Tone; label: string }[] = [
  { tone: "success", label: "Satisfied" },
  { tone: "warning", label: "Partially satisfied" },
  { tone: "danger", label: "Other than satisfied" },
  { tone: "info", label: "In assessment" },
  { tone: "neutral", label: "Not assessed" },
];

/** The two places colour is actually spent: the five-tone status system and the blue budget. */
export const InUse: Story = {
  render: () => (
    <Sheet
      title="Colour in use"
      lede="Status reaches colour only through tone. Blue has four permitted uses."
    >
      <Group title="Tone" note="Badge and Dot, text at the solid on the soft" cols={5}>
        {tones.map((t) => (
          <div key={t.tone} className="space-y-2">
            <Badge tone={t.tone}>{t.label}</Badge>
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Dot tone={t.tone} /> {t.tone}
            </div>
          </div>
        ))}
      </Group>

      <Group title="Blue budget" note="primary action · selection · focus ring · link" cols={4}>
        <div className="space-y-1.5">
          <Button variant="primary">Submit package</Button>
          <div className="text-[11.5px] text-muted-foreground">Primary action</div>
        </div>
        <div className="space-y-1.5">
          <div className="flex h-8 items-center rounded-md bg-primary-soft px-2.5 text-[13px] font-medium text-primary">
            Selected row
          </div>
          <div className="text-[11.5px] text-muted-foreground">Selection tint</div>
        </div>
        <div className="space-y-1.5">
          <div className="flex h-8 items-center rounded-md border border-input bg-card px-2.5 text-[13px] ring-2 ring-ring/35 ring-offset-1 ring-offset-background">
            gcs-app-01
          </div>
          <div className="text-[11.5px] text-muted-foreground">Focus ring</div>
        </div>
        <div className="space-y-1.5">
          <div className="flex h-8 items-center text-[13px]">
            <a href="#" className="text-primary underline-offset-2 hover:underline">
              POAM-0042
            </a>
          </div>
          <div className="text-[11.5px] text-muted-foreground">Link</div>
        </div>
      </Group>
    </Sheet>
  ),
};
