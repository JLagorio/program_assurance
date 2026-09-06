import { test } from "node:test";
import assert from "node:assert/strict";
import { createLedgerLocale } from "../src/lib/locale-format.ts";
test("server/client formatting has explicit locale and time zone defaults", () => {
  const locale = createLedgerLocale();
  assert.equal(locale.locale, "en-US");
  assert.equal(locale.timeZone, "UTC");
  assert.equal(locale.formatNumber(1234.5), "1,234.5");
  assert.equal(
    locale.formatDate(Date.UTC(2026, 8, 5, 23), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    "09/05/2026",
  );
});
test("translated templates own word order, numbers and plural categories", () => {
  const de = createLedgerLocale({ locale: "de-DE", messages: { pageLabel: "{page}. Seite" } });
  assert.equal(de.t("pageLabel", { page: de.formatNumber(1234) }), "1.234. Seite");
  assert.equal(de.t("close"), "Close");
  assert.equal(
    de.formatPlural(1, { one: "{count} Eintrag", other: "{count} Einträge" }),
    "1 Eintrag",
  );
  assert.equal(
    de.formatPlural(2, { one: "{count} Eintrag", other: "{count} Einträge" }),
    "2 Einträge",
  );
  const ar = createLedgerLocale({ locale: "ar-EG", direction: "rtl" });
  assert.equal(ar.formatPlural(2, { two: "عنصران", other: "{count} عناصر" }), "عنصران");
  assert.equal(ar.direction, "rtl");
});
test("date-only formatting preserves the local selected day independently of timestamp time zone", () => {
  const locale = createLedgerLocale({ locale: "en-US", timeZone: "Pacific/Honolulu" });
  const selected = new Date(2026, 8, 5);
  assert.equal(
    locale.formatCalendarDate(selected, { year: "numeric", month: "2-digit", day: "2-digit" }),
    "09/05/2026",
  );
  assert.equal(
    locale.formatDate(Date.UTC(2026, 8, 5), { year: "numeric", month: "2-digit", day: "2-digit" }),
    "09/04/2026",
  );
});
