/**
 * The one "today" the whole product runs against.
 *
 * Every figure in this app is derived from static mock data frozen in August
 * 2026. A render path that reads the wall clock therefore drifts away from the
 * dataset by one day per real day, and — worse — two pages that read it at
 * different moments disagree about the same commitment. Lateness against a
 * committed date is the load-bearing number in a GRC product, so it has to come
 * from one place.
 *
 * This module is deliberately dependency-free. It sits below `conmon.ts`,
 * `program-stage.ts`, `program-coverage.ts`, `te-phases.ts` and
 * `risk-scoring.ts` so any of them can import it without creating a cycle
 * (`conmon.ts` already imports `parseGateDate` from `program-stage.ts`, so the
 * clock cannot live in either of those).
 *
 * Selectors take `now` as a parameter defaulted to `datasetNow` rather than
 * reading it at module scope inside a component, so a caller can still ask
 * "what does this look like on another date?" without the default ever being
 * the wall clock.
 */

/** The dataset's now. Never `new Date()` — that desynchronises SSR and CSR. */
export const datasetNow = new Date("2026-08-30T12:00:00Z");

/** How that date is labelled on screen. */
export const datasetToday = "Aug 30, 2026";
