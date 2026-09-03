import type { ReactNode } from "react";

import { Box, Inline, Stack, Text } from "../../primitives";

/**
 * The matrix is the contract: every variant down the side, every state or size across the top,
 * one cell per pairing. A family's Matrix story is what Josef signs off; the toolbar switches the mode.
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
