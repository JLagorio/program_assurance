import { useCallback, useRef, useState, type ReactNode } from "react";

import { Popover, PopoverContent } from "../../components/popover";
import { useLedgerLocale } from "../../lib/locale";

/* Choosing a mark: where it sits, what was chosen, and the details card anchored to it. */

/** Where a chosen mark sits in the plot, in pixels, so a details card can anchor to it. */
export type Anchor = { x: number; y: number; width: number; height: number };

export type Picked<T> = { item: T; anchor: Anchor };

/** A plot's chosen mark: set by a click or by Enter on the focused plot, cleared when its card closes. */
export function usePicked<T>() {
  const [picked, setPicked] = useState<Picked<T> | null>(null);
  const pick = useCallback((item: T, anchor: Anchor) => setPicked({ item, anchor }), []);
  const clear = useCallback(() => setPicked(null), []);
  return { picked, pick, clear };
}

export const rectAnchor = (p: {
  x?: number | undefined;
  y?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}): Anchor => ({ x: p.x ?? 0, y: p.y ?? 0, width: p.width ?? 0, height: p.height ?? 0 });

export const pointAnchor = (
  p: { x?: number | undefined; y?: number | undefined } | undefined,
  r = 4,
): Anchor => ({
  x: (p?.x ?? 0) - r,
  y: (p?.y ?? 0) - r,
  width: r * 2,
  height: r * 2,
});

/** The card's head: what was chosen, in a swatch and a name, and its value. */
export function CardHead({
  swatch,
  title,
  subtitle,
  value,
  rows,
}: {
  swatch?: ReactNode | undefined;
  title: string;
  subtitle?: string | undefined;
  value?: string | undefined;
  /** One line per series, for a whole category; `note` is the change from the point before. */
  rows?:
    | { swatch: ReactNode; label: string; value: string; note?: string | null | undefined }[]
    | undefined;
}) {
  return (
    <div className="flex flex-col gap-025">
      <div className="flex items-center gap-075">
        {swatch}
        <span className="min-w-0 truncate font-body-small font-medium text-default">{title}</span>
      </div>
      {subtitle ? <span className="font-body-xsmall text-subtle">{subtitle}</span> : null}
      {value !== undefined ? (
        <span className="font-heading-small tabular-nums text-default">{value}</span>
      ) : null}
      {rows?.length ? (
        <div className="flex flex-col gap-025 pt-025">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-100 font-body-small">
              {r.swatch}
              <span className="min-w-0 flex-1 truncate text-subtle">{r.label}</span>
              {r.note ? <span className="tabular-nums text-subtlest">{r.note}</span> : null}
              <span className="tabular-nums font-medium text-default">{r.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The details card: the kit's PopoverContent anchored to the chosen mark, above it, closed by
 * Escape or a click outside, focus back on the plot after.
 */
export function Card({
  anchor,
  label,
  onClose,
  refocus,
  children,
}: {
  anchor: Anchor;
  label: string | undefined;
  onClose: () => void;
  /** Where focus goes when the card closes: back to the plot. */
  refocus: () => void;
  children: ReactNode;
}) {
  const { t } = useLedgerLocale();
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div
        ref={anchorRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }}
      />
      <PopoverContent
        anchor={anchorRef}
        side="top"
        align="center"
        sideOffset={6}
        collisionPadding={8}
        aria-label={label ? t("detailsLabel", { label }) : t("details")}
        finalFocus={() => {
          refocus();
          return false;
        }}
        className="gap-150"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
