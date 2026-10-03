import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type RefObject } from "react";
import { expect } from "storybook/test";

import * as tokenSheet from "../_lib/sheet";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Group, Page, Spec, under } = tokenSheet;

const meta = { title: "Tokens/Metrics", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Bars({ prefix }: { prefix: string }) {
  return (
    <div className="flex flex-wrap items-end gap-300">
      {under(prefix).map((d) => (
        <div key={d.name} className="flex flex-col items-start gap-050">
          <div
            className="flex w-[96px] items-center justify-center rounded-medium bg-brand-subtlest font-body-small text-brand"
            style={{ height: `var(${d.cssVar})` }}
          >
            {d.light}
          </div>
          <span className="font-body text-default">{d.name.split(".").slice(-1)[0]}</span>
          <Spec>{d.utility}</Spec>
        </div>
      ))}
    </div>
  );
}

export const Dimension: Story = {
  render: () => (
    <Page
      title="Metrics"
      lede="Tier 5, our extension: control heights as a themed axis, not left to components. Motion is six durations, three curves and a stagger step."
    >
      <Group title="dimension.control">
        <Bars prefix="dimension.control" />
      </Group>
      <Group title="dimension.row">
        <Bars prefix="dimension.row" />
      </Group>
      <Group title="dimension.icon">
        <div className="flex flex-wrap items-end gap-300">
          {under("dimension.icon").map((d) => (
            <div key={d.name} className="flex flex-col items-start gap-050">
              <div
                className="rounded-small bg-neutral-bold"
                style={{ width: `var(${d.cssVar})`, height: `var(${d.cssVar})` }}
              />
              <span className="font-body text-default">{d.name.split(".").slice(-1)[0]}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
      <Group title="dimension.part">
        {/* A part's own size, read by that part: listed, not drawn, since a popup's width is wider
            than a phone. */}
        <ul className="flex flex-col gap-150">
          {under("dimension.part").map((d) => (
            <li key={d.name} className="flex flex-col gap-025">
              <span className="font-body text-default">{d.name}</span>
              <Spec>{d.light}</Spec>
              <span className="font-body-small text-subtle">{d.description}</span>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="motion">
        {/* Rows stack where the sheet, not the window, is too narrow for the columns. */}
        <div className="@container flex flex-col gap-150 @lg:gap-050">
          {under("motion").map((d) => (
            <div
              key={d.name}
              className="grid grid-cols-1 gap-x-300 @lg:grid-cols-[220px_160px_minmax(0,1fr)]"
            >
              <span>{d.name}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
};

/* Each container size as a pair of classes the scanner can see: the words shown from the size up,
   and the words shown below it. Written out, since a class is never built from a string. */
const containerSteps: Record<string, { reached: string; below: string }> = {
  "3xs": { reached: "hidden @3xs:inline", below: "@3xs:hidden" },
  "2xs": { reached: "hidden @2xs:inline", below: "@2xs:hidden" },
  xs: { reached: "hidden @xs:inline", below: "@xs:hidden" },
  sm: { reached: "hidden @sm:inline", below: "@sm:hidden" },
  md: { reached: "hidden @md:inline", below: "@md:hidden" },
  compact: { reached: "hidden @compact:inline", below: "@compact:hidden" },
  lg: { reached: "hidden @lg:inline", below: "@lg:hidden" },
  xl: { reached: "hidden @xl:inline", below: "@xl:hidden" },
  "2xl": { reached: "hidden @2xl:inline", below: "@2xl:hidden" },
  "3xl": { reached: "hidden @3xl:inline", below: "@3xl:hidden" },
  split: { reached: "hidden @split:inline", below: "@split:hidden" },
  "4xl": { reached: "hidden @4xl:inline", below: "@4xl:hidden" },
  "5xl": { reached: "hidden @5xl:inline", below: "@5xl:hidden" },
  "6xl": { reached: "hidden @6xl:inline", below: "@6xl:hidden" },
  "7xl": { reached: "hidden @7xl:inline", below: "@7xl:hidden" },
};

const pixels = (rem: string) =>
  parseFloat(rem) * parseFloat(getComputedStyle(document.documentElement).fontSize);

function ContainerWidth({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return (
    <span className="font-body-small text-subtle">
      {width === null ? "Measuring the container" : `This container is ${width}px wide.`}
    </span>
  );
}

/**
 * The container sizes, live. The frame below is a container: each step says whether the frame has
 * reached it, through the step's own `@` variant, so the words are what a part inside would see.
 * Drag the frame's corner to resize it, or open the story in the 320px frame.
 */
export const ContainerSizes: Story = {
  render: function Render() {
    const frame = useRef<HTMLDivElement>(null);
    const steps = under("dimension.container").sort(
      (a, b) => parseFloat(a.light) - parseFloat(b.light),
    );
    return (
      <Page
        title="Container sizes"
        lede="A part inside a panel, a rail or a dialog switches on its own width, never the window's. These are the sizes a container query reads: Tailwind's scale restated as tokens, and two of the kit's own. @md is 28rem inside a container; md: is the 48rem viewport breakpoint."
      >
        <Group title="dimension.container">
          <ContainerWidth target={frame} />
          <div
            ref={frame}
            data-container-frame
            className="@container resize-x overflow-auto rounded-large border border-default"
          >
            <ul className="flex flex-col divide-y divide-[var(--ds-color-border)]">
              {steps.map((d) => {
                const key = d.name.split(".").at(-1) ?? "";
                const classes = containerSteps[key];
                if (!classes) return null;
                return (
                  <li
                    key={d.name}
                    data-step={key}
                    data-px={d.lightResolved}
                    className="flex flex-wrap items-baseline justify-between gap-x-200 gap-y-025 px-150 py-075"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-body text-default">@{key}</span>
                      <Spec>{d.name}</Spec>
                    </span>
                    <span className="font-body-small text-subtle">
                      {d.light} ·{" "}
                      <span data-reached className={`font-medium text-default ${classes.reached}`}>
                        reached
                      </span>
                      <span data-below className={classes.below}>
                        not reached
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Group>
      </Page>
    );
  },
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>("[data-container-frame]");
    if (!frame) throw new Error("no container frame");
    const rows = [...frame.querySelectorAll<HTMLElement>("[data-step]")];
    await expect(rows).toHaveLength(Object.keys(containerSteps).length);
    for (const row of rows) {
      const reached = frame.clientWidth >= pixels(row.dataset["px"] ?? "0");
      const shown = (selector: string) =>
        getComputedStyle(row.querySelector(selector) ?? row).display !== "none";
      await expect(shown("[data-reached]"), `@${row.dataset["step"]} reached`).toBe(reached);
      await expect(shown("[data-below]"), `@${row.dataset["step"]} below`).toBe(!reached);
    }
  },
};
