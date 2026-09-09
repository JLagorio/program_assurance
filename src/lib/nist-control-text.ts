/**
 * SP 800-53 Rev. 5 control statements, discussion, parameters and
 * SP 800-53A Rev. 5 assessment objectives, methods and objects, keyed by
 * control id — the whole catalog, 1196 controls and enhancements.
 *
 * Large: import it dynamically (a route loader) so it never lands in the
 * initial bundle. The text is split into 20 per-family chunks under
 * `./nist-control-text/`; this facade pulls all of them and merges, which is
 * what a screen wanting the entire catalog (SCTM, ConMon, baseline) needs.
 *
 * A screen that needs ONE family or ONE control must import
 * `./nist-control-text/registry` instead — importing this module materialises
 * every family, so `loadControlText` re-exported here is a convenience, not a
 * saving.
 *
 * Generated from the NIST OSCAL release of SP 800-53 Rev. 5 (catalog version
 * 5.2.0, 2026-05-11, OSCAL 1.2.2) and the SP 800-53B Low /
 * Moderate / High / Privacy baseline profiles.
 * NIST publications are US Government works in the public domain.
 *
 * Do not hand-edit — regenerate with: node scripts/gen-nist-catalog.mjs
 */

import type { NistControlText } from "./nist-catalog";
import { controlText as ac } from "./nist-control-text/ac";
import { controlText as at } from "./nist-control-text/at";
import { controlText as au } from "./nist-control-text/au";
import { controlText as ca } from "./nist-control-text/ca";
import { controlText as cm } from "./nist-control-text/cm";
import { controlText as cp } from "./nist-control-text/cp";
import { controlText as ia } from "./nist-control-text/ia";
import { controlText as ir } from "./nist-control-text/ir";
import { controlText as ma } from "./nist-control-text/ma";
import { controlText as mp } from "./nist-control-text/mp";
import { controlText as pe } from "./nist-control-text/pe";
import { controlText as pl } from "./nist-control-text/pl";
import { controlText as pm } from "./nist-control-text/pm";
import { controlText as ps } from "./nist-control-text/ps";
import { controlText as pt } from "./nist-control-text/pt";
import { controlText as ra } from "./nist-control-text/ra";
import { controlText as sa } from "./nist-control-text/sa";
import { controlText as sc } from "./nist-control-text/sc";
import { controlText as si } from "./nist-control-text/si";
import { controlText as sr } from "./nist-control-text/sr";

export {
  controlTextFamilies,
  controlTextLoader,
  isControlTextFamily,
  loadAllControlText,
  loadControlFamily,
  loadControlText,
} from "./nist-control-text/registry";

/** The whole catalog. The 20 family chunks load in parallel and merge here. */
export const controlText: Record<string, NistControlText> = Object.assign(
  {},
  ac,
  at,
  au,
  ca,
  cm,
  cp,
  ia,
  ir,
  ma,
  mp,
  pe,
  pl,
  pm,
  ps,
  pt,
  ra,
  sa,
  sc,
  si,
  sr,
);
