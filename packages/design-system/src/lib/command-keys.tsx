import { DialogClose } from "../components/dialog";
import { useLedgerLocale } from "./locale";
import { KbdShortcut } from "../components/kbd";

/** The footer's keys, the same in every Command dialog of the kit: the arrows to move, Enter to choose or run, Escape to close. The caps come from KbdShortcut, so each key is drawn and named one way; the words come from the locale. Not a part; it lives beside `cn`. */
export function CommandKeys({ choose }: { choose?: string | undefined }) {
  const { t } = useLedgerLocale();
  return (
    <>
      <span className="flex items-center gap-050">
        <KbdShortcut keys="ArrowUp" />
        <KbdShortcut keys="ArrowDown" />
        <span>{t("keyHintMove")}</span>
      </span>
      <span className="flex items-center gap-050">
        <KbdShortcut keys="Enter" />
        <span>{choose ?? t("keyHintChoose")}</span>
      </span>
      <DialogClose
        aria-label={t("close")}
        className="flex items-center gap-050 rounded-small outline-none focus-visible:outline-focused"
      >
        <KbdShortcut keys="Escape" />
        <span>{t("keyHintClose")}</span>
      </DialogClose>
    </>
  );
}
