/**
 * Per-user, per-program persistence for the activity timeline: which filters
 * the user last chose and which events they have already read.
 * Stored in localStorage under a key scoped to the signed-in user.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { currentUser } from "@/lib/poam-audit";
import type { ActivityKind, DateRange } from "@/lib/program-activity";

export type ActivityFilters = {
  kind: ActivityKind | "All";
  actor: string | "All";
  range: DateRange;
};

export const defaultFilters: ActivityFilters = {
  kind: "All",
  actor: "All",
  range: "All time",
};

const userKey = () => currentUser.name.toLowerCase().replace(/\s+/g, "-");

const filtersKey = (programId: string) => `equinox:${userKey()}:activity-filters:${programId}`;
const readKey = (programId: string) => `equinox:${userKey()}:activity-read:${programId}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — filters simply do not persist */
  }
}

/** Filters restored after hydration so SSR and the client agree on first paint. */
export function useActivityFilters(programId: string) {
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);

  useEffect(() => {
    setFilters(read<ActivityFilters>(filtersKey(programId), defaultFilters));
  }, [programId]);

  const update = useCallback(
    (patch: Partial<ActivityFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        write(filtersKey(programId), next);
        return next;
      });
    },
    [programId],
  );

  const reset = useCallback(() => {
    setFilters(defaultFilters);
    write(filtersKey(programId), defaultFilters);
  }, [programId]);

  return { filters, update, reset };
}

/** Read/unread state. Unknown ids are unread, so new activity always surfaces. */
export function useReadState(programId: string) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(readKey(programId));
      setReadIds(new Set<string>(raw ? JSON.parse(raw) : []));
    } catch {
      setReadIds(new Set());
    }
    hydrated.current = true;
  }, [programId]);

  const persist = useCallback(
    (next: Set<string>) => {
      setReadIds(next);
      write(readKey(programId), [...next]);
    },
    [programId],
  );

  const markRead = useCallback(
    (id: string) => persist(new Set(readIds).add(id)),
    [persist, readIds],
  );

  const markAllRead = useCallback(
    (ids: string[]) => persist(new Set([...readIds, ...ids])),
    [persist, readIds],
  );

  const markUnread = useCallback(
    (id: string) => {
      const next = new Set(readIds);
      next.delete(id);
      persist(next);
    },
    [persist, readIds],
  );

  return { readIds, markRead, markUnread, markAllRead };
}
