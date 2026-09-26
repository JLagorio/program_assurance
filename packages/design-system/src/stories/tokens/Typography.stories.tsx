import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Group, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Typography", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sample = "Control SC-7(5) · Boundary protection · Deny by default, allow by exception";

const composites = [
  "font.heading.medium",
  "font.heading.small",
  "font.heading.xsmall",
  "font.body.large",
  "font.body",
  "font.body.small",
  "font.body.xsmall",
  "font.code",
];

export const Specimen: Story = {
  render: () => (
    <Page
      title="Typography"
      lede="Tier 2. A type token is one font shorthand: family, weight, size, leading, and its letter-spacing. Labels are font.body.small plus font.weight.medium, not a size of their own. No half pixels exist."
    >
      <Group title="composites">
        {/* Rows stack where the sheet, not the window, is too narrow for the columns. */}
        <div className="@container flex flex-col divide-y divide-[var(--ds-color-border)]">
          {composites.map((name) => {
            const d = under(name).find((x) => x.name === name);
            if (!d) return null;
            return (
              <div
                key={name}
                className="grid grid-cols-1 items-baseline gap-x-300 gap-y-100 py-150 @md:grid-cols-[220px_minmax(0,1fr)]"
              >
                <div className="flex flex-col gap-025">
                  <span className="font-body text-default">{name}</span>
                  <Spec>{d.utility}</Spec>
                  <Spec>{d.light}</Spec>
                </div>
                <div className={d.utility ?? ""}>{sample}</div>
              </div>
            );
          })}
        </div>
      </Group>
      <Group title="weights, on font.body">
        <div className="flex flex-wrap gap-400">
          {["font-regular", "font-medium", "font-semibold"].map((w) => (
            <div key={w} className="flex flex-col gap-050">
              <span className={`font-body ${w}`}>{sample.split(" · ")[1]}</span>
              <Spec>{w}</Spec>
            </div>
          ))}
        </div>
      </Group>
      <Group title="families">
        <div className="@container flex flex-col gap-150 @md:gap-050">
          {under("font.family").map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-1 gap-x-300 @md:grid-cols-[220px_minmax(0,1fr)]"
            >
              <span>{d.name}</span>
              {/* A font stack is one long token: it breaks at its hyphens and spaces first. */}
              <span className="min-w-0 break-words">
                <Spec>{d.light}</Spec>
              </span>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
};

const faces = [
  { label: "Regular 400", className: "font-body font-regular" },
  { label: "Medium 500", className: "font-body font-medium" },
  { label: "Semibold 600", className: "font-body font-semibold" },
  { label: "Italic 400", className: "font-body italic" },
];

/**
 * The faces fonts.css ships, rendered from the package: Geist's variable font, upright and italic.
 * The Storybook imports fonts.css as a product does, so what loads here loads there.
 */
export const PackagedFaces: Story = {
  render: () => (
    <Page
      title="Packaged faces"
      lede='fonts.css ships Geist from @fontsource-variable/geist: one variable font for every weight, upright and italic, under the name "Geist Variable", which the font tokens name first.'
    >
      <Group title="font.family.body · Geist Variable">
        <div className="flex flex-col gap-100">
          {faces.map((face) => (
            <div key={face.label} data-face className="flex flex-wrap items-baseline gap-x-300">
              <span className={face.className}>{sample.split(" · ")[1]}</span>
              <Spec>{face.label}</Spec>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    for (const descriptor of ['400 13px "Geist Variable"', 'italic 400 13px "Geist Variable"']) {
      const loaded = await document.fonts.load(descriptor, "Boundary");
      await expect(loaded.length, descriptor).toBeGreaterThan(0);
      await expect(loaded.every((face) => face.status === "loaded")).toBe(true);
    }
    const sampleText = canvasElement.querySelector("[data-face] span");
    if (!sampleText) throw new Error("no sample");
    await expect(getComputedStyle(sampleText).fontFamily).toMatch(/^"Geist Variable"/);
  },
};
