import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { Truncate } from "./truncate";

/* A seat nobody holds: an owner, an assessor, a signer. It is Person's counterpart, the place a
   person's avatar and name would be, drawn as the avatar's empty form (a dashed circle at Person's
   xsmall size, 16px) beside words that say which role is empty. It is a statement, not a missing
   value, so it is said in words where Absent hears a dash; and it is the one thing a reader can
   fill, so with `onSelect` the whole seat is a button. The warning tone is the tone of no owner:
   the words in color.text.warning, the circle in color.border.warning. */

export type EmptySeatProps = Omit<ComponentProps<"span">, "children" | "onSelect"> & {
  /** The seat in words, naming the role nobody holds: "No owner", "No assessor", "No authorizing official". Drawn beside the dashed circle, and the seat's accessible name. */
  label: string;
  /** Makes the seat a button that fills it, such as one that opens Assign owner. Without it the seat only reports, and takes no Tab stop. */
  onSelect?: (() => void) | undefined;
};

/** A role nobody holds: a dashed circle and the words that say so, pressable when the caller can fill it. */
export function EmptySeat({ label, onSelect, className, ...props }: EmptySeatProps) {
  const seat = (
    <>
      <span
        aria-hidden="true"
        data-slot="empty-seat-mark"
        className="size-200 shrink-0 rounded-full border border-dashed border-warning"
      />
      {/* A label cut by its column shows whole on hover and keyboard focus while it is cut. */}
      <Truncate>{label}</Truncate>
    </>
  );
  return (
    <span
      {...props}
      className={cn(
        "inline-flex min-w-0 max-w-full align-middle font-medium text-warning",
        className,
      )}
      data-slot="empty-seat"
      data-pressable={onSelect ? "" : undefined}
    >
      {onSelect ? (
        <button
          type="button"
          data-slot="empty-seat-button"
          onClick={onSelect}
          className="relative flex min-w-0 cursor-pointer items-center gap-075 rounded-xsmall text-start outline-none touch-target-block hover:underline focus-visible:outline-focused"
        >
          {seat}
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-075">{seat}</span>
      )}
    </span>
  );
}
