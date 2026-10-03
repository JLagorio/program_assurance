import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { QueryStatus } from "./work-common";

/**
 * A failure region: a record page or a tab panel, whose blocks report their failed queries to it
 * so the outage is said once, in one alert at the region's top, with one Retry that refetches every
 * failed query in it. `container` is the element the region's blocks are drawn in; a block drawn
 * elsewhere through a portal (a dialog, a sheet, a preview panel, the Details rail) is not held by
 * it and says its own failure where it is. QueryState's `region` draws one.
 */
export type FailureRegion = {
  container: () => HTMLElement | null;
  report: (id: string, failed: QueryStatus[]) => void;
};
export const FailureRegionContext = createContext<FailureRegion | null>(null);

/** What a block's failures look like to its region: re-reported only when this changes. */
const failureSignature = (failed: QueryStatus[]) =>
  failed
    .map(
      (item) =>
        `${item.data === undefined ? "missing" : "stale"}:${item.isFetching ? "fetching" : "idle"}:${
          item.error instanceof Error ? item.error.message : ""
        }`,
    )
    .join("|");

/**
 * Hands a block's failed queries to the failure region it is drawn in. Returns whether a region
 * holds them, in which case the block draws no alert of its own: the region says it once. The
 * second value is a ref for an element of the block (a hidden span), so a block a portal draws
 * outside the region keeps its own alert.
 */
export function useRegionFailures(
  failed: QueryStatus[],
): [held: boolean, probe: (node: HTMLElement | null) => void] {
  const region = useContext(FailureRegionContext);
  const id = useId();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [held, setHeld] = useState(false);
  // Measured before paint, so a held block never shows its own alert for a frame.
  useLayoutEffect(() => {
    const container = region?.container();
    setHeld(Boolean(container && node && container !== node && container.contains(node)));
  }, [region, node]);
  const latest = useRef(failed);
  latest.current = failed;
  const signature = failureSignature(failed);
  useLayoutEffect(() => {
    if (!region || !held) return;
    region.report(id, latest.current);
    return () => region.report(id, []);
  }, [region, held, id, signature]);
  return [held, setNode];
}

/** The failures a region's blocks report, by block, and the function they report through. */
export function useFailureReports(): [QueryStatus[], FailureRegion["report"]] {
  const [reports, setReports] = useState<ReadonlyMap<string, QueryStatus[]>>(new Map());
  const report = useCallback((id: string, failed: QueryStatus[]) => {
    setReports((previous) => {
      if (!failed.length && !previous.has(id)) return previous;
      const next = new Map(previous);
      if (failed.length) next.set(id, failed);
      else next.delete(id);
      return next;
    });
  }, []);
  const reported = useMemo(() => [...reports.values()].flat(), [reports]);
  return [reported, report];
}
