import { Kbd } from "../components/kbd";

/** The footer's keys, the same in every Command dialog of the kit: the arrows to move, Enter to choose or run, Escape to close. Not a part; it lives beside `cn`. */
export function CommandKeys({ choose = "to choose" }: { choose?: string | undefined }) {
  return (
    <>
      <span className="flex items-center gap-050">
        <Kbd label="Up arrow">↑</Kbd>
        <Kbd label="Down arrow">↓</Kbd>
        <span>to move</span>
      </span>
      <span className="flex items-center gap-050">
        <Kbd label="Enter">↵</Kbd>
        <span>{choose}</span>
      </span>
      <span className="flex items-center gap-050">
        <Kbd>Esc</Kbd>
        <span>to close</span>
      </span>
    </>
  );
}
