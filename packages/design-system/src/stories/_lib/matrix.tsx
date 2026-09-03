import type { Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { Box, Inline, Stack, Text } from "../../primitives";

/**
 * The matrix is the contract: every variant down the side, every state or size across the top,
 * one cell per pairing. A family's Matrix story is what Josef signs off, in both modes.
 */
export function Matrix<R extends string, C extends string>({
  rows,
  cols,
  rowLabel = "variant",
  render,
}: {
  rows: readonly R[];
  cols: readonly C[];
  rowLabel?: string;
  render: (row: R, col: C) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-left">
        <thead>
          <tr>
            <th className="h-row-header pe-300 align-bottom font-body-small font-medium text-subtlest">
              {rowLabel}
            </th>
            {cols.map((c) => (
              <th
                key={c}
                className="h-row-header pe-300 align-bottom font-body-small font-medium text-subtlest"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r} className="border-t border-default">
              <td className="py-150 pe-300 align-middle font-body-small text-subtle">{r}</td>
              {cols.map((c) => (
                <td key={c} className="py-150 pe-300 align-middle">
                  {render(r, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A labelled row of specimens, for families whose states do not form a grid. */
export function Specimens({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack space="space.100">
      <Text size="xsmall" color="color.text.subtlest">
        {title}
      </Text>
      <Inline space="space.150" rowSpace="space.150" alignBlock="center" shouldWrap>
        {children}
      </Inline>
    </Stack>
  );
}

/**
 * Renders the story twice, light beside dark, whatever the toolbar says. Each half is its own
 * mode scope (tokens.css defines both), so the two share nothing but the story.
 */
export const bothModes: Decorator = (Story) => (
  <div className="grid gap-200 lg:grid-cols-2">
    {(["light", "dark"] as const).map((mode) => (
      <div key={mode} data-color-mode={mode} className="min-w-0">
        <Box
          backgroundColor="elevation.surface"
          padding="space.200"
          className="rounded-large border border-default"
        >
          <Stack space="space.200">
            <Text size="xsmall" color="color.text.subtlest">
              {mode}
            </Text>
            <Story />
          </Stack>
        </Box>
      </div>
    ))}
  </div>
);
