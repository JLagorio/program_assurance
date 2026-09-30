import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { expect } from "storybook/test";

import { Group, Page, Spec, TokenTable, allDocs, under, type TokenDoc } from "../_lib/sheet";
import { formatRatio, measure, type Paint } from "./_contrast";

const meta = { title: "Tokens/Color", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const lede =
  "Tier 1. Every value is a ramp step per mode. A state (hovered, pressed) is its own token, never alpha on a base token. Utilities are generated per property: a text token is only reachable as text-*, a background token only as bg-*.";

export const Background: Story = {
  render: () => (
    <Page title="Color · background" lede={lede}>
      {[
        "neutral",
        "brand",
        "selected",
        "danger",
        "warning",
        "success",
        "information",
        "disabled",
        "input",
        "inverse",
        "accent",
      ].map((role) => (
        <Group key={role} title={role}>
          <TokenTable rows={under(`color.background.${role}`)} />
        </Group>
      ))}
      <Group title="blanket · skeleton">
        <TokenTable rows={[...under("color.blanket"), ...under("color.skeleton")]} />
      </Group>
    </Page>
  ),
};

export const Text: Story = {
  render: () => (
    <Page title="Color · text" lede={lede}>
      <TokenTable rows={under("color.text")} />
    </Page>
  ),
};

export const Icon: Story = {
  render: () => (
    <Page
      title="Color · icon"
      lede="Icons mirror text, one step bolder where a thin glyph needs it. Reached as icon-*."
    >
      <TokenTable rows={under("color.icon")} />
    </Page>
  ),
};

export const Border: Story = {
  render: () => (
    <Page title="Color · border" lede={lede}>
      <TokenTable rows={under("color.border")} />
    </Page>
  ),
};

export const Elevation: Story = {
  render: () => (
    <Page
      title="Elevation"
      lede="Surfaces pair with shadows: raised with shadow.raised, overlay with shadow.overlay. In dark, surfaces climb in lightness instead of casting more shadow. utility.elevation.surface.current is set by surface-owning components and read by sticky and masking children. The layers say which surface stacks over which."
    >
      <Group title="surface">
        <TokenTable
          rows={[...under("elevation.surface"), ...under("utility.elevation.surface.current")]}
        />
      </Group>
      <Group title="shadow">
        <TokenTable rows={under("elevation.shadow")} />
      </Group>
      <Group title="opacity">
        <TokenTable rows={under("opacity")} />
      </Group>
      <Group title="layer · the stacking order, lowest first">
        <TokenTable rows={under("layer")} />
      </Group>
    </Page>
  ),
};

export const Chart: Story = {
  render: () => (
    <Page
      title="Color · chart"
      lede="Tier 1 for data. Every series on a chart is one of these, and nothing else reaches the teal and purple ramps. The same step in both modes, so a chart weighs the same on either surface. The categorical order is validated for deutan and protan vision in both modes: assign in order, never by rank, and fold a seventh category into Other."
    >
      <Group title="series · a status, brand, context, the track">
        <TokenTable
          rows={under("color.chart").filter(
            (d) => !/categorical|sequential|diverging/.test(d.name),
          )}
        />
      </Group>
      <Group title="categorical · six hues in order, then Other">
        <TokenTable rows={under("color.chart.categorical")} />
      </Group>
      <Group title="sequential · one hue, near zero to the most">
        <TokenTable rows={under("color.chart.sequential")} />
      </Group>
      <Group title="diverging · negative, midpoint, positive">
        <TokenTable rows={under("color.chart.diverging")} />
      </Group>
    </Page>
  ),
};

/* ---- increased contrast ---- */

type ContrastDoc = TokenDoc & {
  contrast: { light: string; dark: string; lightResolved: string; darkResolved: string } | null;
};
const contrastDocs = (allDocs as ContrastDoc[]).filter((d) => d.contrast !== null);

const paintOf = (d: TokenDoc): Paint =>
  d.group === "background" ? "background" : d.group === "border" ? "border" : "text";
const minimumOf = (d: TokenDoc) => (d.group === "text" ? 4.5 : 3);

/** The token painted on the surface, in the contrast its cell pins and the mode the toolbar sets. */
function ContrastSwatch({ d }: { d: TokenDoc }) {
  const v = `var(${d.cssVar})`;
  if (d.group === "background")
    return (
      <span
        data-swatch
        className="block h-500 w-full rounded-medium"
        style={{ backgroundColor: v }}
      />
    );
  if (d.group === "border")
    return (
      <span
        data-swatch
        className="block h-500 w-full rounded-medium border border-solid"
        style={{ borderColor: v }}
      />
    );
  if (d.group === "icon")
    return (
      <svg
        data-swatch
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-300"
        style={{ color: v }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    );
  return (
    <span data-swatch className="font-heading-small" style={{ color: v }}>
      Aa
    </span>
  );
}

/** Re-reads the ratio whenever the toolbar changes the root's mode or contrast. */
function useMeasured(paint: Paint) {
  const ref = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(Number.NaN);
  useEffect(() => {
    const read = () => {
      const swatch = ref.current?.querySelector("[data-swatch]");
      if (swatch) setRatio(measure(swatch, paint));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode", "data-contrast-mode"],
    });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", read);
    return () => {
      observer.disconnect();
      scheme.removeEventListener("change", read);
    };
  }, [paint]);
  return { ref, ratio };
}

function ContrastCell({
  d,
  contrast,
  title,
  light,
  dark,
}: {
  d: TokenDoc;
  contrast: "no-preference" | "more";
  title: string;
  light: string;
  dark: string;
}) {
  const { ref, ratio } = useMeasured(paintOf(d));
  return (
    <figure data-contrast-mode={contrast} className="flex min-w-0 flex-col gap-075">
      <div
        ref={ref}
        data-cell={contrast === "more" ? "increased" : "standard"}
        data-token={d.name}
        className="flex h-600 items-center justify-center rounded-medium border border-default bg-surface px-100"
      >
        <ContrastSwatch d={d} />
      </div>
      <figcaption className="flex flex-col gap-025">
        <span className="font-body-small font-medium text-default">
          {title} · <span data-ratio>{formatRatio(ratio)}</span>
        </span>
        <Spec>light {light}</Spec>
        <Spec>dark {dark}</Spec>
      </figcaption>
    </figure>
  );
}

function ContrastRow({ d }: { d: ContrastDoc }) {
  const contrast = d.contrast;
  if (contrast === null) return null;
  return (
    <div className="grid grid-cols-1 gap-150 py-150 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex min-w-0 flex-col gap-025">
        <span className="font-body text-default">{d.name}</span>
        {d.utility ? <Spec>{d.utility}</Spec> : null}
        <span className="font-body-small text-subtle">{d.description}</span>
      </div>
      <div className="grid grid-cols-2 gap-100">
        <ContrastCell
          d={d}
          contrast="no-preference"
          title="Standard"
          light={d.light}
          dark={d.dark ?? d.light}
        />
        <ContrastCell
          d={d}
          contrast="more"
          title="Increased"
          light={contrast.light}
          dark={contrast.dark}
        />
      </div>
    </div>
  );
}

function ContrastGroup({ title, docs }: { title: string; docs: ContrastDoc[] }): ReactNode {
  return (
    <Group title={title}>
      {/* Rows stack where the sheet, not the window, is too narrow for the columns. */}
      <div className="@container flex flex-col divide-y divide-[var(--ds-color-border)]">
        {docs.map((d) => (
          <ContrastRow key={d.name} d={d} />
        ))}
      </div>
    </Group>
  );
}

/**
 * Every token with an increased-contrast value, at the standard contrast and at the increased one,
 * in the mode the toolbar sets. Each cell pins its own `data-contrast-mode`; the ratio under it is
 * measured in the browser against the surface. Flip Mode in the toolbar for dark.
 */
export const IncreasedContrast: Story = {
  render: () => (
    <Page
      title="Color · increased contrast"
      lede="The reader asked for more contrast: prefers-contrast: more, or data-contrast-mode set to more on the root. Field and choice boundaries, hairlines and the selected, pressed and highlighted fills reach 3:1 against the surface; the text and icons drawn on those fills keep 4.5:1 and 3:1. The standard values stay the default."
    >
      <ContrastGroup
        title="boundaries · field and choice controls, hairlines"
        docs={contrastDocs.filter((d) => d.group === "border")}
      />
      <ContrastGroup
        title="state fills · pressed, highlighted, selected"
        docs={contrastDocs.filter((d) => d.group === "background")}
      />
      <ContrastGroup
        title="text and icons drawn on those fills"
        docs={contrastDocs.filter((d) => d.group === "text" || d.group === "icon")}
      />
    </Page>
  ),
  play: async ({ canvasElement }) => {
    const swatch = (cell: "standard" | "increased", name: string) => {
      const el = canvasElement.querySelector(
        `[data-cell="${cell}"][data-token="${name}"] [data-swatch]`,
      );
      if (!el) throw new Error(`no ${cell} swatch for ${name}`);
      return el;
    };
    await expect(canvasElement.querySelectorAll('[data-cell="increased"]')).toHaveLength(
      contrastDocs.length,
    );
    // Each increased value meets its minimum against the surface, in the mode the run sets.
    for (const d of contrastDocs)
      await expect(
        measure(swatch("increased", d.name), paintOf(d)),
        `${d.name} at increased contrast`,
      ).toBeGreaterThanOrEqual(minimumOf(d));
    // The recorded default is untouched: the field boundary stays light at standard contrast.
    const standardField = swatch("standard", "color.border.input");
    const increasedField = swatch("increased", "color.border.input");
    await expect(measure(standardField, "border")).toBeLessThan(3);
    await expect(getComputedStyle(increasedField).borderTopColor).not.toBe(
      getComputedStyle(standardField).borderTopColor,
    );
  },
};
