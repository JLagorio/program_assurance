import { mkdirSync } from "node:fs";
import { join } from "node:path";

/* Where a browser suite saves a screenshot. CI sets PATTERN_ARTIFACT_DIR and
   uploads it, so a failure on the runner keeps its picture; on this machine the
   files land in /tmp as before. /tmp exists on macOS and Linux alike. */
export function artifactPath(name) {
  const dir = process.env.PATTERN_ARTIFACT_DIR || "/tmp";
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}
